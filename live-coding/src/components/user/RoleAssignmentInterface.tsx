/**
 * Role Assignment Interface Component
 * 
 * Enhanced interface for managing user roles with hierarchy validation,
 * bulk operations, and audit logging integration.
 */

'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Can } from '../authorization/Can'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { UserRole, getUserRole, isRoleHierarchyValid } from '../../lib/authorization/roles'
import { auditHelpers } from '../../lib/authorization/audit'

interface User {
  id: string
  firstName: string
  lastName: string
  emailAddresses: Array<{ emailAddress: string }>
  publicMetadata: { role: UserRole }
}

export interface RoleAssignmentInterfaceProps {
  users: User[]
  selectedUserIds?: string[]
  onRoleChange?: (userId: string, newRole: UserRole) => Promise<void>
  onBulkRoleChange?: (userIds: string[], newRole: UserRole) => Promise<void>
  className?: string
}

const roleHierarchy = [
  UserRole.STUDENT,
  UserRole.INSTRUCTOR,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
]

const roleDescriptions = {
  [UserRole.STUDENT]: 'Can access courses and learning materials',
  [UserRole.INSTRUCTOR]: 'Can create and manage courses, view student progress',
  [UserRole.ADMIN]: 'Can manage users, courses, and system settings',
  [UserRole.SUPER_ADMIN]: 'Full system access including user management and system configuration',
}

