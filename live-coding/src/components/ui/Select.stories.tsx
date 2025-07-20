import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const mockOptions = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'disabled', label: 'Disabled Option', disabled: true },
];

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
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
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: mockOptions,
    placeholder: 'Select a country...',
  },
};

export const WithValue: Story = {
  args: {
    options: mockOptions,
    value: 'us',
    placeholder: 'Select a country...',
  },
};

export const WithError: Story = {
  args: {
    options: mockOptions,
    placeholder: 'Select a country...',
    error: 'Please select a country',
  },
};

export const WithHelperText: Story = {
  args: {
    options: mockOptions,
    placeholder: 'Select a country...',
    helperText: 'Choose your country of residence',
  },
};

export const Searchable: Story = {
  args: {
    options: mockOptions,
    placeholder: 'Search and select a country...',
    searchable: true,
  },
};

export const Clearable: Story = {
  args: {
    options: mockOptions,
    placeholder: 'Select a country...',
    clearable: true,
    value: 'us',
  },
};

export const SearchableAndClearable: Story = {
  args: {
    options: mockOptions,
    placeholder: 'Search and select a country...',
    searchable: true,
    clearable: true,
    value: 'ca',
  },
};

export const Small: Story = {
  args: {
    options: mockOptions,
    size: 'sm',
    placeholder: 'Small select...',
  },
};

export const Large: Story = {
  args: {
    options: mockOptions,
    size: 'lg',
    placeholder: 'Large select...',
  },
};

export const Disabled: Story = {
  args: {
    options: mockOptions,
    placeholder: 'Disabled select...',
    disabled: true,
    value: 'us',
  },
};

export const Success: Story = {
  args: {
    options: mockOptions,
    variant: 'success',
    placeholder: 'Success state...',
    helperText: 'Great choice!',
    value: 'us',
  },
};

export const Destructive: Story = {
  args: {
    options: mockOptions,
    variant: 'destructive',
    placeholder: 'Error state...',
    error: 'Invalid selection',
  },
};

export const LongList: Story = {
  args: {
    options: [
      ...mockOptions,
      { value: 'br', label: 'Brazil' },
      { value: 'mx', label: 'Mexico' },
      { value: 'ar', label: 'Argentina' },
      { value: 'cl', label: 'Chile' },
      { value: 'pe', label: 'Peru' },
      { value: 'co', label: 'Colombia' },
      { value: 'in', label: 'India' },
      { value: 'cn', label: 'China' },
      { value: 'kr', label: 'South Korea' },
      { value: 'th', label: 'Thailand' },
      { value: 'sg', label: 'Singapore' },
      { value: 'my', label: 'Malaysia' },
    ],
    placeholder: 'Select from many options...',
    searchable: true,
  },
};

// Interactive example
function InteractiveExample() {
  const [selectedValue, setSelectedValue] = React.useState<string>('');

  return (
    <div className="w-80 space-y-4">
      <Select
        options={mockOptions}
        value={selectedValue}
        onChange={setSelectedValue}
        placeholder="Select a country..."
        searchable
        clearable
        helperText="This is a fully interactive select component"
      />
      
      {selectedValue && (
        <div className="p-3 bg-accent rounded-md">
          <p className="text-sm">
            Selected: <strong>{mockOptions.find(opt => opt.value === selectedValue)?.label}</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Value: {selectedValue}
          </p>
        </div>
      )}
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};