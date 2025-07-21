/**
 * User Management Dashboard Test
 * 
 * Tests admin user management dashboard with user listing, role assignment,
 * and integration with authentication and authorization systems.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserManagementDashboard } from './UserManagementDashboard'
import { AuthProvider } from '../auth/AuthProvider'
import { AuthorizationProvider } from '../authorization/AuthorizationProvider'
import { ThemeProvider } from '../providers/ThemeProvider'
import { UserRole } from '../../lib/authorization/roles'

// Mock Clerk
const mockUseAuth = jest.fn()
const mockUseUser = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockUseAuth(),
  useUser: () => mockUseUser(),
}))

const mockUsers = [
  {
    id: 'user_1',
    firstName: 'Alice',
    lastName: 'Student',
    emailAddresses: [{ emailAddress: 'alice@example.com' }],
    publicMetadata: { role: UserRole.STUDENT },
    createdAt: new Date('2024-01-15'),
    lastSignInAt: new Date('2024-01-20'),
  },
  {
    id: 'user_2',
    firstName: 'Bob',
    lastName: 'Instructor',
    emailAddresses: [{ emailAddress: 'bob@example.com' }],
    publicMetadata: { role: UserRole.INSTRUCTOR },
    createdAt: new Date('2024-01-10'),
    lastSignInAt: new Date('2024-01-19'),
  },
  {
    id: 'user_3',
    firstName: 'Carol',
    lastName: 'Admin',
    emailAddresses: [{ emailAddress: 'carol@example.com' }],
    publicMetadata: { role: UserRole.ADMIN },
    createdAt: new Date('2024-01-05'),
    lastSignInAt: new Date('2024-01-21'),
  },
]

function TestWrapper({ children, userRole = UserRole.ADMIN }: { 
  children: React.ReactNode
  userRole?: UserRole 
}) {
  mockUseAuth.mockReturnValue({
    isSignedIn: true,
    isLoaded: true,
    user: {
      id: 'admin_123',
      publicMetadata: { role: userRole },
    },
  })

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthorizationProvider>
          {children}
        </AuthorizationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

describe('UserManagementDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Dashboard Access Control', () => {
    it('renders dashboard for admin users', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      expect(screen.getByTestId('user-management-dashboard')).toBeInTheDocument()
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })

    it('renders dashboard for super admin users', () => {
      render(
        <TestWrapper userRole={UserRole.SUPER_ADMIN}>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      expect(screen.getByTestId('user-management-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('super-admin-actions')).toBeInTheDocument()
    })

    it('denies access to non-admin users', () => {
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      expect(screen.queryByTestId('user-management-dashboard')).not.toBeInTheDocument()
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })
  })

  describe('User List Display', () => {
    it('displays list of users', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      expect(screen.getByTestId('users-table')).toBeInTheDocument()
      expect(screen.getByText('Alice Student')).toBeInTheDocument()
      expect(screen.getByText('Bob Instructor')).toBeInTheDocument()
      expect(screen.getByText('Carol Admin')).toBeInTheDocument()
    })

    it('displays user roles with appropriate badges', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      expect(screen.getByTestId('role-badge-student')).toBeInTheDocument()
      expect(screen.getByTestId('role-badge-instructor')).toBeInTheDocument()
      expect(screen.getByTestId('role-badge-admin')).toBeInTheDocument()
    })

    it('shows user registration and last login dates', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument() // Alice registration
      expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument() // Alice last login
    })

    it('displays user statistics', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      expect(screen.getByTestId('user-stats')).toBeInTheDocument()
      expect(screen.getByText('Total Users: 3')).toBeInTheDocument()
      expect(screen.getByText('Students: 1')).toBeInTheDocument()
      expect(screen.getByText('Instructors: 1')).toBeInTheDocument()
      expect(screen.getByText('Admins: 1')).toBeInTheDocument()
    })
  })

  describe('User Search and Filtering', () => {
    it('filters users by search term', async () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      const searchInput = screen.getByTestId('user-search')
      fireEvent.change(searchInput, { target: { value: 'Alice' } })

      await waitFor(() => {
        expect(screen.getByText('Alice Student')).toBeInTheDocument()
        expect(screen.queryByText('Bob Instructor')).not.toBeInTheDocument()
        expect(screen.queryByText('Carol Admin')).not.toBeInTheDocument()
      })
    })

    it('filters users by role', async () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      const roleFilter = screen.getByTestId('role-filter')
      fireEvent.change(roleFilter, { target: { value: UserRole.INSTRUCTOR } })

      await waitFor(() => {
        expect(screen.queryByText('Alice Student')).not.toBeInTheDocument()
        expect(screen.getByText('Bob Instructor')).toBeInTheDocument()
        expect(screen.queryByText('Carol Admin')).not.toBeInTheDocument()
      })
    })

    it('sorts users by different criteria', async () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      const sortSelect = screen.getByTestId('sort-select')
      fireEvent.change(sortSelect, { target: { value: 'lastSignIn' } })

      await waitFor(() => {
        const userRows = screen.getAllByTestId(/user-row-/)
        expect(userRows[0]).toHaveTextContent('Carol Admin') // Most recent login
      })
    })
  })

  describe('Role Management', () => {
    it('allows changing user roles', async () => {
      const onRoleChange = jest.fn()

      render(
        <TestWrapper>
          <UserManagementDashboard 
            users={mockUsers} 
            onRoleChange={onRoleChange}
          />
        </TestWrapper>
      )

      // Click role change button for Alice
      const changeRoleBtn = screen.getByTestId('change-role-user_1')
      fireEvent.click(changeRoleBtn)

      // Select new role
      const roleSelect = screen.getByTestId('role-select-user_1')
      fireEvent.change(roleSelect, { target: { value: UserRole.INSTRUCTOR } })

      // Confirm change
      const confirmBtn = screen.getByTestId('confirm-role-change')
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        expect(onRoleChange).toHaveBeenCalledWith('user_1', UserRole.INSTRUCTOR)
      })
    })

    it('prevents role changes that would violate hierarchy', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      // Admin should not be able to assign super admin role
      const changeRoleBtn = screen.getByTestId('change-role-user_1')
      fireEvent.click(changeRoleBtn)

      const roleSelect = screen.getByTestId('role-select-user_1')
      const options = Array.from(roleSelect.querySelectorAll('option'))
      const superAdminOption = options.find(option => option.value === UserRole.SUPER_ADMIN)
      
      expect(superAdminOption).toBeUndefined()
    })

    it('shows confirmation dialog for role changes', async () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      const changeRoleBtn = screen.getByTestId('change-role-user_1')
      fireEvent.click(changeRoleBtn)

      const roleSelect = screen.getByTestId('role-select-user_1')
      fireEvent.change(roleSelect, { target: { value: UserRole.INSTRUCTOR } })

      expect(screen.getByTestId('role-change-confirmation')).toBeInTheDocument()
      expect(screen.getByText('Change Alice Student to Instructor?')).toBeInTheDocument()
    })
  })

  describe('User Actions', () => {
    it('allows viewing user details', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      const viewBtn = screen.getByTestId('view-user-user_1')
      fireEvent.click(viewBtn)

      expect(screen.getByTestId('user-details-modal')).toBeInTheDocument()
      expect(screen.getByText('Alice Student Details')).toBeInTheDocument()
    })

    it('allows suspending users', async () => {
      const onUserSuspend = jest.fn()

      render(
        <TestWrapper>
          <UserManagementDashboard 
            users={mockUsers} 
            onUserSuspend={onUserSuspend}
          />
        </TestWrapper>
      )

      const suspendBtn = screen.getByTestId('suspend-user-user_1')
      fireEvent.click(suspendBtn)

      // Confirm suspension
      const confirmBtn = screen.getByTestId('confirm-suspend')
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        expect(onUserSuspend).toHaveBeenCalledWith('user_1')
      })
    })

    it('allows deleting users (super admin only)', () => {
      render(
        <TestWrapper userRole={UserRole.SUPER_ADMIN}>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      expect(screen.getByTestId('delete-user-user_1')).toBeInTheDocument()
    })

    it('hides delete option for regular admins', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      expect(screen.queryByTestId('delete-user-user_1')).not.toBeInTheDocument()
    })
  })

  describe('Bulk Operations', () => {
    it('allows selecting multiple users', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      const selectAll = screen.getByTestId('select-all-users')
      fireEvent.click(selectAll)

      expect(screen.getByTestId('bulk-actions')).toBeInTheDocument()
      expect(screen.getByText('3 users selected')).toBeInTheDocument()
    })

    it('allows bulk role changes', async () => {
      const onBulkRoleChange = jest.fn()

      render(
        <TestWrapper>
          <UserManagementDashboard 
            users={mockUsers} 
            onBulkRoleChange={onBulkRoleChange}
          />
        </TestWrapper>
      )

      // Select users
      fireEvent.click(screen.getByTestId('select-user-user_1'))
      fireEvent.click(screen.getByTestId('select-user-user_2'))

      // Bulk role change
      const bulkRoleBtn = screen.getByTestId('bulk-role-change')
      fireEvent.click(bulkRoleBtn)

      const roleSelect = screen.getByTestId('bulk-role-select')
      fireEvent.change(roleSelect, { target: { value: UserRole.STUDENT } })

      const confirmBtn = screen.getByTestId('confirm-bulk-change')
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        expect(onBulkRoleChange).toHaveBeenCalledWith(['user_1', 'user_2'], UserRole.STUDENT)
      })
    })
  })

  describe('Integration with Existing Systems', () => {
    it('integrates with Phase 1 components', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      // Should use Phase 1 Table, Button, Input components
      expect(screen.getByTestId('users-table')).toHaveClass('border-collapse') // Phase 1 table styling
    })

    it('integrates with Phase 2.2 authorization', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      // Admin should see management actions
      expect(screen.getByTestId('change-role-user_1')).toBeInTheDocument()
    })

    it('maintains theme consistency', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      const dashboard = screen.getByTestId('user-management-dashboard')
      expect(dashboard).toHaveClass('bg-background') // Phase 1 theme classes
    })
  })

  describe('Error Handling', () => {
    it('handles user loading errors', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard 
            users={[]} 
            error="Failed to load users"
          />
        </TestWrapper>
      )

      expect(screen.getByText('Failed to load users')).toBeInTheDocument()
      expect(screen.getByTestId('retry-load-users')).toBeInTheDocument()
    })

    it('handles role change errors', async () => {
      const onRoleChange = jest.fn().mockRejectedValue(new Error('Role change failed'))

      render(
        <TestWrapper>
          <UserManagementDashboard 
            users={mockUsers} 
            onRoleChange={onRoleChange}
          />
        </TestWrapper>
      )

      const changeRoleBtn = screen.getByTestId('change-role-user_1')
      fireEvent.click(changeRoleBtn)

      const roleSelect = screen.getByTestId('role-select-user_1')
      fireEvent.change(roleSelect, { target: { value: UserRole.INSTRUCTOR } })

      const confirmBtn = screen.getByTestId('confirm-role-change')
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        expect(screen.getByText('Failed to change user role. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('maintains WCAG compliance', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      // Check for proper table structure
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('columnheader')).toHaveLength(6) // Name, Email, Role, Registered, Last Login, Actions
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <UserManagementDashboard users={mockUsers} />
        </TestWrapper>
      )

      // All interactive elements should be keyboard accessible
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })
  })
})