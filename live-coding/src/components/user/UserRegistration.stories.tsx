/**
 * UserRegistration Storybook Stories
 * 
 * Interactive documentation for the UserRegistration component
 * showcasing registration flow, role assignment, and onboarding steps.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { UserRegistration } from './UserRegistration'
import { AuthProvider } from '../auth/AuthProvider'
import { AuthorizationProvider } from '../authorization/AuthorizationProvider'
import { ThemeProvider } from '../providers/ThemeProvider'
import { UserRole } from '../../lib/authorization/roles'

const meta: Meta<typeof UserRegistration> = {
  title: 'User Management/UserRegistration',
  component: UserRegistration,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The UserRegistration component provides a comprehensive user registration and onboarding flow.

**Features:**
- Integration with Clerk authentication
- Role assignment (admin only)
- Multi-step onboarding process
- Profile completion and preferences setup
- Theme-aware styling and accessibility compliance

**Integration:**
- Uses Phase 1 UI components (Form, Input, Button)
- Integrates with Phase 2.1 authentication system
- Leverages Phase 2.2 authorization for role assignment
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <AuthProvider>
          <AuthorizationProvider>
            <div className="min-h-screen bg-background">
              <Story />
            </div>
          </AuthorizationProvider>
        </AuthProvider>
      </ThemeProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof UserRegistration>

// Mock authentication states for different scenarios
const mockAuthStates = {
  notSignedIn: {
    isSignedIn: false,
    isLoaded: true,
    user: null,
  },
  studentUser: {
    isSignedIn: true,
    isLoaded: true,
    user: {
      id: 'user_student',
      publicMetadata: { role: UserRole.STUDENT },
    },
  },
  adminUser: {
    isSignedIn: true,
    isLoaded: true,
    user: {
      id: 'user_admin',
      publicMetadata: { role: UserRole.ADMIN },
    },
  },
}

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default registration flow for new users with standard onboarding steps.',
      },
    },
  },
}

export const WithRoleSelection: Story = {
  args: {
    allowRoleSelection: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Registration flow with role selection enabled (admin only feature).',
      },
    },
  },
}

export const OnboardingStep1: Story = {
  args: {
    initialStep: 'profile',
  },
  parameters: {
    docs: {
      description: {
        story: 'First onboarding step focusing on profile completion.',
      },
    },
  },
}

export const OnboardingStep2: Story = {
  args: {
    initialStep: 'preferences',
  },
  parameters: {
    docs: {
      description: {
        story: 'Second onboarding step for setting user preferences.',
      },
    },
  },
}

export const OnboardingStep3: Story = {
  args: {
    initialStep: 'completion',
  },
  parameters: {
    docs: {
      description: {
        story: 'Final onboarding step with completion confirmation.',
      },
    },
  },
}

export const LoadingState: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Registration component in loading state during form submission.',
      },
    },
  },
}

export const ErrorState: Story = {
  args: {
    error: 'Registration failed. Please check your information and try again.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Registration component displaying error state with user feedback.',
      },
    },
  },
}

export const DarkTheme: Story = {
  args: {},
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <AuthorizationProvider>
            <div className="min-h-screen bg-background">
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
        story: 'Registration component in dark theme mode.',
      },
    },
  },
}

export const MobileView: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Registration component optimized for mobile devices.',
      },
    },
  },
}

export const TabletView: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Registration component on tablet-sized screens.',
      },
    },
  },
}