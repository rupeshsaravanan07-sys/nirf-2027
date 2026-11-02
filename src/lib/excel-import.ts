import ExcelJS from 'exceljs'
import { normalizeRegisterNumber, isValidMobileNumber, formatMobileNumber } from './utils'
import type { OutcomeCategory } from '@/types/database'

export interface ParsedStudent {
  register_number: string
  student_name: string
  mobile_number: string | null
  alternate_mobile_number: string | null
  email: string | null
  department: string | null
  programme: string | null
  school: string | null
  proctor_name: string | null
  proctor_employee_id: string | null
  source_status: string | null
  is_eligible: boolean
  original_source_data: Record<string, any>
  has_invalid_mobile: boolean
}

export interface ParsedResponse {
  register_number: string
  student_name: string
  source_sheet: string
  original_row_number: number
  source_timestamp: string | null
  outcome_category_raw: string | null
  outcome_category: OutcomeCategory
  company_name: string | null
  student_status_raw: string | null
  stipend: string | null
  ctc: string | null
  campus_off_campus: string | null
  proof_link: string | null
  higher_studies_institution: string | null
  higher_studies_admission_year: string | null
  original_response_data: Record<string, any>
}

export interface ImportPreview {
  filename: string
  file_size_bytes: number
  total_students: number
  eligible_count: number
  ineligible_count: number
  duplicate_register_numbers: { register_number: string; count: number }[]
  invalid_mobile_numbers: { register_number: string; name: string; mobile: string | null }[]
  total_responses: number
  matched_responses_count: number
  unmatched_responses_count: number
  unmatched_responses: ParsedResponse[]
  multi_response_students: { register_number: string; response_count: number }[]
  unique_proctors_count: number
  unique_programmes_count: number
  students: ParsedStudent[]
  responses: ParsedResponse[]
  summary: {
    ready_to_import: boolean
    new_students: number
    existing_students: number
  }
}

// Map raw "Select" column value from Google Forms to standard OutcomeCategory
export function mapRawOutcomeToCategory(rawSelect: string | null | undefined): OutcomeCategory {
  if (!rawSelect) return 'no_confirmed_outcome'
  const text = rawSelect.trim().toLowerCase()

  if (text.includes('not placed') || (text.includes('preparing') && !text.includes('higher'))) {
    return 'no_confirmed_outcome'
  }
  if (text.includes('higher studies') || text.includes('entrance') || text.includes('m.tech') || text.includes('ms')) {
    return 'higher_studies'
  }
  if (text.includes('planning to become an entrepreneur') || text.includes('start a business') || text === 'entrepreneurship') {
    return 'entrepreneurship'
  }
  if (text.includes('placement') || text.includes('full-time') || text.includes('job')) {
    return 'full_time_employment'
  }
  if (text.includes('internship')) {
    return 'internship_only'
  }
  if (text.includes('entrepreneur')) {
    return 'entrepreneurship'
  }
  return 'other_progression'
}

// Clean and normalize column header names (strip newlines, extra spaces)
function cleanHeader(header: any): string {
  if (header === null || header === undefined) return ''
  return String(header).replace(/\r?\n|\r/g, ' ').trim().replace(/\s+/g, ' ')
}

