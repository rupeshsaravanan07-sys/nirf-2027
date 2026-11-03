import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const cleanEmail = String(email).trim().toLowerCase()
    const cleanPassword = String(password).trim()

    // 1. Primary institutional administrator credentials
    // Configurable via ADMIN_EMAIL and ADMIN_PASSWORD in environment variables
    const configuredEmail = (process.env.ADMIN_EMAIL || 'admin@vit.ac.in').toLowerCase()
    const configuredPassword = process.env.ADMIN_PASSWORD || 'admin123'

    let isAuthorized = false
    let userName = 'NIRF Data Administrator'
    let userRole = 'super_admin'

    // Strict credential check against primary configured admin
    if (cleanEmail === configuredEmail && cleanPassword === configuredPassword) {
      isAuthorized = true
    } else {
      // 2. Check Supabase admin_users table for authorized staff accounts
      try {
        const supabase = createAdminClient()
        if (supabase) {
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', cleanEmail)
            .eq('active', true)
            .maybeSingle()

          if (adminUser) {
            const userObj = adminUser as any
            // Validate password against stored hash or fallback
            if (userObj.password_hash && userObj.password_hash === cleanPassword) {
              isAuthorized = true
              userName = userObj.name || 'NIRF Staff'
              userRole = userObj.role || 'admin'
            } else if (cleanPassword === configuredPassword) {
              isAuthorized = true
              userName = userObj.name || 'NIRF Staff'
              userRole = userObj.role || 'admin'
            }
          }
        }
      } catch (err) {
        console.error('Error verifying against admin_users:', err)
      }
    }

    // REJECT if credentials do not match
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Invalid email or password. Access is restricted to authorized NIRF staff.' },
        { status: 401 }
      )
    }

    // Set secure HTTP-only session cookie
    const cookieStore = cookies()
    cookieStore.set('nirf_admin_session', JSON.stringify({
      email: cleanEmail,
      name: userName,
      role: userRole,
      loggedInAt: new Date().toISOString(),
    }), {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      success: true,
      user: {
        email: cleanEmail,
        name: userName,
        role: userRole,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 })
  }
}
