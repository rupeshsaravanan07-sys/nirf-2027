-- ============================================================================
-- NIRF 2027 Student Progression Data Collection & Management System
-- Initial Database Schema Migration
-- ============================================================================
-- Generated: 2026-10-30
-- Description: Complete schema for tracking student progression outcomes,
--              managing WhatsApp reminder campaigns, importing legacy data,
--              and generating NIRF-compliant reports.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. UTILITY FUNCTION: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column()
    IS 'Trigger function to automatically set updated_at to current timestamp on row update.';

-- ============================================================================
-- 2. TABLE: admin_users — Staff accounts for system administration
-- ============================================================================

CREATE TABLE public.admin_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'viewer')),
    password_hash   TEXT,                                       -- nullable, for non-supabase-auth users
    auth_user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- link to Supabase Auth
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_email_unique UNIQUE (email);

CREATE INDEX idx_admin_users_auth_user_id ON public.admin_users (auth_user_id);
CREATE INDEX idx_admin_users_role         ON public.admin_users (role);

COMMENT ON TABLE public.admin_users
    IS 'Staff accounts (super_admin, admin, viewer) who manage the NIRF student progression system.';

-- ============================================================================
-- 3. TABLE: students — Master student records (931+ students)
-- ============================================================================

CREATE TABLE public.students (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_number         TEXT NOT NULL,
    student_name            TEXT,
    mobile_number           TEXT,
    alternate_mobile_number TEXT,
    email                   TEXT,
    department              TEXT,
    programme               TEXT,
    school                  TEXT,
    proctor_name            TEXT,
    proctor_employee_id     TEXT,
    source_status           TEXT,                                -- original status from import
    form_access_token       UUID DEFAULT gen_random_uuid(),      -- for secure form access
    original_source_data    JSONB,                               -- raw imported row data
    is_eligible             BOOLEAN NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ADD CONSTRAINT students_register_number_unique UNIQUE (register_number);
ALTER TABLE public.students ADD CONSTRAINT students_form_access_token_unique UNIQUE (form_access_token);

CREATE INDEX idx_students_register_number   ON public.students (register_number);
CREATE INDEX idx_students_mobile_number     ON public.students (mobile_number);
CREATE INDEX idx_students_proctor_emp_id    ON public.students (proctor_employee_id);
CREATE INDEX idx_students_form_access_token ON public.students (form_access_token);
CREATE INDEX idx_students_department        ON public.students (department);
CREATE INDEX idx_students_source_status     ON public.students (source_status);

COMMENT ON TABLE public.students
    IS 'Master student records for NIRF 2027 progression tracking. Each row represents one graduating student.';

-- ============================================================================
-- 4. TABLE: import_logs — Upload and import tracking
--    (Created before original_responses because it is referenced by FK)
-- ============================================================================

CREATE TABLE public.import_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename            TEXT NOT NULL,
    file_size_bytes     BIGINT,
    uploaded_by         UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    upload_date         TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_rows          INTEGER,
    imported_rows       INTEGER,
    skipped_rows        INTEGER,
    duplicate_rows      INTEGER,
    error_rows          INTEGER,
    unmatched_responses INTEGER,
    import_summary      JSONB,
    import_status       TEXT NOT NULL DEFAULT 'pending'
                        CHECK (import_status IN ('pending', 'preview', 'confirmed', 'completed', 'failed')),
    errors              JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_logs_uploaded_by   ON public.import_logs (uploaded_by);
CREATE INDEX idx_import_logs_import_status ON public.import_logs (import_status);

COMMENT ON TABLE public.import_logs
    IS 'Tracks every file upload/import operation, including row counts, errors, and matching summary.';

-- ============================================================================
-- 5. TABLE: original_responses — Archived imported responses
-- ============================================================================

CREATE TABLE public.original_responses (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id              UUID REFERENCES public.students(id) ON DELETE SET NULL,
    register_number         TEXT NOT NULL,
    source_sheet            TEXT,
    original_row_number     INTEGER,
    original_response_data  JSONB NOT NULL,
    source_timestamp        TIMESTAMPTZ,
    imported_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    import_log_id           UUID REFERENCES public.import_logs(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_original_responses_student_id    ON public.original_responses (student_id);
CREATE INDEX idx_original_responses_register_num  ON public.original_responses (register_number);
CREATE INDEX idx_original_responses_import_log_id ON public.original_responses (import_log_id);

COMMENT ON TABLE public.original_responses
    IS 'Immutable archive of imported Google Forms / Excel responses, linked back to students and import batches.';

-- ============================================================================
-- 6. TABLE: progression_submissions — New form submissions with versioning
-- ============================================================================

CREATE TABLE public.progression_submissions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id              UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submission_version      INTEGER NOT NULL DEFAULT 1,
    outcome_category        TEXT NOT NULL
                            CHECK (outcome_category IN (
                                'full_time_employment',
                                'higher_studies',
                                'entrepreneurship',
                                'internship_only',
                                'other_progression',
                                'no_confirmed_outcome'
                            )),
    employment_details      JSONB,
    higher_studies_details  JSONB,
    entrepreneurship_details JSONB,
    internship_details      JSONB,
    other_details           JSONB,
    evidence_storage_path   TEXT,
    declaration_accepted    BOOLEAN NOT NULL DEFAULT false,
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    submission_reference    TEXT,
    verification_status     TEXT NOT NULL DEFAULT 'pending'
                            CHECK (verification_status IN (
                                'pending', 'verified', 'rejected', 'needs_review'
                            )),
    verified_by             UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    verified_at             TIMESTAMPTZ,
    admin_notes             TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.progression_submissions
    ADD CONSTRAINT progression_submissions_student_version_unique
    UNIQUE (student_id, submission_version);

ALTER TABLE public.progression_submissions
    ADD CONSTRAINT progression_submissions_reference_unique
    UNIQUE (submission_reference);

CREATE INDEX idx_progression_sub_student_id   ON public.progression_submissions (student_id);
CREATE INDEX idx_progression_sub_outcome      ON public.progression_submissions (outcome_category);
CREATE INDEX idx_progression_sub_verification ON public.progression_submissions (verification_status);

COMMENT ON TABLE public.progression_submissions
    IS 'Student progression outcome submissions with versioning. Each new submission increments submission_version per student.';

-- ============================================================================
-- 7. TABLE: message_templates — Editable WhatsApp message templates
--    (Created before reminders because it is referenced by FK)
-- ============================================================================

CREATE TABLE public.message_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    template_text   TEXT NOT NULL,
    variables       JSONB,                                      -- array of variable names used
    is_default      BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_by      UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_templates_is_active  ON public.message_templates (is_active);
CREATE INDEX idx_message_templates_is_default ON public.message_templates (is_default);

COMMENT ON TABLE public.message_templates
    IS 'Editable WhatsApp/SMS/email message templates with variable placeholders for reminder campaigns.';

-- ============================================================================
-- 8. TABLE: reminders — WhatsApp reminder tracking
-- ============================================================================

CREATE TABLE public.reminders (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id              UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    reminder_number         INTEGER NOT NULL CHECK (reminder_number BETWEEN 1 AND 10),
    message_text            TEXT NOT NULL,
    message_template_id     UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
    generated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by             UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    reviewed_at             TIMESTAMPTZ,
    approved_at             TIMESTAMPTZ,
    sent_at                 TIMESTAMPTZ,
    send_method             TEXT CHECK (send_method IN (
                                'whatsapp_manual', 'whatsapp_api', 'sms', 'email'
                            )),
    send_status             TEXT NOT NULL DEFAULT 'draft'
                            CHECK (send_status IN (
                                'draft', 'pending_review', 'approved', 'sent',
                                'failed', 'skipped', 'invalid_number'
                            )),
    confirmed_sent_by       UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    response_received_after BOOLEAN NOT NULL DEFAULT false,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_student_id      ON public.reminders (student_id);
CREATE INDEX idx_reminders_send_status     ON public.reminders (send_status);
CREATE INDEX idx_reminders_reminder_number ON public.reminders (reminder_number);

COMMENT ON TABLE public.reminders
    IS 'Tracks every WhatsApp/SMS/email reminder sent to students, with approval workflow and delivery status.';

-- ============================================================================
-- 9. TABLE: communication_logs — All communication events
-- ============================================================================

CREATE TABLE public.communication_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    reminder_id     UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
    event_type      TEXT NOT NULL CHECK (event_type IN (
                        'message_generated',
                        'message_reviewed',
                        'message_approved',
                        'whatsapp_link_opened',
                        'send_confirmed',
                        'send_failed',
                        'response_received',
                        'escalation_created'
                    )),
    event_data      JSONB,
    performed_by    UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_communication_logs_student_id  ON public.communication_logs (student_id);
CREATE INDEX idx_communication_logs_event_type  ON public.communication_logs (event_type);
CREATE INDEX idx_communication_logs_reminder_id ON public.communication_logs (reminder_id);

COMMENT ON TABLE public.communication_logs
    IS 'Immutable audit trail of all communication events: message generation, review, send, delivery, and responses.';

-- ============================================================================
-- 10. TABLE: proctor_escalations — Post-3-reminder escalation
-- ============================================================================

CREATE TABLE public.proctor_escalations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    proctor_name        TEXT,
    proctor_employee_id TEXT,
    escalation_reason   TEXT NOT NULL DEFAULT 'No response after 3 reminders',
    reminder_count      INTEGER NOT NULL,
    escalation_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
    follow_up_status    TEXT NOT NULL DEFAULT 'pending'
                        CHECK (follow_up_status IN (
                            'pending', 'contacted', 'resolved', 'no_response'
                        )),
    follow_up_notes     TEXT,
    resolved_at         TIMESTAMPTZ,
    resolved_by         UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proctor_esc_student_id    ON public.proctor_escalations (student_id);
CREATE INDEX idx_proctor_esc_proctor_id    ON public.proctor_escalations (proctor_employee_id);
CREATE INDEX idx_proctor_esc_follow_up     ON public.proctor_escalations (follow_up_status);

COMMENT ON TABLE public.proctor_escalations
    IS 'Escalation records created when a student does not respond after multiple reminders. Routed to their assigned proctor.';

-- ============================================================================
-- 11. TRIGGERS: Auto-update updated_at on all tables that have it
-- ============================================================================

CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_import_logs_updated_at
    BEFORE UPDATE ON public.import_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_progression_submissions_updated_at
    BEFORE UPDATE ON public.progression_submissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_message_templates_updated_at
    BEFORE UPDATE ON public.message_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_reminders_updated_at
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_proctor_escalations_updated_at
    BEFORE UPDATE ON public.proctor_escalations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 12. ROW LEVEL SECURITY: Enable RLS on all tables
-- ============================================================================

ALTER TABLE public.admin_users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.original_responses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progression_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctor_escalations      ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 13. RLS POLICIES: Authenticated admin users have full access
-- ============================================================================
-- These policies check that the authenticated user exists in admin_users
-- and is active. For public student form submissions, separate anon policies
-- can be added later.

-- Helper: Check if current auth user is an active admin
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE auth_user_id = auth.uid()
          AND active = true
          AND role IN ('super_admin', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_active_admin()
    IS 'Returns true if the currently authenticated Supabase user is an active admin or super_admin.';

-- Helper: Check if current auth user is any active staff (including viewer)
CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE auth_user_id = auth.uid()
          AND active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_active_staff()
    IS 'Returns true if the currently authenticated Supabase user is any active staff member (super_admin, admin, or viewer).';

-- ---- admin_users ----
CREATE POLICY admin_users_select ON public.admin_users
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

CREATE POLICY admin_users_insert ON public.admin_users
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_admin());

CREATE POLICY admin_users_update ON public.admin_users
    FOR UPDATE TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

CREATE POLICY admin_users_delete ON public.admin_users
    FOR DELETE TO authenticated
    USING (public.is_active_admin());

-- ---- students ----
CREATE POLICY students_select ON public.students
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

CREATE POLICY students_insert ON public.students
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_admin());

CREATE POLICY students_update ON public.students
    FOR UPDATE TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

CREATE POLICY students_delete ON public.students
    FOR DELETE TO authenticated
    USING (public.is_active_admin());

-- Allow anonymous access for student form submission via form_access_token
CREATE POLICY students_anon_select ON public.students
    FOR SELECT TO anon
    USING (form_access_token IS NOT NULL);

-- ---- import_logs ----
CREATE POLICY import_logs_select ON public.import_logs
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

CREATE POLICY import_logs_insert ON public.import_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_admin());

CREATE POLICY import_logs_update ON public.import_logs
    FOR UPDATE TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

CREATE POLICY import_logs_delete ON public.import_logs
    FOR DELETE TO authenticated
    USING (public.is_active_admin());

-- ---- original_responses ----
CREATE POLICY original_responses_select ON public.original_responses
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

CREATE POLICY original_responses_insert ON public.original_responses
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_admin());

CREATE POLICY original_responses_update ON public.original_responses
    FOR UPDATE TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

CREATE POLICY original_responses_delete ON public.original_responses
    FOR DELETE TO authenticated
    USING (public.is_active_admin());

-- ---- progression_submissions ----
CREATE POLICY progression_submissions_select ON public.progression_submissions
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

CREATE POLICY progression_submissions_insert ON public.progression_submissions
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_admin());

