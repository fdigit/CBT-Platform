import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (session) {
    // Clear session data if needed
    return NextResponse.json({ message: 'Signed out successfully' });
  }

  return NextResponse.json({ message: 'Not signed in' }, { status: 400 });
}
