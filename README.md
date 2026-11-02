# NIRF 2027 – Student Progression Data Collection & Management System

> Production-Ready Full-Stack Web Application for Institutional NIRF 2027 Accreditation Reporting.

---

## 🌟 Executive Summary

This system was engineered specifically for institutional accreditation (NIRF 2027) to collect, verify, monitor, and report graduate student progression outcomes across an initial student population of **929+ students**.

### Verified Workbook Statistics (Source: `NIRF 2027 – Student Progression Data Collection (Responses).xlsx`)
- **Total Master Students:** `929` students (SCOPE School)
- **Total Form Responses:** `382` responses
- **Matched Student Responses:** `257` students with verified progression data
- **Unmatched Archived Responses:** `125` entries preserved in archive
- **Pending Submissions:** `672` students
- **Unique Faculty Proctors:** `105` mentors tracked

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui Component Architecture |
| **Database** | Supabase PostgreSQL + Resilient Local Persistence Store |
| **Authentication** | Supabase Auth + Role-Based Session Middleware |
| **Excel Engine** | ExcelJS (Streaming parser with dynamic header sanitization) |
| **Validation** | Zod (Type-safe input validation) |
| **Testing** | Node.js Test Runner + TypeScript execution |
| **Hosting** | Vercel (Edge-ready) / Node.js Server |

---

## 🚀 Key System Capabilities

### 1. Dynamic Excel Import Engine (`/admin/import`)
- Ingests institutional workbooks containing `Student list`, `Eligible Students`, and `Form Responses 1`.
- **Dynamic Header Normalization:** Trims embedded line breaks (`\n`) and trailing whitespace from Excel headers.
- **Deduplication:** Normalizes register numbers (uppercase, trimmed) to prevent duplicate records on re-import.
- **Audit Logging:** Tracks import history, unmatched students, and invalid phone numbers.

### 2. Secure Public Student Form (`/student-form?token=[UUID]`)
- **Privacy Protection:** Individual token-based access. No sequential database IDs or predictable URLs.
- **Pre-filled Verified Info:** Pre-populates Register Number, Student Name, Department, and Programme.
- **Conditional Category Logic:**
  - **Full-time Employment:** Company Name, Designation, Joining Date, CTC, On/Off Campus mode.
  - **Higher Studies:** University Name, Degree, Country, Admission Year, Proof upload.
  - **Entrepreneurship:** Business Name, Nature of Venture, Incorporation Date.
  - **Internship Only:** Distinctly tracked per NIRF rules; does not automatically count as full-time employment.
  - **Preparing / Placement Search:** Detailed explanation field.
- **Document Proof Upload:** Accepts PDF, PNG, JPG up to 10MB.
- **Submission Reference:** Generates instant tracking codes (e.g., `NIRF-20261030-XYZ123`).
- **Version History:** Editing a submission creates Version 2+ without overwriting original records.

### 3. Administrator Dashboard (`/admin`)
- **Live Metric Cards:** Live counts computed directly from records (Total Students, Submitted, Pending, Verified, Needs Review, Invalid Contacts, Escalated).
- **Completion Tracking:** Institutional progress bar and category distribution.
- **Programme & Department Breakdown:** Submission percentages across all 12 degree streams.
- **Proctor Compliance Table:** Real-time completion rates for all 105 assigned faculty proctors.

### 4. Staff-Controlled WhatsApp Campaign Hub (`/admin/whatsapp`)
- **Personalized Template Engine:** Injects `{{student_name}}`, `{{register_number}}`, `{{student_form_link}}`, and `{{reminder_number}}`.
- **Two-Step Dispatch Safeguard:** Opening WhatsApp via `wa.me` does **not** auto-mark messages as sent. Staff must verify delivery and click "Confirm Staff Sent".
- **Communication Timeline:** Logs generated, approved, and confirmed timestamps with staff attribution.

### 5. Automated Proctor Escalation (`/admin/escalations`)
- **Safeguard Rule:** When any student receives **3 confirmed reminders** without submitting their form, the system automatically escalates the student to their designated faculty proctor.
- **Proctor Follow-up Portal:** Displays proctor contact info, student phone number, and mentorship discussion notes.

### 6. Master Multi-Sheet Excel Export (`/admin/reports`)
Generates comprehensive Excel workbooks containing:
1. `All Students Progression`: Enriched with company, CTC, proof links, reminder counts, and escalation flags.
2. `Department Summary`: Aggregate completion rates by degree program.
3. `Proctor Follow-up Report`: Compliance percentages by faculty mentor.

---

## 🛠️ Setup & Running Instructions

### 1. Environment Configuration (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Migration (Supabase PostgreSQL)
1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/mvrqktwwmpojjdqhhofb](https://supabase.com/dashboard/project/mvrqktwwmpojjdqhhofb)
2. Navigate to **SQL Editor** in the left sidebar.
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`.
4. Click **Run**.
5. Run `node sync-to-supabase.js` to immediately sync the 929 students into Supabase!

### 3. Running Locally
```bash
npm install
npm test        # Runs test suite (10/10 passing)
npm run build   # Production build
npm start       # Launches server on http://localhost:3000
```

### 4. Default Staff Login
- **URL:** `http://localhost:3000/login`
- **Email:** `admin@vit.ac.in`
- **Password:** `admin123`
