import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'disabled', label: 'Disabled Option', disabled: true },
];

describe('Select Component', () => {
  it('renders with default props', () => {
    render(<Select options={mockOptions} />);
    const select = screen.getByRole('button');
    expect(select).toBeInTheDocument();
    expect(select).toHaveTextContent('Select an option...');
  });

  it('renders with custom placeholder', () => {
    render(<Select options={mockOptions} placeholder="Choose an option" />);
    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<Select options={mockOptions} />);
    
    const select = screen.getByRole('button');
    await user.click(select);
    
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(<Select options={mockOptions} />);
    
    const select = screen.getByRole('button');
    await user.click(select);
    
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('selects option when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Select options={mockOptions} onChange={handleChange} />);
    
    const select = screen.getByRole('button');
    await user.click(select);
    
    const option = screen.getByText('Option 1');
    await user.click(option);
    
    expect(handleChange).toHaveBeenCalledWith('option1');
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows selected value', () => {
    render(<Select options={mockOptions} value="option2" />);
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Select options={mockOptions} disabled />);
    const select = screen.getByRole('button');
    expect(select).toBeDisabled();
  });

  it('handles error state', () => {
    const errorMessage = 'This field is required';
    render(<Select options={mockOptions} error={errorMessage} />);
    
    const select = screen.getByRole('button');
    expect(select).toHaveClass('border-destructive');
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows helper text', () => {
    const helperText = 'Choose your preferred option';
    render(<Select options={mockOptions} helperText={helperText} />);
    expect(screen.getByText(helperText)).toBeInTheDocument();
  });

  it('prioritizes error over helper text', () => {
    render(
      <Select 
        options={mockOptions}
        error="This is an error" 
        helperText="This is helper text" 
      />
    );
    
    expect(screen.getByText('This is an error')).toBeInTheDocument();
    expect(screen.queryByText('This is helper text')).not.toBeInTheDocument();
  });

  describe('Keyboard navigation', () => {
    it('opens dropdown with Enter key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const select = screen.getByRole('button');
      select.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens dropdown with Space key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const select = screen.getByRole('button');
      select.focus();
      await user.keyboard(' ');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('navigates options with arrow keys', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const select = screen.getByRole('button');
      select.focus();
      await user.keyboard('{Enter}');
      
      // Arrow down should focus first option
      await user.keyboard('{ArrowDown}');
      
      const firstOption = screen.getByText('Option 1').closest('li');
      expect(firstOption).toHaveClass('bg-accent');
      
      // Arrow down again should focus second option
      await user.keyboard('{ArrowDown}');
      
      const secondOption = screen.getByText('Option 2').closest('li');
      expect(secondOption).toHaveClass('bg-accent');
    });

    it('selects focused option with Enter', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Select options={mockOptions} onChange={handleChange} />);
      
      const select = screen.getByRole('button');
      select.focus();
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('closes dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const select = screen.getByRole('button');
      select.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('skips disabled options during navigation', async () => {
      const user = userEvent.setup();
      const optionsWithDisabled = [
        { value: 'option1', label: 'Option 1' },
        { value: 'disabled', label: 'Disabled Option', disabled: true },
        { value: 'option2', label: 'Option 2' },
      ];
      
      render(<Select options={optionsWithDisabled} />);
      
      const select = screen.getByRole('button');
      select.focus();
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      
      // Should skip disabled option and focus on Option 2
      const secondOption = screen.getByText('Option 2').closest('li');
      expect(secondOption).toHaveClass('bg-accent');
    });
  });

  describe('Searchable functionality', () => {
    it('shows search input when searchable is true', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} searchable />);
      
      const select = screen.getByRole('button');
      await user.click(select);
      
      expect(screen.getByPlaceholderText('Search options...')).toBeInTheDocument();
    });

    it('filters options based on search term', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} searchable />);
      
      const select = screen.getByRole('button');
      await user.click(select);
      
      const searchInput = screen.getByPlaceholderText('Search options...');
      await user.type(searchInput, 'Option 1');
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
    });

    it('shows "No options found" when search yields no results', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} searchable />);
      
      const select = screen.getByRole('button');
      await user.click(select);
      
      const searchInput = screen.getByPlaceholderText('Search options...');
      await user.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No options found')).toBeInTheDocument();
    });
  });

  describe('Clearable functionality', () => {
    it('shows clear button when clearable and has value', () => {
      render(<Select options={mockOptions} clearable value="option1" />);
      expect(screen.getByLabelText('Clear selection')).toBeInTheDocument();
    });

    it('does not show clear button when no value', () => {
      render(<Select options={mockOptions} clearable />);
      expect(screen.queryByLabelText('Clear selection')).not.toBeInTheDocument();
    });

    it('clears selection when clear button is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Select options={mockOptions} clearable value="option1" onChange={handleChange} />);
      
      const clearButton = screen.getByLabelText('Clear selection');
      await user.click(clearButton);
      
      expect(handleChange).toHaveBeenCalledWith('');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Select options={mockOptions} id="test-select" />);
      
      const select = screen.getByRole('button');
      expect(select).toHaveAttribute('aria-haspopup', 'listbox');
      expect(select).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const select = screen.getByRole('button');
      expect(select).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(select);
      
      expect(select).toHaveAttribute('aria-expanded', 'true');
    });

    it('sets aria-describedby when error or helper text is present', () => {
      const { rerender } = render(<Select options={mockOptions} error="Error message" id="test-select" />);
      
      let select = screen.getByRole('button');
      expect(select).toHaveAttribute('aria-describedby', 'test-select-description');

      rerender(<Select options={mockOptions} helperText="Helper text" id="test-select" />);
      
      select = screen.getByRole('button');
      expect(select).toHaveAttribute('aria-describedby', 'test-select-description');
    });

    it('marks selected option as aria-selected', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} value="option1" />);
      
      const select = screen.getByRole('button');
      await user.click(select);
      
      const selectedOption = screen.getByText('Option 1').closest('li');
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });

    it('marks disabled options as aria-disabled', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const select = screen.getByRole('button');
      await user.click(select);
      
      const disabledOption = screen.getByText('Disabled Option').closest('li');
      expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Select ref={ref} options={mockOptions} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('applies custom className', () => {
    const customClass = 'custom-select-class';
    render(<Select className={customClass} options={mockOptions} />);
    expect(screen.getByRole('button')).toHaveClass(customClass);
  });

  it('handles different sizes', () => {
    const { rerender } = render(<Select options={mockOptions} size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('h-8');

    rerender(<Select options={mockOptions} size="lg" />);
    expect(screen.getByRole('button')).toHaveClass('h-12');
  });

  it('handles different variants', () => {
    const { rerender } = render(<Select options={mockOptions} variant="destructive" />);
    expect(screen.getByRole('button')).toHaveClass('border-destructive');

    rerender(<Select options={mockOptions} variant="success" />);
    expect(screen.getByRole('button')).toHaveClass('border-success');
  });
});