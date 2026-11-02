import { NextRequest, NextResponse } from 'next/server'
import { getStudentDetail } from '@/lib/data-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await getStudentDetail(params.id)
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json(student)
  } catch (error: any) {
    console.error('Error fetching student detail:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch student' }, { status: 500 })
  }
}
