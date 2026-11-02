import { z } from 'zod'

// ============================================================
// Student Form Validation Schemas
// ============================================================

export const employmentDetailsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  job_designation: z.string().min(1, 'Job designation is required'),
  employment_type: z.enum(['full_time', 'part_time', 'contract']),
  joining_date: z.string().min(1, 'Joining date/year is required'),
  annual_ctc: z.string().optional(),
  placement_type: z.enum(['on_campus', 'off_campus']),
})

export const higherStudiesDetailsSchema = z.object({
  institution_name: z.string().min(1, 'Institution name is required'),
  programme_course: z.string().min(1, 'Programme/course is required'),
  admission_year: z.string().min(1, 'Admission year is required'),
  country: z.string().min(1, 'Country is required'),
})

export const entrepreneurshipDetailsSchema = z.object({
  business_name: z.string().min(1, 'Business/start-up name is required'),
  nature_of_business: z.string().min(1, 'Nature of business is required'),
  establishment_date: z.string().min(1, 'Establishment date/year is required'),
})

export const internshipDetailsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  internship_role: z.string().min(1, 'Internship role is required'),
  duration: z.string().min(1, 'Duration is required'),
  stipend: z.string().optional(),
})

export const otherDetailsSchema = z.object({
  explanation: z.string().min(1, 'Please provide an explanation'),
})

export const outcomeCategories = [
  'full_time_employment',
  'higher_studies',
  'entrepreneurship',
  'internship_only',
  'other_progression',
  'no_confirmed_outcome',
] as const

export const outcomeCategoryLabels: Record<typeof outcomeCategories[number], string> = {
  full_time_employment: 'Full-time Employment',
  higher_studies: 'Higher Studies',
  entrepreneurship: 'Entrepreneurship',
  internship_only: 'Internship Only',
  other_progression: 'Other Progression',
  no_confirmed_outcome: 'No Confirmed Progression Outcome',
}

export const studentFormSchema = z.object({
  register_number: z.string().min(1, 'Register number is required'),
  student_name: z.string().min(1, 'Student name is required'),
  department: z.string().optional(),
  programme: z.string().optional(),
  outcome_category: z.enum(outcomeCategories),
  employment_details: employmentDetailsSchema.optional().nullable(),
  higher_studies_details: higherStudiesDetailsSchema.optional().nullable(),
  entrepreneurship_details: entrepreneurshipDetailsSchema.optional().nullable(),
  internship_details: internshipDetailsSchema.optional().nullable(),
  other_details: otherDetailsSchema.optional().nullable(),
  declaration_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the declaration to submit',
  }),
})

export type StudentFormData = z.infer<typeof studentFormSchema>

// ============================================================
// Admin Validation Schemas
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const messageTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  template_text: z.string().min(10, 'Template must be at least 10 characters'),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export type MessageTemplateFormData = z.infer<typeof messageTemplateSchema>

export const reminderApprovalSchema = z.object({
  reminder_ids: z.array(z.string().uuid()).min(1, 'Select at least one reminder'),
  action: z.enum(['approve', 'reject', 'edit']),
  edited_text: z.string().optional(),
  notes: z.string().optional(),
})

export const verificationSchema = z.object({
  submission_id: z.string().uuid(),
  status: z.enum(['verified', 'rejected', 'needs_review']),
  admin_notes: z.string().optional(),
})

export const escalationFollowUpSchema = z.object({
  escalation_id: z.string().uuid(),
  follow_up_status: z.enum(['contacted', 'resolved', 'no_response']),
  follow_up_notes: z.string().optional(),
})