const roleColors = {
  [UserRole.STUDENT]: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  [UserRole.INSTRUCTOR]: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  [UserRole.SUPER_ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

export function RoleAssignmentInterface({
  users,
  selectedUserIds = [],
  onRoleChange,
  onBulkRoleChange,
  className = '',
}: RoleAssignmentInterfaceProps) {
  const { user: currentUser } = useAuth()
  const currentUserRole = getUserRole(currentUser)

  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Get available roles based on current user's permissions
  const availableRoles = useMemo(() => {
    return roleHierarchy.filter(role => {
      // Super admins can assign any role
      if (currentUserRole === UserRole.SUPER_ADMIN) {
        return true
      }
      
      // Admins can assign roles up to Admin (but not Super Admin)
      if (currentUserRole === UserRole.ADMIN) {
        return role !== UserRole.SUPER_ADMIN
      }
      
      // Instructors can only assign Student role
      if (currentUserRole === UserRole.INSTRUCTOR) {
        return role === UserRole.STUDENT
      }
      
      return false
    })
  }, [currentUserRole])

  // Get selected users data
  const selectedUsers = useMemo(() => {
    return users.filter(user => selectedUserIds.includes(user.id))
  }, [users, selectedUserIds])

  // Validate role assignment
  const validateRoleAssignment = (targetRole: UserRole, targetUsers: User[]) => {
    // Check if current user can assign this role
    if (!availableRoles.includes(targetRole)) {
      return 'You do not have permission to assign this role.'
    }

    // Check hierarchy constraints for each user
    for (const user of targetUsers) {
      if (!isRoleHierarchyValid(currentUserRole, user.publicMetadata.role, targetRole)) {
        return `Cannot change ${user.firstName} ${user.lastName}'s role due to hierarchy constraints.`
      }
    }

    return null
  }

  const handleRoleAssignment = async () => {
    if (!selectedRole || selectedUsers.length === 0) return

    const validationError = validateRoleAssignment(selectedRole, selectedUsers)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      if (selectedUsers.length === 1) {
        // Single user role change
        if (onRoleChange) {
          await onRoleChange(selectedUsers[0].id, selectedRole)
        }
        
        // Log individual role change
        auditHelpers.logRoleChanged(
          selectedUsers[0].id,
          selectedUsers[0].publicMetadata.role,
          selectedRole,
          currentUser?.id
        )
      } else {
        // Bulk role change
        if (onBulkRoleChange) {
          await onBulkRoleChange(selectedUserIds, selectedRole)
        }
        
        // Log bulk role changes
        selectedUsers.forEach(user => {
          auditHelpers.logRoleChanged(
            user.id,
            user.publicMetadata.role,
            selectedRole,
            currentUser?.id
          )
        })
      }

      setShowConfirmation(false)
      setSelectedRole('')
    } catch (err: any) {
      setError(err.message || 'Failed to assign role. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleChangeImpact = (newRole: UserRole) => {
    const upgrades = selectedUsers.filter(user => 
      roleHierarchy.indexOf(newRole) > roleHierarchy.indexOf(user.publicMetadata.role)
    )
    const downgrades = selectedUsers.filter(user => 
      roleHierarchy.indexOf(newRole) < roleHierarchy.indexOf(user.publicMetadata.role)
    )
    const noChange = selectedUsers.filter(user => user.publicMetadata.role === newRole)

    return { upgrades, downgrades, noChange }
  }

  if (selectedUsers.length === 0) {
    return (
      <Card className={`p-6 ${className}`} data-testid="role-assignment-interface">
        <div className="text-center text-muted-foreground">
          <p>Select users to manage their roles</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`} data-testid="role-assignment-interface">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Role Assignment
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedUsers.length === 1 
              ? `Managing role for ${selectedUsers[0].firstName} ${selectedUsers[0].lastName}`
              : `Managing roles for ${selectedUsers.length} users`
            }
          </p>
        </div>

        {/* Current Roles Summary */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Current Roles</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(
              selectedUsers.reduce((acc, user) => {
                acc[user.publicMetadata.role] = (acc[user.publicMetadata.role] || 0) + 1
                return acc
              }, {} as Record<UserRole, number>)
            ).map(([role, count]) => (
              <span
                key={role}
                className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[role as UserRole]}`}
                data-testid={`current-role-${role}`}
              >
                {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({count})
              </span>
            ))}
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Assign New Role</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableRoles.map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedRole === role
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                data-testid={`role-option-${role}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">
                    {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${roleColors[role]}`}>
                    {role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {roleDescriptions[role]}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Role Change Preview */}
        {selectedRole && (
          <div className="border border-border rounded-lg p-4 bg-muted/25">
            <h4 className="text-sm font-medium text-foreground mb-3">Change Preview</h4>
            {(() => {
              const { upgrades, downgrades, noChange } = getRoleChangeImpact(selectedRole)
              return (
                <div className="space-y-2 text-sm">
                  {upgrades.length > 0 && (
                    <div className="text-green-600 dark:text-green-400">
                      ↗ {upgrades.length} user(s) will be promoted to {selectedRole.replace('_', ' ')}
                    </div>
                  )}
                  {downgrades.length > 0 && (
                    <div className="text-orange-600 dark:text-orange-400">
                      ↘ {downgrades.length} user(s) will be demoted to {selectedRole.replace('_', ' ')}
                    </div>
                  )}
                  {noChange.length > 0 && (
                    <div className="text-muted-foreground">
                      → {noChange.length} user(s) already have this role
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={!selectedRole || isSubmitting}
            data-testid="assign-role-button"
          >
            {isSubmitting ? 'Assigning...' : 'Assign Role'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedRole('')
              setError('')
            }}
            disabled={isSubmitting}
            data-testid="cancel-assignment"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedRole && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4" data-testid="role-assignment-confirmation">
            <h3 className="text-lg font-semibold mb-4">Confirm Role Assignment</h3>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {selectedUsers.length === 1
                  ? `Change ${selectedUsers[0].firstName} ${selectedUsers[0].lastName}'s role to ${selectedRole.replace('_', ' ')}?`
                  : `Change ${selectedUsers.length} users' roles to ${selectedRole.replace('_', ' ')}?`
                }
              </p>

              {/* Impact Summary */}
              {(() => {
                const { upgrades, downgrades } = getRoleChangeImpact(selectedRole)
                return (
                  <div className="text-sm space-y-1">
                    {upgrades.length > 0 && (
                      <div className="text-green-600 dark:text-green-400">
                        • {upgrades.length} promotion(s)
                      </div>
                    )}
                    {downgrades.length > 0 && (
                      <div className="text-orange-600 dark:text-orange-400">
                        • {downgrades.length} demotion(s)
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="flex space-x-3">
                <Button
                  onClick={handleRoleAssignment}
                  disabled={isSubmitting}
                  data-testid="confirm-role-assignment"
                >
                  {isSubmitting ? 'Assigning...' : 'Confirm'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSubmitting}
                  data-testid="cancel-confirmation"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}