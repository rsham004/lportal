/**
 * User Management Dashboard Component
 * 
 * Admin dashboard for managing users with role assignment, user actions,
 * and integration with authentication and authorization systems.
 */

'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { RoleGuard } from '../authorization/RoleGuard'
import { Can } from '../authorization/Can'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { UserRole, getUserRole } from '../../lib/authorization/roles'
import { auditHelpers } from '../../lib/authorization/audit'

interface User {
  id: string
  firstName: string
  lastName: string
  emailAddresses: Array<{ emailAddress: string }>
  publicMetadata: { role: UserRole }
  createdAt: Date
  lastSignInAt: Date | null
}

interface UserManagementDashboardProps {
  users: User[]
  error?: string
  onRoleChange?: (userId: string, newRole: UserRole) => Promise<void>
  onUserSuspend?: (userId: string) => Promise<void>
  onUserDelete?: (userId: string) => Promise<void>
  onBulkRoleChange?: (userIds: string[], newRole: UserRole) => Promise<void>
}

const roleColors = {
  [UserRole.STUDENT]: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  [UserRole.INSTRUCTOR]: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  [UserRole.SUPER_ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

export function UserManagementDashboard({
  users,
  error,
  onRoleChange,
  onUserSuspend,
  onUserDelete,
  onBulkRoleChange,
}: UserManagementDashboardProps) {
  const { user: currentUser } = useAuth()
  const currentUserRole = getUserRole(currentUser)

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'created' | 'lastSignIn'>('name')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null)
  const [roleChangeUser, setRoleChangeUser] = useState<{ userId: string; newRole: UserRole } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.emailAddresses[0]?.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || user.publicMetadata.role === roleFilter
      
      return matchesSearch && matchesRole
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case 'email':
          return a.emailAddresses[0]?.emailAddress.localeCompare(b.emailAddresses[0]?.emailAddress)
        case 'role':
          return a.publicMetadata.role.localeCompare(b.publicMetadata.role)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'lastSignIn':
          const aTime = a.lastSignInAt ? new Date(a.lastSignInAt).getTime() : 0
          const bTime = b.lastSignInAt ? new Date(b.lastSignInAt).getTime() : 0
          return bTime - aTime
        default:
          return 0
      }
    })
  }, [users, searchTerm, roleFilter, sortBy])

  // Calculate user statistics
  const userStats = useMemo(() => {
    const stats = {
      total: users.length,
      students: 0,
      instructors: 0,
      admins: 0,
      superAdmins: 0,
    }

    users.forEach(user => {
      switch (user.publicMetadata.role) {
        case UserRole.STUDENT:
          stats.students++
          break
        case UserRole.INSTRUCTOR:
          stats.instructors++
          break
        case UserRole.ADMIN:
          stats.admins++
          break
        case UserRole.SUPER_ADMIN:
          stats.superAdmins++
          break
      }
    })

    return stats
  }, [users])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setIsSubmitting(true)
      
      if (onRoleChange) {
        await onRoleChange(userId, newRole)
      }

      // Log role change
      const user = users.find(u => u.id === userId)
      if (user) {
        auditHelpers.logRoleChanged(
          userId,
          user.publicMetadata.role,
          newRole,
          currentUser?.id
        )
      }

      setRoleChangeUser(null)
    } catch (err) {
      // Error handling would be done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUserSuspend = async (userId: string) => {
    try {
      setIsSubmitting(true)
      
      if (onUserSuspend) {
        await onUserSuspend(userId)
      }

      // Log suspension
      auditHelpers.logAccessDenied(userId, 'user_account', userId, { action: 'suspended' })
    } catch (err) {
      // Error handling would be done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkRoleChange = async (newRole: UserRole) => {
    try {
      setIsSubmitting(true)
      
      if (onBulkRoleChange) {
        await onBulkRoleChange(selectedUsers, newRole)
      }

      setSelectedUsers([])
    } catch (err) {
      // Error handling would be done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedUsers(prev => 
      prev.length === filteredAndSortedUsers.length 
        ? []
        : filteredAndSortedUsers.map(user => user.id)
    )
  }

  // Access control check
  if (currentUserRole !== UserRole.ADMIN && currentUserRole !== UserRole.SUPER_ADMIN) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You don't have permission to access the user management dashboard.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button data-testid="retry-load-users" variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div data-testid="user-management-dashboard" className="bg-background space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        
        <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
          <div data-testid="super-admin-actions" className="flex space-x-2">
            <Button variant="outline">Export Users</Button>
            <Button>Add User</Button>
          </div>
        </RoleGuard>
      </div>

      {/* User Statistics */}
      <Card data-testid="user-stats" className="p-6">
        <h2 className="text-lg font-semibold mb-4">User Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{userStats.total}</div>
            <div className="text-sm text-muted-foreground">Total Users: {userStats.total}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{userStats.students}</div>
            <div className="text-sm text-muted-foreground">Students: {userStats.students}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{userStats.instructors}</div>
            <div className="text-sm text-muted-foreground">Instructors: {userStats.instructors}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{userStats.admins}</div>
            <div className="text-sm text-muted-foreground">Admins: {userStats.admins}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{userStats.superAdmins}</div>
            <div className="text-sm text-muted-foreground">Super Admins: {userStats.superAdmins}</div>
          </div>
        </div>
      </Card>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              data-testid="user-search"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            data-testid="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            className="p-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Roles</option>
            <option value={UserRole.STUDENT}>Students</option>
            <option value={UserRole.INSTRUCTOR}>Instructors</option>
            <option value={UserRole.ADMIN}>Admins</option>
            <option value={UserRole.SUPER_ADMIN}>Super Admins</option>
          </select>

          <select
            data-testid="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 border border-border rounded-md bg-background"
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="role">Sort by Role</option>
            <option value="created">Sort by Registration</option>
            <option value="lastSignIn">Sort by Last Login</option>
          </select>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card data-testid="bulk-actions" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedUsers.length} users selected
            </span>
            <div className="flex space-x-2">
              <select
                data-testid="bulk-role-select"
                className="p-2 border border-border rounded-md bg-background text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    setRoleChangeUser({ userId: 'bulk', newRole: e.target.value as UserRole })
                  }
                }}
              >
                <option value="">Change Role...</option>
                <option value={UserRole.STUDENT}>Student</option>
                <option value={UserRole.INSTRUCTOR}>Instructor</option>
                {currentUserRole === UserRole.SUPER_ADMIN && (
                  <option value={UserRole.ADMIN}>Admin</option>
                )}
              </select>
              <Button
                data-testid="bulk-role-change"
                variant="outline"
                size="sm"
                onClick={() => {
                  // This would trigger the bulk role change confirmation
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <table data-testid="users-table" className="w-full border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 text-left">
                <input
                  data-testid="select-all-users"
                  type="checkbox"
                  checked={selectedUsers.length === filteredAndSortedUsers.length}
                  onChange={toggleSelectAll}
                  className="rounded border-border"
                />
              </th>
              <th className="p-4 text-left font-medium">Name</th>
              <th className="p-4 text-left font-medium">Email</th>
              <th className="p-4 text-left font-medium">Role</th>
              <th className="p-4 text-left font-medium">Registered</th>
              <th className="p-4 text-left font-medium">Last Login</th>
              <th className="p-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.map((user) => (
              <tr
                key={user.id}
                data-testid={`user-row-${user.id}`}
                className="border-t border-border hover:bg-muted/25"
              >
                <td className="p-4">
                  <input
                    data-testid={`select-user-${user.id}`}
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="rounded border-border"
                  />
                </td>
                <td className="p-4 font-medium">
                  {user.firstName} {user.lastName}
                </td>
                <td className="p-4 text-muted-foreground">
                  {user.emailAddresses[0]?.emailAddress}
                </td>
                <td className="p-4">
                  <span
                    data-testid={`role-badge-${user.publicMetadata.role}`}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      roleColors[user.publicMetadata.role]
                    }`}
                  >
                    {user.publicMetadata.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground text-sm">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="p-4 text-muted-foreground text-sm">
                  {user.lastSignInAt
                    ? new Date(user.lastSignInAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Never'}
                </td>
                <td className="p-4">
                  <div className="flex space-x-1">
                    <Button
                      data-testid={`view-user-${user.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUserDetails(user.id)}
                    >
                      View
                    </Button>
                    <Button
                      data-testid={`change-role-${user.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => setRoleChangeUser({ userId: user.id, newRole: user.publicMetadata.role })}
                    >
                      Role
                    </Button>
                    <Button
                      data-testid={`suspend-user-${user.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserSuspend(user.id)}
                    >
                      Suspend
                    </Button>
                    <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
                      <Button
                        data-testid={`delete-user-${user.id}`}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </RoleGuard>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Role Change Confirmation Modal */}
      {roleChangeUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card data-testid="role-change-confirmation" className="p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Role Change</h3>
            <p className="text-muted-foreground mb-4">
              {roleChangeUser.userId === 'bulk' 
                ? `Change ${selectedUsers.length} users to ${roleChangeUser.newRole}?`
                : `Change ${users.find(u => u.id === roleChangeUser.userId)?.firstName} ${users.find(u => u.id === roleChangeUser.userId)?.lastName} to ${roleChangeUser.newRole.replace('_', ' ')}?`
              }
            </p>
            <div className="space-y-4">
              <select
                data-testid={`role-select-${roleChangeUser.userId}`}
                value={roleChangeUser.newRole}
                onChange={(e) => setRoleChangeUser({ ...roleChangeUser, newRole: e.target.value as UserRole })}
                className="w-full p-2 border border-border rounded-md bg-background"
              >
                <option value={UserRole.STUDENT}>Student</option>
                <option value={UserRole.INSTRUCTOR}>Instructor</option>
                {currentUserRole === UserRole.SUPER_ADMIN && (
                  <>
                    <option value={UserRole.ADMIN}>Admin</option>
                    <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                  </>
                )}
              </select>
              <div className="flex space-x-2">
                <Button
                  data-testid="confirm-role-change"
                  onClick={() => {
                    if (roleChangeUser.userId === 'bulk') {
                      handleBulkRoleChange(roleChangeUser.newRole)
                    } else {
                      handleRoleChange(roleChangeUser.userId, roleChangeUser.newRole)
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Changing...' : 'Confirm'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRoleChangeUser(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card data-testid="user-details-modal" className="p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {users.find(u => u.id === showUserDetails)?.firstName} {users.find(u => u.id === showUserDetails)?.lastName} Details
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserDetails(null)}
              >
                ✕
              </Button>
            </div>
            {/* User details content would go here */}
            <div className="space-y-4">
              <p>User details and activity would be displayed here.</p>
            </div>
          </Card>
        </div>
      )}

      {/* Bulk Change Confirmation */}
      {roleChangeUser?.userId === 'bulk' && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Bulk Role Change</h3>
            <p className="text-muted-foreground mb-4">
              Change {selectedUsers.length} selected users to {roleChangeUser.newRole}?
            </p>
            <div className="flex space-x-2">
              <Button
                data-testid="confirm-bulk-change"
                onClick={() => handleBulkRoleChange(roleChangeUser.newRole)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Changing...' : 'Confirm'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRoleChangeUser(null)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}