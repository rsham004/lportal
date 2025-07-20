import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Enter your message...',
    error: 'This field is required',
  },
};

export const WithHelperText: Story = {
  args: {
    placeholder: 'Enter your message...',
    helperText: 'Please provide a detailed description',
  },
};

export const WithCharacterCount: Story = {
  args: {
    placeholder: 'Enter your message...',
    showCharCount: true,
    maxLength: 200,
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small textarea...',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large textarea...',
  },
};

export const AutoResize: Story = {
  args: {
    placeholder: 'This textarea will auto-resize as you type...',
    autoResize: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea...',
    disabled: true,
    value: 'This textarea is disabled',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    placeholder: 'Success state...',
    helperText: 'Great! Your input looks good.',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    placeholder: 'Error state...',
    error: 'Something went wrong',
  },
};

export const NoResize: Story = {
  args: {
    resize: 'none',
    placeholder: 'This textarea cannot be resized...',
  },
};

export const HorizontalResize: Story = {
  args: {
    resize: 'horizontal',
    placeholder: 'This textarea can be resized horizontally...',
  },
};

export const BothResize: Story = {
  args: {
    resize: 'both',
    placeholder: 'This textarea can be resized in both directions...',
  },
};