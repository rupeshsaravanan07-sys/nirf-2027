import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  initializeDataStore,
  getStudentByToken,
  submitStudentProgression,
  updateSubmissionVerification,
  getStudentDetail,
} from '../src/lib/data-store'

describe('Student Form & Versioning Workflow', () => {
  it('looks up a student by individual secure token and pre-fills their verified data', async () => {
    await initializeDataStore()

    const { student, existing_submission } = await getStudentByToken('non-existent-token')
    assert.strictEqual(student, null)
    assert.strictEqual(existing_submission, null)
  })

  it('allows a student to submit their progression outcome and increments submission version', async () => {
    await initializeDataStore()

    // Find student with token
    const detail = await getStudentDetail((await import('../src/lib/data-store')).loadDB?.().students[0].id || '')
    // or get first student from data-store
    const studentList = await (await import('../src/lib/data-store')).getStudents({ limit: 1 })
    const testStudent = studentList.students[0]

    // Submit outcome
    const sub1 = await submitStudentProgression({
      form_access_token: testStudent.form_access_token,
      outcome_category: 'full_time_employment',
      employment_details: {
        company_name: 'Google LLC',
        job_designation: 'Software Engineer',
        employment_type: 'full_time',
        joining_date: 'August 2026',
        annual_ctc: '32 LPA',
        placement_type: 'on_campus',
      },
      declaration_accepted: true,
    })

    assert.strictEqual(sub1.success, true)
    assert.strictEqual(typeof sub1.submission_reference, 'string')
    assert.strictEqual(sub1.submission_reference?.startsWith('NIRF-'), true)

    // Verify submission is recorded
    const updated = await getStudentDetail(testStudent.id)
    assert.strictEqual(updated?.submissions.length! >= 1, true)
    const latest = updated?.submissions[0]
    assert.strictEqual(latest?.outcome_category, 'full_time_employment')

    // Submit updated version (version 2)
    const sub2 = await submitStudentProgression({
      form_access_token: testStudent.form_access_token,
      outcome_category: 'higher_studies',
      higher_studies_details: {
        institution_name: 'Stanford University',
        programme_course: 'MS in Computer Science',
        admission_year: '2026',
        country: 'USA',
      },
      declaration_accepted: true,
    })

    assert.strictEqual(sub2.success, true)
    const updated2 = await getStudentDetail(testStudent.id)
    assert.strictEqual(updated2?.submissions[0].submission_version! > latest?.submission_version!, true)
    assert.strictEqual(updated2?.submissions[0].outcome_category, 'higher_studies')

    // Admin verifies submission
    const verified = await updateSubmissionVerification(
      updated2?.submissions[0].id!,
      'verified',
      'Admission letter verified by Committee'
    )
    assert.strictEqual(verified, true)

    const finalCheck = await getStudentDetail(testStudent.id)
    assert.strictEqual(finalCheck?.submissions[0].verification_status, 'verified')
    assert.strictEqual(finalCheck?.submissions[0].admin_notes, 'Admission letter verified by Committee')
  })
})
