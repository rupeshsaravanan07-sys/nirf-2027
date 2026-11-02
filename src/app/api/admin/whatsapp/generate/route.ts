import { NextRequest, NextResponse } from 'next/server'
import { generateWhatsAppReminders } from '@/lib/data-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { student_ids, template_id } = body

    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const app_url = `${protocol}://${host}`

    const result = await generateWhatsAppReminders({
      student_ids,
      template_id,
      app_url,
    })

    return NextResponse.json({
      success: true,
      message: `Generated ${result.generated_count} personalized WhatsApp reminder(s).`,
      ...result,
    })
  } catch (error: any) {
    console.error('Error generating WhatsApp reminders:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate reminders' }, { status: 500 })
  }
}
