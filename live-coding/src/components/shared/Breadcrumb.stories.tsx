import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';

// Mock Next.js router
const mockUsePathname = (pathname: string) => {
  return () => pathname;
};

const meta: Meta<typeof Breadcrumb> = {
  title: 'Shared/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/dashboard',
      },
    },
  },
};

export const CoursePage: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/courses',
      },
    },
  },
};

export const DeepNesting: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/courses/javascript-fundamentals/lessons/variables-and-data-types',
      },
    },
  },
};

export const WithoutHomeIcon: Story = {
  args: {
    homeIcon: false,
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/courses/javascript-fundamentals',
      },
    },
  },
};

export const CustomSeparator: Story = {
  args: {
    separator: <span className="text-muted-foreground">/</span>,
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/courses/javascript-fundamentals/lessons',
      },
    },
  },
};

export const MaxItemsLimit: Story = {
  args: {
    maxItems: 3,
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/courses/javascript-fundamentals/lessons/variables-and-data-types/exercises/practice-1',
      },
    },
  },
};