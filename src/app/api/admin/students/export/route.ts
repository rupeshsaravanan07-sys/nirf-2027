import { NextResponse } from 'next/server'
import { generateMasterExcelExport } from '@/lib/data-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const excelBuffer = await generateMasterExcelExport()

    const filename = `NIRF_2027_Progression_Report_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(new Uint8Array(excelBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating Excel export:', error)
    return NextResponse.json({ error: error.message || 'Failed to export Excel' }, { status: 500 })
  }
}
