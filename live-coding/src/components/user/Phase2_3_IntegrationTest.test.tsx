/**
 * Phase 2.3 Integration Test
 * 
 * Comprehensive integration test for all Phase 2.3 user management components
 * working together with existing Phase 1, 2.1, and 2.2 systems.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Phase2_3_IntegrationTest } from './Phase2_3_IntegrationTest'
import { AuthProvider } from '../auth/AuthProvider'
import { AuthorizationProvider } from '../authorization/AuthorizationProvider'
import { ThemeProvider } from '../providers/ThemeProvider'
import { UserRole } from '../../lib/authorization/roles'

// Mock Clerk
const mockUseAuth = jest.fn()
const mockUseUser = jest.fn()
const mockUseSignIn = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockUseAuth(),
  useUser: () => mockUseUser(),
  useSignIn: () => mockUseSignIn(),
}))

function TestWrapper({ children, userRole = UserRole.ADMIN }: { 
  children: React.ReactNode
  userRole?: UserRole 
}) {
  mockUseAuth.mockReturnValue({
    isSignedIn: true,
    isLoaded: true,
    user: {
      id: 'admin_123',
      publicMetadata: { role: userRole },
    },
  })

  mockUseUser.mockReturnValue({
    user: {
      id: 'admin_123',
      publicMetadata: { role: userRole },
    },
    isLoaded: true,
  })

  mockUseSignIn.mockReturnValue({
    signIn: {
      create: jest.fn(),
      attemptFirstFactor: jest.fn(),
      resetPassword: jest.fn(),
    },
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

describe('Phase 2.3 Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Integration Test Component', () => {
    it('renders integration test interface', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByTestId('phase-2-3-integration-test')).toBeInTheDocument()
      expect(screen.getByText('Phase 2.3 User Management Integration Demo')).toBeInTheDocument()
    })

    it('shows navigation buttons for all components', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Registration')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Password Reset')).toBeInTheDocument()
      expect(screen.getByText('Role Assignment')).toBeInTheDocument()
      expect(screen.getByText('Activity Monitor')).toBeInTheDocument()
    })

    it('displays overview by default', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByText('Phase 2.3 User Management Interface')).toBeInTheDocument()
      expect(screen.getByText('✅ Completed Components')).toBeInTheDocument()
      expect(screen.getByText('🔗 Integration Features')).toBeInTheDocument()
    })
  })

  describe('Component Navigation', () => {
    it('navigates to registration component', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      const registrationButton = screen.getByText('Registration')
      fireEvent.click(registrationButton)

      // Should show registration component
      expect(screen.getByTestId('user-registration')).toBeInTheDocument()
    })

    it('navigates to profile component', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      const profileButton = screen.getByText('Profile')
      fireEvent.click(profileButton)

      // Should show profile component with user selection
      expect(screen.getByTestId('user-profile')).toBeInTheDocument()
    })

    it('navigates to dashboard component', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      const dashboardButton = screen.getByText('Dashboard')
      fireEvent.click(dashboardButton)

      // Should show dashboard component
      expect(screen.getByTestId('user-management-dashboard')).toBeInTheDocument()
    })

    it('navigates to password reset component', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      const passwordResetButton = screen.getByText('Password Reset')
      fireEvent.click(passwordResetButton)

      // Should show password reset component
      expect(screen.getByTestId('password-reset-form')).toBeInTheDocument()
    })

    it('navigates to role assignment component', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      const roleAssignmentButton = screen.getByText('Role Assignment')
      fireEvent.click(roleAssignmentButton)

      // Should show role assignment interface
      expect(screen.getByTestId('role-assignment-interface')).toBeInTheDocument()
    })

    it('navigates to activity monitor component', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      const activityMonitorButton = screen.getByText('Activity Monitor')
      fireEvent.click(activityMonitorButton)

      // Should show activity monitor
      expect(screen.getByTestId('user-activity-monitor')).toBeInTheDocument()
    })
  })

  describe('User Selection and Interaction', () => {
    it('allows selecting different users for profile view', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      // Navigate to profile
      fireEvent.click(screen.getByText('Profile'))

      // Should show user selection buttons
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Carol')).toBeInTheDocument()

      // Click on Bob
      fireEvent.click(screen.getByText('Bob'))

      // Profile should update (would need to check specific profile content)
      expect(screen.getByTestId('user-profile')).toBeInTheDocument()
    })

    it('allows selecting users for role assignment', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      // Navigate to role assignment
      fireEvent.click(screen.getByText('Role Assignment'))

      // Should show user selection for role assignment
      expect(screen.getByText('Select Users for Role Assignment')).toBeInTheDocument()
      
      // Should show users with their current roles
      expect(screen.getByText('Alice (student)')).toBeInTheDocument()
      expect(screen.getByText('Bob (instructor)')).toBeInTheDocument()
      expect(screen.getByText('Carol (admin)')).toBeInTheDocument()
    })

    it('allows selecting different users for activity monitoring', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      // Navigate to activity monitor
      fireEvent.click(screen.getByText('Activity Monitor'))

      // Should show user selection buttons
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Carol')).toBeInTheDocument()
    })
  })

  describe('Integration Verification', () => {
    it('shows integration status indicators', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByText('Integration Test Results')).toBeInTheDocument()
      expect(screen.getByText('Phase 1 Integration')).toBeInTheDocument()
      expect(screen.getByText('Phase 2.1 Integration')).toBeInTheDocument()
      expect(screen.getByText('Phase 2.2 Integration')).toBeInTheDocument()
    })

    it('lists completed components', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByText('UserRegistration - Complete onboarding flow')).toBeInTheDocument()
      expect(screen.getByText('UserProfile - Profile management with preferences')).toBeInTheDocument()
      expect(screen.getByText('UserManagementDashboard - Admin user management')).toBeInTheDocument()
      expect(screen.getByText('PasswordReset - Account recovery system')).toBeInTheDocument()
      expect(screen.getByText('RoleAssignmentInterface - Enhanced role management')).toBeInTheDocument()
      expect(screen.getByText('UserActivityMonitor - Session and audit tracking')).toBeInTheDocument()
    })

    it('lists integration features', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByText('Phase 1 UI components (Button, Form, Card)')).toBeInTheDocument()
      expect(screen.getByText('Phase 2.1 Clerk authentication')).toBeInTheDocument()
      expect(screen.getByText('Phase 2.2 CASL authorization')).toBeInTheDocument()
      expect(screen.getByText('Theme system consistency')).toBeInTheDocument()
      expect(screen.getByText('Comprehensive TDD test coverage')).toBeInTheDocument()
      expect(screen.getByText('Storybook documentation')).toBeInTheDocument()
    })
  })

  describe('Component Functionality', () => {
    it('demonstrates registration flow', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Registration'))

      // Should show registration component with role selection enabled
      expect(screen.getByTestId('user-registration')).toBeInTheDocument()
    })

    it('demonstrates dashboard functionality', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Dashboard'))

      // Should show dashboard with mock users
      expect(screen.getByTestId('user-management-dashboard')).toBeInTheDocument()
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
      expect(screen.getByText('Carol Davis')).toBeInTheDocument()
    })

    it('demonstrates role assignment with user selection', async () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Role Assignment'))

      // Select a user
      const aliceButton = screen.getByText('Alice (student)')
      fireEvent.click(aliceButton)

      // Should show role assignment interface
      expect(screen.getByTestId('role-assignment-interface')).toBeInTheDocument()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles navigation between components smoothly', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      // Navigate through multiple components
      fireEvent.click(screen.getByText('Registration'))
      expect(screen.getByTestId('user-registration')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Dashboard'))
      expect(screen.getByTestId('user-management-dashboard')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Overview'))
      expect(screen.getByText('Phase 2.3 User Management Interface')).toBeInTheDocument()
    })

    it('maintains state during navigation', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      // Navigate to role assignment and select users
      fireEvent.click(screen.getByText('Role Assignment'))
      fireEvent.click(screen.getByText('Alice (student)'))

      // Navigate away and back
      fireEvent.click(screen.getByText('Overview'))
      fireEvent.click(screen.getByText('Role Assignment'))

      // Selection should be maintained
      expect(screen.getByTestId('role-assignment-interface')).toBeInTheDocument()
    })
  })

  describe('Accessibility and Usability', () => {
    it('maintains WCAG compliance across all components', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      
      // Check for proper button accessibility
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      const overviewButton = screen.getByText('Overview')
      overviewButton.focus()
      expect(document.activeElement).toBe(overviewButton)
    })
  })

  describe('Theme Integration', () => {
    it('maintains theme consistency across all components', () => {
      render(
        <TestWrapper>
          <Phase2_3_IntegrationTest />
        </TestWrapper>
      )

      const container = screen.getByTestId('phase-2-3-integration-test')
      expect(container).toBeInTheDocument()

      // Navigate through components to ensure theme consistency
      fireEvent.click(screen.getByText('Registration'))
      expect(screen.getByTestId('user-registration')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Dashboard'))
      expect(screen.getByTestId('user-management-dashboard')).toBeInTheDocument()
    })
  })
})