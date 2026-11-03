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

  const link = context.student_form_link || ''
  const name = context.student_name || 'Student'
  const regNo = context.register_number || ''
  const dept = context.department || 'SCOPE'
  const prog = context.programme || ''
  const proctor = context.proctor_name || 'Your Assigned Proctor'
  const reminderNum = String(context.reminder_number || 1)
  const maxReminders = String(context.max_reminders || 3)

  const replacements: [RegExp, string][] = [
    // Link variations (e.g. {{form_link}}, {form_link}, {{student_form_link}}, {student_form_link}, {{link}}, {link})
    [/\{\{?(?:student_form_link|form_link|student_link|link|url)\}\}?/gi, link],
    // Student name variations (e.g. {{student_name}}, {student_name}, {{name}}, {name})
    [/\{\{?(?:student_name|name)\}\}?/gi, name],
    // Register number variations (e.g. {{register_number}}, {register_number}, {{reg_no}}, {reg_no}, {{roll_number}})
    [/\{\{?(?:register_number|reg_no|roll_no|roll_number)\}\}?/gi, regNo],
    // Proctor name variations
    [/\{\{?(?:proctor_name|proctor)\}\}?/gi, proctor],
    // Department variations
    [/\{\{?department\}\}?/gi, dept],
    // Programme variations
    [/\{\{?programme\}\}?/gi, prog],
    // Reminder numbers
    [/\{\{?reminder_number\}\}?/gi, reminderNum],
    [/\{\{?max_reminders\}\}?/gi, maxReminders],
  ]

  for (const [regex, value] of replacements) {
    message = message.replace(regex, value)
  }

  return message
}

export function generateDirectWhatsAppUrl(mobileNumber: string, message: string): string {
  const formatted = formatMobileNumber(mobileNumber).replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${formatted}?text=${encoded}`
}
