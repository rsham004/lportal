/**
 * Can Component
 * 
 * Conditionally renders children based on user permissions.
 * This is the primary component for implementing role-based UI.
 */

'use client'

import React from 'react'
import { useAbility } from './AuthorizationProvider'

interface CanProps {
  action: string | string[]
  subject: string
  resource?: any
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ action, subject, resource, children, fallback = null }: CanProps) {
  const ability = useAbility()
  
  const canPerformAction = React.useMemo(() => {
    try {
      if (Array.isArray(action)) {
        return action.some(a => ability.can(a, subject, resource))
      }
      
      return ability.can(action, subject, resource)
    } catch (error) {
      // If there's an error checking permissions, deny access
      console.warn('Error checking permissions:', error)
      return false
    }
  }, [ability, action, subject, resource])

  if (canPerformAction) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * Cannot Component
 * 
 * Inverse of Can - renders children when user CANNOT perform an action
 */
interface CannotProps {
  action: string | string[]
  subject: string
  resource?: any
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Cannot({ action, subject, resource, children, fallback = null }: CannotProps) {
  const ability = useAbility()
  
  const cannotPerformAction = React.useMemo(() => {
    try {
      if (Array.isArray(action)) {
        return !action.some(a => ability.can(a, subject, resource))
      }
      
      return !ability.can(action, subject, resource)
    } catch (error) {
      // If there's an error checking permissions, assume they cannot
      console.warn('Error checking permissions:', error)
      return true
    }
  }, [ability, action, subject, resource])

  if (cannotPerformAction) {
    return <>{children}</>
  }

  return <>{fallback}</>
}