CREATE POLICY progression_submissions_update ON public.progression_submissions
    FOR UPDATE TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

CREATE POLICY progression_submissions_delete ON public.progression_submissions
    FOR DELETE TO authenticated
    USING (public.is_active_admin());

-- Allow anonymous student submissions via form
CREATE POLICY progression_submissions_anon_insert ON public.progression_submissions
    FOR INSERT TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_id
              AND s.form_access_token IS NOT NULL
              AND s.is_eligible = true
        )
    );

-- ---- message_templates ----
CREATE POLICY message_templates_select ON public.message_templates
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

CREATE POLICY message_templates_insert ON public.message_templates
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_admin());

CREATE POLICY message_templates_update ON public.message_templates
    FOR UPDATE TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

CREATE POLICY message_templates_delete ON public.message_templates
    FOR DELETE TO authenticated
    USING (public.is_active_admin());

-- ---- reminders ----
CREATE POLICY reminders_select ON public.reminders
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

CREATE POLICY reminders_insert ON public.reminders
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_admin());

CREATE POLICY reminders_update ON public.reminders
    FOR UPDATE TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

CREATE POLICY reminders_delete ON public.reminders
    FOR DELETE TO authenticated
    USING (public.is_active_admin());

-- ---- communication_logs ----
CREATE POLICY communication_logs_select ON public.communication_logs
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

