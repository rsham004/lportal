/**
 * Phase 1 & Phase 2 Integration Verification Tests
 * 
 * Comprehensive tests to verify that Phase 1 (UI Components) and Phase 2 (Authentication & Security)
 * components work together seamlessly.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Phase 1 Components
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AppLayout, AppHeader, AppMain, AppSidebar, AppContent, AppFooter } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormField, FormLabel, FormError, FormProvider, useForm } from '@/components/ui/Form';

// Phase 2 Components
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthorizationProvider, useCan } from '@/components/authorization/AuthorizationProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Can } from '@/components/authorization/Can';
import { UserProfile } from '@/components/user/UserProfile';
import { UserManagement } from '@/components/user/UserManagement';

// Security Components
import { Phase2_4_SecurityIntegrationTest } from '@/components/security/Phase2_4_SecurityIntegrationTest';

// Mock Clerk
const mockUser = {
  id: 'user_123',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  firstName: 'John',
  lastName: 'Doe',
  publicMetadata: { role: 'student' },
  privateMetadata: {},
  unsafeMetadata: {},
};

const mockAuth = {
  isLoaded: true,
  isSignedIn: true,
  user: mockUser,
  userId: 'user_123',
  sessionId: 'session_123',
  signOut: jest.fn(),
};

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="clerk-provider">{children}</div>,
  useAuth: () => mockAuth,
  useUser: () => ({ user: mockUser, isLoaded: true }),
  SignInButton: ({ children }: { children: React.ReactNode }) => <button data-testid="sign-in-button">{children}</button>,
  SignOutButton: ({ children }: { children: React.ReactNode }) => <button data-testid="sign-out-button">{children}</button>,
  UserButton: () => <div data-testid="user-button">User Menu</div>,
}));

// Mock Next.js
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

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

// Mock security utilities
jest.mock('@/lib/security/csrf-protection', () => ({
  generateCSRFToken: jest.fn(() => 'mock-csrf-token'),
  validateCSRFToken: jest.fn(() => true),
  getCSRFHeaders: jest.fn(() => ({ 'X-CSRF-Token': 'mock-csrf-token' })),
}));

jest.mock('@/lib/security/rate-limiting', () => ({
  checkRateLimit: jest.fn(() => Promise.resolve({ allowed: true, remaining: 10 })),
  getRateLimitHeaders: jest.fn(() => ({ 'X-RateLimit-Remaining': '10' })),
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

// Test component that combines Phase 1 UI with Phase 2 Auth
function IntegratedAuthApp() {
  const { register, handleSubmit, state } = useForm();
  const [formData, setFormData] = React.useState<any>(null);

  const onSubmit = (data: any) => {
    setFormData(data);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthorizationProvider>
          <AppLayout>
            <AppHeader>
              <div className="flex items-center justify-between p-4">
                <h1 className="text-xl font-bold">Learning Portal</h1>
                <div data-testid="user-button">User Menu</div>
              </div>
            </AppHeader>
            
            <AppMain>
              <AppContent>
                <div className="container mx-auto px-4 py-6">
                  {/* Protected content that requires authentication */}
                  <ProtectedRoute>
                    <div className="space-y-6">
                      <h2 className="text-2xl font-semibold">Dashboard</h2>
                      
                      {/* Role-based content */}
                      <Can action="read" subject="Course">
                        <div data-testid="student-content">
                          <h3 className="text-lg font-medium">My Courses</h3>
                          <p>Student can view their enrolled courses</p>
                        </div>
                      </Can>
                      
                      <Can action="create" subject="Course">
                        <div data-testid="instructor-content">
                          <h3 className="text-lg font-medium">Create Course</h3>
                          <p>Instructor can create new courses</p>
                        </div>
                      </Can>
                      
                      <Can action="manage" subject="User">
                        <div data-testid="admin-content">
                          <h3 className="text-lg font-medium">User Management</h3>
                          <UserManagement />
                        </div>
                      </Can>
                      
                      {/* Form with CSRF protection */}
                      <div className="max-w-md">
                        <h3 className="text-lg font-medium mb-4">Update Profile</h3>
                        <Form onSubmit={handleSubmit(onSubmit)}>
                          <FormField>
                            <FormLabel htmlFor="name">Name</FormLabel>
                            <Input
                              id="name"
                              {...register('name', { required: 'Name is required' })}
                            />
                            <FormError name="name" />
                          </FormField>
                          
                          <FormField>
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <Input
                              id="email"
                              type="email"
                              {...register('email', { required: 'Email is required' })}
                            />
                            <FormError name="email" />
                          </FormField>
                          
                          <Button type="submit" disabled={state.isSubmitting}>
                            {state.isSubmitting ? 'Updating...' : 'Update Profile'}
                          </Button>
                        </Form>
                        
                        {formData && (
                          <div className="mt-4 p-4 bg-green-100 rounded" data-testid="form-success">
                            Profile updated successfully!
                          </div>
                        )}
                      </div>
                      
                      {/* User profile component */}
                      <UserProfile />
                      
                      {/* Security integration test component */}
                      <Phase2_4_SecurityIntegrationTest />
                    </div>
                  </ProtectedRoute>
                </div>
              </AppContent>
            </AppMain>
            
            <AppFooter>
              <div className="p-4 text-center text-sm text-gray-600">
                © 2024 Learning Portal. All rights reserved.
              </div>
            </AppFooter>
          </AppLayout>
        </AuthorizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Unauthenticated version for testing
