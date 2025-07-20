/**
 * RoleGuard Component
 * 
 * Guards content based on user roles with support for role hierarchy.
 * More specific than the Can component for role-based access control.
 */

'use client'

import React from 'react'
import { useAuth } from '@clerk/nextjs'
import { UserRole, getUserRole, isRoleHigherThan } from '../../lib/authorization/roles'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  requireExact?: boolean // If true, only exact role matches are allowed (no hierarchy)
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

export function RoleGuard({ 
  allowedRoles, 
  requireExact = false,
  children, 
  fallback = null,
  loading = null
}: RoleGuardProps) {
  const { user, isLoaded } = useAuth()
  
  // Show loading state while auth is loading
  if (!isLoaded) {
    return <>{loading}</>
  }
  
  // Get user role
  const userRole = getUserRole(user)
  
  // Check if user has access
  const hasAccess = React.useMemo(() => {
    if (!userRole) {
      return false
    }
    
    if (requireExact) {
      // Exact role match required
      return allowedRoles.includes(userRole)
    }
    
    // Check if user has one of the allowed roles or a higher role
    return allowedRoles.some(allowedRole => {
      return userRole === allowedRole || isRoleHigherThan(userRole, allowedRole)
    })
  }, [userRole, allowedRoles, requireExact])
  
  if (hasAccess) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}

/**
 * MinimumRole Component
 * 
 * Requires a minimum role level (uses role hierarchy)
 */
interface MinimumRoleProps {
  role: UserRole
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

export function MinimumRole({ role, children, fallback = null, loading = null }: MinimumRoleProps) {
  const { user, isLoaded } = useAuth()
  
  if (!isLoaded) {
    return <>{loading}</>
  }
  
  const userRole = getUserRole(user)
  
  const hasMinimumRole = React.useMemo(() => {
    if (!userRole) {
      return false
    }
    
    return userRole === role || isRoleHigherThan(userRole, role)
  }, [userRole, role])
  
  if (hasMinimumRole) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}

/**
 * ExactRole Component
 * 
 * Requires an exact role match (no hierarchy)
 */
interface ExactRoleProps {
  role: UserRole
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

export function ExactRole({ role, children, fallback = null, loading = null }: ExactRoleProps) {
  const { user, isLoaded } = useAuth()
  
  if (!isLoaded) {
    return <>{loading}</>
  }
  
  const userRole = getUserRole(user)
  
  if (userRole === role) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}