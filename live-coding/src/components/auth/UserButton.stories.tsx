import type { Meta, StoryObj } from '@storybook/react'
import { UserButton } from './UserButton'

// Mock Clerk for Storybook
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: true,
    isLoaded: true,
  }),
  useUser: () => ({
    user: {
      id: 'user_123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com' }],
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    },
    isLoaded: true,
  }),
  UserButton: (props: any) => (
    <div className="flex items-center space-x-2 p-2 border rounded-md" {...props}>
      <img
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
        alt="User"
        className="h-8 w-8 rounded-full"
      />
      <span className="text-sm">John Doe</span>
    </div>
  ),
}))

const meta: Meta<typeof UserButton> = {
  title: 'Components/Auth/UserButton',
  component: UserButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A user button component that shows the authenticated user\'s avatar and provides access to user menu.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    afterSignOutUrl: {
      control: 'text',
    },
    showName: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithName: Story = {
  args: {
    showName: true,
  },
}

export const CustomSignOutUrl: Story = {
  args: {
    afterSignOutUrl: '/goodbye',
  },
}

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading state when user data is not yet loaded.',
      },
    },
  },
  render: () => {
    // Mock loading state
    jest.doMock('@clerk/nextjs', () => ({
      useAuth: () => ({
        isSignedIn: true,
        isLoaded: false,
      }),
      useUser: () => ({
        user: null,
        isLoaded: false,
      }),
      UserButton: () => (
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300" />
      ),
    }))
    
    return <UserButton />
  },
}

export const NotSignedIn: Story = {
  parameters: {
    docs: {
      description: {
        story: 'When user is not signed in, the component renders nothing.',
      },
    },
  },
  render: () => {
    // Mock not signed in state
    jest.doMock('@clerk/nextjs', () => ({
      useAuth: () => ({
        isSignedIn: false,
        isLoaded: true,
      }),
      useUser: () => ({
        user: null,
        isLoaded: true,
      }),
      UserButton: () => null,
    }))
    
    return <UserButton /> || <div className="text-muted-foreground">Not signed in - component renders nothing</div>
  },
}