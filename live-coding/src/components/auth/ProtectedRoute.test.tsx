import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from './ProtectedRoute'

// Mock Clerk
const mockUseAuth = jest.fn()
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth(),
  RedirectToSignIn: () => <div data-testid="redirect-to-signin">Redirecting to sign in...</div>,
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    })

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('redirect-to-signin')).not.toBeInTheDocument()
  })

  it('redirects to sign in when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('redirect-to-signin')).toBeInTheDocument()
  })

  it('shows loading state when auth is not loaded', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
    })

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('redirect-to-signin')).not.toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('supports custom loading component', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
    })

    render(
      <ProtectedRoute loadingComponent={<div data-testid="custom-loading">Custom Loading</div>}>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('supports role-based access control', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        publicMetadata: {
          role: 'student',
        },
      },
    })

    render(
      <ProtectedRoute requiredRole="admin">
        <div data-testid="protected-content">Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('allows access when user has required role', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        publicMetadata: {
          role: 'admin',
        },
      },
    })

    render(
      <ProtectedRoute requiredRole="admin">
        <div data-testid="protected-content">Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })
})