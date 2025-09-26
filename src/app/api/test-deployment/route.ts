import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test environment variables
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ Set' : '❌ Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing',
      NODE_ENV: process.env.NODE_ENV || '❌ Missing',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? '✅ Set' : '❌ Missing',
    };

    // Test database connection
    let dbStatus = '❌ Failed';
    let userCount = 0;
    try {
      const users = await prisma.user.findMany({ take: 1 });
      dbStatus = '✅ Connected';
      userCount = await prisma.user.count();
    } catch (error) {
      dbStatus = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Test specific teacher user
    let teacherStatus = '❌ Not found';
    try {
      const teacher = await prisma.user.findUnique({
        where: { email: 'teacher1@littleteddies.com' },
        include: { TeacherProfile: true }
      });
      if (teacher) {
        teacherStatus = `✅ Found - Role: ${teacher.role}`;
      }
    } catch (error) {
      teacherStatus = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      status: 'Deployment Test',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        status: dbStatus,
        userCount,
      },
      teacher: {
        status: teacherStatus,
      },
      deployment: {
        platform: 'Vercel',
        nodeVersion: process.version,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
