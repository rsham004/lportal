import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['button', 'dropdown'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    variant: 'button',
    size: 'md',
  },
};

export const ButtonSmall: Story = {
  args: {
    variant: 'button',
    size: 'sm',
  },
};

export const ButtonLarge: Story = {
  args: {
    variant: 'button',
    size: 'lg',
  },
};

export const Dropdown: Story = {
  args: {
    variant: 'dropdown',
    size: 'md',
  },
};

export const DropdownSmall: Story = {
  args: {
    variant: 'dropdown',
    size: 'sm',
  },
};

export const DropdownLarge: Story = {
  args: {
    variant: 'dropdown',
    size: 'lg',
  },
};

export const CustomClassName: Story = {
  args: {
    variant: 'button',
    className: 'border-2 border-primary',
  },
};