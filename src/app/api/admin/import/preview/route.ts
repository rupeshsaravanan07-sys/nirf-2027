import { NextRequest, NextResponse } from 'next/server'
import { parseExcelWorkbook } from '@/lib/excel-import'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No Excel file uploaded' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const preview = await parseExcelWorkbook(buffer, file.name)

    return NextResponse.json(preview)
  } catch (error: any) {
    console.error('Error parsing Excel file:', error)
    return NextResponse.json({ error: error.message || 'Failed to process Excel file' }, { status: 500 })
  }
}
