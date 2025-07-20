import type { Meta, StoryObj } from '@storybook/react'
import { RoleGuard, MinimumRole, ExactRole } from './RoleGuard'
import { AuthorizationProvider } from './AuthorizationProvider'
import { UserRole } from '../../lib/authorization/roles'

// Mock Clerk for Storybook
const mockUseAuth = jest.fn()
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth(),
}))

const meta: Meta<typeof RoleGuard> = {
  title: 'Components/Authorization/RoleGuard',
  component: RoleGuard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Guards content based on user roles with support for role hierarchy.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const role = context.parameters?.userRole || UserRole.STUDENT
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        isLoaded: true,
        user: {
          id: 'user_123',
          publicMetadata: { role },
        },
      })

      return (
        <AuthorizationProvider>
          <Story />
        </AuthorizationProvider>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const StudentAccess: Story = {
  args: {
    allowedRoles: [UserRole.STUDENT],
    children: <div className="p-4 bg-blue-100 text-blue-800 rounded">📚 Student Dashboard Content</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Access denied</div>,
  },
  parameters: {
    userRole: UserRole.STUDENT,
  },
}

export const InstructorAccess: Story = {
  args: {
    allowedRoles: [UserRole.INSTRUCTOR],
    children: <div className="p-4 bg-green-100 text-green-800 rounded">🎓 Instructor Dashboard Content</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Instructor access required</div>,
  },
  parameters: {
    userRole: UserRole.INSTRUCTOR,
  },
}

export const AdminAccess: Story = {
  args: {
    allowedRoles: [UserRole.ADMIN],
    children: <div className="p-4 bg-purple-100 text-purple-800 rounded">⚙️ Admin Panel Content</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Admin access required</div>,
  },
  parameters: {
    userRole: UserRole.ADMIN,
  },
}

export const SuperAdminAccess: Story = {
  args: {
    allowedRoles: [UserRole.SUPER_ADMIN],
    children: <div className="p-4 bg-red-100 text-red-800 rounded">🔐 Super Admin System Settings</div>,
    fallback: <div className="p-4 bg-gray-100 text-gray-800 rounded">❌ Super Admin access required</div>,
  },
  parameters: {
    userRole: UserRole.SUPER_ADMIN,
  },
}

export const MultipleRoles: Story = {
  args: {
    allowedRoles: [UserRole.INSTRUCTOR, UserRole.ADMIN],
    children: <div className="p-4 bg-yellow-100 text-yellow-800 rounded">👥 Staff Area (Instructors & Admins)</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Staff access required</div>,
  },
  parameters: {
    userRole: UserRole.INSTRUCTOR,
  },
}

export const HierarchyAllowed: Story = {
  args: {
    allowedRoles: [UserRole.ADMIN],
    requireExact: false,
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Super Admin can access Admin content (hierarchy)</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Access denied</div>,
  },
  parameters: {
    userRole: UserRole.SUPER_ADMIN,
  },
}

export const ExactRoleRequired: Story = {
  args: {
    allowedRoles: [UserRole.ADMIN],
    requireExact: true,
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Exact Admin role required</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Exact Admin role required (Super Admin denied)</div>,
  },
  parameters: {
    userRole: UserRole.SUPER_ADMIN,
  },
}

export const AccessDenied: Story = {
  args: {
    allowedRoles: [UserRole.ADMIN],
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Admin content</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Student cannot access admin content</div>,
  },
  parameters: {
    userRole: UserRole.STUDENT,
  },
}

export const CustomFallback: Story = {
  args: {
    allowedRoles: [UserRole.INSTRUCTOR],
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Course Management</div>,
    fallback: (
      <div className="p-4 bg-blue-100 text-blue-800 rounded border border-blue-300">
        <h3 className="font-semibold">Become an Instructor</h3>
        <p className="text-sm mt-1">Apply to become an instructor to access course management features.</p>
        <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">Apply Now</button>
      </div>
    ),
  },
  parameters: {
    userRole: UserRole.STUDENT,
  },
}

export const LoadingState: Story = {
  args: {
    allowedRoles: [UserRole.STUDENT],
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Content loaded</div>,
    loading: <div className="p-4 bg-gray-100 text-gray-600 rounded">🔄 Loading permissions...</div>,
  },
  decorators: [
    (Story) => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        isLoaded: false,
        user: null,
      })

      return (
        <AuthorizationProvider>
          <Story />
        </AuthorizationProvider>
      )
    },
  ],
}

// MinimumRole component stories
export const MinimumRoleInstructor: Story = {
  render: () => (
    <MinimumRole 
      role={UserRole.INSTRUCTOR}
      fallback={<div className="p-4 bg-red-100 text-red-800 rounded">❌ Instructor level required</div>}
    >
      <div className="p-4 bg-green-100 text-green-800 rounded">✅ Instructor+ content (Admin can access)</div>
    </MinimumRole>
  ),
  parameters: {
    userRole: UserRole.ADMIN,
  },
}

// ExactRole component stories
export const ExactRoleOnly: Story = {
  render: () => (
    <ExactRole 
      role={UserRole.ADMIN}
      fallback={<div className="p-4 bg-red-100 text-red-800 rounded">❌ Exact Admin role required</div>}
    >
      <div className="p-4 bg-purple-100 text-purple-800 rounded">✅ Admin only content</div>
    </ExactRole>
  ),
  parameters: {
    userRole: UserRole.ADMIN,
  },
}

export const RoleHierarchyDemo: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <h3 className="text-lg font-semibold">Role Hierarchy Demonstration</h3>
      <p className="text-sm text-gray-600">Current user: Super Admin</p>
      
      <div className="space-y-2">
        <RoleGuard allowedRoles={[UserRole.STUDENT]}>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">✅ Student level content</div>
        </RoleGuard>
        
        <RoleGuard allowedRoles={[UserRole.INSTRUCTOR]}>
          <div className="p-3 bg-green-50 border border-green-200 rounded">✅ Instructor level content</div>
        </RoleGuard>
        
        <RoleGuard allowedRoles={[UserRole.ADMIN]}>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded">✅ Admin level content</div>
        </RoleGuard>
        
        <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
          <div className="p-3 bg-red-50 border border-red-200 rounded">✅ Super Admin only content</div>
        </RoleGuard>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          Super Admin can access all content above due to role hierarchy.
        </p>
      </div>
    </div>
  ),
  parameters: {
    userRole: UserRole.SUPER_ADMIN,
  },
}