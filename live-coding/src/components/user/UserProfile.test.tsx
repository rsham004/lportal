/**
 * User Profile Component Test
 * 
 * Tests user profile management with edit capabilities, preferences,
 * and integration with authentication and authorization systems.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserProfile } from './UserProfile'
import { AuthProvider } from '../auth/AuthProvider'
import { AuthorizationProvider } from '../authorization/AuthorizationProvider'
import { ThemeProvider } from '../providers/ThemeProvider'
import { UserRole } from '../../lib/authorization/roles'

// Mock Clerk
const mockUseAuth = jest.fn()
const mockUseUser = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockUseAuth(),
  useUser: () => mockUseUser(),
}))

const mockUser = {
  id: 'user_123',
  firstName: 'John',
  lastName: 'Doe',
  emailAddresses: [{ emailAddress: 'john@example.com' }],
  imageUrl: 'https://example.com/avatar.jpg',
  publicMetadata: { role: UserRole.STUDENT },
  privateMetadata: {
    bio: 'Learning enthusiast',
    learningGoals: 'Master React and TypeScript',
    preferences: {
      emailNotifications: true,
      theme: 'system',
    },
  },
}

function TestWrapper({ children, userRole = UserRole.STUDENT }: { 
  children: React.ReactNode
  userRole?: UserRole 
}) {
  mockUseAuth.mockReturnValue({
    isSignedIn: true,
    isLoaded: true,
    user: { ...mockUser, publicMetadata: { role: userRole } },
  })

  mockUseUser.mockReturnValue({
    user: { ...mockUser, publicMetadata: { role: userRole } },
    isLoaded: true,
  })

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthorizationProvider>
          {children}
        </AuthorizationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

describe('UserProfile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Profile Display', () => {
    it('renders user profile information', () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      expect(screen.getByTestId('user-profile')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('Student')).toBeInTheDocument()
    })

    it('displays user avatar', () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      const avatar = screen.getByTestId('user-avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
      expect(avatar).toHaveAttribute('alt', 'John Doe')
    })

    it('shows role badge with appropriate styling', () => {
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <UserProfile />
        </TestWrapper>
      )

      const roleBadge = screen.getByTestId('role-badge')
      expect(roleBadge).toBeInTheDocument()
      expect(roleBadge).toHaveTextContent('Instructor')
      expect(roleBadge).toHaveClass('bg-green-100') // Instructor role styling
    })

    it('displays bio and learning goals', () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      expect(screen.getByText('Learning enthusiast')).toBeInTheDocument()
      expect(screen.getByText('Master React and TypeScript')).toBeInTheDocument()
    })
  })

  describe('Profile Editing', () => {
    it('enters edit mode when edit button is clicked', () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      const editButton = screen.getByTestId('edit-profile-btn')
      fireEvent.click(editButton)

      expect(screen.getByTestId('profile-edit-form')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    })

    it('allows editing profile information', async () => {
      const onProfileUpdate = jest.fn()

      render(
        <TestWrapper>
          <UserProfile onProfileUpdate={onProfileUpdate} />
        </TestWrapper>
      )

      // Enter edit mode
      fireEvent.click(screen.getByTestId('edit-profile-btn'))

      // Update bio
      const bioInput = screen.getByLabelText('Bio')
      fireEvent.change(bioInput, { target: { value: 'Updated bio' } })

      // Save changes
      const saveButton = screen.getByTestId('save-profile-btn')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onProfileUpdate).toHaveBeenCalledWith({
          bio: 'Updated bio',
          learningGoals: 'Master React and TypeScript',
        })
      })
    })

    it('cancels edit mode without saving changes', () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      // Enter edit mode
      fireEvent.click(screen.getByTestId('edit-profile-btn'))

      // Make changes
      const bioInput = screen.getByLabelText('Bio')
      fireEvent.change(bioInput, { target: { value: 'Changed bio' } })

      // Cancel
      const cancelButton = screen.getByTestId('cancel-edit-btn')
      fireEvent.click(cancelButton)

      // Should show original bio
      expect(screen.getByText('Learning enthusiast')).toBeInTheDocument()
      expect(screen.queryByText('Changed bio')).not.toBeInTheDocument()
    })

    it('validates required fields', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      // Enter edit mode
      fireEvent.click(screen.getByTestId('edit-profile-btn'))

      // Clear required field
      const firstNameInput = screen.getByLabelText('First Name')
      fireEvent.change(firstNameInput, { target: { value: '' } })

      // Try to save
      const saveButton = screen.getByTestId('save-profile-btn')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument()
      })
    })
  })

  describe('Preferences Management', () => {
    it('displays user preferences', () => {
      render(
        <TestWrapper>
          <UserProfile showPreferences />
        </TestWrapper>
      )

      expect(screen.getByTestId('user-preferences')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Notifications')).toBeChecked()
      expect(screen.getByDisplayValue('system')).toBeInTheDocument()
    })

    it('allows updating preferences', async () => {
      const onPreferencesUpdate = jest.fn()

      render(
        <TestWrapper>
          <UserProfile 
            showPreferences 
            onPreferencesUpdate={onPreferencesUpdate}
          />
        </TestWrapper>
      )

      // Toggle email notifications
      const emailToggle = screen.getByLabelText('Email Notifications')
      fireEvent.click(emailToggle)

      // Change theme preference
      const themeSelect = screen.getByLabelText('Theme Preference')
      fireEvent.change(themeSelect, { target: { value: 'dark' } })

      // Save preferences
      const saveButton = screen.getByTestId('save-preferences-btn')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onPreferencesUpdate).toHaveBeenCalledWith({
          emailNotifications: false,
          theme: 'dark',
        })
      })
    })
  })

  describe('Authorization Integration', () => {
    it('allows users to edit their own profile', () => {
      render(
        <TestWrapper>
          <UserProfile userId="user_123" />
        </TestWrapper>
      )

      expect(screen.getByTestId('edit-profile-btn')).toBeInTheDocument()
    })

    it('prevents users from editing other profiles', () => {
      render(
        <TestWrapper>
          <UserProfile userId="other_user_456" />
        </TestWrapper>
      )

      expect(screen.queryByTestId('edit-profile-btn')).not.toBeInTheDocument()
      expect(screen.getByText('View Only')).toBeInTheDocument()
    })

    it('allows admins to edit any profile', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <UserProfile userId="other_user_456" />
        </TestWrapper>
      )

      expect(screen.getByTestId('edit-profile-btn')).toBeInTheDocument()
      expect(screen.getByTestId('admin-actions')).toBeInTheDocument()
    })

    it('shows role management for admins', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <UserProfile userId="other_user_456" showRoleManagement />
        </TestWrapper>
      )

      expect(screen.getByTestId('role-management')).toBeInTheDocument()
      expect(screen.getByLabelText('Change Role')).toBeInTheDocument()
    })
  })

  describe('Activity History', () => {
    it('displays user activity when enabled', () => {
      render(
        <TestWrapper>
          <UserProfile showActivity />
        </TestWrapper>
      )

      expect(screen.getByTestId('user-activity')).toBeInTheDocument()
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    })

    it('shows login history for admins', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <UserProfile userId="other_user_456" showActivity />
        </TestWrapper>
      )

      expect(screen.getByTestId('login-history')).toBeInTheDocument()
      expect(screen.getByText('Login History')).toBeInTheDocument()
    })

    it('hides sensitive activity from non-admins', () => {
      render(
        <TestWrapper userRole={UserRole.STUDENT}>
          <UserProfile userId="other_user_456" showActivity />
        </TestWrapper>
      )

      expect(screen.queryByTestId('login-history')).not.toBeInTheDocument()
      expect(screen.queryByTestId('admin-activity')).not.toBeInTheDocument()
    })
  })

  describe('Integration with Existing Systems', () => {
    it('integrates with Phase 1 components', () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      // Should use Phase 1 Card, Button, Input components
      const profileCard = screen.getByTestId('user-profile')
      expect(profileCard).toHaveClass('rounded-lg') // Phase 1 Card styling
    })

    it('integrates with Phase 2.1 authentication', () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      // Should display authenticated user information
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('integrates with Phase 2.2 authorization', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <UserProfile userId="other_user_456" />
        </TestWrapper>
      )

      // Admin should see additional actions
      expect(screen.getByTestId('admin-actions')).toBeInTheDocument()
    })

    it('maintains theme consistency', () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      const container = screen.getByTestId('user-profile')
      expect(container).toHaveClass('bg-card') // Phase 1 theme classes
    })
  })

  describe('Error Handling', () => {
    it('handles profile update errors', async () => {
      const onProfileUpdate = jest.fn().mockRejectedValue(new Error('Update failed'))

      render(
        <TestWrapper>
          <UserProfile onProfileUpdate={onProfileUpdate} />
        </TestWrapper>
      )

      // Enter edit mode and try to save
      fireEvent.click(screen.getByTestId('edit-profile-btn'))
      fireEvent.click(screen.getByTestId('save-profile-btn'))

      await waitFor(() => {
        expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument()
      })
    })

    it('handles loading states gracefully', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: false,
      })

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      expect(screen.getByTestId('profile-loading')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('maintains WCAG compliance', () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      
      // Check for proper image alt text
      const avatar = screen.getByTestId('user-avatar')
      expect(avatar).toHaveAttribute('alt', 'John Doe')
    })

    it('supports keyboard navigation in edit mode', () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('edit-profile-btn'))

      // All form inputs should be keyboard accessible
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toBeInTheDocument()
      })
    })
  })
})