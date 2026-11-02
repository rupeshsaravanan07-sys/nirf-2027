import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Support administrative login
    // In production, Supabase Auth signInWithPassword can also be called
    if (
      (email === 'admin@vit.ac.in' || email === 'admin@college.edu' || email.includes('@')) &&
      (password === 'admin123' || password.length >= 6)
    ) {
      const cookieStore = cookies()
      cookieStore.set('nirf_admin_session', JSON.stringify({
        email,
        name: 'NIRF Data Administrator',
        role: 'super_admin',
        loggedInAt: new Date().toISOString(),
      }), {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return NextResponse.json({
        success: true,
        user: {
          email,
          name: 'NIRF Data Administrator',
          role: 'super_admin',
        },
      })
    }

    return NextResponse.json({ error: 'Invalid credentials. Password must be at least 6 characters.' }, { status: 401 })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 })
  }
}
