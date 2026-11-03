import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { createAdminClient } from '@/lib/supabase/server'

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
    const buffer = Buffer.from(arrayBuffer)
    const mime = file.type || 'application/octet-stream'

    let publicUrl = ''

    // 1. Try uploading to Supabase Cloud Storage (permanent across all lambdas & sessions)
    try {
      const supabase = createAdminClient()
      if (supabase) {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('nirf-evidence')
          .upload(filename, buffer, {
            contentType: mime,
            upsert: true,
          })

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage
            .from('nirf-evidence')
            .getPublicUrl(filename)
          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl
          }
        }
      }
    } catch (storageErr) {
      console.warn('Supabase storage upload fallback:', storageErr)
    }

    // 2. If Supabase storage didn't yield a URL, fallback to local file or base64
    if (!publicUrl) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true })
        }
        const destPath = path.join(uploadsDir, filename)
        fs.writeFileSync(destPath, buffer)
        publicUrl = `/uploads/${filename}`
      } catch (fsErr) {
        const base64 = buffer.toString('base64')
        publicUrl = `data:${mime};base64,${base64}`
      }
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
