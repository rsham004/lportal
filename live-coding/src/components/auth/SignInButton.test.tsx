import { render, screen, fireEvent } from '@testing-library/react'
import { SignInButton } from './SignInButton'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: false,
    isLoaded: true,
  }),
  SignInButton: ({ children, ...props }: any) => (
    <button data-testid="clerk-signin-button" {...props}>
      {children || 'Sign In'}
    </button>
  ),
}))

describe('SignInButton', () => {
  it('renders sign in button when user is not authenticated', () => {
    render(<SignInButton />)
    
    expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('accepts custom children', () => {
    render(
      <SignInButton>
        <span>Custom Sign In Text</span>
      </SignInButton>
    )
    
    expect(screen.getByText('Custom Sign In Text')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<SignInButton className="custom-class" />)
    
    const button = screen.getByTestId('clerk-signin-button')
    expect(button).toHaveClass('custom-class')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<SignInButton onClick={handleClick} />)
    
    fireEvent.click(screen.getByTestId('clerk-signin-button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('supports different variants', () => {
    render(<SignInButton variant="outline" />)
    
    const button = screen.getByTestId('clerk-signin-button')
    expect(button).toBeInTheDocument()
  })
})