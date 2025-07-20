import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from './Header'

// Mock Clerk
const mockUseAuth = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth(),
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
}))

describe('Header Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })
    })

    it('shows sign in and get started buttons', () => {
      render(<Header />)
      
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
    })

    it('does not show notifications for unauthenticated users', () => {
      render(<Header />)
      
      // Should not show notification bell
      const buttons = screen.getAllByRole('button')
      const notificationButton = buttons.find(button => 
        button.querySelector('svg') && 
        button.getAttribute('class')?.includes('relative')
      )
      expect(notificationButton).toBeUndefined()
    })

    it('maintains all other header functionality', () => {
      render(<Header showSidebarToggle onSidebarToggle={jest.fn()} />)
      
      // Logo should be present
      expect(screen.getByText('Learning Portal')).toBeInTheDocument()
      
      // Search should be present
      expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument()
      
      // Theme toggle should be present
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      expect(themeToggle).toBeInTheDocument()
      
      // Sidebar toggle should be present
      const sidebarToggle = screen.getByRole('button')
      expect(sidebarToggle).toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })
    })

    it('shows user button instead of sign in buttons', () => {
      render(<Header />)
      
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument()
    })

    it('shows notifications for authenticated users', () => {
      render(<Header />)
      
      // Should show notification bell with badge
      const notificationButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg') && 
        button.getAttribute('class')?.includes('relative')
      )
      expect(notificationButtons.length).toBeGreaterThan(0)
    })

    it('maintains all header functionality with authentication', () => {
      render(<Header showSidebarToggle onSidebarToggle={jest.fn()} />)
      
      // All core functionality should remain
      expect(screen.getByText('Learning Portal')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument()
      
      // Theme toggle should still work
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      expect(themeToggle).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
      })
    })

    it('shows loading state for authentication section', () => {
      render(<Header />)
      
      // Should show loading spinner in auth section
      const loadingElement = screen.getByRole('status', { hidden: true })
      expect(loadingElement).toBeInTheDocument()
    })

    it('maintains other header functionality during auth loading', () => {
      render(<Header />)
      
      // Core header elements should still be present
      expect(screen.getByText('Learning Portal')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior with Authentication', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })
    })

    it('maintains responsive search behavior', () => {
      render(<Header />)
      
      // Search input should be present
      const searchInput = screen.getByPlaceholderText('Search courses...')
      expect(searchInput).toBeInTheDocument()
      
      // Should handle focus events
      fireEvent.focus(searchInput)
      expect(searchInput).toHaveFocus()
    })

    it('maintains mobile sidebar toggle functionality', () => {
      const mockToggle = jest.fn()
      render(<Header showSidebarToggle onSidebarToggle={mockToggle} />)
      
      const sidebarToggle = screen.getAllByRole('button')[0] // First button should be sidebar toggle
      fireEvent.click(sidebarToggle)
      
      expect(mockToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility with Authentication', () => {
    it('maintains accessibility when unauthenticated', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      })

      render(<Header />)
      
      // Sign in buttons should be accessible
      const signInButton = screen.getByText('Sign In')
      expect(signInButton).toBeInTheDocument()
      expect(signInButton.closest('button')).toBeInTheDocument()
    })

    it('maintains accessibility when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      render(<Header />)
      
      // User button should be accessible
      const userButton = screen.getByTestId('clerk-user-button')
      expect(userButton).toBeInTheDocument()
    })

    it('provides proper ARIA labels and roles', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      render(<Header />)
      
      // Header should have proper role
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
      
      // Search should have proper accessibility
      const searchInput = screen.getByPlaceholderText('Search courses...')
      expect(searchInput).toHaveAttribute('type', 'text')
    })
  })

  describe('Theme Integration with Authentication', () => {
    it('applies consistent theming to auth and non-auth elements', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
      })

      render(<Header />)
      
      // Header should have consistent background classes
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('bg-background/95')
      
      // User button should be present and styled
      expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
    })
  })
})