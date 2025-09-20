import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['TEACHER', 'STUDENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadType = formData.get('uploadType') as string // 'assignment' | 'submission' | 'lesson-plan'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!uploadType) {
      return NextResponse.json({ error: 'Upload type is required' }, { status: 400 })
    }

    // Validate file size based on upload type
    const maxSize = uploadType === 'submission' ? 10 * 1024 * 1024 : 25 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
    ]

    // Add video/audio for lesson plans
    if (uploadType === 'lesson-plan') {
      allowedTypes.push('video/mp4', 'audio/mpeg')
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary with temporary folder
    const uploadResult = await uploadToCloudinary(
      `data:${file.type};base64,${buffer.toString('base64')}`,
      {
        folder: `cbt-platform/temp/${uploadType}`,
        tags: ['temp', uploadType, session.user.id],
        public_id: `temp_${session.user.id}_${Date.now()}_${file.name.split('.')[0]}`,
      }
    )

    return NextResponse.json({
      file: {
        id: uploadResult.public_id,
        name: file.name,
        url: uploadResult.secure_url,
        size: uploadResult.bytes,
        type: file.type,
        cloudinaryId: uploadResult.public_id,
        uploadedAt: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error uploading temporary file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

