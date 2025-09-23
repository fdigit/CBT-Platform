import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Role } from '../types/models'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name: string
    role: Role
    schoolId?: string
  }
}

// Role-based access control decorator
export function requireAuth(roles?: Role[]) {
  return async function (request: NextRequest) {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session || !session.user) {
        return NextResponse.json(
          { message: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check if user has required role
      if (roles && !roles.includes(session.user.role)) {
        return NextResponse.json(
          { message: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Add user to request for downstream handlers
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name!,
        role: session.user.role,
        schoolId: session.user.schoolId
      }

      return null // Continue to next handler
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { message: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

// School scoping middleware
export async function enforceSchoolScoping(request: AuthenticatedRequest) {
  const user = request.user
  
  if (!user) {
    return NextResponse.json(
      { message: 'User not authenticated' },
      { status: 401 }
    )
  }

  // Super admins can access all data
  if (user.role === Role.SUPER_ADMIN) {
    return null
  }

  // School admins and students must have a schoolId
  if (!user.schoolId) {
    return NextResponse.json(
      { message: 'User not associated with any school' },
      { status: 403 }
    )
  }

  return null
}

// Helper to get school-scoped Prisma where clause
export function getSchoolScopedWhere(user: AuthenticatedRequest['user'], additionalWhere: any = {}) {
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Super admins see everything
  if (user.role === Role.SUPER_ADMIN) {
    return additionalWhere
  }

  // School admins and students are scoped to their school
  return {
    ...additionalWhere,
    schoolId: user.schoolId
  }
}

// Helper to get student-scoped Prisma where clause
export function getStudentScopedWhere(user: AuthenticatedRequest['user'], additionalWhere: any = {}) {
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Super admins see everything
  if (user.role === Role.SUPER_ADMIN) {
    return additionalWhere
  }

  // School admins see all students in their school
  if (user.role === Role.SCHOOL_ADMIN) {
    return {
      ...additionalWhere,
      schoolId: user.schoolId
    }
  }

  // Students only see their own data
  if (user.role === Role.STUDENT) {
    return {
      ...additionalWhere,
      userId: user.id
    }
  }

  throw new Error('Invalid user role')
}

// Combined middleware function
export async function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: {
    roles?: Role[]
    enforceSchoolScoping?: boolean
  } = {}
) {
  return async function (request: NextRequest) {
    try {
      // Check authentication and roles
      const authResult = await requireAuth(options.roles)(request)
      if (authResult) return authResult

      const authenticatedRequest = request as AuthenticatedRequest

      // Enforce school scoping if required
      if (options.enforceSchoolScoping) {
        const scopingResult = await enforceSchoolScoping(authenticatedRequest)
        if (scopingResult) return scopingResult
      }

      // Call the actual handler
      return await handler(authenticatedRequest)
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Utility functions for common permission checks
export function canAccessSchool(user: AuthenticatedRequest['user'], schoolId: string): boolean {
  if (!user) return false
  
  // Super admins can access any school
  if (user.role === Role.SUPER_ADMIN) return true
  
  // Others can only access their own school
  return user.schoolId === schoolId
}

export function canManageStudents(user: AuthenticatedRequest['user']): boolean {
  if (!user) return false
  return [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN].includes(user.role)
}

export function canCreateExams(user: AuthenticatedRequest['user']): boolean {
  if (!user) return false
  return [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN].includes(user.role)
}

export function canViewAllSchools(user: AuthenticatedRequest['user']): boolean {
  if (!user) return false
  return user.role === Role.SUPER_ADMIN
}

export function canApproveSchools(user: AuthenticatedRequest['user']): boolean {
  if (!user) return false
  return user.role === Role.SUPER_ADMIN
}

// Helper to validate school ownership for resources
export async function validateSchoolOwnership(
  user: AuthenticatedRequest['user'],
  resourceSchoolId: string
): Promise<boolean> {
  if (!user) return false
  
  // Super admins can access any resource
  if (user.role === Role.SUPER_ADMIN) return true
  
  // Others must match school
  return user.schoolId === resourceSchoolId
}
