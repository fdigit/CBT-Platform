import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Restore the original email and name (remove suspension markers)
    let originalEmail = user.email
    let originalName = user.name

    // Remove suspension markers
    if (originalEmail.includes('.suspended.')) {
      originalEmail = originalEmail.split('.suspended.')[0]
    }
    if (originalName.startsWith('[SUSPENDED] ')) {
      originalName = originalName.replace('[SUSPENDED] ', '')
    }

    await prisma.user.update({
      where: { id },
      data: {
        email: originalEmail,
        name: originalName,
      }
    })

    return NextResponse.json({ message: 'User reactivated successfully' })
  } catch (error) {
    console.error('Error reactivating user:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
