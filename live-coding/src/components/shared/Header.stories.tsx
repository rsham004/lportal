import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';

const meta: Meta<typeof Header> = {
  title: 'Shared/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showSidebarToggle: false,
  },
};

export const WithSidebarToggle: Story = {
  args: {
    showSidebarToggle: true,
    onSidebarToggle: () => console.log('Sidebar toggled'),
  },
};

export const Mobile: Story = {
  args: {
    showSidebarToggle: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  args: {
    showSidebarToggle: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};