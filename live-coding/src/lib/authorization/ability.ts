/**
 * CASL Ability System
 * 
 * Implements the CASL ability system for fine-grained permission checking.
 * This allows for both role-based and resource-specific permissions.
 */

import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'
import { createContext } from 'react'
import { UserRole } from './roles'

// Define the subjects (resources) in our system
export type Subjects = 'Course' | 'User' | 'System' | 'Analytics' | 'all'

// Define the actions that can be performed
export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage'

// Define the ability type
export type AppAbility = MongoAbility<[Actions, Subjects]>

// Create React context for ability
export const AbilityContext = createContext<AppAbility | undefined>(undefined)

/**
 * Create ability based on user role and ID
 */
export function createAbility(role: UserRole | undefined | null, userId?: string): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  if (!role) {
    // No permissions for unauthenticated users
    return build()
  }

  switch (role) {
    case UserRole.STUDENT:
      // Students can read courses and their own profile
      can('read', 'Course')
      can('read', 'User')
      
      // Students can update their own profile
      if (userId) {
        can('update', 'User', { id: userId })
      }
      break

    case UserRole.INSTRUCTOR:
      // Instructors can read and create courses
      can('read', 'Course')
      can('create', 'Course')
      can('read', 'User')
      
      // Instructors can update their own profile
      if (userId) {
        can('update', 'User', { id: userId })
        
        // Instructors can manage courses they created
        can('update', 'Course', { instructorId: userId })
        can('delete', 'Course', { instructorId: userId })
      }
      break

    case UserRole.ADMIN:
      // Admins can manage courses and users
      can('manage', 'Course')
      can('manage', 'User')
      can('read', 'Analytics')
      
      // Admins cannot manage system settings
      cannot('manage', 'System')
      break

    case UserRole.SUPER_ADMIN:
      // Super admins can do everything
      can('manage', 'all')
      break

    default:
      // Unknown role gets no permissions
      break
  }

  return build()
}

/**
 * Helper function to check if an action is allowed on a subject
 */
export function checkAbility(
  ability: AppAbility,
  action: Actions | Actions[],
  subject: Subjects,
  resource?: any
): boolean {
  if (Array.isArray(action)) {
    return action.some(a => ability.can(a, subject, resource))
  }
  
  return ability.can(action, subject, resource)
}

/**
 * Create ability from Clerk user object
 */
export function createAbilityFromUser(user: any): AppAbility {
  const role = user?.publicMetadata?.role as UserRole
  const userId = user?.id
  
  return createAbility(role, userId)
}