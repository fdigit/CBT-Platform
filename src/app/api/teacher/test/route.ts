import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { Role } from '../../../../types/models'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json(
        { message: 'Teacher access required' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      message: 'Teacher authentication successful',
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        schoolId: session.user.schoolId,
        school: session.user.school?.name,
        teacherProfile: session.user.teacherProfile
      }
    })
  } catch (error) {
    console.error('Teacher test API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
