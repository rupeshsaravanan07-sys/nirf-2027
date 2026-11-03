import { NextRequest, NextResponse } from 'next/server'
import { commitImportPreview } from '@/lib/data-store'
import type { ImportPreview } from '@/lib/excel-import'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { preview, uploadedBy, overwrite } = body as {
      preview: ImportPreview
      uploadedBy?: string
      overwrite?: boolean
    }

    if (!preview || !preview.students) {
      return NextResponse.json({ error: 'Missing import preview data' }, { status: 400 })
    }

    const result = await commitImportPreview(preview, uploadedBy || 'Admin Staff', !!overwrite)

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.imported_students} students and ${result.imported_responses} responses.`,
      ...result,
    })
  } catch (error: any) {
    console.error('Error committing import:', error)
    return NextResponse.json({ error: error.message || 'Failed to commit import' }, { status: 500 })
  }
}
