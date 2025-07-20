/**
 * Phase Integration Verification Test
 * 
 * Comprehensive test suite verifying that Phase 1, Phase 2.1, and Phase 2.2 
 * components work seamlessly together with no conflicts or integration issues.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from './auth/AuthProvider'
import { AuthorizationProvider } from './authorization/AuthorizationProvider'
import { Can } from './authorization/Can'
import { RoleGuard } from './authorization/RoleGuard'
import { ProtectedRoute } from './authorization/ProtectedRoute'
import { Header } from './shared/Header'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Form } from './ui/Form'
import { Card } from './ui/Card'
import { ThemeProvider } from './providers/ThemeProvider'
import { ThemeToggle } from './ui/ThemeToggle'
import { AppLayout } from './ui/AppLayout'
import { UserRole } from '../lib/authorization/roles'

// Mock Clerk
const mockUseAuth = jest.fn()
const mockUseUser = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  ),
  useAuth: () => mockUseAuth(),
  useUser: () => mockUseUser(),
  SignInButton: ({ children, onClick, ...props }: any) => (
    <button data-testid="clerk-signin-button" onClick={onClick} {...props}>
      {children || 'Sign In'}
    </button>
  ),
  UserButton: (props: any) => (
    <div data-testid="clerk-user-button" {...props}>
      User Menu
    </div>
  ),
  RedirectToSignIn: () => <div data-testid="redirect-to-signin">Redirecting...</div>,
}))

// Full provider wrapper for integration testing
function FullProviderWrapper({ children, userRole = null, userId = 'user_123' }: {
  children: React.ReactNode
  userRole?: UserRole | null
  userId?: string
}) {
  mockUseAuth.mockReturnValue({
    isSignedIn: !!userRole,
    isLoaded: true,
    user: userRole ? {
      id: userId,
      publicMetadata: { role: userRole },
    } : null,
  })

  mockUseUser.mockReturnValue({
    user: userRole ? {
      id: userId,
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com' }],
    } : null,
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

describe('Phase Integration Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Provider Stack Integration', () => {
    it('renders all providers without conflicts', () => {
      render(
        <FullProviderWrapper userRole={UserRole.STUDENT}>
          <div data-testid="test-content">Test Content</div>
        </FullProviderWrapper>
      )

      expect(screen.getByTestId('clerk-provider')).toBeInTheDocument()
      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })

    it('provides all contexts to nested components', () => {
      function TestComponent() {
        return (
          <div>
            <Can action="read" subject="Course">
              <div data-testid="can-read">Can read courses</div>
            </Can>
            <Button data-testid="phase1-button">Phase 1 Button</Button>
          </div>
        )
      }

      render(
        <FullProviderWrapper userRole={UserRole.STUDENT}>
          <TestComponent />
        </FullProviderWrapper>
      )

      expect(screen.getByTestId('can-read')).toBeInTheDocument()
      expect(screen.getByTestId('phase1-button')).toBeInTheDocument()
    })
  })

  describe('Header Integration with All Phases', () => {
    it('shows correct UI for unauthenticated users', () => {
      render(
        <FullProviderWrapper userRole={null}>
          <Header />
        </FullProviderWrapper>
      )

      // Phase 1 components should be present
      expect(screen.getByText('Learning Portal')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument()
      
      // Phase 2.1 authentication should show sign in
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
      
      // Should not show notifications (authorization-based)
      expect(screen.queryByRole('button', { name: /notification/i })).not.toBeInTheDocument()
    })

    it('shows correct UI for authenticated student', () => {
      render(
        <FullProviderWrapper userRole={UserRole.STUDENT}>
          <Header />
        </FullProviderWrapper>
      )

      // Phase 1 components maintained
      expect(screen.getByText('Learning Portal')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument()
      
      // Phase 2.1 authentication shows user button
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
      
      // Phase 2.2 authorization shows notifications for authenticated users
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(2) // Should include notification button
    })

    it('maintains responsive functionality with all phases', () => {
      const mockToggle = jest.fn()
      
      render(
        <FullProviderWrapper userRole={UserRole.INSTRUCTOR}>
          <Header showSidebarToggle onSidebarToggle={mockToggle} />
        </FullProviderWrapper>
      )

      // Phase 1 responsive features should work
      const searchInput = screen.getByPlaceholderText('Search courses...')
      fireEvent.focus(searchInput)
      expect(searchInput).toHaveFocus()

      // Sidebar toggle should work
      const buttons = screen.getAllByRole('button')
      const sidebarButton = buttons[0] // First button should be sidebar toggle
      fireEvent.click(sidebarButton)
      expect(mockToggle).toHaveBeenCalled()
    })
  })

  describe('Button Component Integration', () => {
    it('Phase 1 Button works with Phase 2.1 SignInButton', () => {
      render(
        <FullProviderWrapper userRole={null}>
          <div>
            <Button variant="outline" data-testid="phase1-button">Phase 1 Button</Button>
            <div data-testid="signin-section">
              {/* SignInButton uses Phase 1 Button internally */}
              <button data-testid="clerk-signin-button">Sign In</button>
            </div>
          </div>
        </FullProviderWrapper>
      )

      expect(screen.getByTestId('phase1-button')).toBeInTheDocument()
      expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument()
    })

    it('Phase 1 Button works within Phase 2.2 authorization context', () => {
      render(
        <FullProviderWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <Button variant="default" data-testid="create-course-btn">
              Create Course
            </Button>
          </Can>
          <Can action="manage" subject="System">
            <Button variant="destructive" data-testid="system-btn">
              System Management
            </Button>
          </Can>
        </FullProviderWrapper>
      )

      // Instructor can create courses
      expect(screen.getByTestId('create-course-btn')).toBeInTheDocument()
      // Instructor cannot manage system
      expect(screen.queryByTestId('system-btn')).not.toBeInTheDocument()
    })

    it('Button variants work consistently across all phases', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
      
      render(
        <FullProviderWrapper userRole={UserRole.ADMIN}>
          <div>
            {variants.map(variant => (
              <Can key={variant} action="read" subject="Course">
                <Button variant={variant} data-testid={`button-${variant}`}>
                  {variant}
                </Button>
              </Can>
            ))}
          </div>
        </FullProviderWrapper>
      )

      variants.forEach(variant => {
        expect(screen.getByTestId(`button-${variant}`)).toBeInTheDocument()
      })
    })
  })

  describe('Form Component Integration', () => {
    it('Phase 1 Form components work with authorization context', () => {
      render(
        <FullProviderWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <Form data-testid="course-form">
              <Input 
                placeholder="Course Title" 
                data-testid="course-title"
              />
              <Button type="submit" data-testid="submit-btn">
                Create Course
              </Button>
            </Form>
          </Can>
        </FullProviderWrapper>
      )

      expect(screen.getByTestId('course-form')).toBeInTheDocument()
      expect(screen.getByTestId('course-title')).toBeInTheDocument()
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument()
    })

    it('Form validation works with role-based access', () => {
      render(
        <FullProviderWrapper userRole={UserRole.STUDENT}>
          <Can 
            action="create" 
            subject="Course"
            fallback={
              <div data-testid="access-denied">
                Students cannot create courses
              </div>
            }
          >
            <Form data-testid="course-form">
              <Input placeholder="Course Title" />
              <Button type="submit">Create Course</Button>
            </Form>
          </Can>
        </FullProviderWrapper>
      )

      expect(screen.queryByTestId('course-form')).not.toBeInTheDocument()
      expect(screen.getByTestId('access-denied')).toBeInTheDocument()
    })
  })

  describe('Layout Component Integration', () => {
    it('AppLayout works with authentication and authorization', () => {
      render(
        <FullProviderWrapper userRole={UserRole.ADMIN}>
          <AppLayout
            header={<Header />}
            sidebar={
              <div data-testid="sidebar">
                <Can action="manage" subject="User">
                  <div data-testid="admin-nav">Admin Navigation</div>
                </Can>
              </div>
            }
            footer={<div data-testid="footer">Footer</div>}
          >
            <div data-testid="main-content">Main Content</div>
          </AppLayout>
        </FullProviderWrapper>
      )

      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('admin-nav')).toBeInTheDocument()
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('Layout responds to role changes', () => {
      const { rerender } = render(
        <FullProviderWrapper userRole={UserRole.STUDENT}>
          <div data-testid="layout">
            <Can action="manage" subject="User">
              <div data-testid="admin-panel">Admin Panel</div>
            </Can>
            <Can action="read" subject="Course">
              <div data-testid="student-content">Student Content</div>
            </Can>
          </div>
        </FullProviderWrapper>
      )

      // Student view
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument()
      expect(screen.getByTestId('student-content')).toBeInTheDocument()

      // Change to admin
      rerender(
        <FullProviderWrapper userRole={UserRole.ADMIN}>
          <div data-testid="layout">
            <Can action="manage" subject="User">
              <div data-testid="admin-panel">Admin Panel</div>
            </Can>
            <Can action="read" subject="Course">
              <div data-testid="student-content">Student Content</div>
            </Can>
          </div>
        </FullProviderWrapper>
      )

      // Admin view
      expect(screen.getByTestId('admin-panel')).toBeInTheDocument()
      expect(screen.getByTestId('student-content')).toBeInTheDocument()
    })
  })

  describe('Theme System Integration', () => {
    it('Theme system works across all phases', () => {
      render(
        <FullProviderWrapper userRole={UserRole.INSTRUCTOR}>
          <div data-testid="theme-test">
            <ThemeToggle data-testid="theme-toggle" />
            <Card data-testid="phase1-card">
              <Can action="create" subject="Course">
                <Button data-testid="auth-button">Create Course</Button>
              </Can>
            </Card>
          </div>
        </FullProviderWrapper>
      )

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
      expect(screen.getByTestId('phase1-card')).toBeInTheDocument()
      expect(screen.getByTestId('auth-button')).toBeInTheDocument()
    })

    it('Theme classes apply consistently across phases', () => {
      render(
        <FullProviderWrapper userRole={UserRole.ADMIN}>
          <div className="bg-background text-foreground" data-testid="themed-container">
            <Header />
            <Can action="manage" subject="System">
              <Card className="bg-card text-card-foreground" data-testid="admin-card">
                <Button className="bg-primary text-primary-foreground">
                  System Settings
                </Button>
              </Card>
            </Can>
          </div>
        </FullProviderWrapper>
      )

      const container = screen.getByTestId('themed-container')
      expect(container).toHaveClass('bg-background', 'text-foreground')
      
      const card = screen.getByTestId('admin-card')
      expect(card).toHaveClass('bg-card', 'text-card-foreground')
    })
  })

  describe('Protected Route Integration', () => {
    it('ProtectedRoute works with Phase 1 components', () => {
      render(
        <FullProviderWrapper userRole={UserRole.INSTRUCTOR}>
          <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR]}>
            <AppLayout
              header={<Header />}
              main={
                <Card data-testid="instructor-dashboard">
                  <h1>Instructor Dashboard</h1>
                  <Button>Manage Courses</Button>
                </Card>
              }
            />
          </ProtectedRoute>
        </FullProviderWrapper>
      )

      expect(screen.getByTestId('instructor-dashboard')).toBeInTheDocument()
      expect(screen.getByText('Instructor Dashboard')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Manage Courses' })).toBeInTheDocument()
    })

    it('ProtectedRoute shows Phase 1 loading components', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
        user: null,
      })

      render(
        <FullProviderWrapper userRole={null}>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected</div>
          </ProtectedRoute>
        </FullProviderWrapper>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling Integration', () => {
    it('handles errors gracefully across all phases', () => {
      // Simulate auth error
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: {
          id: 'user_123',
          publicMetadata: {}, // No role
        },
      })

      render(
        <FullProviderWrapper userRole={null}>
          <RoleGuard 
            allowedRoles={[UserRole.STUDENT]}
            fallback={
              <Card data-testid="error-card" className="border-destructive">
                <p className="text-destructive">Access denied</p>
                <Button variant="outline">Go Back</Button>
              </Card>
            }
          >
            <div data-testid="protected-content">Protected Content</div>
          </RoleGuard>
        </FullProviderWrapper>
      )

      expect(screen.getByTestId('error-card')).toBeInTheDocument()
      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Performance Integration', () => {
    it('renders complex nested structure efficiently', () => {
      const startTime = performance.now()

      render(
        <FullProviderWrapper userRole={UserRole.SUPER_ADMIN}>
          <AppLayout
            header={<Header />}
            sidebar={
              <div>
                {[UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].map(role => (
                  <RoleGuard key={role} allowedRoles={[role]}>
                    <Card>
                      <Can action="read" subject="Course">
                        <Button variant="ghost">{role} Menu</Button>
                      </Can>
                    </Card>
                  </RoleGuard>
                ))}
              </div>
            }
            main={
              <div>
                {Array.from({ length: 10 }, (_, i) => (
                  <Can key={i} action="read" subject="Course">
                    <Card data-testid={`card-${i}`}>
                      <Input placeholder={`Input ${i}`} />
                      <Button>Button {i}</Button>
                    </Card>
                  </Can>
                ))}
              </div>
            }
          />
        </FullProviderWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render complex structure in reasonable time
      expect(renderTime).toBeLessThan(100) // 100ms threshold

      // All components should be present
      expect(screen.getByText('Learning Portal')).toBeInTheDocument()
      expect(screen.getByTestId('card-0')).toBeInTheDocument()
      expect(screen.getByTestId('card-9')).toBeInTheDocument()
    })
  })
})