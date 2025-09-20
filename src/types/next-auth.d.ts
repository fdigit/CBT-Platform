import { DefaultSession } from 'next-auth'

// Define Role enum locally
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      schoolId?: string
      school?: any
      studentProfile?: any
      schoolAdminProfile?: any
      teacherProfile?: any
    } & DefaultSession['user']
  }

  interface User {
    role: Role
    schoolId?: string
    school?: any
    studentProfile?: any
    schoolAdminProfile?: any
    teacherProfile?: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role
    schoolId?: string
    school?: any
    studentProfile?: any
    schoolAdminProfile?: any
    teacherProfile?: any
  }
}
