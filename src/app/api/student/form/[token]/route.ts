import { NextRequest, NextResponse } from 'next/server'
import { getStudentByToken } from '@/lib/data-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const { student, existing_submission } = await getStudentByToken(token)

    if (!student) {
      return NextResponse.json({ error: 'Invalid or expired student link' }, { status: 404 })
    }

    // Return safe student fields (prefill verified student information)
    return NextResponse.json({
      student: {
        register_number: student.register_number,
        student_name: student.student_name,
        department: student.department || student.programme || 'SCOPE',
        programme: student.programme,
        email: student.email,
        mobile_number: student.mobile_number,
        is_eligible: student.is_eligible,
      },
      existing_submission: existing_submission
        ? {
            outcome_category: existing_submission.outcome_category,
            employment_details: existing_submission.employment_details,
            higher_studies_details: existing_submission.higher_studies_details,
            entrepreneurship_details: existing_submission.entrepreneurship_details,
            internship_details: existing_submission.internship_details,
            other_details: existing_submission.other_details,
            evidence_storage_path: existing_submission.evidence_storage_path,
            submission_reference: existing_submission.submission_reference,
            submission_version: existing_submission.submission_version,
            verification_status: existing_submission.verification_status,
            submitted_at: existing_submission.submitted_at,
          }
        : null,
    })
  } catch (error: any) {
    console.error('Error fetching student form by token:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
