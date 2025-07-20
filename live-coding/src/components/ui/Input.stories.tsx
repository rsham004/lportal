import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'success'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    placeholder: 'Enter your email',
    'aria-label': 'Email address',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    placeholder: 'Medium input (default)',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    placeholder: 'Success state',
    defaultValue: 'Valid input',
  },
};

export const WithError: Story = {
  args: {
    error: 'This field is required',
    placeholder: 'Enter required field',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    defaultValue: 'Cannot edit this',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter email address',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter number',
  },
};