import { NextRequest, NextResponse } from 'next/server'
import { getStudents } from '@/lib/data-store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '25', 10)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const department = searchParams.get('department') || undefined
    const proctor = searchParams.get('proctor') || undefined
    const sortBy = searchParams.get('sortBy') || 'register_number'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'

    const result = await getStudents({
      page,
      limit,
      search,
      status,
      department,
      proctor,
      sortBy,
      sortOrder,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch students' }, { status: 500 })
  }
}
