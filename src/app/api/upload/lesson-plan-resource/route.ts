import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadLessonPlanResource } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const lessonPlanId = formData.get('lessonPlanId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!lessonPlanId) {
      return NextResponse.json({ error: 'Lesson plan ID is required' }, { status: 400 })
    }

    // Verify lesson plan belongs to teacher
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: {
        id: lessonPlanId,
        teacherId: teacher.id
      }
    })

    if (!lessonPlan) {
      return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })
    }

    // Check if lesson plan can be modified
    if (lessonPlan.reviewStatus === 'APPROVED') {
      return NextResponse.json({ error: 'Cannot modify approved lesson plan' }, { status: 400 })
    }

    // Validate file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 400 })
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
      'video/mp4',
      'audio/mpeg',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    // Determine resource type
    let resourceType: 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'PRESENTATION' | 'SPREADSHEET' | 'OTHER' = 'OTHER'
    
    if (file.type.startsWith('image/')) {
      resourceType = 'IMAGE'
    } else if (file.type.startsWith('video/')) {
      resourceType = 'VIDEO'
    } else if (file.type.startsWith('audio/')) {
      resourceType = 'AUDIO'
    } else if (file.type.includes('pdf') || file.type.includes('word') || file.type.includes('text')) {
      resourceType = 'DOCUMENT'
    } else if (file.type.includes('powerpoint') || file.type.includes('presentation')) {
      resourceType = 'PRESENTATION'
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      resourceType = 'SPREADSHEET'
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await uploadLessonPlanResource(
      `data:${file.type};base64,${buffer.toString('base64')}`,
      lessonPlanId,
      teacher.id,
      file.name
    )

    // Save resource to database
    const resource = await prisma.lessonPlanResource.create({
      data: {
        lessonPlanId,
        fileName: uploadResult.public_id,
        originalName: file.name,
        filePath: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.type,
        resourceType,
      }
    })

    return NextResponse.json({
      resource: {
        id: resource.id,
        fileName: resource.fileName,
        originalName: resource.originalName,
        url: resource.filePath,
        size: resource.fileSize,
        mimeType: resource.mimeType,
        resourceType: resource.resourceType,
        uploadedAt: resource.uploadedAt,
      }
    })

  } catch (error) {
    console.error('Error uploading lesson plan resource:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

