import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadSubmissionAttachment } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const submissionId = formData.get('submissionId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Verify submission belongs to student
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        studentId: student.id,
      },
      include: {
        assignment: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check if submission can still be modified
    if (submission.status === 'GRADED') {
      return NextResponse.json(
        { error: 'Cannot modify graded submission' },
        { status: 400 }
      );
    }

    // Check if assignment is still open
    if (
      submission.assignment.dueDate &&
      new Date() > submission.assignment.dueDate
    ) {
      return NextResponse.json(
        { error: 'Assignment deadline has passed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit for student submissions)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadSubmissionAttachment(
      `data:${file.type};base64,${buffer.toString('base64')}`,
      submissionId,
      student.id,
      file.name
    );

    // Save attachment to database
    const attachment = await prisma.submissionAttachment.create({
      data: {
        submissionId,
        fileName: uploadResult.public_id,
        originalName: file.name,
        filePath: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.type,
      },
    });

    return NextResponse.json({
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        originalName: attachment.originalName,
        url: attachment.filePath,
        size: attachment.fileSize,
        mimeType: attachment.mimeType,
        uploadedAt: attachment.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Error uploading submission attachment:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
