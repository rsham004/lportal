/**
 * UserProfile Storybook Stories
 * 
 * Interactive documentation for the UserProfile component
 * showcasing profile viewing, editing, and management capabilities.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { UserProfile } from './UserProfile'
import { AuthProvider } from '../auth/AuthProvider'
import { AuthorizationProvider } from '../authorization/AuthorizationProvider'
import { ThemeProvider } from '../providers/ThemeProvider'
import { UserRole } from '../../lib/authorization/roles'

const meta: Meta<typeof UserProfile> = {
  title: 'User Management/UserProfile',
  component: UserProfile,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The UserProfile component provides comprehensive user profile management functionality.

**Features:**
- Profile viewing and editing capabilities
- Preferences management
- Role management (admin only)
- Activity history display
- Theme-aware styling and accessibility compliance

**Access Control:**
- Users can edit their own profiles
- Admins can edit any user profile
- Role changes require appropriate permissions

**Integration:**
- Uses Phase 1 UI components (Form, Input, Button, Card)
- Integrates with Phase 2.1 authentication system
- Leverages Phase 2.2 authorization for access control
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
type Story = StoryObj<typeof UserProfile>

// Mock user data for different scenarios
const mockUsers = {
  student: {
    id: 'user_student_123',
    firstName: 'Alice',
    lastName: 'Johnson',
    emailAddresses: [{ emailAddress: 'alice.johnson@example.com' }],
    publicMetadata: { 
      role: UserRole.STUDENT,
      preferences: {
        theme: 'system',
        notifications: true,
        language: 'en',
      }
    },
    createdAt: new Date('2024-01-15'),
    lastSignInAt: new Date('2024-01-20'),
  },
  instructor: {
    id: 'user_instructor_456',
    firstName: 'Bob',
    lastName: 'Smith',
    emailAddresses: [{ emailAddress: 'bob.smith@example.com' }],
    publicMetadata: { 
      role: UserRole.INSTRUCTOR,
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en',
      }
    },
    createdAt: new Date('2024-01-10'),
    lastSignInAt: new Date('2024-01-19'),
  },
  admin: {
    id: 'user_admin_789',
    firstName: 'Carol',
    lastName: 'Davis',
    emailAddresses: [{ emailAddress: 'carol.davis@example.com' }],
    publicMetadata: { 
      role: UserRole.ADMIN,
      preferences: {
        theme: 'light',
        notifications: false,
        language: 'en',
      }
    },
    createdAt: new Date('2024-01-05'),
    lastSignInAt: new Date('2024-01-21'),
  },
}

export const StudentProfile: Story = {
  args: {
    user: mockUsers.student,
    isOwnProfile: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Student user viewing and editing their own profile.',
      },
    },
  },
}

export const InstructorProfile: Story = {
  args: {
    user: mockUsers.instructor,
    isOwnProfile: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Instructor user managing their profile with additional capabilities.',
      },
    },
  },
}

export const AdminProfile: Story = {
  args: {
    user: mockUsers.admin,
    isOwnProfile: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin user with full profile management capabilities.',
      },
    },
  },
}

export const ViewOnlyProfile: Story = {
  args: {
    user: mockUsers.student,
    isOwnProfile: false,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile in view-only mode (when viewing another user\'s profile).',
      },
    },
  },
}

export const AdminViewingUserProfile: Story = {
  args: {
    user: mockUsers.student,
    isOwnProfile: false,
    canEdit: true,
    canChangeRole: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin viewing and managing another user\'s profile with role change capabilities.',
      },
    },
  },
}

export const EditMode: Story = {
  args: {
    user: mockUsers.student,
    isOwnProfile: true,
    initialMode: 'edit',
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile component in edit mode with form fields enabled.',
      },
    },
  },
}

export const PreferencesTab: Story = {
  args: {
    user: mockUsers.instructor,
    isOwnProfile: true,
    initialTab: 'preferences',
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile component showing the preferences management tab.',
      },
    },
  },
}

export const ActivityTab: Story = {
  args: {
    user: mockUsers.admin,
    isOwnProfile: true,
    initialTab: 'activity',
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile component displaying user activity history.',
      },
    },
  },
}

export const LoadingState: Story = {
  args: {
    user: mockUsers.student,
    isOwnProfile: true,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile component in loading state during data fetch or update.',
      },
    },
  },
}

export const ErrorState: Story = {
  args: {
    user: mockUsers.student,
    isOwnProfile: true,
    error: 'Failed to update profile. Please try again.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile component displaying error state with user feedback.',
      },
    },
  },
}

export const DarkTheme: Story = {
  args: {
    user: mockUsers.instructor,
    isOwnProfile: true,
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
        story: 'Profile component in dark theme mode.',
      },
    },
  },
}

export const MobileView: Story = {
  args: {
    user: mockUsers.student,
    isOwnProfile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Profile component optimized for mobile devices.',
      },
    },
  },
}

export const TabletView: Story = {
  args: {
    user: mockUsers.admin,
    isOwnProfile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Profile component on tablet-sized screens.',
      },
    },
  },
}