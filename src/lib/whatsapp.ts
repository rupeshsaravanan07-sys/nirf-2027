import { formatMobileNumber } from './utils'

export interface WhatsAppMessageContext {
  student_name: string
  register_number: string
  student_form_link: string
  department?: string | null
  programme?: string | null
  proctor_name?: string | null
  reminder_number: number
  max_reminders?: number
}

export const DEFAULT_WHATSAPP_TEMPLATE = `Dear {{student_name}},

Our college is collecting Student Progression Information for NIRF 2027.
Our records indicate that your progression details are still pending.

Please complete the online form using the following secure link:
{{student_form_link}}

Register Number: {{register_number}}
Department: {{department}}

This is Reminder #{{reminder_number}}. Kindly submit your details at the earliest to ensure accurate representation of our institution in the national rankings.

Regards,
NIRF Student Progression Data Collection Team`

export function renderWhatsAppMessage(
  templateText: string,
  context: WhatsAppMessageContext
): string {
  let message = templateText
  const replacements: Record<string, string> = {
    '{{student_name}}': context.student_name || 'Student',
    '{{register_number}}': context.register_number || '',
    '{{student_form_link}}': context.student_form_link || '',
    '{{department}}': context.department || 'SCOPE',
    '{{programme}}': context.programme || '',
    '{{proctor_name}}': context.proctor_name || 'Your Assigned Proctor',
    '{{reminder_number}}': String(context.reminder_number || 1),
    '{{max_reminders}}': String(context.max_reminders || 3),
  }

  for (const [placeholder, value] of Object.entries(replacements)) {
    message = message.split(placeholder).join(value)
  }

  return message
}

export function generateDirectWhatsAppUrl(mobileNumber: string, message: string): string {
  const formatted = formatMobileNumber(mobileNumber).replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${formatted}?text=${encoded}`
}
