import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('h-10'); // default size
  });

  it('renders with placeholder text', () => {
    const placeholder = 'Enter your email';
    render(<Input placeholder={placeholder} />);
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test value');
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-8');

    rerender(<Input size="md" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-10');

    rerender(<Input size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-12');
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(<Input variant="default" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-input');

    rerender(<Input variant="destructive" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-destructive');

    rerender(<Input variant="success" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-success');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed');
  });

  it('handles error state with message', () => {
    const errorMessage = 'This field is required';
    render(<Input error={errorMessage} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-destructive');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    const customClass = 'custom-input-class';
    render(<Input className={customClass} />);
    expect(screen.getByRole('textbox')).toHaveClass(customClass);
  });

  it('handles focus and blur events', async () => {
    const user = userEvent.setup();
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalled();
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalled();
  });

  it('supports controlled component pattern', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('initial');
      return (
        <Input 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          data-testid="controlled-input"
        />
      );
    };

    render(<TestComponent />);
    const input = screen.getByTestId('controlled-input');
    expect(input).toHaveValue('initial');
  });

  it('supports uncontrolled component pattern', () => {
    render(<Input defaultValue="default value" data-testid="uncontrolled-input" />);
    const input = screen.getByTestId('uncontrolled-input');
    expect(input).toHaveValue('default value');
  });

  it('has proper accessibility attributes', () => {
    render(
      <Input 
        aria-label="Email address"
        aria-describedby="email-help"
        required
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Email address');
    expect(input).toHaveAttribute('aria-describedby', 'email-help');
    expect(input).toHaveAttribute('required');
  });

  describe('Enhanced Features', () => {
    it('renders with start icon', () => {
      render(
        <Input 
          startIcon={<MagnifyingGlassIcon data-testid="start-icon" />}
          data-testid="input"
        />
      );
      
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toHaveClass('pl-10');
    });

    it('renders with end icon', () => {
      render(
        <Input 
          endIcon={<MagnifyingGlassIcon data-testid="end-icon" />}
          data-testid="input"
        />
      );
      
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toHaveClass('pr-10');
    });

    it('shows helper text', () => {
      render(<Input helperText="This is helper text" />);
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });

    it('prioritizes error over helper text', () => {
      render(
        <Input 
          error="This is an error" 
          helperText="This is helper text" 
        />
      );
      
      expect(screen.getByText('This is an error')).toBeInTheDocument();
      expect(screen.queryByText('This is helper text')).not.toBeInTheDocument();
    });

    describe('Password input', () => {
      it('renders password toggle button', () => {
        render(<Input type="password" data-testid="input" />);
        
        expect(screen.getByLabelText('Show password')).toBeInTheDocument();
        expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
      });

      it('toggles password visibility', async () => {
        const user = userEvent.setup();
        
        render(<Input type="password" data-testid="input" />);
        
        const input = screen.getByTestId('input');
        const toggleButton = screen.getByLabelText('Show password');
        
        expect(input).toHaveAttribute('type', 'password');
        
        await user.click(toggleButton);
        
        expect(input).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
        
        await user.click(toggleButton);
        
        expect(input).toHaveAttribute('type', 'password');
        expect(screen.getByLabelText('Show password')).toBeInTheDocument();
      });

      it('does not render end icon when password toggle is present', () => {
        render(
          <Input 
            type="password"
            endIcon={<MagnifyingGlassIcon data-testid="end-icon" />}
            data-testid="input"
          />
        );
        
        expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Show password')).toBeInTheDocument();
      });

      it('password toggle button has proper accessibility attributes', () => {
        render(<Input type="password" />);
        
        const toggleButton = screen.getByLabelText('Show password');
        expect(toggleButton).toHaveAttribute('aria-label', 'Show password');
        expect(toggleButton).toHaveAttribute('tabIndex', '-1');
      });
    });

    it('sets aria-describedby when error or helper text is present', () => {
      const { rerender } = render(<Input error="Error message" id="test-input" />);
      
      let input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-description');

      rerender(<Input helperText="Helper text" id="test-input" />);
      
      input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-description');
    });
  });
});