CREATE POLICY communication_logs_insert ON public.communication_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_admin());

CREATE POLICY communication_logs_delete ON public.communication_logs
    FOR DELETE TO authenticated
    USING (public.is_active_admin());

-- ---- proctor_escalations ----
CREATE POLICY proctor_escalations_select ON public.proctor_escalations
    FOR SELECT TO authenticated
    USING (public.is_active_staff());

CREATE POLICY proctor_escalations_insert ON public.proctor_escalations
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_admin());

CREATE POLICY proctor_escalations_update ON public.proctor_escalations
    FOR UPDATE TO authenticated
    USING (public.is_active_admin())
    WITH CHECK (public.is_active_admin());

CREATE POLICY proctor_escalations_delete ON public.proctor_escalations
    FOR DELETE TO authenticated
    USING (public.is_active_admin());

-- ============================================================================
-- 14. SEED DATA: Default WhatsApp message template
-- ============================================================================

INSERT INTO public.message_templates (name, template_text, variables, is_default, is_active)
VALUES (
    'Default NIRF Progression Reminder',
    E'Dear {{student_name}},\n\n'
    E'Greetings from the NIRF Cell.\n\n'
    E'We are reaching out regarding your post-graduation progression details required for NIRF 2027 ranking.\n\n'
    E'Please fill out the Student Progression Form using the secure link below:\n'
    E'{{form_link}}\n\n'
    E'Your Register Number: {{register_number}}\n'
    E'Department: {{department}}\n\n'
    E'This is reminder {{reminder_number}} of {{max_reminders}}.\n\n'
    E'If you have already submitted the form, please ignore this message.\n\n'
    E'For any queries, contact the NIRF Cell.\n\n'
    E'Thank you for your cooperation.',
    '["student_name", "form_link", "register_number", "department", "reminder_number", "max_reminders"]'::JSONB,
    true,
    true
);

-- ============================================================================
-- 15. GRANT SERVICE ROLE BYPASS (for backend/server operations)
-- ============================================================================
-- The service_role key bypasses RLS by default in Supabase.
-- No additional grants needed for server-side operations.

-- ============================================================================
-- Migration complete.
-- ============================================================================
