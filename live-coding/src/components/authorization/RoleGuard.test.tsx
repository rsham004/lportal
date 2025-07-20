import { render, screen } from '@testing-library/react'
import { RoleGuard } from './RoleGuard'
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

describe('RoleGuard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Single Role Requirements', () => {
    it('renders children when user has required role', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[UserRole.INSTRUCTOR]}>
          <div data-testid="content">Instructor content</div>
        </RoleGuard>,
        UserRole.INSTRUCTOR
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('does not render children when user lacks required role', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[UserRole.INSTRUCTOR]}>
          <div data-testid="content">Instructor content</div>
        </RoleGuard>,
        UserRole.STUDENT
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('renders fallback when user lacks required role', () => {
      renderWithAuth(
        <RoleGuard 
          allowedRoles={[UserRole.INSTRUCTOR]}
          fallback={<div data-testid="fallback">Access denied</div>}
        >
          <div data-testid="content">Instructor content</div>
        </RoleGuard>,
        UserRole.STUDENT
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
      expect(screen.getByTestId('fallback')).toBeInTheDocument()
    })
  })

  describe('Multiple Role Requirements', () => {
    it('renders children when user has one of the allowed roles', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
          <div data-testid="content">Staff content</div>
        </RoleGuard>,
        UserRole.INSTRUCTOR
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('renders children when user has another allowed role', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
          <div data-testid="content">Staff content</div>
        </RoleGuard>,
        UserRole.ADMIN
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('does not render when user has none of the allowed roles', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
          <div data-testid="content">Staff content</div>
        </RoleGuard>,
        UserRole.STUDENT
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })

  describe('Role Hierarchy', () => {
    it('allows higher roles when requireExact is false', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[UserRole.ADMIN]} requireExact={false}>
          <div data-testid="content">Admin content</div>
        </RoleGuard>,
        UserRole.SUPER_ADMIN
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('denies higher roles when requireExact is true', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[UserRole.ADMIN]} requireExact={true}>
          <div data-testid="content">Admin only content</div>
        </RoleGuard>,
        UserRole.SUPER_ADMIN
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('allows exact role when requireExact is true', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[UserRole.ADMIN]} requireExact={true}>
          <div data-testid="content">Admin only content</div>
        </RoleGuard>,
        UserRole.ADMIN
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated Users', () => {
    it('does not render content for unauthenticated users', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[UserRole.STUDENT]}>
          <div data-testid="content">Student content</div>
        </RoleGuard>,
        null
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('renders fallback for unauthenticated users', () => {
      renderWithAuth(
        <RoleGuard 
          allowedRoles={[UserRole.STUDENT]}
          fallback={<div data-testid="login">Please log in</div>}
        >
          <div data-testid="content">Student content</div>
        </RoleGuard>,
        null
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
      expect(screen.getByTestId('login')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('handles loading state gracefully', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
        user: null,
      } as any)

      render(
        <AuthorizationProvider>
          <RoleGuard allowedRoles={[UserRole.STUDENT]}>
            <div data-testid="content">Student content</div>
          </RoleGuard>
        </AuthorizationProvider>
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('renders loading component during auth loading', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
        user: null,
      } as any)

      render(
        <AuthorizationProvider>
          <RoleGuard 
            allowedRoles={[UserRole.STUDENT]}
            loading={<div data-testid="loading">Loading...</div>}
          >
            <div data-testid="content">Student content</div>
          </RoleGuard>
        </AuthorizationProvider>
      )

      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
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
          <RoleGuard allowedRoles={[UserRole.STUDENT]}>
            <div data-testid="content">Student content</div>
          </RoleGuard>
        </AuthorizationProvider>
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('handles invalid role gracefully', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: {
          id: 'user_123',
          publicMetadata: { role: 'invalid_role' },
        },
      } as any)

      render(
        <AuthorizationProvider>
          <RoleGuard allowedRoles={[UserRole.STUDENT]}>
            <div data-testid="content">Student content</div>
          </RoleGuard>
        </AuthorizationProvider>
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })
})