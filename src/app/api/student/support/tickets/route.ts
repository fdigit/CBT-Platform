import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const studentId = session.user.studentProfile?.id;
    if (!studentId) {
      return NextResponse.json(
        { message: 'Student profile not found' },
        { status: 404 }
      );
    }

    // For now, return mock data since we don't have a support tickets table
    // In a real implementation, you would create a SupportTicket model
    const mockTickets = [
      {
        id: '1',
        subject: 'Unable to access exam',
        description: 'I am getting an error when trying to start my Math exam',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        subject: 'Question about results',
        description: 'I cannot find my results for the previous exam',
        status: 'resolved',
        priority: 'medium',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json(mockTickets);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const studentId = session.user.studentProfile?.id;
    if (!studentId) {
      return NextResponse.json(
        { message: 'Student profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { subject, category, description, priority } = body;

    if (!subject || !category || !description) {
      return NextResponse.json(
        { message: 'Subject, category, and description are required' },
        { status: 400 }
      );
    }

    // For now, return mock data
    // In a real implementation, you would save to the database
    const newTicket = {
      id: Date.now().toString(),
      subject,
      category,
      description,
      priority: priority || 'medium',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(newTicket);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
