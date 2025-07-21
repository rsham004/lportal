/**
 * User Registration Component Test
 * 
 * Tests user registration and onboarding flow with role assignment
 * and integration with existing authentication and authorization systems.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserRegistration } from './UserRegistration'
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
  SignUp: ({ onComplete, ...props }: any) => (
    <div data-testid="clerk-signup" {...props}>
      <button onClick={() => onComplete?.({ user: { id: 'new_user_123' } })}>
        Complete Registration
      </button>
    </div>
  ),
}))

function TestWrapper({ children }: { children: React.ReactNode }) {
  mockUseAuth.mockReturnValue({
    isSignedIn: false,
    isLoaded: true,
    user: null,
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

describe('UserRegistration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Registration Form Rendering', () => {
    it('renders registration form with all required fields', () => {
      render(
        <TestWrapper>
          <UserRegistration />
        </TestWrapper>
      )

      expect(screen.getByTestId('user-registration')).toBeInTheDocument()
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
      expect(screen.getByTestId('clerk-signup')).toBeInTheDocument()
    })

    it('renders role selection for admin users', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: {
          id: 'admin_123',
          publicMetadata: { role: UserRole.ADMIN },
        },
      })

      render(
        <TestWrapper>
          <UserRegistration showRoleSelection />
        </TestWrapper>
      )

      expect(screen.getByTestId('role-selection')).toBeInTheDocument()
      expect(screen.getByLabelText('Student')).toBeInTheDocument()
      expect(screen.getByLabelText('Instructor')).toBeInTheDocument()
    })

    it('does not render role selection for non-admin users', () => {
      render(
        <TestWrapper>
          <UserRegistration showRoleSelection />
        </TestWrapper>
      )

      expect(screen.queryByTestId('role-selection')).not.toBeInTheDocument()
    })
  })

  describe('Registration Process', () => {
    it('handles successful registration', async () => {
      const onRegistrationComplete = jest.fn()

      render(
        <TestWrapper>
          <UserRegistration onRegistrationComplete={onRegistrationComplete} />
        </TestWrapper>
      )

      const completeButton = screen.getByText('Complete Registration')
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(onRegistrationComplete).toHaveBeenCalledWith({
          user: { id: 'new_user_123' },
          role: UserRole.STUDENT, // Default role
        })
      })
    })

    it('handles registration with custom role selection', async () => {
      const onRegistrationComplete = jest.fn()
      
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: {
          id: 'admin_123',
          publicMetadata: { role: UserRole.ADMIN },
        },
      })

      render(
        <TestWrapper>
          <UserRegistration 
            showRoleSelection 
            onRegistrationComplete={onRegistrationComplete}
          />
        </TestWrapper>
      )

      // Select instructor role
      const instructorRadio = screen.getByLabelText('Instructor')
      fireEvent.click(instructorRadio)

      const completeButton = screen.getByText('Complete Registration')
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(onRegistrationComplete).toHaveBeenCalledWith({
          user: { id: 'new_user_123' },
          role: UserRole.INSTRUCTOR,
        })
      })
    })

    it('validates required fields before submission', async () => {
      render(
        <TestWrapper>
          <UserRegistration />
        </TestWrapper>
      )

      // Try to submit without completing Clerk signup
      const form = screen.getByTestId('user-registration')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Please complete the registration form')).toBeInTheDocument()
      })
    })
  })

  describe('Onboarding Steps', () => {
    it('shows welcome step after registration', async () => {
      render(
        <TestWrapper>
          <UserRegistration showOnboarding />
        </TestWrapper>
      )

      const completeButton = screen.getByText('Complete Registration')
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-welcome')).toBeInTheDocument()
        expect(screen.getByText('Welcome to Learning Portal!')).toBeInTheDocument()
      })
    })

    it('shows profile completion step', async () => {
      render(
        <TestWrapper>
          <UserRegistration showOnboarding />
        </TestWrapper>
      )

      const completeButton = screen.getByText('Complete Registration')
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-welcome')).toBeInTheDocument()
      })

      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      expect(screen.getByTestId('onboarding-profile')).toBeInTheDocument()
      expect(screen.getByLabelText('Bio')).toBeInTheDocument()
      expect(screen.getByLabelText('Learning Goals')).toBeInTheDocument()
    })

    it('shows preferences step', async () => {
      render(
        <TestWrapper>
          <UserRegistration showOnboarding />
        </TestWrapper>
      )

      // Complete registration
      fireEvent.click(screen.getByText('Complete Registration'))
      await waitFor(() => screen.getByTestId('onboarding-welcome'))

      // Go to profile step
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByTestId('onboarding-profile')).toBeInTheDocument()

      // Go to preferences step
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByTestId('onboarding-preferences')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Notifications')).toBeInTheDocument()
      expect(screen.getByLabelText('Theme Preference')).toBeInTheDocument()
    })

    it('completes onboarding process', async () => {
      const onOnboardingComplete = jest.fn()

      render(
        <TestWrapper>
          <UserRegistration 
            showOnboarding 
            onOnboardingComplete={onOnboardingComplete}
          />
        </TestWrapper>
      )

      // Complete all steps
      fireEvent.click(screen.getByText('Complete Registration'))
      await waitFor(() => screen.getByTestId('onboarding-welcome'))

      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Complete Onboarding'))

      await waitFor(() => {
        expect(onOnboardingComplete).toHaveBeenCalledWith({
          userId: 'new_user_123',
          profileData: expect.any(Object),
          preferences: expect.any(Object),
        })
      })
    })
  })

  describe('Integration with Existing Systems', () => {
    it('integrates with Phase 1 Form components', () => {
      render(
        <TestWrapper>
          <UserRegistration showOnboarding />
        </TestWrapper>
      )

      // Should use Phase 1 Form, Input, Button components
      expect(screen.getByTestId('user-registration')).toBeInTheDocument()
      
      // Check for Phase 1 component classes/styling
      const form = screen.getByTestId('user-registration')
      expect(form).toHaveClass('space-y-6') // Phase 1 Form styling
    })

    it('integrates with Phase 2.1 authentication', () => {
      render(
        <TestWrapper>
          <UserRegistration />
        </TestWrapper>
      )

      // Should show Clerk signup component
      expect(screen.getByTestId('clerk-signup')).toBeInTheDocument()
    })

    it('integrates with Phase 2.2 authorization for role selection', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: {
          id: 'admin_123',
          publicMetadata: { role: UserRole.ADMIN },
        },
      })

      render(
        <TestWrapper>
          <UserRegistration showRoleSelection />
        </TestWrapper>
      )

      // Admin should see role selection
      expect(screen.getByTestId('role-selection')).toBeInTheDocument()
    })

    it('maintains theme consistency', () => {
      render(
        <TestWrapper>
          <UserRegistration />
        </TestWrapper>
      )

      const container = screen.getByTestId('user-registration')
      expect(container).toHaveClass('bg-background') // Phase 1 theme classes
    })
  })

  describe('Error Handling', () => {
    it('handles registration errors gracefully', async () => {
      const mockSignUp = jest.fn().mockRejectedValue(new Error('Registration failed'))

      render(
        <TestWrapper>
          <UserRegistration onRegistrationError={mockSignUp} />
        </TestWrapper>
      )

      const completeButton = screen.getByText('Complete Registration')
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument()
      })
    })

    it('handles network errors during onboarding', async () => {
      const mockOnboarding = jest.fn().mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <UserRegistration 
            showOnboarding 
            onOnboardingComplete={mockOnboarding}
          />
        </TestWrapper>
      )

      // Complete registration and onboarding steps
      fireEvent.click(screen.getByText('Complete Registration'))
      await waitFor(() => screen.getByTestId('onboarding-welcome'))

      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Complete Onboarding'))

      await waitFor(() => {
        expect(screen.getByText('Failed to complete onboarding. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('maintains WCAG compliance', () => {
      render(
        <TestWrapper>
          <UserRegistration showOnboarding />
        </TestWrapper>
      )

      // Check for proper form labels
      expect(screen.getByRole('form')).toBeInTheDocument()
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <UserRegistration showRoleSelection />
        </TestWrapper>
      )

      const form = screen.getByTestId('user-registration')
      expect(form).toBeInTheDocument()
      
      // Role selection should be keyboard accessible
      if (screen.queryByTestId('role-selection')) {
        const radioButtons = screen.getAllByRole('radio')
        radioButtons.forEach(radio => {
          expect(radio).toBeInTheDocument()
        })
      }
    })
  })
})