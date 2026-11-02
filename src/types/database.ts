// Database type definitions matching the PostgreSQL schema
// These types are used throughout the application for type safety

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type OutcomeCategory =
  | 'full_time_employment'
  | 'higher_studies'
  | 'entrepreneurship'
  | 'internship_only'
  | 'other_progression'
  | 'no_confirmed_outcome'

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'needs_review'

export type SendStatus = 'draft' | 'pending_review' | 'approved' | 'sent' | 'failed' | 'skipped' | 'invalid_number'

export type SendMethod = 'whatsapp_manual' | 'whatsapp_api' | 'sms' | 'email'

export type ImportStatus = 'pending' | 'preview' | 'confirmed' | 'completed' | 'failed'

export type FollowUpStatus = 'pending' | 'contacted' | 'resolved' | 'no_response'

export type AdminRole = 'super_admin' | 'admin' | 'viewer'

export type CommunicationEventType =
  | 'message_generated'
  | 'message_reviewed'
  | 'message_approved'
  | 'whatsapp_link_opened'
  | 'send_confirmed'
  | 'send_failed'
  | 'response_received'
  | 'escalation_created'

export interface Student {
  id: string
  register_number: string
  student_name: string
  mobile_number: string | null
  alternate_mobile_number: string | null
  email: string | null
  department: string | null
  programme: string | null
  school: string | null
  proctor_name: string | null
  proctor_employee_id: string | null
  source_status: string | null
  form_access_token: string
  original_source_data: Json | null
  is_eligible: boolean
  created_at: string
  updated_at: string
}

export interface ProgressionSubmission {
  id: string
  student_id: string
  submission_version: number
  outcome_category: OutcomeCategory
  employment_details: Json | null
  higher_studies_details: Json | null
  entrepreneurship_details: Json | null
  internship_details: Json | null
  other_details: Json | null
  evidence_storage_path: string | null
  declaration_accepted: boolean
  submitted_at: string
  submission_reference: string
  verification_status: VerificationStatus
  verified_by: string | null
  verified_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface OriginalResponse {
  id: string
  student_id: string | null
  register_number: string
  source_sheet: string | null
  original_row_number: number | null
  original_response_data: Json
  source_timestamp: string | null
  imported_at: string
  import_log_id: string | null
  created_at: string
}

export interface Reminder {
  id: string
  student_id: string
  reminder_number: number
  message_text: string
  message_template_id: string | null
  generated_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  approved_at: string | null
  sent_at: string | null
  send_method: SendMethod | null
  send_status: SendStatus
  confirmed_sent_by: string | null
  response_received_after: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CommunicationLog {
  id: string
  student_id: string
  reminder_id: string | null
  event_type: CommunicationEventType
  event_data: Json | null
  performed_by: string | null
  created_at: string
}

export interface ProctorEscalation {
  id: string
  student_id: string
  proctor_name: string | null
  proctor_employee_id: string | null
  escalation_reason: string | null
  reminder_count: number
  escalation_date: string
  follow_up_status: FollowUpStatus
  follow_up_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  auth_user_id: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface ImportLog {
  id: string
  filename: string
  file_size_bytes: number | null
  uploaded_by: string | null
  upload_date: string
  total_rows: number | null
  imported_rows: number | null
  skipped_rows: number | null
  duplicate_rows: number | null
  error_rows: number | null
  unmatched_responses: number | null
  import_summary: Json | null
  import_status: ImportStatus
  errors: Json | null
  created_at: string
  updated_at: string
}

export interface MessageTemplate {
  id: string
  name: string
  template_text: string
  variables: Json | null
  is_default: boolean
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// Joined/enriched types for the admin dashboard
export interface StudentWithStatus extends Student {
  submission_count: number
  latest_submission?: ProgressionSubmission | null
  reminder_count: number
  latest_reminder?: Reminder | null
  escalation?: ProctorEscalation | null
  original_response_count: number
}

export interface DashboardStats {
  total_students: number
  total_existing_responses: number
  total_new_submissions: number
  total_submitted: number
  total_pending: number
  verification_pending: number
  verified: number
  follow_up_required: number
  invalid_contacts: number
  escalated_to_proctors: number
}

export interface DepartmentStats {
  department: string
  total: number
  submitted: number
  pending: number
}

export interface ProctorStats {
  proctor_name: string
  proctor_employee_id: string
  total_students: number
  submitted: number
  pending: number
  submission_percentage: number
}

export interface OutcomeCategoryStats {
  category: OutcomeCategory
  count: number
}

// Database interface for Supabase client typing
export interface Database {
  public: {
    Tables: {
      students: {
        Row: Student
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'form_access_token'> & {
          id?: string
          form_access_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Student, 'id' | 'created_at'>>
      }
      progression_submissions: {
        Row: ProgressionSubmission
        Insert: Omit<ProgressionSubmission, 'id' | 'created_at' | 'updated_at' | 'submission_reference'> & {
          id?: string
          submission_reference?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ProgressionSubmission, 'id' | 'created_at'>>
      }
      original_responses: {
        Row: OriginalResponse
        Insert: Omit<OriginalResponse, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<OriginalResponse, 'id' | 'created_at'>>
      }
      reminders: {
        Row: Reminder
        Insert: Omit<Reminder, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Reminder, 'id' | 'created_at'>>
      }
      communication_logs: {
        Row: CommunicationLog
        Insert: Omit<CommunicationLog, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<CommunicationLog, 'id' | 'created_at'>>
      }
      proctor_escalations: {
        Row: ProctorEscalation
        Insert: Omit<ProctorEscalation, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ProctorEscalation, 'id' | 'created_at'>>
      }
      admin_users: {
        Row: AdminUser
        Insert: Omit<AdminUser, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<AdminUser, 'id' | 'created_at'>>
      }
      import_logs: {
        Row: ImportLog
        Insert: Omit<ImportLog, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ImportLog, 'id' | 'created_at'>>
      }
      message_templates: {
        Row: MessageTemplate
        Insert: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<MessageTemplate, 'id' | 'created_at'>>
      }
    }
  }
}
