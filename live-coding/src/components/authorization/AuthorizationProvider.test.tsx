import { render, screen } from '@testing-library/react'
import { useAuth } from '@clerk/nextjs'
import { AuthorizationProvider, useAbility } from './AuthorizationProvider'
import { UserRole } from '../../lib/authorization/roles'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Test component to access ability
function TestComponent() {
  const ability = useAbility()
  
  return (
    <div>
      <div data-testid="can-read-course">
        {ability.can('read', 'Course') ? 'Can read courses' : 'Cannot read courses'}
      </div>
      <div data-testid="can-create-course">
        {ability.can('create', 'Course') ? 'Can create courses' : 'Cannot create courses'}
      </div>
      <div data-testid="can-manage-users">
        {ability.can('manage', 'User') ? 'Can manage users' : 'Cannot manage users'}
      </div>
    </div>
  )
}

describe('AuthorizationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('provides ability context to children', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: 'user_123',
        publicMetadata: { role: UserRole.STUDENT },
      },
    } as any)

    render(
      <AuthorizationProvider>
        <TestComponent />
      </AuthorizationProvider>
    )

    expect(screen.getByTestId('can-read-course')).toHaveTextContent('Can read courses')
    expect(screen.getByTestId('can-create-course')).toHaveTextContent('Cannot create courses')
    expect(screen.getByTestId('can-manage-users')).toHaveTextContent('Cannot manage users')
  })

  it('creates instructor abilities correctly', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: 'instructor_123',
        publicMetadata: { role: UserRole.INSTRUCTOR },
      },
    } as any)

    render(
      <AuthorizationProvider>
        <TestComponent />
      </AuthorizationProvider>
    )

    expect(screen.getByTestId('can-read-course')).toHaveTextContent('Can read courses')
    expect(screen.getByTestId('can-create-course')).toHaveTextContent('Can create courses')
    expect(screen.getByTestId('can-manage-users')).toHaveTextContent('Cannot manage users')
  })

  it('creates admin abilities correctly', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: 'admin_123',
        publicMetadata: { role: UserRole.ADMIN },
      },
    } as any)

    render(
      <AuthorizationProvider>
        <TestComponent />
      </AuthorizationProvider>
    )

    expect(screen.getByTestId('can-read-course')).toHaveTextContent('Can read courses')
    expect(screen.getByTestId('can-create-course')).toHaveTextContent('Can create courses')
    expect(screen.getByTestId('can-manage-users')).toHaveTextContent('Can manage users')
  })

  it('handles unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
      user: null,
    } as any)

    render(
      <AuthorizationProvider>
        <TestComponent />
      </AuthorizationProvider>
    )

    expect(screen.getByTestId('can-read-course')).toHaveTextContent('Cannot read courses')
    expect(screen.getByTestId('can-create-course')).toHaveTextContent('Cannot create courses')
    expect(screen.getByTestId('can-manage-users')).toHaveTextContent('Cannot manage users')
  })

  it('handles loading state', () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
      user: null,
    } as any)

    render(
      <AuthorizationProvider>
        <TestComponent />
      </AuthorizationProvider>
    )

    expect(screen.getByTestId('can-read-course')).toHaveTextContent('Cannot read courses')
    expect(screen.getByTestId('can-create-course')).toHaveTextContent('Cannot create courses')
    expect(screen.getByTestId('can-manage-users')).toHaveTextContent('Cannot manage users')
  })

  it('handles user without role', () => {
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
        <TestComponent />
      </AuthorizationProvider>
    )

    expect(screen.getByTestId('can-read-course')).toHaveTextContent('Cannot read courses')
    expect(screen.getByTestId('can-create-course')).toHaveTextContent('Cannot create courses')
    expect(screen.getByTestId('can-manage-users')).toHaveTextContent('Cannot manage users')
  })

  it('updates ability when user role changes', () => {
    const { rerender } = render(
      <AuthorizationProvider>
        <TestComponent />
      </AuthorizationProvider>
    )

    // Initially student
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: 'user_123',
        publicMetadata: { role: UserRole.STUDENT },
      },
    } as any)

    rerender(
      <AuthorizationProvider>
        <TestComponent />
      </AuthorizationProvider>
    )

    expect(screen.getByTestId('can-create-course')).toHaveTextContent('Cannot create courses')

    // Change to instructor
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: 'user_123',
        publicMetadata: { role: UserRole.INSTRUCTOR },
      },
    } as any)

    rerender(
      <AuthorizationProvider>
        <TestComponent />
      </AuthorizationProvider>
    )

    expect(screen.getByTestId('can-create-course')).toHaveTextContent('Can create courses')
  })

  it('throws error when useAbility is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAbility must be used within an AuthorizationProvider')

    consoleSpy.mockRestore()
  })
})