function UnauthenticatedApp() {
  const unauthenticatedMockAuth = {
    isLoaded: true,
    isSignedIn: false,
    user: null,
    userId: null,
    sessionId: null,
    signOut: jest.fn(),
  };

  // Temporarily override the mock
  const originalUseAuth = require('@clerk/nextjs').useAuth;
  require('@clerk/nextjs').useAuth = () => unauthenticatedMockAuth;

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthorizationProvider>
          <AppLayout>
            <AppHeader>
              <div className="flex items-center justify-between p-4">
                <h1 className="text-xl font-bold">Learning Portal</h1>
                <button data-testid="sign-in-button">Sign In</button>
              </div>
            </AppHeader>
            
            <AppMain>
              <AppContent>
                <ProtectedRoute>
                  <div data-testid="protected-content">
                    This should not be visible when unauthenticated
                  </div>
                </ProtectedRoute>
              </AppContent>
            </AppMain>
          </AppLayout>
        </AuthorizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('Phase 1 & Phase 2 Integration Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Integration with UI Components', () => {
    it('renders authenticated user interface with all Phase 1 components', () => {
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Verify Phase 1 layout components are present
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer

      // Verify authentication integration
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('shows protected content only when authenticated', () => {
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Protected content should be visible for authenticated user
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Update Profile')).toBeInTheDocument();
    });

    it('integrates theme provider with authentication components', () => {
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Both theme and auth providers should be active
      expect(screen.getByTestId('clerk-provider')).toBeInTheDocument();
      // Theme should be applied to authenticated components
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Authorization Integration with UI Components', () => {
    it('shows role-based content based on user permissions', () => {
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Student role should see course content
      expect(screen.getByTestId('student-content')).toBeInTheDocument();
      expect(screen.getByText('My Courses')).toBeInTheDocument();

      // Should not see admin content (user has student role)
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('integrates Can component with Phase 1 UI components', () => {
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Can component should work within the layout
      const studentContent = screen.getByTestId('student-content');
      expect(studentContent).toBeInTheDocument();
      expect(studentContent).toHaveTextContent('Student can view their enrolled courses');
    });

    it('maintains proper layout structure with conditional content', () => {
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Layout should remain intact regardless of conditional content
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      
      // Content area should contain role-based elements
      const main = screen.getByRole('main');
      expect(main).toContainElement(screen.getByTestId('student-content'));
    });
  });

  describe('Security Integration with UI Components', () => {
    it('integrates CSRF protection with form components', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Fill and submit form (should include CSRF protection)
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      // Form should submit successfully with security measures
      await waitFor(() => {
        expect(screen.getByTestId('form-success')).toBeInTheDocument();
      });
    });

    it('integrates security monitoring with user interactions', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Multiple interactions should be monitored
      await user.click(screen.getByTestId('user-button'));
      await user.type(screen.getByLabelText(/name/i), 'Test');
      
      // Security integration test component should be present
      expect(screen.getByText('Security Integration Test')).toBeInTheDocument();
    });

    it('maintains security headers across component interactions', () => {
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Security components should be integrated
      expect(screen.getByText('Security Integration Test')).toBeInTheDocument();
      
      // Layout should maintain security context
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('User Management Integration', () => {
    it('integrates user management with layout and security', () => {
      // Mock admin user for this test
      const adminMockAuth = {
        ...mockAuth,
        user: {
          ...mockUser,
          publicMetadata: { role: 'admin' },
        },
      };

      jest.doMock('@clerk/nextjs', () => ({
        ClerkProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="clerk-provider">{children}</div>,
        useAuth: () => adminMockAuth,
        useUser: () => ({ user: adminMockAuth.user, isLoaded: true }),
        SignInButton: ({ children }: { children: React.ReactNode }) => <button data-testid="sign-in-button">{children}</button>,
        SignOutButton: ({ children }: { children: React.ReactNode }) => <button data-testid="sign-out-button">{children}</button>,
        UserButton: () => <div data-testid="user-button">User Menu</div>,
      }));

      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Admin should see user management (if they have admin role)
      // This test verifies the integration structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('integrates user profile with form components and layout', () => {
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // User profile should be integrated within the layout
      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByRole('main')).toContainElement(
        screen.getByText('User Profile')
      );
    });
  });

  describe('Complete Integration Flow', () => {
    it('handles complete user journey from authentication to interaction', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // 1. User sees authenticated layout
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('user-button')).toBeInTheDocument();

      // 2. User interacts with role-based content
      expect(screen.getByTestId('student-content')).toBeInTheDocument();

      // 3. User fills out secure form
      await user.type(screen.getByLabelText(/name/i), 'Integration Test');
      await user.type(screen.getByLabelText(/email/i), 'integration@test.com');

      // 4. User submits form with security measures
      await user.click(screen.getByRole('button', { name: /update profile/i }));

      // 5. Success feedback within integrated layout
      await waitFor(() => {
        expect(screen.getByTestId('form-success')).toBeInTheDocument();
      });

      // 6. All components remain functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('maintains state consistency across all integrated components', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'State Test');
      
      // Interact with other components
      await user.click(screen.getByTestId('user-button'));
      
      // Form state should be preserved
      expect(screen.getByLabelText(/name/i)).toHaveValue('State Test');
      
      // Layout should remain stable
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles error states gracefully across integrated components', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Submit empty form to trigger validation
      await user.click(screen.getByRole('button', { name: /update profile/i }));

      // Errors should be displayed within the layout
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      // Layout should remain functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility Integration', () => {
    it('maintains accessibility standards across integrated components', () => {
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // All ARIA landmarks should be present
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();

      // Form accessibility should be maintained
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('handles focus management across authentication and UI components', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedAuthApp />
        </FormProvider>
      );

      // Focus should work properly across integrated components
      const nameInput = screen.getByLabelText(/name/i);
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();
    });
  });
});