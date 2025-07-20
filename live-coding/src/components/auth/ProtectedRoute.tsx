'use client'

import { useAuth, RedirectToSignIn } from '@clerk/nextjs'
import { ReactNode } from 'react'
import { Loading } from '../ui/Loading'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
  loadingComponent?: ReactNode
  fallbackComponent?: ReactNode
}

export function ProtectedRoute({
  children,
  requiredRole,
  loadingComponent,
  fallbackComponent,
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded, user } = useAuth()

  // Show loading state while auth is loading
  if (!isLoaded) {
    return loadingComponent || <Loading />
  }

  // Redirect to sign in if not authenticated
  if (!isSignedIn) {
    return <RedirectToSignIn />
  }

  // Check role-based access if required
  if (requiredRole) {
    const userRole = user?.publicMetadata?.role as string
    
    if (!userRole || userRole !== requiredRole) {
      return (
        fallbackComponent || (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
              <p className="mt-2 text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        )
      )
    }
  }

  return <>{children}</>
}