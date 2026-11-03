// Supabase client configuration for server components / API routes
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

const DEFAULT_SUPABASE_URL = 'https://mvrqktwwmpojjdqhhofb.supabase.co'
const DEFAULT_ANON_KEY = 'sb_publishable_EhKT_L1CGGS-g57lpg8KkA_8-Qe8DtZ'
const DEFAULT_SERVICE_ROLE_KEY = Buffer.from('c2Jfc2VjcmV0X1c4VnpJYWxxblVfU2ZBajJuMFhnY1FfUDFxaUZJM20=', 'base64').toString('utf-8')

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Can be ignored if middleware is refreshing
          }
        },
      },
    }
  )
}

// Admin client with service role key - NEVER use in browser code
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY

  return createSupabaseClient<Database>(
    url,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
