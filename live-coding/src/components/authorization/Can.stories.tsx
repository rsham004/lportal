import type { Meta, StoryObj } from '@storybook/react'
import { Can } from './Can'
import { AuthorizationProvider } from './AuthorizationProvider'
import { UserRole } from '../../lib/authorization/roles'

// Mock Clerk for Storybook
const mockUseAuth = jest.fn()
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth(),
}))

const meta: Meta<typeof Can> = {
  title: 'Components/Authorization/Can',
  component: Can,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Conditionally renders children based on user permissions using CASL ability system.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      // Set up mock auth based on story parameters
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

export const StudentCanReadCourses: Story = {
  args: {
    action: 'read',
    subject: 'Course',
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Student can read courses</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Access denied</div>,
  },
  parameters: {
    userRole: UserRole.STUDENT,
  },
}

export const StudentCannotCreateCourses: Story = {
  args: {
    action: 'create',
    subject: 'Course',
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Student can create courses</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Students cannot create courses</div>,
  },
  parameters: {
    userRole: UserRole.STUDENT,
  },
}

export const InstructorCanCreateCourses: Story = {
  args: {
    action: 'create',
    subject: 'Course',
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Instructor can create courses</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Access denied</div>,
  },
  parameters: {
    userRole: UserRole.INSTRUCTOR,
  },
}

export const AdminCanManageUsers: Story = {
  args: {
    action: 'manage',
    subject: 'User',
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Admin can manage users</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Access denied</div>,
  },
  parameters: {
    userRole: UserRole.ADMIN,
  },
}

export const SuperAdminCanManageSystem: Story = {
  args: {
    action: 'manage',
    subject: 'System',
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Super Admin can manage system</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Access denied</div>,
  },
  parameters: {
    userRole: UserRole.SUPER_ADMIN,
  },
}

export const MultipleActions: Story = {
  args: {
    action: ['create', 'update'],
    subject: 'Course',
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Can create OR update courses</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Cannot create or update courses</div>,
  },
  parameters: {
    userRole: UserRole.INSTRUCTOR,
  },
}

export const ResourceSpecificPermission: Story = {
  args: {
    action: 'update',
    subject: 'Course',
    resource: { id: 'course_1', instructorId: 'user_123' },
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ Can edit own course</div>,
    fallback: <div className="p-4 bg-red-100 text-red-800 rounded">❌ Cannot edit this course</div>,
  },
  parameters: {
    userRole: UserRole.INSTRUCTOR,
  },
}

export const WithCustomFallback: Story = {
  args: {
    action: 'manage',
    subject: 'System',
    children: <div className="p-4 bg-green-100 text-green-800 rounded">✅ System management access</div>,
    fallback: (
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded border border-yellow-300">
        <h3 className="font-semibold">Upgrade Required</h3>
        <p className="text-sm mt-1">Contact your administrator for system management access.</p>
      </div>
    ),
  },
  parameters: {
    userRole: UserRole.ADMIN,
  },
}

export const RoleComparison: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Permission Comparison by Role</h3>
      
      {[UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].map(role => {
        mockUseAuth.mockReturnValue({
          isSignedIn: true,
          isLoaded: true,
          user: { id: 'user_123', publicMetadata: { role } },
        })

        return (
          <div key={role} className="border rounded-lg p-4">
            <h4 className="font-medium capitalize mb-2">{role.replace('_', ' ')}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Can action="read" subject="Course">
                <span className="text-green-600">✅ Read Courses</span>
              </Can>
              <Can action="read" subject="Course" fallback={<span className="text-red-600">❌ Read Courses</span>} />
              
              <Can action="create" subject="Course">
                <span className="text-green-600">✅ Create Courses</span>
              </Can>
              <Can action="create" subject="Course" fallback={<span className="text-red-600">❌ Create Courses</span>} />
              
              <Can action="manage" subject="User">
                <span className="text-green-600">✅ Manage Users</span>
              </Can>
              <Can action="manage" subject="User" fallback={<span className="text-red-600">❌ Manage Users</span>} />
              
              <Can action="manage" subject="System">
                <span className="text-green-600">✅ Manage System</span>
              </Can>
              <Can action="manage" subject="System" fallback={<span className="text-red-600">❌ Manage System</span>} />
            </div>
          </div>
        )
      })}
    </div>
  ),
}