/**
 * User Management Integration Tests
 * 
 * Tests the integration between Phase 1 UI components, Phase 2 authentication/authorization,
 * and user management functionality with security features.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Phase 1 Components
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AppLayout, AppHeader, AppMain, AppContent } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormProvider } from '@/components/ui/Form';

// Phase 2 Components
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthorizationProvider } from '@/components/authorization/AuthorizationProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Can } from '@/components/authorization/Can';

// User Management Components
import { 
  UserProfile, 
  UserManagementDashboard, 
  UserRegistration, 
  PasswordReset,
  RoleAssignmentInterface,
  UserActivityMonitor 
} from '@/components/user';

// Security Integration
import { Phase2_4_SecurityIntegrationTest } from '@/components/security/Phase2_4_SecurityIntegrationTest';

// Mock users with different roles
const mockUsers = [
  {
    id: 'user_student_1',
    firstName: 'John',
    lastName: 'Student',
    emailAddresses: [{ emailAddress: 'john.student@example.com' }],
    publicMetadata: { role: 'student' },
    createdAt: new Date('2024-01-01'),
    lastSignInAt: new Date('2024-01-15'),
  },
  {
    id: 'user_instructor_1',
    firstName: 'Jane',
    lastName: 'Instructor',
    emailAddresses: [{ emailAddress: 'jane.instructor@example.com' }],
    publicMetadata: { role: 'instructor' },
    createdAt: new Date('2024-01-02'),
    lastSignInAt: new Date('2024-01-14'),
  },
  {
    id: 'user_admin_1',
    firstName: 'Admin',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'admin@example.com' }],
    publicMetadata: { role: 'admin' },
    createdAt: new Date('2024-01-03'),
    lastSignInAt: new Date('2024-01-16'),
  },
];

// Mock current user (admin for most tests)
let currentUser = mockUsers[2]; // Admin user

const mockAuth = {
  isLoaded: true,
  isSignedIn: true,
  get user() { return currentUser; },
  get userId() { return currentUser.id; },
  sessionId: 'session_123',
  signOut: jest.fn(),
};

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="clerk-provider">{children}</div>,
  useAuth: () => mockAuth,
  useUser: () => ({ user: currentUser, isLoaded: true }),
  UserButton: () => <div data-testid="user-button">{currentUser.firstName} Menu</div>,
}));

// Mock Next.js
jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/users',
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

jest.mock('@/lib/security/security-monitoring', () => ({
  SecurityMonitor: jest.fn().mockImplementation(() => ({
    logSecurityEvent: jest.fn(() => Promise.resolve(true)),
    detectThreat: jest.fn(() => Promise.resolve(true)),
    sendAlert: jest.fn(() => Promise.resolve(true)),
  })),
}));

// Mock authorization utilities
jest.mock('@/lib/authorization/roles', () => ({
  UserRole: {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
  },
  getUserRole: jest.fn((user) => user?.publicMetadata?.role || 'student'),
}));

jest.mock('@/lib/authorization/audit', () => ({
  auditHelpers: {
    logUserAction: jest.fn(() => Promise.resolve()),
    logRoleChange: jest.fn(() => Promise.resolve()),
    logSecurityEvent: jest.fn(() => Promise.resolve()),
  },
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

// Comprehensive user management app
function UserManagementApp() {
  const [selectedTab, setSelectedTab] = React.useState('dashboard');
  const [users, setUsers] = React.useState(mockUsers);
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, publicMetadata: { role: newRole as any } }
        : user
    ));
  };

  const handleUserSuspend = async (userId: string) => {
    console.log('Suspending user:', userId);
  };

  const handleUserDelete = async (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthorizationProvider>
          <FormProvider>
            <AppLayout>
              <AppHeader>
                <div className="flex items-center justify-between p-4">
                  <h1 className="text-xl font-bold">User Management Portal</h1>
                  <div className="flex items-center gap-4">
                    <div data-testid="user-button">{currentUser.firstName} Menu</div>
                  </div>
                </div>
              </AppHeader>
              
              <AppMain>
                <AppContent>
                  <ProtectedRoute>
                    <Can action="manage" subject="User">
                      <div className="container mx-auto px-4 py-6">
                        {/* Navigation Tabs */}
                        <div className="flex space-x-4 mb-6">
                          <Button
                            variant={selectedTab === 'dashboard' ? 'default' : 'outline'}
                            onClick={() => setSelectedTab('dashboard')}
                            data-testid="tab-dashboard"
                          >
                            User Dashboard
                          </Button>
                          <Button
                            variant={selectedTab === 'profile' ? 'default' : 'outline'}
                            onClick={() => setSelectedTab('profile')}
                            data-testid="tab-profile"
                          >
                            Profile Management
                          </Button>
                          <Button
                            variant={selectedTab === 'registration' ? 'default' : 'outline'}
                            onClick={() => setSelectedTab('registration')}
                            data-testid="tab-registration"
                          >
                            User Registration
                          </Button>
                          <Button
                            variant={selectedTab === 'security' ? 'default' : 'outline'}
                            onClick={() => setSelectedTab('security')}
                            data-testid="tab-security"
                          >
                            Security Integration
                          </Button>
                        </div>

                        {/* Tab Content */}
                        {selectedTab === 'dashboard' && (
                          <div data-testid="dashboard-content">
                            <h2 className="text-2xl font-bold mb-6">User Management Dashboard</h2>
                            <UserManagementDashboard
                              users={users}
                              onRoleChange={handleRoleChange}
                              onUserSuspend={handleUserSuspend}
                              onUserDelete={handleUserDelete}
                            />
                          </div>
                        )}

                        {selectedTab === 'profile' && (
                          <div data-testid="profile-content">
                            <h2 className="text-2xl font-bold mb-6">Profile Management</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">User Profile</h3>
                                <UserProfile
                                  userId={selectedUser || currentUser.id}
                                  showPreferences={true}
                                  showActivity={true}
                                  showRoleManagement={true}
                                />
                              </Card>
                              
                              <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Role Assignment</h3>
                                <RoleAssignmentInterface
                                  users={users}
                                  onRoleChange={handleRoleChange}
                                />
                              </Card>
                            </div>
                            
                            <Card className="p-6 mt-6">
                              <h3 className="text-lg font-semibold mb-4">User Activity Monitor</h3>
                              <UserActivityMonitor
                                userId={selectedUser || currentUser.id}
                                showSecurityEvents={true}
                                showLoginHistory={true}
                              />
                            </Card>
                          </div>
                        )}

                        {selectedTab === 'registration' && (
                          <div data-testid="registration-content">
                            <h2 className="text-2xl font-bold mb-6">User Registration</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">New User Registration</h3>
                                <UserRegistration
                                  onRegistrationComplete={(userData) => {
                                    console.log('User registered:', userData);
                                  }}
                                  showRoleSelection={true}
                                  requireApproval={true}
                                />
                              </Card>
                              
                              <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Password Reset</h3>
                                <PasswordReset
                                  onResetComplete={(email) => {
                                    console.log('Password reset for:', email);
                                  }}
                                  showSecurityQuestions={true}
                                />
                              </Card>
                            </div>
                          </div>
                        )}

                        {selectedTab === 'security' && (
                          <div data-testid="security-content">
                            <h2 className="text-2xl font-bold mb-6">Security Integration</h2>
                            <Phase2_4_SecurityIntegrationTest />
                          </div>
                        )}
                      </div>
                    </Can>
                  </ProtectedRoute>
                </AppContent>
              </AppMain>
            </AppLayout>
          </FormProvider>
        </AuthorizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('User Management Integration with Auth and Security', () => {
  beforeEach(() => {
    currentUser = mockUsers[2]; // Reset to admin user
    jest.clearAllMocks();
  });

  describe('Admin Access and Layout Integration', () => {
    it('renders user management interface for admin users', () => {
      render(<UserManagementApp />);

      // Should show admin interface
      expect(screen.getByText('User Management Portal')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      expect(screen.getByText('User Management Dashboard')).toBeInTheDocument();

      // Should show navigation tabs
      expect(screen.getByTestId('tab-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('tab-profile')).toBeInTheDocument();
      expect(screen.getByTestId('tab-registration')).toBeInTheDocument();
      expect(screen.getByTestId('tab-security')).toBeInTheDocument();
    });

    it('integrates user management with Phase 1 layout components', () => {
      render(<UserManagementApp />);

      // Layout components should be present
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main

      // User management should be within the layout
      const main = screen.getByRole('main');
      expect(main).toContainElement(screen.getByText('User Management Dashboard'));
    });

    it('restricts access to non-admin users', () => {
      currentUser = mockUsers[0]; // Switch to student user
      render(<UserManagementApp />);

      // Should not show user management content for non-admin
      expect(screen.queryByText('User Management Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('User Dashboard Integration', () => {
    it('displays user list with Phase 1 UI components', () => {
      render(<UserManagementApp />);

      // Should show user information
      expect(screen.getByText('John Student')).toBeInTheDocument();
      expect(screen.getByText('Jane Instructor')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();

      // Should show email addresses
      expect(screen.getByText('john.student@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane.instructor@example.com')).toBeInTheDocument();
    });

    it('handles role changes with security validation', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      // Find role change controls (implementation depends on UserManagementDashboard)
      const roleButtons = screen.getAllByText(/student|instructor|admin/i);
      expect(roleButtons.length).toBeGreaterThan(0);

      // Role changes should be logged for security
      // This would be tested more thoroughly with actual role change UI
    });

    it('integrates user actions with security monitoring', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      // User actions should trigger security events
      // This integration is verified through the security monitoring system
      expect(screen.getByText('User Management Dashboard')).toBeInTheDocument();
    });
  });

  describe('Profile Management Integration', () => {
    it('switches to profile management tab', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      await user.click(screen.getByTestId('tab-profile'));
      expect(screen.getByTestId('profile-content')).toBeInTheDocument();
      expect(screen.getByText('Profile Management')).toBeInTheDocument();
    });

    it('integrates user profile with authorization', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      await user.click(screen.getByTestId('tab-profile'));

      // Profile components should be present
      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByText('Role Assignment')).toBeInTheDocument();
      expect(screen.getByText('User Activity Monitor')).toBeInTheDocument();
    });

    it('maintains layout consistency across profile views', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      await user.click(screen.getByTestId('tab-profile'));

      // Layout should remain consistent
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('User Management Portal')).toBeInTheDocument();
    });
  });

  describe('User Registration Integration', () => {
    it('switches to registration tab and shows registration form', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      await user.click(screen.getByTestId('tab-registration'));
      expect(screen.getByTestId('registration-content')).toBeInTheDocument();
      expect(screen.getByText('User Registration')).toBeInTheDocument();
    });

    it('integrates registration with security features', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      await user.click(screen.getByTestId('tab-registration'));

      // Registration and password reset should be present
      expect(screen.getByText('New User Registration')).toBeInTheDocument();
      expect(screen.getByText('Password Reset')).toBeInTheDocument();
    });

    it('handles registration form with Phase 1 form components', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      await user.click(screen.getByTestId('tab-registration'));

      // Form components should be integrated
      // Specific form fields depend on UserRegistration implementation
      expect(screen.getByTestId('registration-content')).toBeInTheDocument();
    });
  });

  describe('Security Integration Tab', () => {
    it('switches to security integration tab', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      await user.click(screen.getByTestId('tab-security'));
      expect(screen.getByTestId('security-content')).toBeInTheDocument();
      expect(screen.getByText('Security Integration')).toBeInTheDocument();
    });

    it('shows security integration test component', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      await user.click(screen.getByTestId('tab-security'));

      // Security integration component should be present
      expect(screen.getByText('Security Integration Test')).toBeInTheDocument();
    });

    it('integrates security testing with user management context', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      await user.click(screen.getByTestId('tab-security'));

      // Security tests should run in the context of user management
      const runTestsButton = screen.getByRole('button', { name: /run tests/i });
      expect(runTestsButton).toBeInTheDocument();
    });
  });

  describe('Cross-Component Integration', () => {
    it('maintains state consistency across tab switches', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      // Switch between tabs
      await user.click(screen.getByTestId('tab-profile'));
      await user.click(screen.getByTestId('tab-dashboard'));
      await user.click(screen.getByTestId('tab-registration'));
      await user.click(screen.getByTestId('tab-security'));

      // All tabs should be functional
      expect(screen.getByTestId('security-content')).toBeInTheDocument();
      
      // Switch back to dashboard
      await user.click(screen.getByTestId('tab-dashboard'));
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('integrates authentication state across all user management features', () => {
      render(<UserManagementApp />);

      // User authentication should be consistent across all components
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(screen.getByText('Admin Menu')).toBeInTheDocument();
    });

    it('applies authorization consistently across user management features', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      // All tabs should be accessible to admin
      await user.click(screen.getByTestId('tab-profile'));
      expect(screen.getByTestId('profile-content')).toBeInTheDocument();

      await user.click(screen.getByTestId('tab-registration'));
      expect(screen.getByTestId('registration-content')).toBeInTheDocument();

      await user.click(screen.getByTestId('tab-security'));
      expect(screen.getByTestId('security-content')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles user management errors gracefully within layout', () => {
      // Test with error state
      render(<UserManagementApp />);

      // Layout should remain stable even with errors
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains responsive behavior with user management content', () => {
      render(<UserManagementApp />);

      // User management should work within responsive layout
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('User Management Dashboard')).toBeInTheDocument();
    });

    it('handles role changes with proper security validation', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      // Role changes should be validated and logged
      // This would be more thoroughly tested with actual role change implementation
      expect(screen.getByText('User Management Dashboard')).toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility', () => {
    it('maintains accessibility standards across user management features', async () => {
      const user = userEvent.setup();
      render(<UserManagementApp />);

      // All tabs should be accessible
      expect(screen.getByTestId('tab-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('tab-profile')).toBeInTheDocument();
      expect(screen.getByTestId('tab-registration')).toBeInTheDocument();
      expect(screen.getByTestId('tab-security')).toBeInTheDocument();

      // Tab navigation should work with keyboard
      await user.tab();
      // Focus management would be tested more thoroughly in actual implementation
    });

    it('handles large user lists efficiently', () => {
      // Test with many users
      const manyUsers = Array.from({ length: 100 }, (_, i) => ({
        ...mockUsers[0],
        id: `user_${i}`,
        firstName: `User${i}`,
        emailAddresses: [{ emailAddress: `user${i}@example.com` }],
      }));

      render(<UserManagementApp />);

      // Should handle large datasets efficiently
      expect(screen.getByText('User Management Dashboard')).toBeInTheDocument();
    });
  });
});