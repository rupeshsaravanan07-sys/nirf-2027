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

    const ext = path.extname(file.name) || '.pdf'
    const cleanReg = regNo.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `${cleanReg}_${uuidv4().substring(0, 8)}${ext}`
    const arrayBuffer = await file.arrayBuffer()

    let publicUrl = ''

    // Attempt local file write (works on local dev)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      const destPath = path.join(uploadsDir, filename)
      fs.writeFileSync(destPath, Buffer.from(arrayBuffer))
      publicUrl = `/uploads/${filename}`
    } catch (fsErr) {
      // In serverless / Vercel cloud with read-only filesystem:
      // Store as clean base64 data URL so it renders instantly in <img> and download links
      const mime = file.type || 'application/octet-stream'
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      publicUrl = `data:${mime};base64,${base64}`
    }

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
