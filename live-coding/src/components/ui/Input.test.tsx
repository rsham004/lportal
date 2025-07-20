import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

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
});