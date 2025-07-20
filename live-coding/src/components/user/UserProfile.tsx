/**
 * User Profile Component
 * 
 * Handles user profile management with edit capabilities, preferences,
 * and integration with authentication and authorization systems.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { Can } from '../authorization/Can'
import { RoleGuard } from '../authorization/RoleGuard'
import { Form } from '../ui/Form'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Spinner } from '../ui/Loading'
import { UserRole, getUserRole } from '../../lib/authorization/roles'
import { auditHelpers } from '../../lib/authorization/audit'

interface UserProfileProps {
  userId?: string
  showPreferences?: boolean
  showActivity?: boolean
  showRoleManagement?: boolean
  onProfileUpdate?: (data: any) => Promise<void>
  onPreferencesUpdate?: (preferences: any) => Promise<void>
  onRoleChange?: (userId: string, newRole: UserRole) => Promise<void>
}

interface ProfileData {
  firstName: string
  lastName: string
  bio: string
  learningGoals: string
}

interface UserPreferences {
  emailNotifications: boolean
  theme: string
}

const roleColors = {
  [UserRole.STUDENT]: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  [UserRole.INSTRUCTOR]: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  [UserRole.SUPER_ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

export function UserProfile({
  userId,
  showPreferences = false,
  showActivity = false,
  showRoleManagement = false,
  onProfileUpdate,
  onPreferencesUpdate,
  onRoleChange,
}: UserProfileProps) {
  const { user: currentUser, isLoaded: authLoaded } = useAuth()
  const { user: clerkUser, isLoaded: userLoaded } = useUser()
  
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    bio: '',
    learningGoals: '',
  })
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    theme: 'system',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Determine if this is the current user's profile or another user's
  const isOwnProfile = !userId || userId === currentUser?.id
  const displayUser = isOwnProfile ? clerkUser : null // In real app, fetch other user data
  const currentUserRole = getUserRole(currentUser)

  useEffect(() => {
    if (displayUser) {
      setProfileData({
        firstName: displayUser.firstName || '',
        lastName: displayUser.lastName || '',
        bio: displayUser.privateMetadata?.bio || '',
        learningGoals: displayUser.privateMetadata?.learningGoals || '',
      })
      
      setPreferences({
        emailNotifications: displayUser.privateMetadata?.preferences?.emailNotifications ?? true,
        theme: displayUser.privateMetadata?.preferences?.theme || 'system',
      })
    }
  }, [displayUser])

  const canEdit = isOwnProfile || (currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.SUPER_ADMIN)

  const handleProfileSave = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (onProfileUpdate) {
        await onProfileUpdate(profileData)
      }

      // Log profile update
      auditHelpers.logResourceAccess(
        currentUser?.id || 'unknown',
        'user_profile',
        userId || currentUser?.id || 'unknown',
        'update'
      )

      setIsEditing(false)
    } catch (err) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreferencesSave = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (onPreferencesUpdate) {
        await onPreferencesUpdate(preferences)
      }
    } catch (err) {
      setError('Failed to update preferences. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRoleChange = async (newRole: UserRole) => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (onRoleChange && userId) {
        await onRoleChange(userId, newRole)
      }

      // Log role change
      auditHelpers.logRoleChanged(
        userId || 'unknown',
        displayUser?.publicMetadata?.role || 'unknown',
        newRole,
        currentUser?.id
      )
    } catch (err) {
      setError('Failed to change user role. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCancel = () => {
    // Reset to original data
    if (displayUser) {
      setProfileData({
        firstName: displayUser.firstName || '',
        lastName: displayUser.lastName || '',
        bio: displayUser.privateMetadata?.bio || '',
        learningGoals: displayUser.privateMetadata?.learningGoals || '',
      })
    }
    setIsEditing(false)
    setError(null)
  }

  if (!authLoaded || !userLoaded) {
    return (
      <div data-testid="profile-loading" className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!displayUser) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">User not found.</p>
      </Card>
    )
  }

  const userRole = getUserRole(displayUser)

  return (
    <div className="space-y-6">
      <Card data-testid="user-profile" className="bg-card p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <img
            data-testid="user-avatar"
            src={displayUser.imageUrl || '/default-avatar.png'}
            alt={`${displayUser.firstName} ${displayUser.lastName}`}
            className="h-24 w-24 rounded-full object-cover border-2 border-border"
          />

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {displayUser.firstName} {displayUser.lastName}
                </h2>
                <p className="text-muted-foreground">
                  {displayUser.emailAddresses[0]?.emailAddress}
                </p>
              </div>
              
              {/* Role Badge */}
              {userRole && (
                <span
                  data-testid="role-badge"
                  className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[userRole]}`}
                >
                  {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              )}
            </div>

            {/* Edit/View Controls */}
            <div className="flex items-center space-x-2 mb-4">
              {canEdit ? (
                <>
                  {!isEditing ? (
                    <Button
                      data-testid="edit-profile-btn"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        data-testid="save-profile-btn"
                        size="sm"
                        onClick={handleProfileSave}
                        disabled={isSubmitting || !profileData.firstName.trim()}
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        data-testid="cancel-edit-btn"
                        variant="outline"
                        size="sm"
                        onClick={handleEditCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">View Only</span>
              )}

              {/* Admin Actions */}
              <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                <div data-testid="admin-actions" className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Activity
                  </Button>
                  <Button variant="outline" size="sm">
                    Send Message
                  </Button>
                </div>
              </RoleGuard>
            </div>

            {/* Profile Content */}
            {isEditing ? (
              <Form data-testid="profile-edit-form" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      required
                    />
                    {!profileData.firstName.trim() && (
                      <p className="text-destructive text-xs mt-1">First name is required</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium mb-1">
                    Bio
                  </label>
                  <Input
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label htmlFor="learningGoals" className="block text-sm font-medium mb-1">
                    Learning Goals
                  </label>
                  <Input
                    id="learningGoals"
                    value={profileData.learningGoals}
                    onChange={(e) => setProfileData({ ...profileData, learningGoals: e.target.value })}
                    placeholder="What do you want to learn?"
                  />
                </div>
              </Form>
            ) : (
              <div className="space-y-3">
                {profileData.bio && (
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Bio</h4>
                    <p className="text-muted-foreground">{profileData.bio}</p>
                  </div>
                )}
                {profileData.learningGoals && (
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Learning Goals</h4>
                    <p className="text-muted-foreground">{profileData.learningGoals}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}
      </Card>

      {/* Preferences */}
      {showPreferences && isOwnProfile && (
        <Card data-testid="user-preferences" className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Preferences</h3>
          <Form className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                className="rounded border-border"
              />
              <label htmlFor="emailNotifications" className="text-sm font-medium">
                Email Notifications
              </label>
            </div>
            <div>
              <label htmlFor="themePreference" className="block text-sm font-medium mb-2">
                Theme Preference
              </label>
              <select
                id="themePreference"
                value={preferences.theme}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                className="w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <Button
              data-testid="save-preferences-btn"
              onClick={handlePreferencesSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Preferences'}
            </Button>
          </Form>
        </Card>
      )}

      {/* Role Management */}
      {showRoleManagement && (
        <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          <Card data-testid="role-management" className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Role Management</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="changeRole" className="block text-sm font-medium mb-2">
                  Change Role
                </label>
                <select
                  id="changeRole"
                  defaultValue={userRole || ''}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full p-2 border border-border rounded-md bg-background"
                  disabled={isSubmitting}
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
              </div>
            </div>
          </Card>
        </RoleGuard>
      )}

      {/* Activity History */}
      {showActivity && (
        <Card data-testid="user-activity" className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-foreground">Completed React Fundamentals</span>
              <span className="text-xs text-muted-foreground">2 days ago</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-foreground">Updated profile information</span>
              <span className="text-xs text-muted-foreground">1 week ago</span>
            </div>
          </div>

          {/* Admin-only activity */}
          <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <div data-testid="login-history" className="mt-6">
              <h4 className="font-medium text-foreground mb-2">Login History</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 text-sm">
                  <span>Last login: Jan 21, 2024 at 2:30 PM</span>
                  <span className="text-muted-foreground">192.168.1.1</span>
                </div>
                <div className="flex justify-between items-center py-1 text-sm">
                  <span>Previous login: Jan 20, 2024 at 9:15 AM</span>
                  <span className="text-muted-foreground">192.168.1.1</span>
                </div>
              </div>
            </div>
          </RoleGuard>
        </Card>
      )}
    </div>
  )
}