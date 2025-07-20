import type { Meta, StoryObj } from '@storybook/react'
import { ProtectedRoute } from './ProtectedRoute'

// Mock Clerk for Storybook
const mockUseAuth = jest.fn()
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth(),
  RedirectToSignIn: () => (
    <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <h3 className="text-lg font-medium">Redirecting to Sign In</h3>
        <p className="text-muted-foreground">Please wait while we redirect you...</p>
      </div>
    </div>
  ),
}))

const meta: Meta<typeof ProtectedRoute> = {
  title: 'Components/Auth/ProtectedRoute',
  component: ProtectedRoute,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A wrapper component that protects routes and content based on authentication status and user roles.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    requiredRole: {
      control: 'text',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const ProtectedContent = () => (
  <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
    <h2 className="text-xl font-semibold text-green-800">Protected Content</h2>
    <p className="text-green-700">This content is only visible to authenticated users.</p>
  </div>
)

export const AuthenticatedUser: Story = {
  args: {
    children: <ProtectedContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows protected content when user is authenticated.',
      },
    },
  },
  render: (args) => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        publicMetadata: {
          role: 'student',
        },
      },
    })
    
    return <ProtectedRoute {...args} />
  },
}

export const UnauthenticatedUser: Story = {
  args: {
    children: <ProtectedContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Redirects to sign in when user is not authenticated.',
      },
    },
  },
  render: (args) => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })
    
    return <ProtectedRoute {...args} />
  },
}

export const LoadingState: Story = {
  args: {
    children: <ProtectedContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows loading state while authentication is being checked.',
      },
    },
  },
  render: (args) => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
    })
    
    return <ProtectedRoute {...args} />
  },
}

export const CustomLoadingComponent: Story = {
  args: {
    children: <ProtectedContent />,
    loadingComponent: (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Custom loading message...</p>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows custom loading component while authentication is being checked.',
      },
    },
  },
  render: (args) => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
    })
    
    return <ProtectedRoute {...args} />
  },
}

export const RoleBasedAccessAllowed: Story = {
  args: {
    children: <ProtectedContent />,
    requiredRole: 'admin',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows protected content when user has the required role.',
      },
    },
  },
  render: (args) => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        publicMetadata: {
          role: 'admin',
        },
      },
    })
    
    return <ProtectedRoute {...args} />
  },
}

export const RoleBasedAccessDenied: Story = {
  args: {
    children: <ProtectedContent />,
    requiredRole: 'admin',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows access denied message when user does not have the required role.',
      },
    },
  },
  render: (args) => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        publicMetadata: {
          role: 'student',
        },
      },
    })
    
    return <ProtectedRoute {...args} />
  },
}

export const CustomFallbackComponent: Story = {
  args: {
    children: <ProtectedContent />,
    requiredRole: 'admin',
    fallbackComponent: (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-semibold text-red-800">Custom Access Denied</h2>
        <p className="text-red-700">You need admin privileges to view this content.</p>
        <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Request Access
        </button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows custom fallback component when access is denied.',
      },
    },
  },
  render: (args) => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        publicMetadata: {
          role: 'student',
        },
      },
    })
    
    return <ProtectedRoute {...args} />
  },
}