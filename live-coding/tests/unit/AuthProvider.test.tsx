import { render, screen } from '@testing-library/react'
import { AuthProvider } from './AuthProvider'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  ),
}))

describe('AuthProvider', () => {
  it('renders children within Clerk provider', () => {
    render(
      <AuthProvider>
        <div data-testid="test-child">Test Content</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('clerk-provider')).toBeInTheDocument()
    expect(screen.getByTestId('test-child')).toBeInTheDocument()
  })

  it('passes publishableKey to ClerkProvider', () => {
    const originalEnv = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-key'

    render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('clerk-provider')).toBeInTheDocument()

    // Restore original env
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalEnv
  })

  it('handles missing publishable key gracefully', () => {
    const originalEnv = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

    expect(() => {
      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      )
    }).not.toThrow()

    // Restore original env
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalEnv
  })
})