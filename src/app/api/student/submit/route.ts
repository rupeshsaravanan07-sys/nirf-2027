import { NextRequest, NextResponse } from 'next/server'
import { submitStudentProgression } from '@/lib/data-store'
import type { OutcomeCategory } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      form_access_token,
      outcome_category,
      employment_details,
      higher_studies_details,
      entrepreneurship_details,
      internship_details,
      other_details,
      evidence_storage_path,
      declaration_accepted,
    } = body

    if (!form_access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    if (!declaration_accepted) {
      return NextResponse.json({ error: 'You must accept the student declaration before submitting.' }, { status: 400 })
    }

    if (!outcome_category) {
      return NextResponse.json({ error: 'Please select a progression outcome category.' }, { status: 400 })
    }

    const result = await submitStudentProgression({
      form_access_token,
      outcome_category: outcome_category as OutcomeCategory,
      employment_details,
      higher_studies_details,
      entrepreneurship_details,
      internship_details,
      other_details,
      evidence_storage_path,
      declaration_accepted: true,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Submission failed' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Progression details submitted successfully.',
      submission_reference: result.submission_reference,
    })
  } catch (error: any) {
    console.error('Error handling student submission:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
