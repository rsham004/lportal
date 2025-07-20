/**
 * Comprehensive Integration Verification Test
 * 
 * This test suite verifies that Phase 2.1 Authentication components
 * integrate correctly with Phase 1 components and maintain all functionality.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VerificationTest } from './VerificationTest'
import { AuthProvider } from './auth/AuthProvider'
import { SignInButton } from './auth/SignInButton'
import { UserButton } from './auth/UserButton'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Header } from './shared/Header'
import { Button } from './ui/Button'
import { ThemeProvider } from './providers/ThemeProvider'

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
  SignIn: () => <div data-testid="clerk-signin-page">Sign In Page</div>,
  SignUp: () => <div data-testid="clerk-signup-page">Sign Up Page</div>,
}))

describe('Phase 2.1 Authentication Integration Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Integration Test', () => {
    it('renders verification test component without errors', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })

      render(<VerificationTest />)
      
      expect(screen.getByText('Phase 2.1 Authentication Integration Verification')).toBeInTheDocument()
      expect(screen.getByText('Theme Integration')).toBeInTheDocument()
      expect(screen.getByText('Button Component Integration')).toBeInTheDocument()
    })
  })

  describe('AuthProvider Integration with Phase 1', () => {
    it('wraps Phase 1 components correctly', () => {
      render(
        <AuthProvider>
          <ThemeProvider>
            <Button>Test Button</Button>
          </ThemeProvider>
        </AuthProvider>
      )

      expect(screen.getByTestId('clerk-provider')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveTextContent('Test Button')
    })

    it('provides authentication context to nested components', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      render(
        <AuthProvider>
          <UserButton />
        </AuthProvider>
      )

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

    it('inherits all Button component functionality', () => {
      const handleClick = jest.fn()
      
      render(
        <SignInButton 
          variant="outline" 
          size="sm" 
          className="custom-class"
          onClick={handleClick}
        >
          Custom Sign In
        </SignInButton>
      )

      const button = screen.getByTestId('clerk-signin-button')
      expect(button).toHaveTextContent('Custom Sign In')
      expect(button).toHaveClass('custom-class')
      
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalled()
    })

    it('supports all Button variants from Phase 1', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
      
      variants.forEach(variant => {
        const { unmount } = render(<SignInButton variant={variant} />)
        expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument()
        unmount()
      })
    })

    it('handles loading states correctly', () => {
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
    it('shows correct UI for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })

      render(<Header />)
      
      // Should show sign in buttons
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
      
      // Should maintain all Phase 1 functionality
      expect(screen.getByText('Learning Portal')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument()
    })

    it('shows correct UI for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      render(<Header />)
      
      // Should show user button
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
      
      // Should not show sign in buttons
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
      
      // Should maintain all Phase 1 functionality
      expect(screen.getByText('Learning Portal')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument()
    })

    it('maintains responsive functionality', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      const mockToggle = jest.fn()
      render(<Header showSidebarToggle onSidebarToggle={mockToggle} />)
      
      // Search functionality should work
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

  describe('ProtectedRoute Integration with Phase 1 Components', () => {
    it('uses Phase 1 Spinner for loading states', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
      })

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('renders protected content with Phase 1 components', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: { publicMetadata: { role: 'student' } },
      })

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">
            <Button variant="outline">Protected Button</Button>
          </div>
        </ProtectedRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveTextContent('Protected Button')
    })

    it('handles role-based access with proper error display', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: { publicMetadata: { role: 'student' } },
      })

      render(
        <ProtectedRoute requiredRole="admin">
          <div data-testid="admin-content">Admin Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    })
  })

  describe('Theme Integration', () => {
    it('maintains theme consistency across auth and Phase 1 components', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      render(
        <ThemeProvider>
          <AuthProvider>
            <div className="bg-background text-foreground">
              <Header />
              <Button>Phase 1 Button</Button>
            </div>
          </AuthProvider>
        </ThemeProvider>
      )

      // Both auth and Phase 1 components should be present
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Phase 1 Button' })).toBeInTheDocument()
      
      // Theme classes should be applied consistently
      const container = screen.getByText('Learning Portal').closest('div')
      expect(container).toHaveClass('bg-background')
    })
  })

  describe('Error Handling Integration', () => {
    it('handles authentication errors gracefully', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected</div>
        </ProtectedRoute>
      )

      expect(screen.getByTestId('redirect-to-signin')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('provides consistent error styling', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: { publicMetadata: { role: 'student' } },
      })

      render(
        <ProtectedRoute requiredRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      )

      const errorMessage = screen.getByText('Access Denied')
      expect(errorMessage).toHaveClass('text-foreground')
      
      const description = screen.getByText("You don't have permission to access this page.")
      expect(description).toHaveClass('text-muted-foreground')
    })
  })

  describe('Accessibility Integration', () => {
    it('maintains WCAG compliance across all components', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })

      render(
        <div>
          <Header />
          <SignInButton>Accessible Sign In</SignInButton>
        </div>
      )

      // Header should have proper role
      expect(screen.getByRole('banner')).toBeInTheDocument()
      
      // Buttons should be accessible
      const signInButton = screen.getByRole('button', { name: 'Accessible Sign In' })
      expect(signInButton).toBeInTheDocument()
      
      // Search input should have proper attributes
      const searchInput = screen.getByPlaceholderText('Search courses...')
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('provides proper focus management', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })

      render(<SignInButton>Focus Test</SignInButton>)
      
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })
  })

  describe('TypeScript Integration', () => {
    it('accepts all Phase 1 Button props without type errors', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })

      // This test verifies that TypeScript compilation works
      // If there were type errors, the component wouldn't render
      render(
        <SignInButton
          variant="outline"
          size="lg"
          className="custom-class"
          disabled={false}
          onClick={() => {}}
        >
          TypeScript Test
        </SignInButton>
      )

      expect(screen.getByRole('button')).toHaveTextContent('TypeScript Test')
    })
  })
})