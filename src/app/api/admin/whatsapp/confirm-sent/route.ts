import { NextRequest, NextResponse } from 'next/server'
import { confirmReminderSent } from '@/lib/data-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reminder_id, confirmed_by, notes } = body as {
      reminder_id: string
      confirmed_by?: string
      notes?: string
    }

    if (!reminder_id) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 })
    }

    const result = await confirmReminderSent(
      reminder_id,
      confirmed_by || 'Admin Staff',
      notes
    )

    if (!result.success) {
      return NextResponse.json({ error: 'Reminder not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: result.escalated
        ? 'Reminder marked as sent. Student has now received 3 reminders without response and has been AUTOMATICALLY ESCALATED to their proctor.'
        : 'Reminder marked as successfully sent by staff.',
      escalated: result.escalated,
      reminder: result.reminder,
    })
  } catch (error: any) {
    console.error('Error confirming reminder dispatch:', error)
    return NextResponse.json({ error: error.message || 'Failed to confirm reminder dispatch' }, { status: 500 })
  }
}
