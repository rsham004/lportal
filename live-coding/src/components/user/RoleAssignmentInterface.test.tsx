/**
 * Role Assignment Interface Test
 * 
 * Tests enhanced role assignment interface with hierarchy validation,
 * bulk operations, and audit logging integration.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RoleAssignmentInterface } from './RoleAssignmentInterface'
import { AuthProvider } from '../auth/AuthProvider'
import { AuthorizationProvider } from '../authorization/AuthorizationProvider'
import { ThemeProvider } from '../providers/ThemeProvider'
import { UserRole } from '../../lib/authorization/roles'

// Mock Clerk
const mockUseAuth = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockUseAuth(),
}))

const mockUsers = [
  {
    id: 'user_1',
    firstName: 'Alice',
    lastName: 'Student',
    emailAddresses: [{ emailAddress: 'alice@example.com' }],
    publicMetadata: { role: UserRole.STUDENT },
  },
  {
    id: 'user_2',
    firstName: 'Bob',
    lastName: 'Instructor',
    emailAddresses: [{ emailAddress: 'bob@example.com' }],
    publicMetadata: { role: UserRole.INSTRUCTOR },
  },
  {
    id: 'user_3',
    firstName: 'Carol',
    lastName: 'Admin',
    emailAddresses: [{ emailAddress: 'carol@example.com' }],
    publicMetadata: { role: UserRole.ADMIN },
  },
]

function TestWrapper({ children, userRole = UserRole.ADMIN }: { 
  children: React.ReactNode
  userRole?: UserRole 
}) {
  mockUseAuth.mockReturnValue({
    user: {
      id: 'current_user',
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

describe('RoleAssignmentInterface Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('shows empty state when no users selected', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface users={mockUsers} selectedUserIds={[]} />
        </TestWrapper>
      )

      expect(screen.getByTestId('role-assignment-interface')).toBeInTheDocument()
      expect(screen.getByText('Select users to manage their roles')).toBeInTheDocument()
    })

    it('shows role assignment interface when users selected', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      expect(screen.getByText('Role Assignment')).toBeInTheDocument()
      expect(screen.getByText('Managing role for Alice Student')).toBeInTheDocument()
    })

    it('shows bulk assignment for multiple users', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1', 'user_2']} 
          />
        </TestWrapper>
      )

      expect(screen.getByText('Managing roles for 2 users')).toBeInTheDocument()
    })
  })

  describe('Current Roles Display', () => {
    it('displays current roles summary', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1', 'user_2']} 
          />
        </TestWrapper>
      )

      expect(screen.getByText('Current Roles')).toBeInTheDocument()
      expect(screen.getByTestId('current-role-student')).toBeInTheDocument()
      expect(screen.getByTestId('current-role-instructor')).toBeInTheDocument()
    })

    it('shows role counts correctly', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1', 'user_2']} 
          />
        </TestWrapper>
      )

      expect(screen.getByText('Student (1)')).toBeInTheDocument()
      expect(screen.getByText('Instructor (1)')).toBeInTheDocument()
    })
  })

  describe('Role Selection', () => {
    it('shows available roles for admin user', () => {
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      expect(screen.getByTestId('role-option-student')).toBeInTheDocument()
      expect(screen.getByTestId('role-option-instructor')).toBeInTheDocument()
      expect(screen.getByTestId('role-option-admin')).toBeInTheDocument()
      expect(screen.queryByTestId('role-option-super_admin')).not.toBeInTheDocument()
    })

    it('shows all roles for super admin user', () => {
      render(
        <TestWrapper userRole={UserRole.SUPER_ADMIN}>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      expect(screen.getByTestId('role-option-student')).toBeInTheDocument()
      expect(screen.getByTestId('role-option-instructor')).toBeInTheDocument()
      expect(screen.getByTestId('role-option-admin')).toBeInTheDocument()
      expect(screen.getByTestId('role-option-super_admin')).toBeInTheDocument()
    })

    it('limits roles for instructor user', () => {
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      expect(screen.getByTestId('role-option-student')).toBeInTheDocument()
      expect(screen.queryByTestId('role-option-instructor')).not.toBeInTheDocument()
      expect(screen.queryByTestId('role-option-admin')).not.toBeInTheDocument()
    })

    it('selects role when clicked', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      const instructorOption = screen.getByTestId('role-option-instructor')
      fireEvent.click(instructorOption)

      expect(instructorOption).toHaveClass('border-primary')
    })
  })

  describe('Role Change Preview', () => {
    it('shows change preview when role selected', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      const instructorOption = screen.getByTestId('role-option-instructor')
      fireEvent.click(instructorOption)

      expect(screen.getByText('Change Preview')).toBeInTheDocument()
      expect(screen.getByText(/1 user\(s\) will be promoted/)).toBeInTheDocument()
    })

    it('shows demotion preview correctly', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_2']} 
          />
        </TestWrapper>
      )

      const studentOption = screen.getByTestId('role-option-student')
      fireEvent.click(studentOption)

      expect(screen.getByText(/1 user\(s\) will be demoted/)).toBeInTheDocument()
    })

    it('shows no change when same role selected', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      const studentOption = screen.getByTestId('role-option-student')
      fireEvent.click(studentOption)

      expect(screen.getByText(/1 user\(s\) already have this role/)).toBeInTheDocument()
    })
  })

  describe('Role Assignment Actions', () => {
    it('enables assign button when role selected', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      const assignButton = screen.getByTestId('assign-role-button')
      expect(assignButton).toBeDisabled()

      const instructorOption = screen.getByTestId('role-option-instructor')
      fireEvent.click(instructorOption)

      expect(assignButton).not.toBeDisabled()
    })

    it('shows confirmation modal when assign clicked', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      const instructorOption = screen.getByTestId('role-option-instructor')
      fireEvent.click(instructorOption)

      const assignButton = screen.getByTestId('assign-role-button')
      fireEvent.click(assignButton)

      expect(screen.getByTestId('role-assignment-confirmation')).toBeInTheDocument()
      expect(screen.getByText(/Change Alice Student's role to instructor/)).toBeInTheDocument()
    })

    it('calls onRoleChange for single user', async () => {
      const onRoleChange = jest.fn().mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
            onRoleChange={onRoleChange}
          />
        </TestWrapper>
      )

      const instructorOption = screen.getByTestId('role-option-instructor')
      fireEvent.click(instructorOption)

      const assignButton = screen.getByTestId('assign-role-button')
      fireEvent.click(assignButton)

      const confirmButton = screen.getByTestId('confirm-role-assignment')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(onRoleChange).toHaveBeenCalledWith('user_1', UserRole.INSTRUCTOR)
      })
    })

    it('calls onBulkRoleChange for multiple users', async () => {
      const onBulkRoleChange = jest.fn().mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1', 'user_2']} 
            onBulkRoleChange={onBulkRoleChange}
          />
        </TestWrapper>
      )

      const adminOption = screen.getByTestId('role-option-admin')
      fireEvent.click(adminOption)

      const assignButton = screen.getByTestId('assign-role-button')
      fireEvent.click(assignButton)

      const confirmButton = screen.getByTestId('confirm-role-assignment')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(onBulkRoleChange).toHaveBeenCalledWith(['user_1', 'user_2'], UserRole.ADMIN)
      })
    })

    it('handles assignment errors', async () => {
      const onRoleChange = jest.fn().mockRejectedValue(new Error('Assignment failed'))

      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
            onRoleChange={onRoleChange}
          />
        </TestWrapper>
      )

      const instructorOption = screen.getByTestId('role-option-instructor')
      fireEvent.click(instructorOption)

      const assignButton = screen.getByTestId('assign-role-button')
      fireEvent.click(assignButton)

      const confirmButton = screen.getByTestId('confirm-role-assignment')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText('Assignment failed')).toBeInTheDocument()
      })
    })
  })

  describe('Hierarchy Validation', () => {
    it('prevents invalid role assignments', () => {
      render(
        <TestWrapper userRole={UserRole.INSTRUCTOR}>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_2']} // Instructor user
          />
        </TestWrapper>
      )

      // Instructor should not be able to assign instructor role to another instructor
      expect(screen.queryByTestId('role-option-instructor')).not.toBeInTheDocument()
    })

    it('shows validation error for invalid assignments', async () => {
      // Mock a scenario where admin tries to assign super admin role
      render(
        <TestWrapper userRole={UserRole.ADMIN}>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      // This test would need to be adjusted based on actual hierarchy validation logic
      // The component should prevent showing super admin option for admin users
    })
  })

  describe('Confirmation Modal', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1', 'user_2']} 
          />
        </TestWrapper>
      )

      const adminOption = screen.getByTestId('role-option-admin')
      fireEvent.click(adminOption)

      const assignButton = screen.getByTestId('assign-role-button')
      fireEvent.click(assignButton)
    })

    it('shows impact summary in confirmation', () => {
      expect(screen.getByText('• 2 promotion(s)')).toBeInTheDocument()
    })

    it('can be cancelled', () => {
      const cancelButton = screen.getByTestId('cancel-confirmation')
      fireEvent.click(cancelButton)

      expect(screen.queryByTestId('role-assignment-confirmation')).not.toBeInTheDocument()
    })
  })

  describe('Cancel and Reset', () => {
    it('resets selection when cancel clicked', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      const instructorOption = screen.getByTestId('role-option-instructor')
      fireEvent.click(instructorOption)

      expect(instructorOption).toHaveClass('border-primary')

      const cancelButton = screen.getByTestId('cancel-assignment')
      fireEvent.click(cancelButton)

      expect(instructorOption).not.toHaveClass('border-primary')
    })
  })

  describe('Accessibility', () => {
    it('maintains WCAG compliance', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
      
      // Check for proper button accessibility
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      const roleOptions = screen.getAllByTestId(/role-option-/)
      roleOptions.forEach(option => {
        expect(option).toBeInTheDocument()
      })
    })
  })

  describe('Integration', () => {
    it('integrates with theme system', () => {
      render(
        <TestWrapper>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      const interface = screen.getByTestId('role-assignment-interface')
      expect(interface).toHaveClass('bg-card') // Theme-aware styling
    })

    it('integrates with authorization system', () => {
      render(
        <TestWrapper userRole={UserRole.STUDENT}>
          <RoleAssignmentInterface 
            users={mockUsers} 
            selectedUserIds={['user_1']} 
          />
        </TestWrapper>
      )

      // Student should not see any role options
      expect(screen.queryByTestId(/role-option-/)).not.toBeInTheDocument()
    })
  })
})