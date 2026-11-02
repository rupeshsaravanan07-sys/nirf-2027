import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import ExcelJS from 'exceljs'
import { parseExcelWorkbook, type ImportPreview, type ParsedStudent, type ParsedResponse } from './excel-import'
import { generateSubmissionReference, normalizeRegisterNumber } from './utils'
import { renderWhatsAppMessage, DEFAULT_WHATSAPP_TEMPLATE } from './whatsapp'
import type {
  Student,
  ProgressionSubmission,
  OriginalResponse,
  Reminder,
  CommunicationLog,
  ProctorEscalation,
  DashboardStats,
  DepartmentStats,
  ProctorStats,
  OutcomeCategory,
  VerificationStatus,
  SendStatus,
  FollowUpStatus,
} from '@/types/database'

const DATA_DIR = path.join(process.cwd(), '.data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

interface InMemoryDB {
  students: Student[]
  submissions: ProgressionSubmission[]
  original_responses: OriginalResponse[]
  reminders: Reminder[]
  communication_logs: CommunicationLog[]
  escalations: ProctorEscalation[]
  templates: { id: string; name: string; template_text: string; is_default: boolean }[]
  import_logs: any[]
  initialized: boolean
}

// In-memory cache for speed
let memoryDB: InMemoryDB | null = null

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadDB(): InMemoryDB {
  if (memoryDB) return memoryDB
  ensureDataDir()
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8')
      memoryDB = JSON.parse(content)
      return memoryDB!
    } catch (e) {
      console.error('Failed to parse db.json, re-initializing...', e)
    }
  }

  memoryDB = {
    students: [],
    submissions: [],
    original_responses: [],
    reminders: [],
    communication_logs: [],
    escalations: [],
    templates: [
      {
        id: uuidv4(),
        name: 'Default NIRF 2027 Reminder',
        template_text: DEFAULT_WHATSAPP_TEMPLATE,
        is_default: true,
      },
    ],
    import_logs: [],
    initialized: false,
  }
  saveDB()
  return memoryDB
}

function saveDB() {
  if (!memoryDB) return
  ensureDataDir()
  fs.writeFileSync(DB_FILE, JSON.stringify(memoryDB, null, 2), 'utf-8')
}

// Initialize database with the provided Excel file if not already initialized
export async function initializeDataStore(): Promise<void> {
  const db = loadDB()
  if (db.initialized && db.students.length > 0) return

  const samplePath = path.join(process.cwd(), 'public', 'NIRF_2027_Responses.xlsx')
  if (fs.existsSync(samplePath)) {
    try {
      const buffer = fs.readFileSync(samplePath)
      const parsed = await parseExcelWorkbook(buffer, 'NIRF 2027 – Student Progression Data Collection (Responses).xlsx')
      await commitImportPreview(parsed, 'System Initial Import')
      db.initialized = true
      saveDB()
      console.log(`[DataStore] Initialized with ${db.students.length} students and ${db.original_responses.length} responses.`)
    } catch (err) {
      console.error('[DataStore] Error during initial workbook parse:', err)
    }
  }
}

