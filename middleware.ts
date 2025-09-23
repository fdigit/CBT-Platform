import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Role } from '@/types/models';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // If no token, redirect to signin (handled by withAuth)
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    const userRole = token.role as Role;
    const schoolId = token.schoolId as string | undefined;

    // Role-based route protection
    if (pathname.startsWith('/admin')) {
      if (userRole !== Role.SUPER_ADMIN) {
        return NextResponse.redirect(
          new URL('/auth/signin?error=insufficient-permissions', req.url)
        );
      }
    }

    if (pathname.startsWith('/school')) {
      if (userRole !== Role.SCHOOL_ADMIN) {
        return NextResponse.redirect(
          new URL('/auth/signin?error=insufficient-permissions', req.url)
        );
      }

      // School admins must have a schoolId
      if (!schoolId) {
        return NextResponse.redirect(
          new URL('/auth/signin?error=no-school-assigned', req.url)
        );
      }
    }

    if (pathname.startsWith('/teacher')) {
      if (userRole !== Role.TEACHER) {
        return NextResponse.redirect(
          new URL('/auth/signin?error=insufficient-permissions', req.url)
        );
      }

      // Teachers must have a schoolId
      if (!schoolId) {
        return NextResponse.redirect(
          new URL('/auth/signin?error=no-school-assigned', req.url)
        );
      }
    }

    if (pathname.startsWith('/student')) {
      if (userRole !== Role.STUDENT) {
        return NextResponse.redirect(
          new URL('/auth/signin?error=insufficient-permissions', req.url)
        );
      }

      // Students must have a schoolId
      if (!schoolId) {
        return NextResponse.redirect(
          new URL('/auth/signin?error=no-school-assigned', req.url)
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow access to auth pages without token
        if (pathname.startsWith('/auth/')) {
          return true;
        }

        // Allow access to public pages
        if (pathname === '/' || pathname.startsWith('/api/schools/register')) {
          return true;
        }

        // Require token for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - api/schools/register (public registration)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|api/schools/register|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
