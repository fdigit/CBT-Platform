'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Role } from '../types/models'

export function DashboardRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return

    // Only redirect if user is on the root path and authenticated
    if (pathname !== '/' || !session?.user) return

    const userRole = session.user.role

    // Redirect based on user role
    switch (userRole) {
      case Role.SUPER_ADMIN:
        router.push('/admin')
        break
      case Role.SCHOOL_ADMIN:
        router.push('/school')
        break
      case Role.TEACHER:
        router.push('/teacher')
        break
      case Role.STUDENT:
        router.push('/student')
        break
      default:
        // If role is not recognized, redirect to signin
        router.push('/auth/signin')
    }
  }, [session, status, router, pathname])

  return null
}