export async function parseExcelWorkbook(
  buffer: Buffer,
  filename: string
): Promise<ImportPreview> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as any)

  const studentSheet =
    workbook.getWorksheet('Student list') ||
    workbook.getWorksheet('Students') ||
    workbook.worksheets[0]

  const responseSheet =
    workbook.getWorksheet('Form Responses 1') ||
    workbook.getWorksheet('Responses') ||
    workbook.getWorksheet('Form Responses')

  const eligibleSheet = workbook.getWorksheet('Eligible Students')

  // Parse Eligible Students if sheet exists
  const eligibleRolls = new Set<string>()
  if (eligibleSheet) {
    eligibleSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 && typeof row.values === 'object') {
        const firstVal = Array.isArray(row.values) ? row.values[1] : null
        if (firstVal && String(firstVal).match(/^[0-9]{2}[A-Za-z]{3}[0-9]{4}/)) {
          eligibleRolls.add(normalizeRegisterNumber(String(firstVal)))
        }
      }
      const val = Array.isArray(row.values) ? row.values[1] : null
      if (val) {
        const reg = normalizeRegisterNumber(String(val))
        if (reg) eligibleRolls.add(reg)
      }
    })
  }

  // Parse Students
  const students: ParsedStudent[] = []
  const regCounts: Record<string, number> = {}
  const invalidMobiles: { register_number: string; name: string; mobile: string | null }[] = []
  const proctors = new Set<string>()
  const programmes = new Set<string>()

  if (studentSheet) {
    const headers: string[] = []
    const headerRow = studentSheet.getRow(1)
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cleanHeader(cell.value)
    })

    // Find column indexes
    let rollCol = -1
    let nameCol = -1
    let mobileCol = -1
    let altMobileCol = -1
    let mailCol = -1
    let progCol = -1
    let schoolCol = -1
    let proctorCol = -1
    let proctorEmpIdCol = -1
    let statusCol = -1

    headers.forEach((h, idx) => {
      const lower = h.toLowerCase()
      if (lower.includes('roll number') || lower.includes('register no') || lower.includes('reg no')) {
        if (rollCol === -1) rollCol = idx
      } else if (lower === 'name' || lower.includes('student name')) {
        if (nameCol === -1) nameCol = idx
      } else if (lower === 'mobile number' || lower === 'student mobile') {
        if (mobileCol === -1) mobileCol = idx
      } else if (lower.includes('alternate mobile') || lower === 'mobile number_1') {
        if (altMobileCol === -1) altMobileCol = idx
      } else if (lower.includes('mail id') || lower.includes('email')) {
        if (mailCol === -1) mailCol = idx
      } else if (lower.includes('programme') || lower.includes('program')) {
        if (progCol === -1) progCol = idx
      } else if (lower === 'school' || lower.includes('department')) {
        if (schoolCol === -1) schoolCol = idx
      } else if (lower === 'proctor name' && proctorCol === -1) {
        proctorCol = idx
      } else if ((lower.includes('emp id') || lower.includes('employee id')) && proctorEmpIdCol === -1) {
        proctorEmpIdCol = idx
      } else if (lower === 'status' && statusCol === -1) {
        statusCol = idx
      }
    })

    // Fallback if headers were not recognized
    if (rollCol === -1) rollCol = 2
    if (nameCol === -1) nameCol = 5
    if (mobileCol === -1) mobileCol = 6
    if (proctorCol === -1) proctorCol = 7
    if (proctorEmpIdCol === -1) proctorEmpIdCol = 8

    studentSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return

      const rawRoll = row.getCell(rollCol).value
      if (!rawRoll) return

      const regNo = normalizeRegisterNumber(String(rawRoll))
      if (!regNo || regNo === 'ROLL NUMBER' || regNo === 'REGISTER NO') return

      regCounts[regNo] = (regCounts[regNo] || 0) + 1

      const name = String(row.getCell(nameCol).value || '').trim()
      const rawMobile = row.getCell(mobileCol).value
      const mobile = rawMobile ? String(rawMobile).trim() : null
      const rawAltMobile = altMobileCol !== -1 ? row.getCell(altMobileCol).value : null
      const altMobile = rawAltMobile ? String(rawAltMobile).trim() : null
      const email = mailCol !== -1 ? String(row.getCell(mailCol).value || '').trim() || null : null
      const programme = progCol !== -1 ? String(row.getCell(progCol).value || '').trim() || null : null
      const school = schoolCol !== -1 ? String(row.getCell(schoolCol).value || '').trim() || null : null
      const proctorName = proctorCol !== -1 ? String(row.getCell(proctorCol).value || '').trim() || null : null
      const proctorEmpId = proctorEmpIdCol !== -1 ? String(row.getCell(proctorEmpIdCol).value || '').trim() || null : null
      const status = statusCol !== -1 ? String(row.getCell(statusCol).value || '').trim() || null : null

      const validMobile = isValidMobileNumber(mobile)
      if (!validMobile && mobile !== 'No pending students') {
        invalidMobiles.push({ register_number: regNo, name, mobile })
      }

      if (proctorName) proctors.add(proctorName)
      if (programme) programmes.add(programme)

      const isEligible = eligibleRolls.size > 0 ? eligibleRolls.has(regNo) : true

      // Store raw row values in original_source_data
      const rawData: Record<string, any> = {}
      row.eachCell((cell, colNumber) => {
        const headerKey = headers[colNumber] || `col_${colNumber}`
        rawData[headerKey] = cell.value
      })

      students.push({
        register_number: regNo,
        student_name: name,
        mobile_number: mobile,
        alternate_mobile_number: altMobile,
        email,
        department: school,
        programme,
        school,
        proctor_name: proctorName,
        proctor_employee_id: proctorEmpId,
        source_status: status,
        is_eligible: isEligible,
        original_source_data: rawData,
        has_invalid_mobile: !validMobile,
      })
    })
  }

  // Parse Form Responses
  const responses: ParsedResponse[] = []
  const studentRegSet = new Set(students.map((s) => s.register_number))
  const unmatchedResponses: ParsedResponse[] = []
  const responseRegCounts: Record<string, number> = {}

  if (responseSheet) {
    const resHeaders: string[] = []
    const headerRow = responseSheet.getRow(1)
    headerRow.eachCell((cell, colNumber) => {
      resHeaders[colNumber] = cleanHeader(cell.value)
    })

    let rTimestampCol = -1
    let rRollCol = -1
    let rNameCol = -1
    let rSelectCol = -1
    let rHsUniCol = -1
    let rHsYearCol = -1
    let rHsProofCol = -1
    let rCompanyCol = -1
    let rStatusCol = -1
    let rStipendCol = -1
    let rCtcCol = -1
    let rCampusCol = -1
    let rJobProofCol = -1

    resHeaders.forEach((h, idx) => {
      const lower = h.toLowerCase()
      if (lower.includes('timestamp')) {
        rTimestampCol = idx
      } else if (
        (lower.includes('register no') || lower.includes('roll number') || lower === 'reg no') &&
        !lower.includes('proof') &&
        !lower.includes('file name')
      ) {
        if (rRollCol === -1) rRollCol = idx
      } else if (lower.includes('student name') || lower === 'name') {
        if (rNameCol === -1) rNameCol = idx
      } else if (lower === 'select') {
        rSelectCol = idx
      } else if (lower.includes('university/institutions')) {
        rHsUniCol = idx
      } else if (lower.includes('year of admission')) {
        rHsYearCol = idx
      } else if (lower.includes('proof') && (lower.includes('university') || lower.includes('higher'))) {
        rHsProofCol = idx
      } else if (lower.includes('company')) {
        rCompanyCol = idx
      } else if (lower.includes('student status')) {
        rStatusCol = idx
      } else if (lower.includes('stipend')) {
        rStipendCol = idx
      } else if (lower.includes('ctc')) {
        rCtcCol = idx
      } else if (lower.includes('campus')) {
        rCampusCol = idx
      } else if (lower.includes('proof') && (lower.includes('company') || lower.includes('oracle') || lower.includes('business'))) {
        rJobProofCol = idx
      }
    })

    if (rRollCol === -1) rRollCol = 3

    responseSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return

      const rawRoll = row.getCell(rRollCol).value
      if (!rawRoll) return

      const regNo = normalizeRegisterNumber(String(rawRoll))
      if (!regNo || regNo === 'REGISTER NO') return

      responseRegCounts[regNo] = (responseRegCounts[regNo] || 0) + 1

      const rawTimestamp = rTimestampCol !== -1 ? row.getCell(rTimestampCol).value : null
      let timestampStr: string | null = null
      if (rawTimestamp instanceof Date) {
        timestampStr = rawTimestamp.toISOString()
      } else if (rawTimestamp) {
        timestampStr = String(rawTimestamp)
      }

      const rawSelect = rSelectCol !== -1 ? String(row.getCell(rSelectCol).value || '') : ''
      const mappedOutcome = mapRawOutcomeToCategory(rawSelect)

      const rawData: Record<string, any> = {}
      row.eachCell((cell, colNumber) => {
        const headerKey = resHeaders[colNumber] || `col_${colNumber}`
        rawData[headerKey] = cell.value
      })

      const parsedRes: ParsedResponse = {
        register_number: regNo,
        student_name: rNameCol !== -1 ? String(row.getCell(rNameCol).value || '').trim() : '',
        source_sheet: 'Form Responses 1',
        original_row_number: rowNumber,
        source_timestamp: timestampStr,
        outcome_category_raw: rawSelect || null,
        outcome_category: mappedOutcome,
        company_name: rCompanyCol !== -1 ? String(row.getCell(rCompanyCol).value || '').trim() || null : null,
        student_status_raw: rStatusCol !== -1 ? String(row.getCell(rStatusCol).value || '').trim() || null : null,
        stipend: rStipendCol !== -1 ? String(row.getCell(rStipendCol).value || '').trim() || null : null,
        ctc: rCtcCol !== -1 ? String(row.getCell(rCtcCol).value || '').trim() || null : null,
        campus_off_campus: rCampusCol !== -1 ? String(row.getCell(rCampusCol).value || '').trim() || null : null,
        proof_link:
          rJobProofCol !== -1
            ? String(row.getCell(rJobProofCol).value || '').trim() || null
            : rHsProofCol !== -1
            ? String(row.getCell(rHsProofCol).value || '').trim() || null
            : null,
        higher_studies_institution:
          rHsUniCol !== -1 ? String(row.getCell(rHsUniCol).value || '').trim() || null : null,
        higher_studies_admission_year:
          rHsYearCol !== -1 ? String(row.getCell(rHsYearCol).value || '').trim() || null : null,
        original_response_data: rawData,
      }

      responses.push(parsedRes)

      if (!studentRegSet.has(regNo)) {
        unmatchedResponses.push(parsedRes)
      }
    })
  }

  // Duplicates & multi-responses
  const duplicateRegNumbers = Object.entries(regCounts)
    .filter(([_, count]) => count > 1)
    .map(([reg, count]) => ({ register_number: reg, count }))

  const multiResponseStudents = Object.entries(responseRegCounts)
    .filter(([_, count]) => count > 1)
    .map(([reg, count]) => ({ register_number: reg, response_count: count }))

  const matchedCount = responses.length - unmatchedResponses.length

  return {
    filename,
    file_size_bytes: buffer.length,
    total_students: students.length,
    eligible_count: students.filter((s) => s.is_eligible).length,
    ineligible_count: students.filter((s) => !s.is_eligible).length,
    duplicate_register_numbers: duplicateRegNumbers,
    invalid_mobile_numbers: invalidMobiles,
    total_responses: responses.length,
    matched_responses_count: matchedCount,
    unmatched_responses_count: unmatchedResponses.length,
    unmatched_responses: unmatchedResponses,
    multi_response_students: multiResponseStudents,
    unique_proctors_count: proctors.size,
    unique_programmes_count: programmes.size,
    students,
    responses,
    summary: {
      ready_to_import: students.length > 0,
      new_students: students.length,
      existing_students: 0,
    },
  }
}
