import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';

describe('Textarea Component', () => {
  it('renders with default props', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveClass('min-h-[80px]'); // default size
  });

  it('renders with placeholder text', () => {
    const placeholder = 'Enter your message';
    render(<Textarea placeholder={placeholder} />);
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Textarea onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'test message');
    
    expect(handleChange).toHaveBeenCalled();
    expect(textarea).toHaveValue('test message');
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<Textarea size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[60px]');

    rerender(<Textarea size="md" />);
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[80px]');

    rerender(<Textarea size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[120px]');
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(<Textarea variant="default" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-input');

    rerender(<Textarea variant="destructive" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-destructive');

    rerender(<Textarea variant="success" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-success');
  });

  it('handles different resize options', () => {
    const { rerender } = render(<Textarea resize="none" />);
    expect(screen.getByRole('textbox')).toHaveClass('resize-none');

    rerender(<Textarea resize="vertical" />);
    expect(screen.getByRole('textbox')).toHaveClass('resize-y');

    rerender(<Textarea resize="horizontal" />);
    expect(screen.getByRole('textbox')).toHaveClass('resize-x');

    rerender(<Textarea resize="both" />);
    expect(screen.getByRole('textbox')).toHaveClass('resize');
  });

  it('handles disabled state', () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('disabled:cursor-not-allowed');
  });

  it('handles error state with message', () => {
    const errorMessage = 'This field is required';
    render(<Textarea error={errorMessage} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('border-destructive');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows helper text', () => {
    const helperText = 'This is helper text';
    render(<Textarea helperText={helperText} />);
    expect(screen.getByText(helperText)).toBeInTheDocument();
  });

  it('prioritizes error over helper text', () => {
    render(
      <Textarea 
        error="This is an error" 
        helperText="This is helper text" 
      />
    );
    
    expect(screen.getByText('This is an error')).toBeInTheDocument();
    expect(screen.queryByText('This is helper text')).not.toBeInTheDocument();
  });

  describe('Character count', () => {
    it('shows character count when showCharCount is true', () => {
      render(<Textarea showCharCount />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      render(<Textarea showCharCount />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'hello');
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows character count with max length', () => {
      render(<Textarea showCharCount maxLength={100} />);
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('prevents typing beyond max length', async () => {
      const user = userEvent.setup();
      render(<Textarea maxLength={5} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'hello world');
      
      expect(textarea).toHaveValue('hello');
    });

    it('applies warning styles when approaching max length', async () => {
      const user = userEvent.setup();
      render(<Textarea showCharCount maxLength={10} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'hello wor'); // 9 characters (90% of 10)
      
      const charCount = screen.getByText('9/10');
      expect(charCount).toHaveClass('text-warning');
    });

    it('applies error styles when at max length', async () => {
      const user = userEvent.setup();
      render(<Textarea showCharCount maxLength={5} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'hello');
      
      const charCount = screen.getByText('5/5');
      expect(charCount).toHaveClass('text-destructive');
    });

    it('has proper aria-label for character count', () => {
      render(<Textarea showCharCount maxLength={100} />);
      const charCount = screen.getByLabelText('Character count: 0 of 100');
      expect(charCount).toBeInTheDocument();
    });
  });

  describe('Auto-resize', () => {
    it('disables manual resize when autoResize is true', () => {
      render(<Textarea autoResize />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize-none');
    });

    it('maintains manual resize when autoResize is false', () => {
      render(<Textarea autoResize={false} resize="vertical" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize-y');
    });
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('applies custom className', () => {
    const customClass = 'custom-textarea-class';
    render(<Textarea className={customClass} />);
    expect(screen.getByRole('textbox')).toHaveClass(customClass);
  });

  it('supports controlled component pattern', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('initial');
      return (
        <Textarea 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          data-testid="controlled-textarea"
        />
      );
    };

    render(<TestComponent />);
    const textarea = screen.getByTestId('controlled-textarea');
    expect(textarea).toHaveValue('initial');
  });

  it('supports uncontrolled component pattern', () => {
    render(<Textarea defaultValue="default value" data-testid="uncontrolled-textarea" />);
    const textarea = screen.getByTestId('uncontrolled-textarea');
    expect(textarea).toHaveValue('default value');
  });

  it('has proper accessibility attributes', () => {
    render(
      <Textarea 
        aria-label="Message"
        aria-describedby="message-help"
        required
        id="message"
      />
    );
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', 'Message');
    expect(textarea).toHaveAttribute('aria-describedby', 'message-description');
    expect(textarea).toHaveAttribute('required');
  });

  it('sets aria-describedby when error or helper text is present', () => {
    const { rerender } = render(<Textarea error="Error message" id="test-textarea" />);
    
    let textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-describedby', 'test-textarea-description');

    rerender(<Textarea helperText="Helper text" id="test-textarea" />);
    
    textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-describedby', 'test-textarea-description');
  });
});