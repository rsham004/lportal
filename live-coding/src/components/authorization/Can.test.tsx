import { render, screen } from '@testing-library/react'
import { Can } from './Can'
import { AuthorizationProvider } from './AuthorizationProvider'
import { UserRole } from '../../lib/authorization/roles'
import { useAuth } from '@clerk/nextjs'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

function renderWithAuth(component: React.ReactElement, role: UserRole | null = null) {
  mockUseAuth.mockReturnValue({
    isSignedIn: !!role,
    isLoaded: true,
    user: role ? {
      id: 'user_123',
      publicMetadata: { role },
    } : null,
  } as any)

  return render(
    <AuthorizationProvider>
      {component}
    </AuthorizationProvider>
  )
}

describe('Can Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Permission Checking', () => {
    it('renders children when user has permission', () => {
      renderWithAuth(
        <Can action="read" subject="Course">
          <div data-testid="content">Course content</div>
        </Can>,
        UserRole.STUDENT
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('does not render children when user lacks permission', () => {
      renderWithAuth(
        <Can action="create" subject="Course">
          <div data-testid="content">Create course</div>
        </Can>,
        UserRole.STUDENT
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('renders fallback when user lacks permission', () => {
      renderWithAuth(
        <Can 
          action="create" 
          subject="Course"
          fallback={<div data-testid="fallback">No permission</div>}
        >
          <div data-testid="content">Create course</div>
        </Can>,
        UserRole.STUDENT
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
      expect(screen.getByTestId('fallback')).toBeInTheDocument()
    })
  })

  describe('Role-based Rendering', () => {
    it('shows student-appropriate content', () => {
      renderWithAuth(
        <div>
          <Can action="read" subject="Course">
            <div data-testid="read-courses">View Courses</div>
          </Can>
          <Can action="create" subject="Course">
            <div data-testid="create-courses">Create Courses</div>
          </Can>
        </div>,
        UserRole.STUDENT
      )

      expect(screen.getByTestId('read-courses')).toBeInTheDocument()
      expect(screen.queryByTestId('create-courses')).not.toBeInTheDocument()
    })

    it('shows instructor-appropriate content', () => {
      renderWithAuth(
        <div>
          <Can action="read" subject="Course">
            <div data-testid="read-courses">View Courses</div>
          </Can>
          <Can action="create" subject="Course">
            <div data-testid="create-courses">Create Courses</div>
          </Can>
          <Can action="manage" subject="User">
            <div data-testid="manage-users">Manage Users</div>
          </Can>
        </div>,
        UserRole.INSTRUCTOR
      )

      expect(screen.getByTestId('read-courses')).toBeInTheDocument()
      expect(screen.getByTestId('create-courses')).toBeInTheDocument()
      expect(screen.queryByTestId('manage-users')).not.toBeInTheDocument()
    })

    it('shows admin-appropriate content', () => {
      renderWithAuth(
        <div>
          <Can action="read" subject="Course">
            <div data-testid="read-courses">View Courses</div>
          </Can>
          <Can action="create" subject="Course">
            <div data-testid="create-courses">Create Courses</div>
          </Can>
          <Can action="manage" subject="User">
            <div data-testid="manage-users">Manage Users</div>
          </Can>
          <Can action="manage" subject="System">
            <div data-testid="manage-system">Manage System</div>
          </Can>
        </div>,
        UserRole.ADMIN
      )

      expect(screen.getByTestId('read-courses')).toBeInTheDocument()
      expect(screen.getByTestId('create-courses')).toBeInTheDocument()
      expect(screen.getByTestId('manage-users')).toBeInTheDocument()
      expect(screen.queryByTestId('manage-system')).not.toBeInTheDocument()
    })

    it('shows super admin content', () => {
      renderWithAuth(
        <div>
          <Can action="manage" subject="System">
            <div data-testid="manage-system">Manage System</div>
          </Can>
        </div>,
        UserRole.SUPER_ADMIN
      )

      expect(screen.getByTestId('manage-system')).toBeInTheDocument()
    })
  })

  describe('Resource-specific Permissions', () => {
    it('allows instructors to edit their own courses', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: {
          id: 'instructor_123',
          publicMetadata: { role: UserRole.INSTRUCTOR },
        },
      } as any)

      const ownCourse = { id: 'course_1', instructorId: 'instructor_123' }
      const otherCourse = { id: 'course_2', instructorId: 'instructor_456' }

      render(
        <AuthorizationProvider>
          <div>
            <Can action="update" subject="Course" resource={ownCourse}>
              <div data-testid="edit-own-course">Edit Own Course</div>
            </Can>
            <Can action="update" subject="Course" resource={otherCourse}>
              <div data-testid="edit-other-course">Edit Other Course</div>
            </Can>
          </div>
        </AuthorizationProvider>
      )

      expect(screen.getByTestId('edit-own-course')).toBeInTheDocument()
      expect(screen.queryByTestId('edit-other-course')).not.toBeInTheDocument()
    })

    it('allows users to edit their own profile', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: {
          id: 'student_123',
          publicMetadata: { role: UserRole.STUDENT },
        },
      } as any)

      const ownProfile = { id: 'student_123' }
      const otherProfile = { id: 'student_456' }

      render(
        <AuthorizationProvider>
          <div>
            <Can action="update" subject="User" resource={ownProfile}>
              <div data-testid="edit-own-profile">Edit Own Profile</div>
            </Can>
            <Can action="update" subject="User" resource={otherProfile}>
              <div data-testid="edit-other-profile">Edit Other Profile</div>
            </Can>
          </div>
        </AuthorizationProvider>
      )

      expect(screen.getByTestId('edit-own-profile')).toBeInTheDocument()
      expect(screen.queryByTestId('edit-other-profile')).not.toBeInTheDocument()
    })
  })

  describe('Unauthenticated Users', () => {
    it('does not render protected content for unauthenticated users', () => {
      renderWithAuth(
        <Can action="read" subject="Course">
          <div data-testid="content">Protected content</div>
        </Can>,
        null
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('renders fallback for unauthenticated users', () => {
      renderWithAuth(
        <Can 
          action="read" 
          subject="Course"
          fallback={<div data-testid="login-prompt">Please log in</div>}
        >
          <div data-testid="content">Protected content</div>
        </Can>,
        null
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
      expect(screen.getByTestId('login-prompt')).toBeInTheDocument()
    })
  })

  describe('Multiple Actions', () => {
    it('renders when user has any of the specified actions', () => {
      renderWithAuth(
        <Can action={['create', 'update']} subject="Course">
          <div data-testid="content">Course management</div>
        </Can>,
        UserRole.INSTRUCTOR
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('does not render when user has none of the specified actions', () => {
      renderWithAuth(
        <Can action={['create', 'update']} subject="Course">
          <div data-testid="content">Course management</div>
        </Can>,
        UserRole.STUDENT
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles invalid action gracefully', () => {
      renderWithAuth(
        <Can action="invalid_action" subject="Course">
          <div data-testid="content">Content</div>
        </Can>,
        UserRole.STUDENT
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('handles invalid subject gracefully', () => {
      renderWithAuth(
        <Can action="read" subject="InvalidSubject">
          <div data-testid="content">Content</div>
        </Can>,
        UserRole.STUDENT
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })
})