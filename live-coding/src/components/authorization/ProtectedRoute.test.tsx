import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthorizationProvider } from './AuthorizationProvider'
import { UserRole } from '../../lib/authorization/roles'
import { useAuth } from '@clerk/nextjs'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  RedirectToSignIn: () => <div data-testid="redirect-to-signin">Redirecting to sign in...</div>,
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

function renderWithAuth(component: React.ReactElement, role: UserRole | null = null, userId = 'user_123') {
  mockUseAuth.mockReturnValue({
    isSignedIn: !!role,
    isLoaded: true,
    user: role ? {
      id: userId,
      publicMetadata: { role },
    } : null,
  } as any)

  return render(
    <AuthorizationProvider>
      {component}
    </AuthorizationProvider>
  )
}

describe('Enhanced ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Authentication', () => {
    it('renders children when user is authenticated', () => {
      renderWithAuth(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
        UserRole.STUDENT
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('redirects when user is not authenticated', () => {
      renderWithAuth(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
        null
      )

      expect(screen.getByTestId('redirect-to-signin')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Role-based Access Control', () => {
    it('allows access when user has required role', () => {
      renderWithAuth(
        <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR]}>
          <div data-testid="instructor-content">Instructor Content</div>
        </ProtectedRoute>,
        UserRole.INSTRUCTOR
      )

      expect(screen.getByTestId('instructor-content')).toBeInTheDocument()
    })

    it('denies access when user lacks required role', () => {
      renderWithAuth(
        <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR]}>
          <div data-testid="instructor-content">Instructor Content</div>
        </ProtectedRoute>,
        UserRole.STUDENT
      )

      expect(screen.queryByTestId('instructor-content')).not.toBeInTheDocument()
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })

    it('allows access for multiple allowed roles', () => {
      renderWithAuth(
        <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
          <div data-testid="staff-content">Staff Content</div>
        </ProtectedRoute>,
        UserRole.ADMIN
      )

      expect(screen.getByTestId('staff-content')).toBeInTheDocument()
    })

    it('allows higher roles by default', () => {
      renderWithAuth(
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
          <div data-testid="admin-content">Admin Content</div>
        </ProtectedRoute>,
        UserRole.SUPER_ADMIN
      )

      expect(screen.getByTestId('admin-content')).toBeInTheDocument()
    })

    it('denies higher roles when requireExact is true', () => {
      renderWithAuth(
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]} requireExact={true}>
          <div data-testid="admin-only-content">Admin Only Content</div>
        </ProtectedRoute>,
        UserRole.SUPER_ADMIN
      )

      expect(screen.queryByTestId('admin-only-content')).not.toBeInTheDocument()
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })
  })

  describe('Permission-based Access Control', () => {
    it('allows access when user has required permission', () => {
      renderWithAuth(
        <ProtectedRoute requiredPermissions={['create_course']}>
          <div data-testid="create-course-content">Create Course</div>
        </ProtectedRoute>,
        UserRole.INSTRUCTOR
      )

      expect(screen.getByTestId('create-course-content')).toBeInTheDocument()
    })

    it('denies access when user lacks required permission', () => {
      renderWithAuth(
        <ProtectedRoute requiredPermissions={['create_course']}>
          <div data-testid="create-course-content">Create Course</div>
        </ProtectedRoute>,
        UserRole.STUDENT
      )

      expect(screen.queryByTestId('create-course-content')).not.toBeInTheDocument()
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })

    it('allows access when user has any of multiple required permissions', () => {
      renderWithAuth(
        <ProtectedRoute requiredPermissions={['create_course', 'manage_users']}>
          <div data-testid="staff-content">Staff Content</div>
        </ProtectedRoute>,
        UserRole.INSTRUCTOR
      )

      expect(screen.getByTestId('staff-content')).toBeInTheDocument()
    })
  })

  describe('Resource-specific Access Control', () => {
    it('allows instructors to access their own courses', () => {
      const course = { id: 'course_1', instructorId: 'instructor_123' }
      
      renderWithAuth(
        <ProtectedRoute 
          requiredPermissions={['update']}
          resource={course}
          resourceType="Course"
        >
          <div data-testid="edit-course">Edit Course</div>
        </ProtectedRoute>,
        UserRole.INSTRUCTOR,
        'instructor_123'
      )

      expect(screen.getByTestId('edit-course')).toBeInTheDocument()
    })

    it('denies instructors access to other courses', () => {
      const course = { id: 'course_1', instructorId: 'instructor_456' }
      
      renderWithAuth(
        <ProtectedRoute 
          requiredPermissions={['update']}
          resource={course}
          resourceType="Course"
        >
          <div data-testid="edit-course">Edit Course</div>
        </ProtectedRoute>,
        UserRole.INSTRUCTOR,
        'instructor_123'
      )

      expect(screen.queryByTestId('edit-course')).not.toBeInTheDocument()
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })

    it('allows users to edit their own profile', () => {
      const profile = { id: 'student_123' }
      
      renderWithAuth(
        <ProtectedRoute 
          requiredPermissions={['update']}
          resource={profile}
          resourceType="User"
        >
          <div data-testid="edit-profile">Edit Profile</div>
        </ProtectedRoute>,
        UserRole.STUDENT,
        'student_123'
      )

      expect(screen.getByTestId('edit-profile')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
        user: null,
      } as any)

      render(
        <AuthorizationProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthorizationProvider>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('shows custom loading component', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
        user: null,
      } as any)

      render(
        <AuthorizationProvider>
          <ProtectedRoute loadingComponent={<div data-testid="custom-loading">Custom Loading</div>}>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthorizationProvider>
      )

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Custom Fallback Components', () => {
    it('shows custom access denied component', () => {
      renderWithAuth(
        <ProtectedRoute 
          allowedRoles={[UserRole.ADMIN]}
          fallbackComponent={<div data-testid="custom-denied">Custom Access Denied</div>}
        >
          <div data-testid="admin-content">Admin Content</div>
        </ProtectedRoute>,
        UserRole.STUDENT
      )

      expect(screen.getByTestId('custom-denied')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles user without role gracefully', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: {
          id: 'user_123',
          publicMetadata: {},
        },
      } as any)

      render(
        <AuthorizationProvider>
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <div data-testid="student-content">Student Content</div>
          </ProtectedRoute>
        </AuthorizationProvider>
      )

      expect(screen.queryByTestId('student-content')).not.toBeInTheDocument()
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })
  })
})