import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Prevent suspending self
    if (id === session.user.id) {
      return NextResponse.json(
        { message: 'Cannot suspend your own account' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // For now, we'll implement suspension by updating the email to indicate suspension
    // In a real implementation, you might want to add a status field to the User model
    await prisma.user.update({
      where: { id },
      data: {
        email: `${user.email}.suspended.${Date.now()}`,
        name: `[SUSPENDED] ${user.name}`,
      },
    });

    return NextResponse.json({ message: 'User suspended successfully' });
  } catch (error) {
    console.error('Error suspending user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
