/**
 * Button Component Integration Test
 * 
 * Tests that Phase 1 Button component works correctly with 
 * Phase 2.1 authentication and Phase 2.2 authorization.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'
import { AuthProvider } from '../auth/AuthProvider'
import { AuthorizationProvider } from '../authorization/AuthorizationProvider'
import { Can } from '../authorization/Can'
import { SignInButton } from '../auth/SignInButton'
import { UserRole } from '../../lib/authorization/roles'

// Mock Clerk
const mockUseAuth = jest.fn()
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockUseAuth(),
  SignInButton: ({ children, onClick, ...props }: any) => (
    <button data-testid="clerk-signin-button" onClick={onClick} {...props}>
      {children || 'Sign In'}
    </button>
  ),
}))

function TestWrapper({ children, userRole = null }: { 
  children: React.ReactNode
  userRole?: UserRole | null 
}) {
  mockUseAuth.mockReturnValue({
    isSignedIn: !!userRole,
    isLoaded: true,
    user: userRole ? {
      id: 'user_123',
      publicMetadata: { role: userRole },
    } : null,
  })

  return (
    <AuthProvider>
      <AuthorizationProvider>
        {children}
      </AuthorizationProvider>
    </AuthProvider>
  )
}

describe('Button Integration with Authentication and Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Button with Authentication Context', () => {
    it('renders Button normally without authentication context', () => {
      render(<Button data-testid="standalone-button">Standalone Button</Button>)
      
      expect(screen.getByTestId('standalone-button')).toBeInTheDocument()
      expect(screen.getByText('Standalone Button')).toBeInTheDocument()
    })

    it('renders Button within authentication provider', () => {
      render(
        <TestWrapper userRole={UserRole.STUDENT}>
          <Button data-testid="auth-button">Authenticated Button</Button>
        </TestWrapper>
      )
      
      expect(screen.getByTestId('auth-button')).toBeInTheDocument()
      expect(screen.getByText('Authenticated Button')).toBeInTheDocument()
    })

    it('Button works with SignInButton integration', () => {
      render(
        <TestWrapper userRole={null}>
          <div>
            <Button variant="outline" data-testid="regular-button">
              Regular Button
            </Button>
            <SignInButton variant="default" data-testid="signin-button">
              Sign In Button
            </SignInButton>
          </div>
        </TestWrapper>
      )
      
      expect(screen.getByTestId('regular-button')).toBeInTheDocument()
      expect(screen.getByTestId('signin-button')).toBeInTheDocument()
    })
  })

  describe('Button with Authorization Context', () => {
    it('renders Button within authorization-protected content', () => {
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <Button data-testid="create-course-btn">Create Course</Button>
          </Can>
        </TestWrapper>
      )
      
      expect(screen.getByTestId('create-course-btn')).toBeInTheDocument()
    })

    it('does not render Button when authorization fails', () => {
      render(
        <TestWrapper userRole={UserRole.STUDENT}>
          <Can action="create" subject="Course">
            <Button data-testid="create-course-btn">Create Course</Button>
          </Can>
        </TestWrapper>
      )
      
      expect(screen.queryByTestId('create-course-btn')).not.toBeInTheDocument()
    })

    it('renders different buttons based on role permissions', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <div>
            <Can action="read" subject="Course">
              <Button data-testid="read-btn" variant="outline">View Courses</Button>
            </Can>
            <Can action="create" subject="Course">
              <Button data-testid="create-btn" variant="default">Create Course</Button>
            </Can>
            <Can action="manage" subject="User">
              <Button data-testid="manage-btn" variant="secondary">Manage Users</Button>
            </Can>
            <Can action="manage" subject="System">
              <Button data-testid="system-btn" variant="destructive">System Settings</Button>
            </Can>
          </div>
        </TestWrapper>
      )
      
      // Admin should see all except system management
      expect(screen.getByTestId('read-btn')).toBeInTheDocument()
      expect(screen.getByTestId('create-btn')).toBeInTheDocument()
      expect(screen.getByTestId('manage-btn')).toBeInTheDocument()
      expect(screen.queryByTestId('system-btn')).not.toBeInTheDocument()
    })
  })

  describe('Button Variants with Authorization', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const

    it('all Button variants work within authorization context', () => {
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <div>
            {variants.map(variant => (
              <Can key={variant} action="read" subject="Course">
                <Button 
                  variant={variant} 
                  data-testid={`button-${variant}`}
                >
                  {variant}
                </Button>
              </Can>
            ))}
          </div>
        </TestWrapper>
      )

      variants.forEach(variant => {
        expect(screen.getByTestId(`button-${variant}`)).toBeInTheDocument()
      })
    })

    it('Button variants maintain styling within authorization context', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <Can action="manage" subject="User">
            <Button 
              variant="destructive" 
              className="custom-class"
              data-testid="styled-button"
            >
              Delete User
            </Button>
          </Can>
        </TestWrapper>
      )

      const button = screen.getByTestId('styled-button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Button Event Handling with Authorization', () => {
    it('Button click events work within authorization context', () => {
      const handleClick = jest.fn()
      
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <Button onClick={handleClick} data-testid="clickable-button">
              Create Course
            </Button>
          </Can>
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('clickable-button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('Button form submission works with authorization', () => {
      const handleSubmit = jest.fn()
      
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <form onSubmit={handleSubmit}>
              <Button type="submit" data-testid="submit-button">
                Submit Course
              </Button>
            </form>
          </Can>
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('submit-button'))
      expect(handleSubmit).toHaveBeenCalled()
    })
  })

  describe('Button Accessibility with Authorization', () => {
    it('Button maintains accessibility attributes within authorization context', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <Can action="delete" subject="Course">
            <Button 
              aria-label="Delete course permanently"
              data-testid="delete-button"
            >
              Delete
            </Button>
          </Can>
        </TestWrapper>
      )

      const button = screen.getByTestId('delete-button')
      expect(button).toHaveAttribute('aria-label', 'Delete course permanently')
    })

    it('Button disabled state works with authorization', () => {
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <Button disabled data-testid="disabled-button">
              Create Course
            </Button>
          </Can>
        </TestWrapper>
      )

      const button = screen.getByTestId('disabled-button')
      expect(button).toBeDisabled()
    })
  })

  describe('Button Performance with Authorization', () => {
    it('renders many buttons efficiently within authorization context', () => {
      const startTime = performance.now()
      
      render(
        <TestWrapper userRole={UserRole.SUPER_ADMIN}>
          <div>
            {Array.from({ length: 50 }, (_, i) => (
              <Can key={i} action="read" subject="Course">
                <Button data-testid={`button-${i}`}>
                  Button {i}
                </Button>
              </Can>
            ))}
          </div>
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render efficiently
      expect(renderTime).toBeLessThan(50) // 50ms threshold
      
      // All buttons should be present
      expect(screen.getByTestId('button-0')).toBeInTheDocument()
      expect(screen.getByTestId('button-49')).toBeInTheDocument()
    })
  })

  describe('Button with Complex Authorization Scenarios', () => {
    it('Button works with nested authorization checks', () => {
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="read" subject="Course">
            <div>
              <Can action="create" subject="Course">
                <Button data-testid="create-btn">Create</Button>
              </Can>
              <Can action="update" subject="Course">
                <Button data-testid="update-btn">Update</Button>
              </Can>
              <Can action="delete" subject="Course">
                <Button data-testid="delete-btn">Delete</Button>
              </Can>
            </div>
          </Can>
        </TestWrapper>
      )

      // Instructor can create and update but not delete
      expect(screen.getByTestId('create-btn')).toBeInTheDocument()
      expect(screen.getByTestId('update-btn')).toBeInTheDocument()
      expect(screen.queryByTestId('delete-btn')).not.toBeInTheDocument()
    })

    it('Button works with resource-specific permissions', () => {
      const ownCourse = { id: 'course_1', instructorId: 'user_123' }
      const otherCourse = { id: 'course_2', instructorId: 'user_456' }

      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <div>
            <Can action="update" subject="Course" resource={ownCourse}>
              <Button data-testid="edit-own-course">Edit Own Course</Button>
            </Can>
            <Can action="update" subject="Course" resource={otherCourse}>
              <Button data-testid="edit-other-course">Edit Other Course</Button>
            </Can>
          </div>
        </TestWrapper>
      )

      expect(screen.getByTestId('edit-own-course')).toBeInTheDocument()
      expect(screen.queryByTestId('edit-other-course')).not.toBeInTheDocument()
    })
  })
})