import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './Sidebar';

const mockCourseData = {
  id: 'javascript-fundamentals',
  title: 'JavaScript Fundamentals',
  modules: [
    {
      id: 'module-1',
      title: 'Getting Started',
      completed: true,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Introduction to JavaScript',
          type: 'video' as const,
          duration: '10 min',
          completed: true,
        },
        {
          id: 'lesson-2',
          title: 'Setting up Development Environment',
          type: 'reading' as const,
          duration: '5 min',
          completed: true,
        },
        {
          id: 'lesson-3',
          title: 'Your First JavaScript Program',
          type: 'video' as const,
          duration: '15 min',
          completed: true,
        },
      ],
    },
    {
      id: 'module-2',
      title: 'Variables and Data Types',
      completed: false,
      lessons: [
        {
          id: 'lesson-4',
          title: 'Understanding Variables',
          type: 'video' as const,
          duration: '12 min',
          completed: true,
        },
        {
          id: 'lesson-5',
          title: 'Primitive Data Types',
          type: 'reading' as const,
          duration: '8 min',
          completed: false,
        },
        {
          id: 'lesson-6',
          title: 'Working with Strings',
          type: 'video' as const,
          duration: '18 min',
          completed: false,
        },
        {
          id: 'lesson-7',
          title: 'Quiz: Variables and Data Types',
          type: 'quiz' as const,
          completed: false,
        },
      ],
    },
    {
      id: 'module-3',
      title: 'Functions and Control Flow',
      completed: false,
      lessons: [
        {
          id: 'lesson-8',
          title: 'Introduction to Functions',
          type: 'video' as const,
          duration: '20 min',
          completed: false,
        },
        {
          id: 'lesson-9',
          title: 'Conditional Statements',
          type: 'video' as const,
          duration: '15 min',
          completed: false,
        },
        {
          id: 'lesson-10',
          title: 'Loops and Iteration',
          type: 'reading' as const,
          duration: '10 min',
          completed: false,
        },
        {
          id: 'lesson-11',
          title: 'Practice Assignment',
          type: 'assignment' as const,
          completed: false,
        },
      ],
    },
  ],
};

const meta: Meta<typeof Sidebar> = {
  title: 'Shared/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MainNavigation: Story = {
  args: {
    variant: 'main',
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/dashboard',
      },
    },
  },
};

export const CourseNavigation: Story = {
  args: {
    variant: 'course',
    courseData: mockCourseData,
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/courses/javascript-fundamentals/lessons/lesson-5',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    variant: 'main',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    nextjs: {
      navigation: {
        pathname: '/courses',
      },
    },
  },
};