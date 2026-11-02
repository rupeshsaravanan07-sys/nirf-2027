const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function sync() {
  console.log('--- Starting Sync from Local Data Store to Supabase ---');
  const dbPath = path.join(__dirname, '.data', 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('Local db.json not found. Run initializeDataStore first.');
    return;
  }

  const localDB = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  console.log(`Found ${localDB.students.length} students and ${localDB.original_responses.length} responses in local store.`);

  // 1. Sync students
  console.log('Syncing students to Supabase...');
  const { data: sData, error: sErr } = await supabase.from('students').upsert(
    localDB.students.map(s => ({
      id: s.id,
      register_number: s.register_number,
      student_name: s.student_name,
      mobile_number: s.mobile_number,
      alternate_mobile_number: s.alternate_mobile_number,
      email: s.email,
      department: s.department,
      programme: s.programme,
      school: s.school,
      proctor_name: s.proctor_name,
      proctor_employee_id: s.proctor_employee_id,
      source_status: s.source_status,
      form_access_token: s.form_access_token,
      is_eligible: s.is_eligible,
      created_at: s.created_at,
      updated_at: s.updated_at,
    })),
    { onConflict: 'register_number' }
  );

  if (sErr) {
    console.error('Error syncing students to Supabase:', sErr.message);
    console.log('NOTE: Ensure you have run the migration SQL in your Supabase SQL Editor first!');
    return;
  }
  console.log(`Successfully synced students to Supabase.`);

  // 2. Sync progression submissions
  if (localDB.submissions.length > 0) {
    console.log(`Syncing ${localDB.submissions.length} progression submissions...`);
    const { error: subErr } = await supabase.from('progression_submissions').upsert(
      localDB.submissions.map(sub => ({
        id: sub.id,
        student_id: sub.student_id,
        submission_version: sub.submission_version,
        outcome_category: sub.outcome_category,
        employment_details: sub.employment_details,
        higher_studies_details: sub.higher_studies_details,
        entrepreneurship_details: sub.entrepreneurship_details,
        internship_details: sub.internship_details,
        other_details: sub.other_details,
        evidence_storage_path: sub.evidence_storage_path,
        declaration_accepted: sub.declaration_accepted,
        submitted_at: sub.submitted_at,
        submission_reference: sub.submission_reference,
        verification_status: sub.verification_status,
        verified_by: null,
        verified_at: sub.verified_at,
        admin_notes: sub.admin_notes || (sub.verified_by ? `Verified by ${sub.verified_by}` : null),
      })),
      { onConflict: 'student_id,submission_version' }
    );
    if (subErr) console.error('Error syncing submissions:', subErr.message);
    else console.log('Successfully synced submissions.');
  }

  // 3. Sync original responses
  if (localDB.original_responses && localDB.original_responses.length > 0) {
    console.log(`Syncing ${localDB.original_responses.length} original responses...`);
    const { error: orErr } = await supabase.from('original_responses').upsert(
      localDB.original_responses.map(r => ({
        id: r.id,
        student_id: r.student_id,
        register_number: r.register_number,
        source_sheet: r.source_sheet,
        original_row_number: r.original_row_number,
        original_response_data: r.original_response_data,
        source_timestamp: r.source_timestamp,
        imported_at: r.imported_at,
        created_at: r.created_at,
      })),
      { onConflict: 'id' }
    );
    if (orErr) console.error('Error syncing original responses:', orErr.message);
    else console.log('Successfully synced original responses.');
  }

  console.log('--- Sync Completed ---');
}

sync();
