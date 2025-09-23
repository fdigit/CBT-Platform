'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

// Define Role enum locally until Prisma client is generated
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  STUDENT = 'STUDENT',
}

interface AuthContextType {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    schoolId?: string;
    school?: any;
    studentProfile?: any;
    schoolAdminProfile?: any;
  } | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isSchoolAdmin: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const loading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const isSuperAdmin = session?.user.role === 'SUPER_ADMIN';
  const isSchoolAdmin = session?.user.role === 'SCHOOL_ADMIN';
  const isStudent = session?.user.role === 'STUDENT';

  const value: AuthContextType = {
    user: session?.user
      ? {
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role as Role,
          schoolId: session.user.schoolId,
          school: session.user.school,
          studentProfile: session.user.studentProfile,
          schoolAdminProfile: session.user.schoolAdminProfile,
        }
      : null,
    loading,
    isAuthenticated,
    isSuperAdmin,
    isSchoolAdmin,
    isStudent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
