import { NextResponse } from 'next/server'
import { getDashboardStats, getDepartmentStats, getProctorStats, getOutcomeStats } from '@/lib/data-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getDashboardStats()
    const departments = await getDepartmentStats()
    const proctors = await getProctorStats()
    const outcomes = await getOutcomeStats()

    return NextResponse.json({
      stats,
      departments,
      proctors,
      outcomes,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 })
  }
}
