import { NextRequest, NextResponse } from 'next/server'
import { approveReminders } from '@/lib/data-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reminder_ids, reviewed_by } = body as { reminder_ids: string[]; reviewed_by?: string }

    if (!reminder_ids || !reminder_ids.length) {
      return NextResponse.json({ error: 'Please select at least one reminder to approve' }, { status: 400 })
    }

    const count = await approveReminders(reminder_ids, reviewed_by || 'Admin Reviewer')

    return NextResponse.json({
      success: true,
      message: `Approved ${count} reminder(s). Ready for staff dispatch.`,
      approved_count: count,
    })
  } catch (error: any) {
    console.error('Error approving reminders:', error)
    return NextResponse.json({ error: error.message || 'Failed to approve reminders' }, { status: 500 })
  }
}
