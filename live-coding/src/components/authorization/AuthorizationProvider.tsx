/**
 * Authorization Provider Component
 * 
 * Provides CASL ability context to the entire application.
 * Integrates with Clerk authentication to create user-specific abilities.
 */

'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { AppAbility, createAbilityFromUser, AbilityContext } from '../../lib/authorization/ability'

interface AuthorizationProviderProps {
  children: React.ReactNode
}

export function AuthorizationProvider({ children }: AuthorizationProviderProps) {
  const { user, isLoaded } = useAuth()
  
  const ability = useMemo(() => {
    if (!isLoaded) {
      // Return empty ability while loading
      return createAbilityFromUser(null)
    }
    
    return createAbilityFromUser(user)
  }, [user, isLoaded])

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  )
}

/**
 * Hook to access the current user's ability
 */
export function useAbility(): AppAbility {
  const ability = useContext(AbilityContext)
  
  if (ability === undefined) {
    throw new Error('useAbility must be used within an AuthorizationProvider')
  }
  
  return ability
}

/**
 * Hook to check if the current user can perform an action
 */
export function useCan(action: string | string[], subject: string, resource?: any): boolean {
  const ability = useAbility()
  
  if (Array.isArray(action)) {
    return action.some(a => ability.can(a, subject, resource))
  }
  
  return ability.can(action, subject, resource)
}

/**
 * Hook to check if the current user cannot perform an action
 */
export function useCannot(action: string | string[], subject: string, resource?: any): boolean {
  return !useCan(action, subject, resource)
}