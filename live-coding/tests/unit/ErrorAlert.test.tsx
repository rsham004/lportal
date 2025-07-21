import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorAlert } from './ErrorAlert';

describe('ErrorAlert Component', () => {
  it('renders with default props', () => {
    render(<ErrorAlert message="Test alert message" />);
    
    expect(screen.getByText('Test alert message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    render(<ErrorAlert message="Test message" visible={false} />);
    
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders different alert types correctly', () => {
    const { rerender } = render(<ErrorAlert message="Error" type="error" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-destructive/10');

    rerender(<ErrorAlert message="Warning" type="warning" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-warning/10');

    rerender(<ErrorAlert message="Info" type="info" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-info/10');

    rerender(<ErrorAlert message="Success" type="success" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-success/10');
  });

  it('shows close button when dismissible', () => {
    const onDismiss = jest.fn();
    render(<ErrorAlert message="Test" dismissible onDismiss={onDismiss} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('hides close button when not dismissible', () => {
    render(<ErrorAlert message="Test" dismissible={false} />);
    
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('auto-dismisses after timeout when autoClose is set', async () => {
    const onDismiss = jest.fn();
    render(
      <ErrorAlert 
        message="Test" 
        autoClose={1000} 
        onDismiss={onDismiss} 
      />
    );
    
    expect(screen.getByText('Test')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    }, { timeout: 1500 });
  });

  it('shows progress bar when autoClose is enabled', () => {
    render(<ErrorAlert message="Test" autoClose={5000} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('hides progress bar when showProgress is false', () => {
    render(<ErrorAlert message="Test" autoClose={5000} showProgress={false} />);
    
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('pauses auto-close on hover when pauseOnHover is true', async () => {
    const onDismiss = jest.fn();
    render(
      <ErrorAlert 
        message="Test" 
        autoClose={1000} 
        pauseOnHover={true}
        onDismiss={onDismiss} 
      />
    );
    
    const alert = screen.getByRole('alert');
    
    // Hover over the alert
    fireEvent.mouseEnter(alert);
    
    // Wait longer than the autoClose time
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Should not have been dismissed yet
    expect(onDismiss).not.toHaveBeenCalled();
    
    // Mouse leave should resume the timer
    fireEvent.mouseLeave(alert);
    
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    }, { timeout: 1500 });
  });

  it('shows icon by default', () => {
    render(<ErrorAlert message="Test" type="error" />);
    
    const alert = screen.getByRole('alert');
    expect(alert.querySelector('svg')).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    render(<ErrorAlert message="Test" type="error" showIcon={false} />);
    
    const alert = screen.getByRole('alert');
    expect(alert.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<ErrorAlert title="Alert Title" message="Alert message" />);
    
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-alert-class';
    render(<ErrorAlert message="Test" className={customClass} />);
    
    expect(screen.getByRole('alert')).toHaveClass(customClass);
  });

  it('has proper accessibility attributes', () => {
    render(<ErrorAlert message="Test message" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('uses assertive aria-live for error type', () => {
    render(<ErrorAlert message="Test message" type="error" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('supports different positions', () => {
    const { rerender } = render(<ErrorAlert message="Test" position="top" />);
    expect(screen.getByRole('alert')).toHaveClass('top-4');

    rerender(<ErrorAlert message="Test" position="bottom" />);
    expect(screen.getByRole('alert')).toHaveClass('bottom-4');

    rerender(<ErrorAlert message="Test" position="top-left" />);
    expect(screen.getByRole('alert')).toHaveClass('top-4', 'left-4');

    rerender(<ErrorAlert message="Test" position="top-right" />);
    expect(screen.getByRole('alert')).toHaveClass('top-4', 'right-4');
  });

  it('renders as fixed position when position is specified', () => {
    render(<ErrorAlert message="Test" position="top" />);
    
    expect(screen.getByRole('alert')).toHaveClass('fixed', 'z-50');
  });

  it('renders as relative position when no position specified', () => {
    render(<ErrorAlert message="Test" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).not.toHaveClass('fixed');
    expect(alert).not.toHaveClass('z-50');
  });

  it('supports custom actions', () => {
    const customAction = (
      <button data-testid="custom-action">Custom Action</button>
    );
    
    render(<ErrorAlert message="Test" actions={customAction} />);
    
    expect(screen.getByTestId('custom-action')).toBeInTheDocument();
  });

  it('clears timeout on unmount', () => {
    const onDismiss = jest.fn();
    const { unmount } = render(
      <ErrorAlert message="Test" autoClose={1000} onDismiss={onDismiss} />
    );
    
    unmount();
    
    // Wait longer than the autoClose time
    setTimeout(() => {
      expect(onDismiss).not.toHaveBeenCalled();
    }, 1200);
  });

  it('resets timer when message changes', async () => {
    const onDismiss = jest.fn();
    const { rerender } = render(
      <ErrorAlert message="First message" autoClose={1000} onDismiss={onDismiss} />
    );
    
    // Wait half the time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Change the message
    rerender(
      <ErrorAlert message="Second message" autoClose={1000} onDismiss={onDismiss} />
    );
    
    // Wait another half time (should not dismiss yet)
    await new Promise(resolve => setTimeout(resolve, 600));
    expect(onDismiss).not.toHaveBeenCalled();
    
    // Wait for the full new timer
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    }, { timeout: 1500 });
  });

  it('supports animation variants', () => {
    const { rerender } = render(<ErrorAlert message="Test" animation="slide" />);
    expect(screen.getByRole('alert')).toHaveClass('animate-slide-in');

    rerender(<ErrorAlert message="Test" animation="fade" />);
    expect(screen.getByRole('alert')).toHaveClass('animate-fade-in');

    rerender(<ErrorAlert message="Test" animation="none" />);
    const alert = screen.getByRole('alert');
    expect(alert).not.toHaveClass('animate-slide-in');
    expect(alert).not.toHaveClass('animate-fade-in');
  });
});