import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay } from './ErrorDisplay';

describe('ErrorDisplay Component', () => {
  it('renders with default props', () => {
    render(<ErrorDisplay message="Test error message" />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders different error types correctly', () => {
    const { rerender } = render(<ErrorDisplay message="Error" type="error" />);
    expect(screen.getByRole('alert')).toHaveClass('border-destructive');

    rerender(<ErrorDisplay message="Warning" type="warning" />);
    expect(screen.getByRole('alert')).toHaveClass('border-warning');

    rerender(<ErrorDisplay message="Info" type="info" />);
    expect(screen.getByRole('alert')).toHaveClass('border-info');

    rerender(<ErrorDisplay message="Success" type="success" />);
    expect(screen.getByRole('alert')).toHaveClass('border-success');
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<ErrorDisplay message="Error" size="sm" />);
    expect(screen.getByRole('alert')).toHaveClass('p-3');

    rerender(<ErrorDisplay message="Error" size="md" />);
    expect(screen.getByRole('alert')).toHaveClass('p-4');

    rerender(<ErrorDisplay message="Error" size="lg" />);
    expect(screen.getByRole('alert')).toHaveClass('p-6');
  });

  it('shows title when provided', () => {
    render(<ErrorDisplay title="Error Title" message="Error message" />);
    
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('shows description when provided', () => {
    render(
      <ErrorDisplay 
        message="Error message" 
        description="This is a detailed description of the error"
      />
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('This is a detailed description of the error')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay message="Error" onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = jest.fn();
    render(<ErrorDisplay message="Error" onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows both retry and dismiss buttons when both callbacks provided', () => {
    const onRetry = jest.fn();
    const onDismiss = jest.fn();
    render(<ErrorDisplay message="Error" onRetry={onRetry} onDismiss={onDismiss} />);
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('shows custom retry text when provided', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay message="Error" onRetry={onRetry} retryText="Reload Data" />);
    
    expect(screen.getByRole('button', { name: 'Reload Data' })).toBeInTheDocument();
  });

  it('shows custom dismiss text when provided', () => {
    const onDismiss = jest.fn();
    render(<ErrorDisplay message="Error" onDismiss={onDismiss} dismissText="Close" />);
    
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-error-class';
    render(<ErrorDisplay message="Error" className={customClass} />);
    
    expect(screen.getByRole('alert')).toHaveClass(customClass);
  });

  it('shows icon by default', () => {
    render(<ErrorDisplay message="Error" type="error" />);
    
    const alert = screen.getByRole('alert');
    expect(alert.querySelector('svg')).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    render(<ErrorDisplay message="Error" type="error" showIcon={false} />);
    
    const alert = screen.getByRole('alert');
    expect(alert.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders as different variants', () => {
    const { rerender } = render(<ErrorDisplay message="Error" variant="filled" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-destructive');

    rerender(<ErrorDisplay message="Error" variant="outlined" />);
    expect(screen.getByRole('alert')).toHaveClass('border-2');

    rerender(<ErrorDisplay message="Error" variant="subtle" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-destructive/10');
  });

  it('has proper accessibility attributes', () => {
    render(<ErrorDisplay message="Error message" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('uses assertive aria-live for error type', () => {
    render(<ErrorDisplay message="Error message" type="error" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('supports custom actions', () => {
    const customAction = (
      <button data-testid="custom-action">Custom Action</button>
    );
    
    render(<ErrorDisplay message="Error" actions={customAction} />);
    
    expect(screen.getByTestId('custom-action')).toBeInTheDocument();
  });

  it('renders multiple custom actions', () => {
    const customActions = (
      <div className="flex space-x-2">
        <button data-testid="action-1">Action 1</button>
        <button data-testid="action-2">Action 2</button>
      </div>
    );
    
    render(<ErrorDisplay message="Error" actions={customActions} />);
    
    expect(screen.getByTestId('action-1')).toBeInTheDocument();
    expect(screen.getByTestId('action-2')).toBeInTheDocument();
  });

  it('shows loading state on retry button', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay message="Error" onRetry={onRetry} retryLoading={true} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeDisabled();
  });

  it('renders with error details when provided', () => {
    const errorDetails = {
      code: 'ERR_001',
      timestamp: '2024-01-01T00:00:00Z',
      stack: 'Error stack trace...',
    };
    
    render(<ErrorDisplay message="Error" details={errorDetails} showDetails={true} />);
    
    expect(screen.getByText('Error Details')).toBeInTheDocument();
    expect(screen.getByText('ERR_001')).toBeInTheDocument();
  });

  it('hides error details by default', () => {
    const errorDetails = {
      code: 'ERR_001',
      timestamp: '2024-01-01T00:00:00Z',
    };
    
    render(<ErrorDisplay message="Error" details={errorDetails} />);
    
    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    expect(screen.queryByText('ERR_001')).not.toBeInTheDocument();
  });

  it('toggles error details visibility', () => {
    const errorDetails = {
      code: 'ERR_001',
      timestamp: '2024-01-01T00:00:00Z',
    };
    
    render(<ErrorDisplay message="Error" details={errorDetails} />);
    
    // Details should be hidden initially
    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    
    // Click show details button
    const showDetailsButton = screen.getByRole('button', { name: /show details/i });
    fireEvent.click(showDetailsButton);
    
    // Details should now be visible
    expect(screen.getByText('Error Details')).toBeInTheDocument();
    expect(screen.getByText('ERR_001')).toBeInTheDocument();
  });
});