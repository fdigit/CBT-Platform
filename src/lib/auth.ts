import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

// Define Role enum locally
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export const authOptions: NextAuthOptions = {
  // Remove PrismaAdapter for MongoDB compatibility
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            school: true,
            StudentProfile: true,
            SchoolAdminProfile: true,
            TeacherProfile: true,
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as any,
          schoolId: user.schoolId || undefined,
          school: user.school,
          studentProfile: user.StudentProfile,
          schoolAdminProfile: user.SchoolAdminProfile,
          teacherProfile: user.TeacherProfile,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.school = user.school;
        token.studentProfile = user.studentProfile;
        token.schoolAdminProfile = user.schoolAdminProfile;
        token.teacherProfile = user.teacherProfile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.schoolId = token.schoolId as string;
        session.user.school = token.school as any;
        session.user.studentProfile = token.studentProfile as any;
        session.user.schoolAdminProfile = token.schoolAdminProfile as any;
        session.user.teacherProfile = token.teacherProfile as any;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
