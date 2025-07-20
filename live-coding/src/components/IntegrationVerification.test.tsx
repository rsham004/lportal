/**
 * Authentication Flow Integration Tests
 * 
 * Tests the integration between Phase 1 UI components and Phase 2 authentication flows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Phase 1 Components
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AppLayout, AppHeader, AppMain, AppContent } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Phase 2 Components
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthorizationProvider } from '@/components/authorization/AuthorizationProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';

// Create different auth states for testing
const createMockAuth = (isSignedIn: boolean, user: any = null) => ({
  isLoaded: true,
  isSignedIn,
  user,
  userId: user?.id || null,
  sessionId: isSignedIn ? 'session_123' : null,
  signOut: jest.fn(),
});

const mockUser = {
  id: 'user_123',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  firstName: 'John',
  lastName: 'Doe',
  publicMetadata: { role: 'student' },
};

// Mock Clerk with different states
let currentMockAuth = createMockAuth(false);

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="clerk-provider">{children}</div>,
  useAuth: () => currentMockAuth,
  useUser: () => ({ user: currentMockAuth.user, isLoaded: true }),
  SignInButton: ({ children, mode, ...props }: any) => (
    <button 
      data-testid="sign-in-button" 
      onClick={() => {
        currentMockAuth = createMockAuth(true, mockUser);
      }}
      {...props}
    >
      {children || 'Sign In'}
    </button>
  ),
  SignOutButton: ({ children, ...props }: any) => (
    <button 
      data-testid="sign-out-button"
      onClick={() => {
        currentMockAuth = createMockAuth(false);
      }}
      {...props}
    >
      {children || 'Sign Out'}
    </button>
  ),
  UserButton: () => <div data-testid="user-button">User Menu</div>,
}));

// Mock Next.js
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock theme utilities
jest.mock('@/lib/theme', () => ({
  getSystemTheme: jest.fn(() => 'light'),
  getStoredTheme: jest.fn(() => 'system'),
  setStoredTheme: jest.fn(),
  resolveTheme: jest.fn((theme, systemTheme) => theme === 'system' ? systemTheme : theme),
  applyTheme: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

// Test component for authentication flows
function AuthFlowTestApp() {
  const [currentView, setCurrentView] = React.useState<'login' | 'signup' | 'dashboard'>('login');

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthorizationProvider>
          <AppLayout>
            <AppHeader>
              <div className="flex items-center justify-between p-4">
                <h1 className="text-xl font-bold">Learning Portal</h1>
                <div className="flex items-center gap-4">
                  {currentMockAuth.isSignedIn ? (
                    <>
                      <div data-testid="user-button">User Menu</div>
                      <button 
                        data-testid="sign-out-button"
                        onClick={() => {
                          currentMockAuth = createMockAuth(false);
                          setCurrentView('login');
                        }}
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentView('login')}
                        data-testid="login-nav-button"
                      >
                        Login
                      </Button>
                      <Button 
                        onClick={() => setCurrentView('signup')}
                        data-testid="signup-nav-button"
                      >
                        Sign Up
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </AppHeader>
            
            <AppMain>
              <AppContent>
                <div className="container mx-auto px-4 py-6">
                  {!currentMockAuth.isSignedIn ? (
                    <div className="max-w-md mx-auto">
                      {currentView === 'login' && (
                        <div data-testid="login-view">
                          <h2 className="text-2xl font-bold mb-6">Sign In</h2>
                          <LoginForm 
                            onSuccess={() => {
                              currentMockAuth = createMockAuth(true, mockUser);
                              setCurrentView('dashboard');
                            }}
                          />
                          <p className="mt-4 text-center">
                            Don't have an account?{' '}
                            <button 
                              className="text-blue-600 hover:underline"
                              onClick={() => setCurrentView('signup')}
                              data-testid="switch-to-signup"
                            >
                              Sign up
                            </button>
                          </p>
                        </div>
                      )}
                      
                      {currentView === 'signup' && (
                        <div data-testid="signup-view">
                          <h2 className="text-2xl font-bold mb-6">Create Account</h2>
                          <SignUpForm 
                            onSuccess={() => {
                              currentMockAuth = createMockAuth(true, mockUser);
                              setCurrentView('dashboard');
                            }}
                          />
                          <p className="mt-4 text-center">
                            Already have an account?{' '}
                            <button 
                              className="text-blue-600 hover:underline"
                              onClick={() => setCurrentView('login')}
                              data-testid="switch-to-login"
                            >
                              Sign in
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <ProtectedRoute>
                      <div data-testid="dashboard-view">
                        <h2 className="text-2xl font-bold mb-6">Welcome to Dashboard</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="p-6 bg-white rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-2">My Courses</h3>
                            <p className="text-gray-600">View your enrolled courses</p>
                          </div>
                          <div className="p-6 bg-white rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-2">Progress</h3>
                            <p className="text-gray-600">Track your learning progress</p>
                          </div>
                          <div className="p-6 bg-white rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-2">Certificates</h3>
                            <p className="text-gray-600">View earned certificates</p>
                          </div>
                        </div>
                      </div>
                    </ProtectedRoute>
                  )}
                </div>
              </AppContent>
            </AppMain>
          </AppLayout>
        </AuthorizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    // Reset auth state before each test
    currentMockAuth = createMockAuth(false);
    jest.clearAllMocks();
  });

  describe('Unauthenticated State', () => {
    it('shows login form in Phase 1 layout when unauthenticated', () => {
      render(<AuthFlowTestApp />);

      // Should show login view by default
      expect(screen.getByTestId('login-view')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      
      // Should show navigation buttons in header
      expect(screen.getByTestId('login-nav-button')).toBeInTheDocument();
      expect(screen.getByTestId('signup-nav-button')).toBeInTheDocument();
      
      // Should not show user menu
      expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
    });

    it('switches between login and signup forms using Phase 1 UI components', async () => {
      const user = userEvent.setup();
      render(<AuthFlowTestApp />);

      // Start with login view
      expect(screen.getByTestId('login-view')).toBeInTheDocument();

      // Switch to signup using navigation button
      await user.click(screen.getByTestId('signup-nav-button'));
      expect(screen.getByTestId('signup-view')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();

      // Switch back to login using link
      await user.click(screen.getByTestId('switch-to-login'));
      expect(screen.getByTestId('login-view')).toBeInTheDocument();
    });

    it('maintains Phase 1 layout structure during auth state changes', async () => {
      const user = userEvent.setup();
      render(<AuthFlowTestApp />);

      // Layout should be consistent
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main

      // Switch views and verify layout remains
      await user.click(screen.getByTestId('signup-nav-button'));
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Authentication Process', () => {
    it('successfully authenticates user and shows dashboard', async () => {
      const user = userEvent.setup();
      render(<AuthFlowTestApp />);

      // Start with login form
      expect(screen.getByTestId('login-view')).toBeInTheDocument();

      // Fill and submit login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should redirect to dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
        expect(screen.getByText('Welcome to Dashboard')).toBeInTheDocument();
      });

      // Header should show user menu and sign out
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('handles signup flow and redirects to dashboard', async () => {
      const user = userEvent.setup();
      render(<AuthFlowTestApp />);

      // Navigate to signup
      await user.click(screen.getByTestId('signup-nav-button'));
      expect(screen.getByTestId('signup-view')).toBeInTheDocument();

      // Fill signup form
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/password/i), 'newpassword123');
      await user.type(screen.getByLabelText(/first name/i), 'New');
      await user.type(screen.getByLabelText(/last name/i), 'User');

      // Submit signup
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Should redirect to dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      // Start with authenticated state
      currentMockAuth = createMockAuth(true, mockUser);
    });

    it('shows dashboard with Phase 1 UI components when authenticated', () => {
      render(<AuthFlowTestApp />);

      // Should show dashboard immediately
      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Dashboard')).toBeInTheDocument();

      // Should show course cards using Phase 1 styling
      expect(screen.getByText('My Courses')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Certificates')).toBeInTheDocument();

      // Header should show authenticated state
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('handles sign out and returns to login view', async () => {
      const user = userEvent.setup();
      render(<AuthFlowTestApp />);

      // Start authenticated
      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();

      // Sign out
      await user.click(screen.getByTestId('sign-out-button'));

      // Should return to login view
      await waitFor(() => {
        expect(screen.getByTestId('login-view')).toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-view')).not.toBeInTheDocument();
      });

      // Header should show unauthenticated state
      expect(screen.getByTestId('login-nav-button')).toBeInTheDocument();
      expect(screen.getByTestId('signup-nav-button')).toBeInTheDocument();
    });

    it('protects dashboard content with ProtectedRoute', () => {
      render(<AuthFlowTestApp />);

      // Dashboard content should be wrapped in ProtectedRoute
      const dashboardView = screen.getByTestId('dashboard-view');
      expect(dashboardView).toBeInTheDocument();
      
      // Content should be accessible when authenticated
      expect(screen.getByText('My Courses')).toBeInTheDocument();
    });
  });

  describe('Theme Integration with Authentication', () => {
    it('maintains theme consistency across authentication states', async () => {
      const user = userEvent.setup();
      render(<AuthFlowTestApp />);

      // Theme should be applied to login form
      const loginView = screen.getByTestId('login-view');
      expect(loginView).toBeInTheDocument();

      // Simulate authentication
      currentMockAuth = createMockAuth(true, mockUser);
      
      // Re-render to simulate state change
      render(<AuthFlowTestApp />);
      
      // Theme should be applied to dashboard
      const dashboardView = screen.getByTestId('dashboard-view');
      expect(dashboardView).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior with Authentication', () => {
    it('maintains responsive layout during authentication flows', async () => {
      const user = userEvent.setup();
      render(<AuthFlowTestApp />);

      // Layout should be responsive in login state
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Simulate authentication
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Layout should remain responsive in authenticated state
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('displays authentication errors within Phase 1 layout', async () => {
      const user = userEvent.setup();
      
      // Mock login form to show error
      jest.doMock('@/components/auth/LoginForm', () => ({
        LoginForm: ({ onSuccess }: { onSuccess: () => void }) => (
          <form onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" />
            </div>
            <button type="submit">Sign In</button>
            <div data-testid="auth-error" className="text-red-600 mt-2">
              Invalid email or password
            </div>
          </form>
        ),
      }));

      render(<AuthFlowTestApp />);

      // Error should be displayed within the layout
      expect(screen.getByTestId('auth-error')).toBeInTheDocument();
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();

      // Layout should remain intact
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});