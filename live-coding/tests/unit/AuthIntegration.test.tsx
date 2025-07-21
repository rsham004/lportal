import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider } from './AuthProvider'
import { SignInButton } from './SignInButton'
import { UserButton } from './UserButton'
import { ProtectedRoute } from './ProtectedRoute'
import { Header } from '../shared/Header'
import { Button } from '../ui/Button'
import { ThemeProvider } from '../providers/ThemeProvider'

// Mock Clerk
const mockUseAuth = jest.fn()
const mockUseUser = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  ),
  useAuth: () => mockUseAuth(),
  useUser: () => mockUseUser(),
  SignInButton: ({ children, ...props }: any) => (
    <button data-testid="clerk-signin-button" {...props}>
      {children || 'Sign In'}
    </button>
  ),
  UserButton: (props: any) => (
    <div data-testid="clerk-user-button" {...props}>
      User Menu
    </div>
  ),
  RedirectToSignIn: () => <div data-testid="redirect-to-signin">Redirecting to sign in...</div>,
}))

describe('Authentication Integration with Phase 1 Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('AuthProvider Integration', () => {
    it('integrates with ThemeProvider correctly', () => {
      render(
        <AuthProvider>
          <ThemeProvider>
            <div data-testid="app-content">App Content</div>
          </ThemeProvider>
        </AuthProvider>
      )

      expect(screen.getByTestId('clerk-provider')).toBeInTheDocument()
      expect(screen.getByTestId('app-content')).toBeInTheDocument()
    })

    it('provides authentication context to child components', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      render(
        <AuthProvider>
          <SignInButton />
          <UserButton />
        </AuthProvider>
      )

      // SignInButton should not render when user is signed in
      expect(screen.queryByTestId('clerk-signin-button')).not.toBeInTheDocument()
      // UserButton should render when user is signed in
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
    })
  })

  describe('SignInButton Integration with Phase 1 Button', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })
    })

    it('uses Phase 1 Button component styling', () => {
      render(<SignInButton variant="outline" size="sm" />)
      
      const button = screen.getByTestId('clerk-signin-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('cursor-pointer')
    })

    it('supports all Button variants from Phase 1', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
      
      variants.forEach(variant => {
        const { unmount } = render(<SignInButton variant={variant} />)
        expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument()
        unmount()
      })
    })

    it('handles loading state with Phase 1 Button', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
      })

      render(<SignInButton />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Loading...')
    })
  })

  describe('Header Integration with Authentication', () => {
    it('shows authentication section when user is not signed in', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })

      render(<Header />)
      
      // Should show sign in buttons
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
      
      // Should not show notifications for unauthenticated users
      expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument()
    })

    it('shows user button when user is signed in', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      render(<Header />)
      
      // Should show user button
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
      
      // Should show notifications for authenticated users
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('maintains Phase 1 Header styling and functionality', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      render(<Header showSidebarToggle onSidebarToggle={jest.fn()} />)
      
      // Should maintain logo and branding
      expect(screen.getByText('Learning Portal')).toBeInTheDocument()
      
      // Should maintain search functionality
      expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument()
      
      // Should maintain theme toggle
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('ProtectedRoute Integration', () => {
    it('integrates with Phase 1 Loading components', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
      })

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      )

      // Should show loading state using Phase 1 Spinner
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('works with custom loading component from Phase 1', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
      })

      const CustomLoading = () => (
        <div data-testid="custom-loading">
          <Button disabled>Custom Loading...</Button>
        </div>
      )

      render(
        <ProtectedRoute loadingComponent={<CustomLoading />}>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('renders protected content with Phase 1 components', () => {
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
        <ProtectedRoute>
          <div data-testid="protected-content">
            <Button>Phase 1 Button in Protected Route</Button>
          </div>
        </ProtectedRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveTextContent('Phase 1 Button in Protected Route')
    })
  })

  describe('Theme Integration', () => {
    it('authentication components work with dark/light theme', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })

      render(
        <ThemeProvider>
          <AuthProvider>
            <SignInButton />
          </AuthProvider>
        </ThemeProvider>
      )

      const button = screen.getByTestId('clerk-signin-button')
      expect(button).toBeInTheDocument()
      
      // Should have theme-aware classes
      expect(button).toHaveClass('cursor-pointer')
    })

    it('maintains theme consistency across auth and Phase 1 components', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      render(
        <ThemeProvider>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </ThemeProvider>
      )

      // Both auth and Phase 1 components should be present and styled consistently
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
      expect(screen.getByText('Learning Portal')).toBeInTheDocument()
    })
  })

  describe('Error Handling Integration', () => {
    it('handles authentication errors gracefully with Phase 1 error components', () => {
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
          <div data-testid="admin-content">Admin Content</div>
        </ProtectedRoute>
      )

      // Should show access denied message
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument()
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    })
  })
})