import { NextRequest, NextResponse } from 'next/server'
import { updateSubmissionVerification } from '@/lib/data-store'
import type { VerificationStatus } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { submission_id, status, admin_notes, verified_by } = body as {
      submission_id: string
      status: VerificationStatus
      admin_notes?: string
      verified_by?: string
    }

    if (!submission_id || !status) {
      return NextResponse.json({ error: 'submission_id and status are required' }, { status: 400 })
    }

    const success = await updateSubmissionVerification(
      submission_id,
      status,
      admin_notes,
      verified_by || 'Admin Officer'
    )

    if (!success) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Submission status successfully updated to ${status}.`,
    })
  } catch (error: any) {
    console.error('Error updating verification status:', error)
    return NextResponse.json({ error: error.message || 'Failed to update verification' }, { status: 500 })
  }
}
