import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Gunakan Service Role Key untuk bypass RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

export async function POST(req: NextRequest) {
  try {
    // Cek session user
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const path = formData.get('path') as string

    if (!file || !path) {
      return NextResponse.json(
        { error: 'File dan path wajib diisi' },
        { status: 400 }
      )
    }

    // Upload ke Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('submissions')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Dapatkan public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('submissions')
      .getPublicUrl(path)

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      path: path 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
