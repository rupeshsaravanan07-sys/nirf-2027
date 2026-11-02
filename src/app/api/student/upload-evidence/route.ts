import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const regNo = (formData.get('register_number') as string) || 'evidence'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const ext = path.extname(file.name) || '.pdf'
    const cleanReg = regNo.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `${cleanReg}_${uuidv4().substring(0, 8)}${ext}`
    const destPath = path.join(uploadsDir, filename)

    const arrayBuffer = await file.arrayBuffer()
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer))

    const publicUrl = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      file_path: publicUrl,
      filename,
    })
  } catch (error: any) {
    console.error('Error uploading evidence file:', error)
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 })
  }
}
