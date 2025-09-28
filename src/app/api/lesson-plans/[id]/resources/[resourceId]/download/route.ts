import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: lessonPlanId, resourceId } = await params;

    // Get the lesson plan and verify access
    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id: lessonPlanId },
      include: {
        teacher: {
          include: {
            user: true,
            school: true,
          },
        },
        resources: {
          where: { id: resourceId },
        },
      },
    });

    if (!lessonPlan) {
      return NextResponse.json(
        { message: 'Lesson plan not found' },
        { status: 404 }
      );
    }

    if (!lessonPlan.resources.length) {
      return NextResponse.json(
        { message: 'Resource not found' },
        { status: 404 }
      );
    }

    const resource = lessonPlan.resources[0];

    // Check if user has access to this lesson plan
    const hasAccess =
      // Teacher can access their own lesson plans
      (session.user.role === 'TEACHER' &&
        lessonPlan.teacherId === session.user.id) ||
      // School admin can access lesson plans from their school
      (session.user.role === 'SCHOOL_ADMIN' &&
        lessonPlan.teacher.schoolId === session.user.schoolId) ||
      // Super admin can access all
      session.user.role === 'SUPER_ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // For Cloudinary URLs, fetch the file and serve it with proper headers
    if (resource.filePath.startsWith('http')) {
      try {
        // Fetch the file from Cloudinary
        const fileResponse = await fetch(resource.filePath);

        if (!fileResponse.ok) {
          throw new Error('Failed to fetch file from Cloudinary');
        }

        // Get the file content as buffer
        const fileBuffer = await fileResponse.arrayBuffer();

        // Determine the file extension from the original filename
        const fileExtension =
          resource.originalName.split('.').pop()?.toLowerCase() || '';

        // Create proper headers for download
        const headers = new Headers();
        headers.set('Content-Type', resource.mimeType);
        headers.set(
          'Content-Disposition',
          `attachment; filename="${resource.originalName}"`
        );
        headers.set('Content-Length', fileBuffer.byteLength.toString());

        // Add cache control headers
        headers.set('Cache-Control', 'private, max-age=3600');

        // Return the file with proper headers
        return new NextResponse(fileBuffer, {
          status: 200,
          headers,
        });
      } catch (error) {
        console.error('Error fetching file from Cloudinary:', error);
        // Fallback to redirect if fetching fails
        return NextResponse.redirect(resource.filePath);
      }
    }

    // For local files (if any), you would implement file serving here
    return NextResponse.json(
      { message: 'File not accessible' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
