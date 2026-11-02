import { NextRequest, NextResponse } from 'next/server'
import { getEscalations, updateEscalationStatus } from '@/lib/data-store'
import type { FollowUpStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    const escalations = await getEscalations(status)
    return NextResponse.json({ escalations })
  } catch (error: any) {
    console.error('Error fetching escalations:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch escalations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { escalation_id, follow_up_status, notes, resolved_by } = body as {
      escalation_id: string
      follow_up_status: FollowUpStatus
      notes?: string
      resolved_by?: string
    }

    if (!escalation_id || !follow_up_status) {
      return NextResponse.json({ error: 'escalation_id and follow_up_status are required' }, { status: 400 })
    }

    const success = await updateEscalationStatus(
      escalation_id,
      follow_up_status,
      notes,
      resolved_by || 'Proctor Office'
    )

    if (!success) {
      return NextResponse.json({ error: 'Escalation not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Escalation updated to status ${follow_up_status}.`,
    })
  } catch (error: any) {
    console.error('Error updating escalation:', error)
    return NextResponse.json({ error: error.message || 'Failed to update escalation' }, { status: 500 })
  }
}
