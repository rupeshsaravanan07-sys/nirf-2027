import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  renderWhatsAppMessage,
  generateDirectWhatsAppUrl,
  DEFAULT_WHATSAPP_TEMPLATE,
} from '../src/lib/whatsapp'
import {
  initializeDataStore,
  generateWhatsAppReminders,
  confirmReminderSent,
  getEscalations,
  getStudents,
  getReminders,
  approveReminders,
} from '../src/lib/data-store'

describe('WhatsApp Campaign & Proctor Escalation Workflow', () => {
  it('renders personalized variables into template', () => {
    const text = renderWhatsAppMessage(DEFAULT_WHATSAPP_TEMPLATE, {
      student_name: 'Kaushik S',
      register_number: '22BCE5208',
      student_form_link: 'https://college.edu/student-form?token=abc-123',
      department: 'SCOPE',
      reminder_number: 1,
      max_reminders: 3,
    })

    assert.strictEqual(text.includes('Dear Kaushik S,'), true)
    assert.strictEqual(text.includes('Register Number: 22BCE5208'), true)
    assert.strictEqual(text.includes('https://college.edu/student-form?token=abc-123'), true)
    assert.strictEqual(text.includes('Reminder #1'), true)
  })

  it('generates properly formatted wa.me chat URL', () => {
    const url = generateDirectWhatsAppUrl('9845091711', 'Hello Student')
    assert.strictEqual(url.startsWith('https://wa.me/919845091711?text='), true)
    assert.strictEqual(url.includes('Hello%20Student'), true)
  })

  it('triggers proctor escalation automatically after 3 confirmed sent reminders', async () => {
    await initializeDataStore()

    // Find a pending student without an existing escalation
    const allEscalations = await getEscalations()
    const escalatedIds = new Set(allEscalations.map((e) => e.student_id))
    const studentList = await getStudents({ status: 'pending', limit: 100 })
    const testStudent = studentList.students.find((s) => !escalatedIds.has(s.id)) || studentList.students[10]
    testStudent.reminder_count = 0
    assert.strictEqual(!!testStudent, true)

    // Generate reminders for this test student
    await generateWhatsAppReminders({ student_ids: [testStudent.id] })

    let pendingReminders = await getReminders('pending_review')
    let studentReminders = pendingReminders.filter((r) => r.student_id === testStudent.id)
    assert.strictEqual(studentReminders.length > 0, true)

    // Approve the reminder
    await approveReminders([studentReminders[0].id])

    // Confirm Sent #1
    let r1 = await confirmReminderSent(studentReminders[0].id, 'Staff A', 'Sent via mobile 1')
    assert.strictEqual(r1.success, true)
    assert.strictEqual(r1.escalated, false)

    // Generate, approve, and send #2
    await generateWhatsAppReminders({ student_ids: [testStudent.id] })
    pendingReminders = await getReminders('pending_review')
    studentReminders = pendingReminders.filter((r) => r.student_id === testStudent.id)
    await approveReminders([studentReminders[0].id])
    let r2 = await confirmReminderSent(studentReminders[0].id, 'Staff A', 'Sent via mobile 2')
    assert.strictEqual(r2.success, true)
    assert.strictEqual(r2.escalated, false)

    // Generate, approve, and send #3 -> MUST AUTO-ESCALATE TO PROCTOR!
    await generateWhatsAppReminders({ student_ids: [testStudent.id] })
    pendingReminders = await getReminders('pending_review')
    studentReminders = pendingReminders.filter((r) => r.student_id === testStudent.id)
    await approveReminders([studentReminders[0].id])
    let r3 = await confirmReminderSent(studentReminders[0].id, 'Staff A', 'Sent via mobile 3')

    assert.strictEqual(r3.success, true)
    assert.strictEqual(r3.escalated, true)

    // Verify student is now in the proctor escalations table
    const escalations = await getEscalations('pending')
    const found = escalations.find((e) => e.student_id === testStudent.id)
    assert.strictEqual(!!found, true)
    assert.strictEqual(found?.reminder_count, 3)
    assert.strictEqual(found?.proctor_name, testStudent.proctor_name)
  })
})
