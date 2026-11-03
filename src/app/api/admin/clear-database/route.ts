import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resetDataStore } from '@/lib/data-store'

export async function POST() {
  try {
    // 1. Wipe Supabase PostgreSQL tables
    const supabase = createAdminClient()
    if (supabase) {
      await supabase.from('proctor_escalations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('communication_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('reminders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('progression_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('original_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('import_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }

    // 2. Wipe in-memory and temporary storage
    resetDataStore()

    return NextResponse.json({
      success: true,
      message: 'All old student records, responses, and escalations have been completely erased. Ready for new cohort import.',
    })
  } catch (error: any) {
    console.error('Error clearing database:', error)
    return NextResponse.json({ error: error.message || 'Failed to clear database' }, { status: 500 })
  }
}
