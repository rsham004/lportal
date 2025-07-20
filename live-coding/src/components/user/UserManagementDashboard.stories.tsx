/**
 * UserManagementDashboard Storybook Stories
 * 
 * Interactive documentation for the UserManagementDashboard component
 * showcasing admin user management, role assignment, and bulk operations.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { UserManagementDashboard } from './UserManagementDashboard'
import { AuthProvider } from '../auth/AuthProvider'
import { AuthorizationProvider } from '../authorization/AuthorizationProvider'
import { ThemeProvider } from '../providers/ThemeProvider'
import { UserRole } from '../../lib/authorization/roles'

const meta: Meta<typeof UserManagementDashboard> = {
  title: 'User Management/UserManagementDashboard',
  component: UserManagementDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The UserManagementDashboard component provides comprehensive admin functionality for managing users.

**Features:**
- User listing with search and filtering
- Role management and assignment
- Bulk operations for multiple users
- User statistics and analytics
- User actions (suspend, delete)
- Activity monitoring and audit trails

**Access Control:**
- Admin and Super Admin access only
- Role hierarchy enforcement
- Audit logging for all actions

**Integration:**
- Uses Phase 1 UI components (Table, Button, Input, Card)
- Integrates with Phase 2.1 authentication system
- Leverages Phase 2.2 authorization for access control
- Maintains audit logging for security compliance
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <AuthProvider>
          <AuthorizationProvider>
            <div className="min-h-screen bg-background p-6">
              <Story />
            </div>
          </AuthorizationProvider>
        </AuthProvider>
      </ThemeProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof UserManagementDashboard>

// Mock user data for dashboard
const mockUsers = [
  {
    id: 'user_1',
    firstName: 'Alice',
    lastName: 'Johnson',
    emailAddresses: [{ emailAddress: 'alice.johnson@example.com' }],
    publicMetadata: { role: UserRole.STUDENT },
    createdAt: new Date('2024-01-15'),
    lastSignInAt: new Date('2024-01-20'),
  },
  {
    id: 'user_2',
    firstName: 'Bob',
    lastName: 'Smith',
    emailAddresses: [{ emailAddress: 'bob.smith@example.com' }],
    publicMetadata: { role: UserRole.INSTRUCTOR },
    createdAt: new Date('2024-01-10'),
    lastSignInAt: new Date('2024-01-19'),
  },
  {
    id: 'user_3',
    firstName: 'Carol',
    lastName: 'Davis',
    emailAddresses: [{ emailAddress: 'carol.davis@example.com' }],
    publicMetadata: { role: UserRole.ADMIN },
    createdAt: new Date('2024-01-05'),
    lastSignInAt: new Date('2024-01-21'),
  },
  {
    id: 'user_4',
    firstName: 'David',
    lastName: 'Wilson',
    emailAddresses: [{ emailAddress: 'david.wilson@example.com' }],
    publicMetadata: { role: UserRole.STUDENT },
    createdAt: new Date('2024-01-12'),
    lastSignInAt: new Date('2024-01-18'),
  },
  {
    id: 'user_5',
    firstName: 'Eva',
    lastName: 'Brown',
    emailAddresses: [{ emailAddress: 'eva.brown@example.com' }],
    publicMetadata: { role: UserRole.INSTRUCTOR },
    createdAt: new Date('2024-01-08'),
    lastSignInAt: new Date('2024-01-22'),
  },
  {
    id: 'user_6',
    firstName: 'Frank',
    lastName: 'Miller',
    emailAddresses: [{ emailAddress: 'frank.miller@example.com' }],
    publicMetadata: { role: UserRole.STUDENT },
    createdAt: new Date('2024-01-20'),
    lastSignInAt: null, // Never signed in
  },
]

const largeMockUsers = Array.from({ length: 50 }, (_, i) => ({
  id: `user_${i + 7}`,
  firstName: `User${i + 7}`,
  lastName: `LastName${i + 7}`,
  emailAddresses: [{ emailAddress: `user${i + 7}@example.com` }],
  publicMetadata: { 
    role: [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN][i % 3] as UserRole 
  },
  createdAt: new Date(2024, 0, Math.floor(Math.random() * 30) + 1),
  lastSignInAt: Math.random() > 0.1 ? new Date(2024, 0, Math.floor(Math.random() * 30) + 1) : null,
}))

export const AdminDashboard: Story = {
  args: {
    users: mockUsers,
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin user management dashboard with standard user list and management capabilities.',
      },
    },
  },
}

export const SuperAdminDashboard: Story = {
  args: {
    users: mockUsers,
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <AuthProvider>
          <AuthorizationProvider>
            <div className="min-h-screen bg-background p-6">
              <Story />
            </div>
          </AuthorizationProvider>
        </AuthProvider>
      </ThemeProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Super Admin dashboard with additional capabilities like user deletion and system management.',
      },
    },
  },
}

export const LargeUserList: Story = {
  args: {
    users: [...mockUsers, ...largeMockUsers],
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with a large number of users to demonstrate search, filtering, and pagination capabilities.',
      },
    },
  },
}

export const EmptyUserList: Story = {
  args: {
    users: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with no users to show empty state handling.',
      },
    },
  },
}

export const LoadingState: Story = {
  args: {
    users: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard in loading state while fetching user data.',
      },
    },
  },
}

export const ErrorState: Story = {
  args: {
    users: [],
    error: 'Failed to load users. Please check your connection and try again.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard displaying error state with retry functionality.',
      },
    },
  },
}

export const FilteredByRole: Story = {
  args: {
    users: mockUsers,
    initialFilters: {
      role: UserRole.STUDENT,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with role filter applied to show only students.',
      },
    },
  },
}

export const SearchResults: Story = {
  args: {
    users: mockUsers,
    initialFilters: {
      search: 'Alice',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard showing search results for a specific user.',
      },
    },
  },
}

export const BulkSelection: Story = {
  args: {
    users: mockUsers,
    initialSelection: ['user_1', 'user_2', 'user_4'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with multiple users selected for bulk operations.',
      },
    },
  },
}

export const RoleChangeModal: Story = {
  args: {
    users: mockUsers,
    showRoleChangeModal: {
      userId: 'user_1',
      currentRole: UserRole.STUDENT,
      newRole: UserRole.INSTRUCTOR,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard showing role change confirmation modal.',
      },
    },
  },
}

export const UserDetailsModal: Story = {
  args: {
    users: mockUsers,
    showUserDetails: 'user_2',
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with user details modal open for viewing user information.',
      },
    },
  },
}

export const DarkTheme: Story = {
  args: {
    users: mockUsers,
  },
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <AuthorizationProvider>
            <div className="min-h-screen bg-background p-6">
              <Story />
            </div>
          </AuthorizationProvider>
        </AuthProvider>
      </ThemeProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard in dark theme mode.',
      },
    },
  },
}

export const MobileView: Story = {
  args: {
    users: mockUsers.slice(0, 3), // Fewer users for mobile demo
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Dashboard optimized for mobile devices with responsive table and actions.',
      },
    },
  },
}

export const TabletView: Story = {
  args: {
    users: mockUsers,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Dashboard on tablet-sized screens with optimized layout.',
      },
    },
  },
}

export const InteractiveDemo: Story = {
  args: {
    users: mockUsers,
    onRoleChange: async (userId: string, newRole: UserRole) => {
      console.log(`Role change: User ${userId} to ${newRole}`)
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
    onUserSuspend: async (userId: string) => {
      console.log(`Suspend user: ${userId}`)
      await new Promise(resolve => setTimeout(resolve, 500))
    },
    onUserDelete: async (userId: string) => {
      console.log(`Delete user: ${userId}`)
      await new Promise(resolve => setTimeout(resolve, 500))
    },
    onBulkRoleChange: async (userIds: string[], newRole: UserRole) => {
      console.log(`Bulk role change: ${userIds.length} users to ${newRole}`)
      await new Promise(resolve => setTimeout(resolve, 1500))
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive dashboard with working callbacks for testing user management actions.',
      },
    },
  },
}