export async function commitImportPreview(preview: ImportPreview, uploadedBy: string = 'Admin'): Promise<{
  imported_students: number
  imported_responses: number
  import_log_id: string
}> {
  const db = loadDB()
  const importLogId = uuidv4()

  const studentMap = new Map<string, Student>()
  for (const s of db.students) {
    studentMap.set(s.register_number, s)
  }

  // Upsert students
  let newStudentCount = 0
  for (const ps of preview.students) {
    const existing = studentMap.get(ps.register_number)
    if (existing) {
      // update details if provided
      existing.student_name = ps.student_name || existing.student_name
      existing.mobile_number = ps.mobile_number || existing.mobile_number
      existing.alternate_mobile_number = ps.alternate_mobile_number || existing.alternate_mobile_number
      existing.email = ps.email || existing.email
      existing.programme = ps.programme || existing.programme
      existing.proctor_name = ps.proctor_name || existing.proctor_name
      existing.proctor_employee_id = ps.proctor_employee_id || existing.proctor_employee_id
      existing.source_status = ps.source_status || existing.source_status
      existing.is_eligible = ps.is_eligible
      existing.updated_at = new Date().toISOString()
    } else {
      const newStudent: Student = {
        id: uuidv4(),
        register_number: ps.register_number,
        student_name: ps.student_name,
        mobile_number: ps.mobile_number,
        alternate_mobile_number: ps.alternate_mobile_number,
        email: ps.email,
        department: ps.department || 'SCOPE',
        programme: ps.programme,
        school: ps.school || 'SCOPE',
        proctor_name: ps.proctor_name,
        proctor_employee_id: ps.proctor_employee_id,
        source_status: ps.source_status,
        form_access_token: uuidv4(),
        original_source_data: ps.original_source_data,
        is_eligible: ps.is_eligible,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      db.students.push(newStudent)
      studentMap.set(newStudent.register_number, newStudent)
      newStudentCount++
    }
  }

  // Archive and insert responses
  let importedRespCount = 0
  for (const pr of preview.responses) {
    const student = studentMap.get(pr.register_number)
    const originalResp: OriginalResponse = {
      id: uuidv4(),
      student_id: student ? student.id : null,
      register_number: pr.register_number,
      source_sheet: pr.source_sheet,
      original_row_number: pr.original_row_number,
      original_response_data: pr.original_response_data,
      source_timestamp: pr.source_timestamp,
      imported_at: new Date().toISOString(),
      import_log_id: importLogId,
      created_at: new Date().toISOString(),
    }
    db.original_responses.push(originalResp)
    importedRespCount++

    // Also create initial progression submission for matched students if they don't have one
    if (student) {
      const existingSub = db.submissions.find((s) => s.student_id === student.id)
      if (!existingSub) {
        const sub: ProgressionSubmission = {
          id: uuidv4(),
          student_id: student.id,
          submission_version: 1,
          outcome_category: pr.outcome_category,
          employment_details:
            pr.outcome_category === 'full_time_employment' || pr.outcome_category === 'internship_only'
              ? {
                  company_name: pr.company_name || 'Not specified',
                  job_designation: pr.student_status_raw || 'Not specified',
                  employment_type: 'full_time',
                  joining_date: '2026',
                  annual_ctc: pr.ctc || undefined,
                  placement_type: pr.campus_off_campus?.toLowerCase().includes('off') ? 'off_campus' : 'on_campus',
                }
              : null,
          higher_studies_details:
            pr.outcome_category === 'higher_studies'
              ? {
                  institution_name: pr.higher_studies_institution || 'Not specified',
                  programme_course: 'Higher Studies',
                  admission_year: pr.higher_studies_admission_year || '2026',
                  country: 'India',
                }
              : null,
          entrepreneurship_details:
            pr.outcome_category === 'entrepreneurship'
              ? {
                  business_name: pr.company_name || 'Independent Business',
                  nature_of_business: 'Startup/Consulting',
                  establishment_date: '2026',
                }
              : null,
          internship_details:
            pr.outcome_category === 'internship_only'
              ? {
                  company_name: pr.company_name || 'Internship',
                  internship_role: pr.student_status_raw || 'Intern',
                  duration: '6 Months',
                  stipend: pr.stipend || undefined,
                }
              : null,
          other_details:
            pr.outcome_category === 'no_confirmed_outcome'
              ? { explanation: pr.outcome_category_raw || 'Preparing for placements/studies' }
              : null,
          evidence_storage_path: pr.proof_link,
          declaration_accepted: true,
          submitted_at: pr.source_timestamp || new Date().toISOString(),
          submission_reference: generateSubmissionReference(),
          verification_status: pr.proof_link ? 'verified' : 'pending',
          verified_by: pr.proof_link ? 'System Auto-Verified' : null,
          verified_at: pr.proof_link ? new Date().toISOString() : null,
          admin_notes: 'Imported from initial Form Responses sheet',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        db.submissions.push(sub)
      }
    }
  }

  db.import_logs.push({
    id: importLogId,
    filename: preview.filename,
    file_size_bytes: preview.file_size_bytes,
    uploaded_by: uploadedBy,
    upload_date: new Date().toISOString(),
    total_rows: preview.total_students,
    imported_rows: newStudentCount,
    duplicate_rows: preview.duplicate_register_numbers.length,
    unmatched_responses: preview.unmatched_responses_count,
    import_status: 'completed',
    import_summary: {
      matched_responses: preview.matched_responses_count,
      unmatched_responses: preview.unmatched_responses_count,
      total_students: db.students.length,
    },
  })

  db.initialized = true
  saveDB()

  return {
    imported_students: newStudentCount,
    imported_responses: importedRespCount,
    import_log_id: importLogId,
  }
}

// Live Dashboard Statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  await initializeDataStore()
  const db = loadDB()

  const totalStudents = db.students.length
  const totalExistingResponses = db.original_responses.length
  const totalNewSubmissions = db.submissions.length

  const submittedStudentIds = new Set(db.submissions.map((s) => s.student_id))
  const totalSubmitted = submittedStudentIds.size
  const totalPending = Math.max(0, totalStudents - totalSubmitted)

  let verificationPending = 0
  let verified = 0
  let followUpRequired = 0

  for (const sub of db.submissions) {
    if (sub.verification_status === 'pending') verificationPending++
    else if (sub.verification_status === 'verified') verified++
    else if (sub.verification_status === 'needs_review' || sub.verification_status === 'rejected') {
      followUpRequired++
    }
  }

  let invalidContacts = 0
  for (const s of db.students) {
    if (!s.mobile_number || s.mobile_number === 'No pending students' || s.mobile_number === '#ERROR!') {
      invalidContacts++
    }
  }

  const escalatedToProctors = db.escalations.filter((e) => e.follow_up_status !== 'resolved').length

  return {
    total_students: totalStudents,
    total_existing_responses: totalExistingResponses,
    total_new_submissions: totalNewSubmissions,
    total_submitted: totalSubmitted,
    total_pending: totalPending,
    verification_pending: verificationPending,
    verified,
    follow_up_required: followUpRequired,
    invalid_contacts: invalidContacts,
    escalated_to_proctors: escalatedToProctors,
  }
}

// Department / School Statistics
export async function getDepartmentStats(): Promise<DepartmentStats[]> {
  await initializeDataStore()
  const db = loadDB()

  const submittedSet = new Set(db.submissions.map((s) => s.student_id))
  const deptMap: Record<string, { total: number; submitted: number }> = {}

  for (const s of db.students) {
    const dept = s.programme ? s.programme.split('(')[0].trim() : s.department || 'SCOPE'
    if (!deptMap[dept]) {
      deptMap[dept] = { total: 0, submitted: 0 }
    }
    deptMap[dept].total++
    if (submittedSet.has(s.id)) {
      deptMap[dept].submitted++
    }
  }

  return Object.entries(deptMap).map(([dept, counts]) => ({
    department: dept,
    total: counts.total,
    submitted: counts.submitted,
    pending: counts.total - counts.submitted,
  }))
}

// Proctor Statistics
export async function getProctorStats(): Promise<ProctorStats[]> {
  await initializeDataStore()
  const db = loadDB()

  const submittedSet = new Set(db.submissions.map((s) => s.student_id))
  const proctorMap: Record<string, { name: string; empId: string; total: number; submitted: number }> = {}

  for (const s of db.students) {
    const key = s.proctor_employee_id || s.proctor_name || 'Unknown'
    if (!proctorMap[key]) {
      proctorMap[key] = {
        name: s.proctor_name || 'Unassigned',
        empId: s.proctor_employee_id || 'N/A',
        total: 0,
        submitted: 0,
      }
    }
    proctorMap[key].total++
    if (submittedSet.has(s.id)) {
      proctorMap[key].submitted++
    }
  }

  return Object.values(proctorMap)
    .map((p) => ({
      proctor_name: p.name,
      proctor_employee_id: p.empId,
      total_students: p.total,
      submitted: p.submitted,
      pending: p.total - p.submitted,
      submission_percentage: p.total > 0 ? Math.round((p.submitted / p.total) * 100) : 0,
    }))
    .sort((a, b) => b.total_students - a.total_students)
}

// Outcome Category Distribution
export async function getOutcomeStats(): Promise<{ category: string; count: number; label: string }[]> {
  await initializeDataStore()
  const db = loadDB()

  const counts: Record<OutcomeCategory, number> = {
    full_time_employment: 0,
    higher_studies: 0,
    entrepreneurship: 0,
    internship_only: 0,
    other_progression: 0,
    no_confirmed_outcome: 0,
  }

  for (const sub of db.submissions) {
    if (counts[sub.outcome_category] !== undefined) {
      counts[sub.outcome_category]++
    } else {
      counts.other_progression++
    }
  }

  const labels: Record<OutcomeCategory, string> = {
    full_time_employment: 'Full-Time Employment',
    higher_studies: 'Higher Studies',
    entrepreneurship: 'Entrepreneurship',
    internship_only: 'Internship Only',
    other_progression: 'Other Progression',
    no_confirmed_outcome: 'Pending / Preparing',
  }

  return Object.entries(counts).map(([cat, count]) => ({
    category: cat,
    count,
    label: labels[cat as OutcomeCategory] || cat,
  }))
}

// Filtered and Paginated Student List for Admin
export interface GetStudentsOptions {
  page?: number
  limit?: number
  search?: string
  status?: string // 'all', 'submitted', 'pending', 'verified', 'pending_verification', 'follow_up', 'reminder_1', 'reminder_2', 'reminder_3', 'escalated'
  department?: string
  proctor?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function getStudents(options: GetStudentsOptions = {}) {
  await initializeDataStore()
  const db = loadDB()

  const {
    page = 1,
    limit = 25,
    search = '',
    status = 'all',
    department,
    proctor,
    sortBy = 'register_number',
    sortOrder = 'asc',
  } = options

  const submissionMap = new Map<string, ProgressionSubmission>()
  for (const sub of db.submissions) {
    const existing = submissionMap.get(sub.student_id)
    if (!existing || sub.submission_version > existing.submission_version) {
      submissionMap.set(sub.student_id, sub)
    }
  }

  const reminderCounts = new Map<string, number>()
  const latestReminderMap = new Map<string, Reminder>()
  for (const r of db.reminders) {
    reminderCounts.set(r.student_id, (reminderCounts.get(r.student_id) || 0) + 1)
    const existing = latestReminderMap.get(r.student_id)
    if (!existing || new Date(r.sent_at || r.created_at) > new Date(existing.sent_at || existing.created_at)) {
      latestReminderMap.set(r.student_id, r)
    }
  }

  const escalationMap = new Map<string, ProctorEscalation>()
  for (const esc of db.escalations) {
    escalationMap.set(esc.student_id, esc)
  }

  let filtered = db.students.filter((student) => {
    // Search
    if (search) {
      const q = search.toLowerCase()
      const matchRoll = student.register_number.toLowerCase().includes(q)
      const matchName = student.student_name.toLowerCase().includes(q)
      const matchMobile = student.mobile_number?.toLowerCase().includes(q)
      const matchProctor = student.proctor_name?.toLowerCase().includes(q)
      if (!matchRoll && !matchName && !matchMobile && !matchProctor) return false
    }

    // Department filter
    if (department && department !== 'all') {
      if (!student.department?.includes(department) && !student.programme?.includes(department)) {
        return false
      }
    }

    // Proctor filter
    if (proctor && proctor !== 'all') {
      if (student.proctor_employee_id !== proctor && student.proctor_name !== proctor) {
        return false
      }
    }

    // Status filter
    const hasSubmission = submissionMap.has(student.id)
    const sub = submissionMap.get(student.id)
    const rCount = reminderCounts.get(student.id) || 0
    const isEscalated = escalationMap.has(student.id)

    if (status === 'submitted') return hasSubmission
    if (status === 'pending') return !hasSubmission
    if (status === 'verified') return sub?.verification_status === 'verified'
    if (status === 'pending_verification') return sub?.verification_status === 'pending'
    if (status === 'follow_up') return sub?.verification_status === 'needs_review' || sub?.verification_status === 'rejected'
    if (status === 'reminder_1') return rCount === 1
    if (status === 'reminder_2') return rCount === 2
    if (status === 'reminder_3') return rCount >= 3
    if (status === 'escalated') return isEscalated

    return true
  })

  // Sorting
  filtered.sort((a, b) => {
    let aVal = (a as any)[sortBy] || ''
    let bVal = (b as any)[sortBy] || ''
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const total = filtered.length
  const startIndex = (page - 1) * limit
  const paginated = filtered.slice(startIndex, startIndex + limit).map((s) => ({
    ...s,
    submission_count: db.submissions.filter((sub) => sub.student_id === s.id).length,
    latest_submission: submissionMap.get(s.id) || null,
    reminder_count: reminderCounts.get(s.id) || 0,
    latest_reminder: latestReminderMap.get(s.id) || null,
    escalation: escalationMap.get(s.id) || null,
  }))

  return {
    students: paginated,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  }
}

// Student by Token (for Public Form)
export async function getStudentByToken(token: string): Promise<{
  student: Student | null
  existing_submission: ProgressionSubmission | null
}> {
  await initializeDataStore()
  const db = loadDB()

  const student = db.students.find((s) => s.form_access_token === token)
  if (!student) return { student: null, existing_submission: null }

  const subs = db.submissions
    .filter((s) => s.student_id === student.id)
    .sort((a, b) => b.submission_version - a.submission_version)

  return {
    student,
    existing_submission: subs.length > 0 ? subs[0] : null,
  }
}

// Student by ID (Full detail view for Admin)
export async function getStudentDetail(id: string) {
  await initializeDataStore()
  const db = loadDB()

  const student = db.students.find((s) => s.id === id)
  if (!student) return null

  const submissions = db.submissions
    .filter((s) => s.student_id === id)
    .sort((a, b) => b.submission_version - a.submission_version)

  const originalResponses = db.original_responses.filter(
    (r) => r.student_id === id || r.register_number === student.register_number
  )

  const reminders = db.reminders
    .filter((r) => r.student_id === id)
    .sort((a, b) => b.reminder_number - a.reminder_number)

  const communicationLogs = db.communication_logs
    .filter((l) => l.student_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const escalation = db.escalations.find((e) => e.student_id === id) || null

  return {
    student,
    submissions,
    original_responses: originalResponses,
    reminders,
    communication_logs: communicationLogs,
    escalation,
  }
}

// Save Student Submission (from Public Form)
export async function submitStudentProgression(data: {
  form_access_token: string
  outcome_category: OutcomeCategory
  employment_details?: any
  higher_studies_details?: any
  entrepreneurship_details?: any
  internship_details?: any
  other_details?: any
  evidence_storage_path?: string | null
  declaration_accepted: boolean
}): Promise<{
  success: boolean
  submission_reference?: string
  error?: string
}> {
  await initializeDataStore()
  const db = loadDB()

  const student = db.students.find((s) => s.form_access_token === data.form_access_token)
  if (!student) {
    return { success: false, error: 'Invalid or expired student link' }
  }

  const existingSubs = db.submissions
    .filter((s) => s.student_id === student.id)
    .sort((a, b) => b.submission_version - a.submission_version)

  const nextVersion = existingSubs.length > 0 ? existingSubs[0].submission_version + 1 : 1
  const refCode = generateSubmissionReference()

  const newSub: ProgressionSubmission = {
    id: uuidv4(),
    student_id: student.id,
    submission_version: nextVersion,
    outcome_category: data.outcome_category,
    employment_details: data.employment_details || null,
    higher_studies_details: data.higher_studies_details || null,
    entrepreneurship_details: data.entrepreneurship_details || null,
    internship_details: data.internship_details || null,
    other_details: data.other_details || null,
    evidence_storage_path: data.evidence_storage_path || null,
    declaration_accepted: data.declaration_accepted,
    submitted_at: new Date().toISOString(),
    submission_reference: refCode,
    verification_status: 'pending',
    verified_by: null,
    verified_at: null,
    admin_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  db.submissions.push(newSub)

  // Log communication event
  db.communication_logs.push({
    id: uuidv4(),
    student_id: student.id,
    reminder_id: null,
    event_type: 'response_received',
    event_data: {
      submission_reference: refCode,
      outcome_category: data.outcome_category,
      version: nextVersion,
    },
    performed_by: null,
    created_at: new Date().toISOString(),
  })

  // Mark reminders as response_received_after
  for (const r of db.reminders) {
    if (r.student_id === student.id) {
      r.response_received_after = true
    }
  }

  saveDB()

  return {
    success: true,
    submission_reference: refCode,
  }
}

// Verification action
export async function updateSubmissionVerification(
  submissionId: string,
  status: VerificationStatus,
  adminNotes?: string,
  verifiedBy: string = 'Admin Staff'
): Promise<boolean> {
  await initializeDataStore()
  const db = loadDB()

  const sub = db.submissions.find((s) => s.id === submissionId)
  if (!sub) return false

  sub.verification_status = status
  sub.verified_by = verifiedBy
  sub.verified_at = new Date().toISOString()
  if (adminNotes !== undefined) sub.admin_notes = adminNotes
  sub.updated_at = new Date().toISOString()

  saveDB()
  return true
}

// WhatsApp Message Generation
export async function generateWhatsAppReminders(params: {
  student_ids?: string[]
  template_id?: string
  app_url?: string
}): Promise<{ generated_count: number }> {
  await initializeDataStore()
  const db = loadDB()

  const appUrl = params.app_url || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const template =
    db.templates.find((t) => t.id === params.template_id) ||
    db.templates.find((t) => t.is_default) ||
    db.templates[0]

  const submittedSet = new Set(db.submissions.map((s) => s.student_id))

  let targetStudents = db.students.filter((s) => !submittedSet.has(s.id))
  if (params.student_ids && params.student_ids.length > 0) {
    const idSet = new Set(params.student_ids)
    targetStudents = targetStudents.filter((s) => idSet.has(s.id))
  }

  let count = 0
  for (const student of targetStudents) {
    const existingReminders = db.reminders.filter((r) => r.student_id === student.id)
    const nextReminderNum = existingReminders.length + 1

    const studentFormLink = `${appUrl}/student-form?token=${student.form_access_token}`

    const messageText = renderWhatsAppMessage(template.template_text, {
      student_name: student.student_name,
      register_number: student.register_number,
      student_form_link: studentFormLink,
      department: student.department || student.programme || 'SCOPE',
      programme: student.programme,
      proctor_name: student.proctor_name,
      reminder_number: nextReminderNum,
      max_reminders: 3,
    })

    const reminderId = uuidv4()
    db.reminders.push({
      id: reminderId,
      student_id: student.id,
      reminder_number: nextReminderNum,
      message_text: messageText,
      message_template_id: template.id,
      generated_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_at: null,
      approved_at: null,
      sent_at: null,
      send_method: 'whatsapp_manual',
      send_status: 'pending_review',
      confirmed_sent_by: null,
      response_received_after: false,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    db.communication_logs.push({
      id: uuidv4(),
      student_id: student.id,
      reminder_id: reminderId,
      event_type: 'message_generated',
      event_data: { reminder_number: nextReminderNum },
      performed_by: null,
      created_at: new Date().toISOString(),
    })

    count++
  }

  saveDB()
  return { generated_count: count }
}

// WhatsApp Reminders list
export async function getReminders(statusFilter: string = 'all') {
  await initializeDataStore()
  const db = loadDB()

  const studentMap = new Map(db.students.map((s) => [s.id, s]))

  let filtered = db.reminders
  if (statusFilter !== 'all') {
    filtered = filtered.filter((r) => r.send_status === statusFilter)
  }

  return filtered
    .map((r) => ({
      ...r,
      student: studentMap.get(r.student_id) || null,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Approve batch or individual reminders
export async function approveReminders(
  reminderIds: string[],
  reviewedBy: string = 'Admin Staff'
): Promise<number> {
  await initializeDataStore()
  const db = loadDB()

  const idSet = new Set(reminderIds)
  let count = 0

  for (const r of db.reminders) {
    if (idSet.has(r.id) && (r.send_status === 'draft' || r.send_status === 'pending_review')) {
      r.send_status = 'approved'
      r.approved_at = new Date().toISOString()
      r.reviewed_by = reviewedBy
      r.reviewed_at = new Date().toISOString()
      r.updated_at = new Date().toISOString()

      db.communication_logs.push({
        id: uuidv4(),
        student_id: r.student_id,
        reminder_id: r.id,
        event_type: 'message_approved',
        event_data: { reminder_number: r.reminder_number },
        performed_by: reviewedBy,
        created_at: new Date().toISOString(),
      })
      count++
    }
  }

  saveDB()
  return count
}

// Confirm Staff Sent Reminder (with auto proctor escalation after 3 sent)
export async function confirmReminderSent(
  reminderId: string,
  confirmedBy: string = 'Admin Staff',
  notes?: string
): Promise<{ success: boolean; escalated: boolean; reminder?: Reminder }> {
  await initializeDataStore()
  const db = loadDB()

  const reminder = db.reminders.find((r) => r.id === reminderId)
  if (!reminder) return { success: false, escalated: false }

  reminder.send_status = 'sent'
  reminder.sent_at = new Date().toISOString()
  reminder.confirmed_sent_by = confirmedBy
  if (notes) reminder.notes = notes
  reminder.updated_at = new Date().toISOString()

  db.communication_logs.push({
    id: uuidv4(),
    student_id: reminder.student_id,
    reminder_id: reminder.id,
    event_type: 'send_confirmed',
    event_data: { notes },
    performed_by: confirmedBy,
    created_at: new Date().toISOString(),
  })

  // Check total successfully sent reminders for this student
  const sentCount = db.reminders.filter(
    (r) => r.student_id === reminder.student_id && r.send_status === 'sent'
  ).length

  let escalated = false
  if (sentCount >= 3) {
    const existingEsc = db.escalations.find((e) => e.student_id === reminder.student_id)
    if (!existingEsc) {
      const student = db.students.find((s) => s.id === reminder.student_id)
      const esc: ProctorEscalation = {
        id: uuidv4(),
        student_id: reminder.student_id,
        proctor_name: student?.proctor_name || null,
        proctor_employee_id: student?.proctor_employee_id || null,
        escalation_reason: 'Automated Escalation: 3 reminders sent with no submission received',
        reminder_count: sentCount,
        escalation_date: new Date().toISOString(),
        follow_up_status: 'pending',
        follow_up_notes: null,
        resolved_at: null,
        resolved_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      db.escalations.push(esc)

      db.communication_logs.push({
        id: uuidv4(),
        student_id: reminder.student_id,
        reminder_id: reminder.id,
        event_type: 'escalation_created',
        event_data: { proctor: student?.proctor_name, emp_id: student?.proctor_employee_id },
        performed_by: 'System Automation',
        created_at: new Date().toISOString(),
      })
      escalated = true
    }
  }

  saveDB()
  return { success: true, escalated, reminder }
}

// Escalations list
export async function getEscalations(statusFilter: string = 'all') {
  await initializeDataStore()
  const db = loadDB()

  const studentMap = new Map(db.students.map((s) => [s.id, s]))

  let filtered = db.escalations
  if (statusFilter !== 'all') {
    filtered = filtered.filter((e) => e.follow_up_status === statusFilter)
  }

  return filtered.map((e) => ({
    ...e,
    student: studentMap.get(e.student_id) || null,
  }))
}

// Update Escalation Follow-up
export async function updateEscalationStatus(
  escalationId: string,
  followUpStatus: FollowUpStatus,
  notes?: string,
  resolvedBy: string = 'Proctor Office'
): Promise<boolean> {
  await initializeDataStore()
  const db = loadDB()

  const esc = db.escalations.find((e) => e.id === escalationId)
  if (!esc) return false

  esc.follow_up_status = followUpStatus
  if (notes) esc.follow_up_notes = notes
  if (followUpStatus === 'resolved') {
    esc.resolved_at = new Date().toISOString()
    esc.resolved_by = resolvedBy
  }
  esc.updated_at = new Date().toISOString()

  saveDB()
  return true
}

// Generate Comprehensive Excel Export
export async function generateMasterExcelExport(): Promise<Buffer> {
  await initializeDataStore()
  const db = loadDB()

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'NIRF 2027 Student Progression System'
  workbook.created = new Date()

  const subMap = new Map<string, ProgressionSubmission>()
  for (const s of db.submissions) {
    const ex = subMap.get(s.student_id)
    if (!ex || s.submission_version > ex.submission_version) {
      subMap.set(s.student_id, s)
    }
  }

  // Sheet 1: Master Student List with Progression Status
  const ws1 = workbook.addWorksheet('All Students Progression')
  ws1.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Register Number', key: 'reg_no', width: 16 },
    { header: 'Student Name', key: 'name', width: 28 },
    { header: 'Mobile Number', key: 'mobile', width: 16 },
    { header: 'Email ID', key: 'email', width: 28 },
    { header: 'Department / School', key: 'dept', width: 16 },
    { header: 'Programme', key: 'prog', width: 40 },
    { header: 'Proctor Name', key: 'proctor', width: 24 },
    { header: 'Proctor Emp ID', key: 'proctor_id', width: 16 },
    { header: 'Submission Status', key: 'sub_status', width: 18 },
    { header: 'Progression Category', key: 'category', width: 24 },
    { header: 'Company / Institution', key: 'org', width: 32 },
    { header: 'Designation / Degree', key: 'role', width: 24 },
    { header: 'Annual CTC / Stipend', key: 'compensation', width: 20 },
    { header: 'Campus / Off-Campus', key: 'campus', width: 20 },
    { header: 'Verification Status', key: 'verified', width: 20 },
    { header: 'Evidence Proof Link', key: 'proof', width: 40 },
    { header: 'Reminders Sent', key: 'reminders', width: 16 },
    { header: 'Escalation Status', key: 'escalated', width: 18 },
  ]

  // Style header row
  ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws1.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' },
  }

  const reminderCounts = new Map<string, number>()
  for (const r of db.reminders) {
    if (r.send_status === 'sent') {
      reminderCounts.set(r.student_id, (reminderCounts.get(r.student_id) || 0) + 1)
    }
  }

  const escSet = new Set(db.escalations.filter((e) => e.follow_up_status !== 'resolved').map((e) => e.student_id))

  db.students.forEach((s, idx) => {
    const sub = subMap.get(s.id)
    const emp = sub?.employment_details as any
    const hs = sub?.higher_studies_details as any
    const ent = sub?.entrepreneurship_details as any
    const intern = sub?.internship_details as any

    let org = ''
    let role = ''
    let comp = ''
    let campus = ''

    if (sub?.outcome_category === 'full_time_employment') {
      org = emp?.company_name || ''
      role = emp?.job_designation || ''
      comp = emp?.annual_ctc || ''
      campus = emp?.placement_type || ''
    } else if (sub?.outcome_category === 'higher_studies') {
      org = hs?.institution_name || ''
      role = hs?.programme_course || ''
      comp = hs?.admission_year ? `Year: ${hs.admission_year}` : ''
    } else if (sub?.outcome_category === 'entrepreneurship') {
      org = ent?.business_name || ''
      role = ent?.nature_of_business || ''
      comp = ent?.establishment_date ? `Est: ${ent.establishment_date}` : ''
    } else if (sub?.outcome_category === 'internship_only') {
      org = intern?.company_name || ''
      role = intern?.internship_role || ''
      comp = intern?.stipend || ''
    }

    ws1.addRow({
      sno: idx + 1,
      reg_no: s.register_number,
      name: s.student_name,
      mobile: s.mobile_number || 'N/A',
      email: s.email || 'N/A',
      dept: s.department || 'SCOPE',
      prog: s.programme || 'N/A',
      proctor: s.proctor_name || 'Unassigned',
      proctor_id: s.proctor_employee_id || 'N/A',
      sub_status: sub ? 'SUBMITTED' : 'PENDING',
      category: sub ? sub.outcome_category.replace(/_/g, ' ').toUpperCase() : 'NOT SUBMITTED',
      org,
      role,
      compensation: comp,
      campus,
      verified: sub?.verification_status?.toUpperCase() || 'N/A',
      proof: sub?.evidence_storage_path || '',
      reminders: reminderCounts.get(s.id) || 0,
      escalated: escSet.has(s.id) ? 'YES (Proctor)' : 'NO',
    })
  })

  // Sheet 2: Department Summary
  const ws2 = workbook.addWorksheet('Department Summary')
  ws2.columns = [
    { header: 'Department / Programme', key: 'dept', width: 45 },
    { header: 'Total Students', key: 'total', width: 16 },
    { header: 'Submitted', key: 'submitted', width: 16 },
    { header: 'Pending', key: 'pending', width: 16 },
    { header: 'Completion %', key: 'rate', width: 16 },
  ]
  ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }

  const deptStats = await getDepartmentStats()
  deptStats.forEach((d) => {
    const rate = d.total > 0 ? Math.round((d.submitted / d.total) * 100) : 0
    ws2.addRow({
      dept: d.department,
      total: d.total,
      submitted: d.submitted,
      pending: d.pending,
      rate: `${rate}%`,
    })
  })

  // Sheet 3: Proctor Follow-up Status
  const ws3 = workbook.addWorksheet('Proctor Follow-up Report')
  ws3.columns = [
    { header: 'Proctor Employee ID', key: 'emp_id', width: 22 },
    { header: 'Proctor Name', key: 'name', width: 30 },
    { header: 'Assigned Students', key: 'total', width: 18 },
    { header: 'Submitted', key: 'submitted', width: 16 },
    { header: 'Pending Submissions', key: 'pending', width: 20 },
    { header: 'Submission %', key: 'pct', width: 16 },
  ]
  ws3.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } }

  const proctorStats = await getProctorStats()
  proctorStats.forEach((p) => {
    ws3.addRow({
      emp_id: p.proctor_employee_id,
      name: p.proctor_name,
      total: p.total_students,
      submitted: p.submitted,
      pending: p.pending,
      pct: `${p.submission_percentage}%`,
    })
  })

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
