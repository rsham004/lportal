/**
 * Form Component Integration Test
 * 
 * Tests that Phase 1 Form components work correctly with 
 * Phase 2.1 authentication and Phase 2.2 authorization.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Form } from './Form'
import { Input } from './Input'
import { Button } from './Button'
import { AuthProvider } from '../auth/AuthProvider'
import { AuthorizationProvider } from '../authorization/AuthorizationProvider'
import { Can } from '../authorization/Can'
import { RoleGuard } from '../authorization/RoleGuard'
import { UserRole } from '../../lib/authorization/roles'

// Mock Clerk
const mockUseAuth = jest.fn()
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockUseAuth(),
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

describe('Form Integration with Authentication and Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Form with Authorization Context', () => {
    it('renders form within authorization-protected content', () => {
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <Form data-testid="course-form">
              <Input placeholder="Course Title" data-testid="course-title" />
              <Button type="submit">Create Course</Button>
            </Form>
          </Can>
        </TestWrapper>
      )
      
      expect(screen.getByTestId('course-form')).toBeInTheDocument()
      expect(screen.getByTestId('course-title')).toBeInTheDocument()
    })

    it('does not render form when authorization fails', () => {
      render(
        <TestWrapper userRole={UserRole.STUDENT}>
          <Can action="create" subject="Course">
            <Form data-testid="course-form">
              <Input placeholder="Course Title" />
              <Button type="submit">Create Course</Button>
            </Form>
          </Can>
        </TestWrapper>
      )
      
      expect(screen.queryByTestId('course-form')).not.toBeInTheDocument()
    })

    it('shows different forms based on role permissions', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <div>
            <Can action="create" subject="Course">
              <Form data-testid="course-form">
                <Input placeholder="Course Title" />
                <Button type="submit">Create Course</Button>
              </Form>
            </Can>
            <Can action="manage" subject="User">
              <Form data-testid="user-form">
                <Input placeholder="User Email" />
                <Button type="submit">Add User</Button>
              </Form>
            </Can>
            <Can action="manage" subject="System">
              <Form data-testid="system-form">
                <Input placeholder="System Setting" />
                <Button type="submit">Update System</Button>
              </Form>
            </Can>
          </div>
        </TestWrapper>
      )
      
      // Admin should see course and user forms but not system
      expect(screen.getByTestId('course-form')).toBeInTheDocument()
      expect(screen.getByTestId('user-form')).toBeInTheDocument()
      expect(screen.queryByTestId('system-form')).not.toBeInTheDocument()
    })
  })

  describe('Form Validation with Authorization', () => {
    it('form validation works within authorization context', async () => {
      const handleSubmit = jest.fn()
      
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <Form onSubmit={handleSubmit} data-testid="validated-form">
              <Input 
                required 
                placeholder="Course Title" 
                data-testid="required-input"
              />
              <Button type="submit" data-testid="submit-btn">
                Create Course
              </Button>
            </Form>
          </Can>
        </TestWrapper>
      )

      const submitButton = screen.getByTestId('submit-btn')
      fireEvent.click(submitButton)

      // Form should not submit without required field
      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('form submission works when validation passes', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault())
      
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <Form onSubmit={handleSubmit} data-testid="validated-form">
              <Input 
                required 
                placeholder="Course Title" 
                data-testid="course-input"
              />
              <Button type="submit" data-testid="submit-btn">
                Create Course
              </Button>
            </Form>
          </Can>
        </TestWrapper>
      )

      const input = screen.getByTestId('course-input')
      const submitButton = screen.getByTestId('submit-btn')

      fireEvent.change(input, { target: { value: 'React Fundamentals' } })
      fireEvent.click(submitButton)

      expect(handleSubmit).toHaveBeenCalled()
    })
  })

  describe('Form with Role-based Fields', () => {
    it('shows different form fields based on user role', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <Form data-testid="role-based-form">
            <Input placeholder="Course Title" data-testid="title-input" />
            
            <Can action="manage" subject="User">
              <Input placeholder="Instructor Assignment" data-testid="instructor-input" />
            </Can>
            
            <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
              <Input placeholder="Admin Notes" data-testid="admin-input" />
            </RoleGuard>
            
            <Can action="manage" subject="System">
              <Input placeholder="System Configuration" data-testid="system-input" />
            </Can>
            
            <Button type="submit">Save</Button>
          </Form>
        </TestWrapper>
      )

      expect(screen.getByTestId('title-input')).toBeInTheDocument()
      expect(screen.getByTestId('instructor-input')).toBeInTheDocument()
      expect(screen.getByTestId('admin-input')).toBeInTheDocument()
      expect(screen.queryByTestId('system-input')).not.toBeInTheDocument()
    })

    it('adapts form fields when role changes', () => {
      const { rerender } = render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Form data-testid="adaptive-form">
            <Input placeholder="Course Title" data-testid="title-input" />
            
            <Can action="manage" subject="User">
              <Input placeholder="Student Management" data-testid="student-input" />
            </Can>
            
            <Can action="manage" subject="System">
              <Input placeholder="System Settings" data-testid="system-input" />
            </Can>
          </Form>
        </TestWrapper>
      )

      // Instructor view
      expect(screen.getByTestId('title-input')).toBeInTheDocument()
      expect(screen.queryByTestId('student-input')).not.toBeInTheDocument()
      expect(screen.queryByTestId('system-input')).not.toBeInTheDocument()

      // Change to admin
      rerender(
        <TestWrapper userRole={UserRole.ADMIN}>
          <Form data-testid="adaptive-form">
            <Input placeholder="Course Title" data-testid="title-input" />
            
            <Can action="manage" subject="User">
              <Input placeholder="Student Management" data-testid="student-input" />
            </Can>
            
            <Can action="manage" subject="System">
              <Input placeholder="System Settings" data-testid="system-input" />
            </Can>
          </Form>
        </TestWrapper>
      )

      // Admin view
      expect(screen.getByTestId('title-input')).toBeInTheDocument()
      expect(screen.getByTestId('student-input')).toBeInTheDocument()
      expect(screen.queryByTestId('system-input')).not.toBeInTheDocument()
    })
  })

  describe('Form with Resource-specific Permissions', () => {
    it('allows editing own resources', () => {
      const ownCourse = { id: 'course_1', instructorId: 'user_123' }
      
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="update" subject="Course" resource={ownCourse}>
            <Form data-testid="edit-own-course">
              <Input defaultValue="My Course" data-testid="course-title" />
              <Button type="submit">Update Course</Button>
            </Form>
          </Can>
        </TestWrapper>
      )

      expect(screen.getByTestId('edit-own-course')).toBeInTheDocument()
      expect(screen.getByTestId('course-title')).toHaveValue('My Course')
    })

    it('prevents editing other resources', () => {
      const otherCourse = { id: 'course_2', instructorId: 'user_456' }
      
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="update" subject="Course" resource={otherCourse}>
            <Form data-testid="edit-other-course">
              <Input defaultValue="Other Course" />
              <Button type="submit">Update Course</Button>
            </Form>
          </Can>
        </TestWrapper>
      )

      expect(screen.queryByTestId('edit-other-course')).not.toBeInTheDocument()
    })
  })

  describe('Form Error Handling with Authorization', () => {
    it('shows authorization error when access is denied', () => {
      render(
        <TestWrapper userRole={UserRole.STUDENT}>
          <Can 
            action="create" 
            subject="Course"
            fallback={
              <div data-testid="access-denied" className="p-4 bg-red-50 rounded">
                <p>You don't have permission to create courses.</p>
                <p>Contact an administrator to request instructor access.</p>
              </div>
            }
          >
            <Form data-testid="course-form">
              <Input placeholder="Course Title" />
              <Button type="submit">Create Course</Button>
            </Form>
          </Can>
        </TestWrapper>
      )

      expect(screen.queryByTestId('course-form')).not.toBeInTheDocument()
      expect(screen.getByTestId('access-denied')).toBeInTheDocument()
      expect(screen.getByText("You don't have permission to create courses.")).toBeInTheDocument()
    })

    it('handles form errors gracefully within authorization context', async () => {
      const handleSubmit = jest.fn((e) => {
        e.preventDefault()
        throw new Error('Validation failed')
      })
      
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <Form onSubmit={handleSubmit} data-testid="error-form">
              <Input placeholder="Course Title" data-testid="title-input" />
              <Button type="submit" data-testid="submit-btn">
                Create Course
              </Button>
            </Form>
          </Can>
        </TestWrapper>
      )

      const input = screen.getByTestId('title-input')
      const submitButton = screen.getByTestId('submit-btn')

      fireEvent.change(input, { target: { value: 'Test Course' } })
      
      // Should not crash when form submission throws error
      expect(() => {
        fireEvent.click(submitButton)
      }).not.toThrow()
    })
  })

  describe('Form Performance with Authorization', () => {
    it('renders complex forms efficiently within authorization context', () => {
      const startTime = performance.now()
      
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <Form data-testid="complex-form">
            {Array.from({ length: 20 }, (_, i) => (
              <Can key={i} action="read" subject="Course">
                <Input 
                  placeholder={`Field ${i}`} 
                  data-testid={`input-${i}`}
                />
              </Can>
            ))}
            <Button type="submit">Submit</Button>
          </Form>
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render efficiently
      expect(renderTime).toBeLessThan(100) // 100ms threshold
      
      // All inputs should be present
      expect(screen.getByTestId('input-0')).toBeInTheDocument()
      expect(screen.getByTestId('input-19')).toBeInTheDocument()
    })
  })

  describe('Form Accessibility with Authorization', () => {
    it('maintains form accessibility within authorization context', () => {
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <Can action="create" subject="Course">
            <Form data-testid="accessible-form">
              <label htmlFor="course-title">Course Title</label>
              <Input 
                id="course-title"
                required
                aria-describedby="title-help"
                data-testid="title-input"
              />
              <div id="title-help" className="text-sm text-muted-foreground">
                Enter a descriptive title for your course
              </div>
              <Button type="submit">Create Course</Button>
            </Form>
          </Can>
        </TestWrapper>
      )

      const input = screen.getByTestId('title-input')
      expect(input).toHaveAttribute('id', 'course-title')
      expect(input).toHaveAttribute('aria-describedby', 'title-help')
      expect(input).toBeRequired()
      
      const label = screen.getByLabelText('Course Title')
      expect(label).toBeInTheDocument()
    })
  })
})