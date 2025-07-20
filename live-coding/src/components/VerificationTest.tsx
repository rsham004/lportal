/**
 * Authorization Integration Verification Test
 * 
 * Tests role-based access control integration with Phase 1 UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Phase 1 Components
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AppLayout, AppHeader, AppMain, AppSidebar, AppContent } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Phase 2 Components
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthorizationProvider } from '@/components/authorization/AuthorizationProvider';
import { Can } from '@/components/authorization/Can';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Create users with different roles
const createUser = (role: string) => ({
  id: `user_${role}`,
  emailAddresses: [{ emailAddress: `${role}@example.com` }],
  firstName: role.charAt(0).toUpperCase() + role.slice(1),
  lastName: 'User',
  publicMetadata: { role },
});

const studentUser = createUser('student');
const instructorUser = createUser('instructor');
const adminUser = createUser('admin');

// Mock auth with different users
let currentUser = studentUser;

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

// Test component with role-based UI
function RoleBasedApp() {
  const [selectedTab, setSelectedTab] = React.useState('dashboard');

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthorizationProvider>
          <AppLayout>
            <AppHeader>
              <div className="flex items-center justify-between p-4">
                <h1 className="text-xl font-bold">Learning Portal</h1>
                <div className="flex items-center gap-4">
                  <div data-testid="user-button">{currentUser.firstName} Menu</div>
                </div>
              </div>
            </AppHeader>
            
            <AppMain withSidebar>
              <AppSidebar>
                <nav className="p-4 space-y-2">
                  <Button
                    variant={selectedTab === 'dashboard' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedTab('dashboard')}
                    data-testid="nav-dashboard"
                  >
                    Dashboard
                  </Button>
                  
                  <Can action="read" subject="Course">
                    <Button
                      variant={selectedTab === 'courses' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedTab('courses')}
                      data-testid="nav-courses"
                    >
                      My Courses
                    </Button>
                  </Can>
                  
                  <Can action="create" subject="Course">
                    <Button
                      variant={selectedTab === 'create-course' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedTab('create-course')}
                      data-testid="nav-create-course"
                    >
                      Create Course
                    </Button>
                  </Can>
                  
                  <Can action="manage" subject="User">
                    <Button
                      variant={selectedTab === 'users' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedTab('users')}
                      data-testid="nav-users"
                    >
                      Manage Users
                    </Button>
                  </Can>
                  
                  <Can action="view" subject="Analytics">
                    <Button
                      variant={selectedTab === 'analytics' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedTab('analytics')}
                      data-testid="nav-analytics"
                    >
                      Analytics
                    </Button>
                  </Can>
                </nav>
              </AppSidebar>
              
              <AppContent>
                <ProtectedRoute>
                  <div className="p-6">
                    {selectedTab === 'dashboard' && (
                      <div data-testid="dashboard-content">
                        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          
                          <Can action="read" subject="Course">
                            <Card className="p-6" data-testid="student-course-card">
                              <h3 className="text-lg font-semibold mb-2">My Courses</h3>
                              <p className="text-gray-600">View enrolled courses</p>
                              <Button className="mt-4" size="sm">View Courses</Button>
                            </Card>
                          </Can>
                          
                          <Can action="create" subject="Course">
                            <Card className="p-6" data-testid="instructor-course-card">
                              <h3 className="text-lg font-semibold mb-2">Course Creation</h3>
                              <p className="text-gray-600">Create and manage courses</p>
                              <Button className="mt-4" size="sm">Create Course</Button>
                            </Card>
                          </Can>
                          
                          <Can action="manage" subject="User">
                            <Card className="p-6" data-testid="admin-user-card">
                              <h3 className="text-lg font-semibold mb-2">User Management</h3>
                              <p className="text-gray-600">Manage platform users</p>
                              <Button className="mt-4" size="sm">Manage Users</Button>
                            </Card>
                          </Can>
                          
                          <Can action="view" subject="Analytics">
                            <Card className="p-6" data-testid="analytics-card">
                              <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                              <p className="text-gray-600">View platform analytics</p>
                              <Button className="mt-4" size="sm">View Analytics</Button>
                            </Card>
                          </Can>
                        </div>
                      </div>
                    )}
                    
                    {selectedTab === 'courses' && (
                      <Can action="read" subject="Course">
                        <div data-testid="courses-content">
                          <h2 className="text-2xl font-bold mb-6">My Courses</h2>
                          <div className="space-y-4">
                            <Card className="p-4">
                              <h3 className="font-semibold">Introduction to React</h3>
                              <p className="text-sm text-gray-600">Progress: 75%</p>
                            </Card>
                            <Card className="p-4">
                              <h3 className="font-semibold">Advanced TypeScript</h3>
                              <p className="text-sm text-gray-600">Progress: 45%</p>
                            </Card>
                          </div>
                        </div>
                      </Can>
                    )}
                    
                    {selectedTab === 'create-course' && (
                      <Can action="create" subject="Course">
                        <div data-testid="create-course-content">
                          <h2 className="text-2xl font-bold mb-6">Create New Course</h2>
                          <Card className="p-6">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">Course Title</label>
                                <input 
                                  type="text" 
                                  className="w-full p-2 border rounded"
                                  placeholder="Enter course title"
                                  data-testid="course-title-input"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea 
                                  className="w-full p-2 border rounded"
                                  rows={4}
                                  placeholder="Enter course description"
                                  data-testid="course-description-input"
                                />
                              </div>
                              <Button data-testid="create-course-button">Create Course</Button>
                            </div>
                          </Card>
                        </div>
                      </Can>
                    )}
                    
                    {selectedTab === 'users' && (
                      <Can action="manage" subject="User">
                        <div data-testid="users-content">
                          <h2 className="text-2xl font-bold mb-6">User Management</h2>
                          <Card className="p-6">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">All Users</h3>
                                <Button size="sm" data-testid="add-user-button">Add User</Button>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 border rounded">
                                  <span>john.doe@example.com (Student)</span>
                                  <Button size="sm" variant="outline">Edit</Button>
                                </div>
                                <div className="flex items-center justify-between p-2 border rounded">
                                  <span>jane.smith@example.com (Instructor)</span>
                                  <Button size="sm" variant="outline">Edit</Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </Can>
                    )}
                    
                    {selectedTab === 'analytics' && (
                      <Can action="view" subject="Analytics">
                        <div data-testid="analytics-content">
                          <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="p-6">
                              <h3 className="text-lg font-semibold">Total Users</h3>
                              <p className="text-3xl font-bold text-blue-600">1,234</p>
                            </Card>
                            <Card className="p-6">
                              <h3 className="text-lg font-semibold">Active Courses</h3>
                              <p className="text-3xl font-bold text-green-600">56</p>
                            </Card>
                            <Card className="p-6">
                              <h3 className="text-lg font-semibold">Completions</h3>
                              <p className="text-3xl font-bold text-purple-600">789</p>
                            </Card>
                            <Card className="p-6">
                              <h3 className="text-lg font-semibold">Revenue</h3>
                              <p className="text-3xl font-bold text-orange-600">$12,345</p>
                            </Card>
                          </div>
                        </div>
                      </Can>
                    )}
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

describe('Authorization Integration with UI Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Student Role Authorization', () => {
    beforeEach(() => {
      currentUser = studentUser;
    });

    it('shows only student-accessible navigation items', () => {
      render(<RoleBasedApp />);

      // Should show basic navigation
      expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nav-courses')).toBeInTheDocument();

      // Should NOT show instructor/admin navigation
      expect(screen.queryByTestId('nav-create-course')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-users')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-analytics')).not.toBeInTheDocument();
    });

    it('shows only student-accessible dashboard cards', () => {
      render(<RoleBasedApp />);

      // Should show student card
      expect(screen.getByTestId('student-course-card')).toBeInTheDocument();
      expect(screen.getByText('My Courses')).toBeInTheDocument();

      // Should NOT show instructor/admin cards
      expect(screen.queryByTestId('instructor-course-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-user-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('analytics-card')).not.toBeInTheDocument();
    });

    it('allows navigation to accessible pages only', async () => {
      const user = userEvent.setup();
      render(<RoleBasedApp />);

      // Can navigate to courses
      await user.click(screen.getByTestId('nav-courses'));
      expect(screen.getByTestId('courses-content')).toBeInTheDocument();
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();

      // Navigation items for restricted content should not exist
      expect(screen.queryByTestId('nav-create-course')).not.toBeInTheDocument();
    });
  });

  describe('Instructor Role Authorization', () => {
    beforeEach(() => {
      currentUser = instructorUser;
    });

    it('shows instructor-accessible navigation items', () => {
      render(<RoleBasedApp />);

      // Should show basic + instructor navigation
      expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nav-courses')).toBeInTheDocument();
      expect(screen.getByTestId('nav-create-course')).toBeInTheDocument();

      // Should NOT show admin-only navigation
      expect(screen.queryByTestId('nav-users')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-analytics')).not.toBeInTheDocument();
    });

    it('shows instructor-accessible dashboard cards', () => {
      render(<RoleBasedApp />);

      // Should show student + instructor cards
      expect(screen.getByTestId('student-course-card')).toBeInTheDocument();
      expect(screen.getByTestId('instructor-course-card')).toBeInTheDocument();
      expect(screen.getByText('Course Creation')).toBeInTheDocument();

      // Should NOT show admin cards
      expect(screen.queryByTestId('admin-user-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('analytics-card')).not.toBeInTheDocument();
    });

    it('allows access to course creation interface', async () => {
      const user = userEvent.setup();
      render(<RoleBasedApp />);

      // Can navigate to course creation
      await user.click(screen.getByTestId('nav-create-course'));
      expect(screen.getByTestId('create-course-content')).toBeInTheDocument();
      expect(screen.getByTestId('course-title-input')).toBeInTheDocument();
      expect(screen.getByTestId('course-description-input')).toBeInTheDocument();
    });

    it('integrates course creation form with Phase 1 UI components', async () => {
      const user = userEvent.setup();
      render(<RoleBasedApp />);

      await user.click(screen.getByTestId('nav-create-course'));

      // Form should use Phase 1 components
      const titleInput = screen.getByTestId('course-title-input');
      const descriptionInput = screen.getByTestId('course-description-input');
      const createButton = screen.getByTestId('create-course-button');

      await user.type(titleInput, 'New Course Title');
      await user.type(descriptionInput, 'Course description here');

      expect(titleInput).toHaveValue('New Course Title');
      expect(descriptionInput).toHaveValue('Course description here');
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Admin Role Authorization', () => {
    beforeEach(() => {
      currentUser = adminUser;
    });

    it('shows all navigation items for admin', () => {
      render(<RoleBasedApp />);

      // Should show all navigation items
      expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nav-courses')).toBeInTheDocument();
      expect(screen.getByTestId('nav-create-course')).toBeInTheDocument();
      expect(screen.getByTestId('nav-users')).toBeInTheDocument();
      expect(screen.getByTestId('nav-analytics')).toBeInTheDocument();
    });

    it('shows all dashboard cards for admin', () => {
      render(<RoleBasedApp />);

      // Should show all cards
      expect(screen.getByTestId('student-course-card')).toBeInTheDocument();
      expect(screen.getByTestId('instructor-course-card')).toBeInTheDocument();
      expect(screen.getByTestId('admin-user-card')).toBeInTheDocument();
      expect(screen.getByTestId('analytics-card')).toBeInTheDocument();
    });

    it('allows access to user management interface', async () => {
      const user = userEvent.setup();
      render(<RoleBasedApp />);

      await user.click(screen.getByTestId('nav-users'));
      expect(screen.getByTestId('users-content')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByTestId('add-user-button')).toBeInTheDocument();
    });

    it('allows access to analytics dashboard', async () => {
      const user = userEvent.setup();
      render(<RoleBasedApp />);

      await user.click(screen.getByTestId('nav-analytics'));
      expect(screen.getByTestId('analytics-content')).toBeInTheDocument();
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });
  });

  describe('Layout Integration with Authorization', () => {
    it('maintains consistent layout structure across all roles', () => {
      // Test with different roles
      const roles = [studentUser, instructorUser, adminUser];
      
      roles.forEach(user => {
        currentUser = user;
        const { unmount } = render(<RoleBasedApp />);

        // Layout structure should be consistent
        expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
        expect(screen.getByRole('main')).toBeInTheDocument(); // Main
        expect(screen.getByRole('complementary')).toBeInTheDocument(); // Sidebar

        // User info should be displayed
        expect(screen.getByTestId('user-button')).toBeInTheDocument();
        expect(screen.getByText(`${user.firstName} Menu`)).toBeInTheDocument();

        unmount();
      });
    });

    it('maintains responsive behavior with role-based content', async () => {
      const user = userEvent.setup();
      currentUser = adminUser;
      render(<RoleBasedApp />);

      // Sidebar should contain role-based navigation
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toContainElement(screen.getByTestId('nav-users'));
      expect(sidebar).toContainElement(screen.getByTestId('nav-analytics'));

      // Content area should update based on navigation
      await user.click(screen.getByTestId('nav-analytics'));
      const main = screen.getByRole('main');
      expect(main).toContainElement(screen.getByTestId('analytics-content'));
    });
  });

  describe('Dynamic Role Changes', () => {
    it('updates UI when user role changes', () => {
      // Start as student
      currentUser = studentUser;
      const { rerender } = render(<RoleBasedApp />);

      expect(screen.getByTestId('student-course-card')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-user-card')).not.toBeInTheDocument();

      // Change to admin
      currentUser = adminUser;
      rerender(<RoleBasedApp />);

      expect(screen.getByTestId('student-course-card')).toBeInTheDocument();
      expect(screen.getByTestId('admin-user-card')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries with Authorization', () => {
    it('handles authorization errors gracefully within layout', () => {
      currentUser = studentUser;
      render(<RoleBasedApp />);

      // Layout should remain stable even if authorization fails
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });
  });
});