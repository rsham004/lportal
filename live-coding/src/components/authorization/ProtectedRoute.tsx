/**
 * Enhanced ProtectedRoute Component
 * 
 * Provides comprehensive route protection with:
 * - Authentication checking
 * - Role-based access control
 * - Permission-based access control
 * - Resource-specific permissions
 */

'use client'

import { useAuth, RedirectToSignIn } from '@clerk/nextjs'
import { ReactNode } from 'react'
import { Spinner } from '../ui/Loading'
import { UserRole, getUserRole, isRoleHigherThan } from '../../lib/authorization/roles'
import { useAbility } from './AuthorizationProvider'

interface ProtectedRouteProps {
  children: ReactNode
  
  // Role-based access control
  allowedRoles?: UserRole[]
  requireExact?: boolean // If true, only exact role matches are allowed
  
  // Permission-based access control
  requiredPermissions?: string[]
  resource?: any // The resource being accessed
  resourceType?: string // The type of resource (e.g., 'Course', 'User')
  
  // Custom components
  loadingComponent?: ReactNode
  fallbackComponent?: ReactNode
  
  // Redirect options
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireExact = false,
  requiredPermissions,
  resource,
  resourceType,
  loadingComponent,
  fallbackComponent,
  redirectTo,
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded, user } = useAuth()
  const ability = useAbility()

  // Show loading state while auth is loading
  if (!isLoaded) {
    return loadingComponent || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to sign in if not authenticated
  if (!isSignedIn) {
    if (redirectTo) {
      return <RedirectToSignIn redirectUrl={redirectTo} />
    }
    return <RedirectToSignIn />
  }

  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = getUserRole(user)
    
    if (!userRole) {
      return renderAccessDenied(fallbackComponent)
    }
    
    const hasRoleAccess = requireExact
      ? allowedRoles.includes(userRole)
      : allowedRoles.some(allowedRole => 
          userRole === allowedRole || isRoleHigherThan(userRole, allowedRole)
        )
    
    if (!hasRoleAccess) {
      return renderAccessDenied(fallbackComponent)
    }
  }

  // Check permission-based access if permissions are specified
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermissionAccess = requiredPermissions.some(permission => {
      if (resource && resourceType) {
        return ability.can(permission, resourceType, resource)
      }
      return ability.can(permission, resourceType || 'all')
    })
    
    if (!hasPermissionAccess) {
      return renderAccessDenied(fallbackComponent)
    }
  }

  // All checks passed, render children
  return <>{children}</>
}

/**
 * Render access denied component
 */
function renderAccessDenied(fallbackComponent?: ReactNode) {
  if (fallbackComponent) {
    return <>{fallbackComponent}</>
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    </div>
  )
}

/**
 * AdminRoute - Shorthand for admin-only routes
 */
interface AdminRouteProps {
  children: ReactNode
  loadingComponent?: ReactNode
  fallbackComponent?: ReactNode
}

export function AdminRoute({ children, loadingComponent, fallbackComponent }: AdminRouteProps) {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
      loadingComponent={loadingComponent}
      fallbackComponent={fallbackComponent}
    >
      {children}
    </ProtectedRoute>
  )
}

/**
 * InstructorRoute - Shorthand for instructor+ routes
 */
interface InstructorRouteProps {
  children: ReactNode
  loadingComponent?: ReactNode
  fallbackComponent?: ReactNode
}

export function InstructorRoute({ children, loadingComponent, fallbackComponent }: InstructorRouteProps) {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}
      loadingComponent={loadingComponent}
      fallbackComponent={fallbackComponent}
    >
      {children}
    </ProtectedRoute>
  )
}

/**
 * SuperAdminRoute - Shorthand for super admin only routes
 */
interface SuperAdminRouteProps {
  children: ReactNode
  loadingComponent?: ReactNode
  fallbackComponent?: ReactNode
}

export function SuperAdminRoute({ children, loadingComponent, fallbackComponent }: SuperAdminRouteProps) {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.SUPER_ADMIN]}
      requireExact={true}
      loadingComponent={loadingComponent}
      fallbackComponent={fallbackComponent}
    >
      {children}
    </ProtectedRoute>
  )
}