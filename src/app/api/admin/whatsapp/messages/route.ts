import { NextRequest, NextResponse } from 'next/server'
import { getReminders } from '@/lib/data-store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    const reminders = await getReminders(status)
    return NextResponse.json({ reminders })
  } catch (error: any) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch reminders' }, { status: 500 })
  }
}
