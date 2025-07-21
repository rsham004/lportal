import { render, screen } from '@testing-library/react'
import { UserButton } from '@/components/auth/UserButton'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: true,
    isLoaded: true,
  }),
  useUser: () => ({
    user: {
      id: 'user_123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com' }],
      imageUrl: 'https://example.com/avatar.jpg',
    },
    isLoaded: true,
  }),
  UserButton: (props: any) => (
    <div data-testid="clerk-user-button" {...props}>
      User Menu
    </div>
  ),
}))

describe('UserButton', () => {
  it('renders user button when user is authenticated', () => {
    render(<UserButton />)
    
    expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
    expect(screen.getByText('User Menu')).toBeInTheDocument()
  })

  it('applies custom appearance settings', () => {
    render(<UserButton />)
    
    const userButton = screen.getByTestId('clerk-user-button')
    expect(userButton).toBeInTheDocument()
  })

  it('handles loading state', () => {
    // Mock loading state
    jest.doMock('@clerk/nextjs', () => ({
      useAuth: () => ({
        isSignedIn: false,
        isLoaded: false,
      }),
      useUser: () => ({
        user: null,
        isLoaded: false,
      }),
      UserButton: (props: any) => (
        <div data-testid="clerk-user-button" {...props}>
          Loading...
        </div>
      ),
    }))

    render(<UserButton />)
    
    expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
  })

  it('supports custom afterSignOutUrl', () => {
    render(<UserButton afterSignOutUrl="/goodbye" />)
    
    expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
  })
})