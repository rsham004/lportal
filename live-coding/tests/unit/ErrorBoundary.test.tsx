import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Test component that throws an error on interaction
const ThrowErrorOnClick = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false);
  
  if (shouldThrow) {
    throw new Error('Click error message');
  }
  
  return (
    <button onClick={() => setShouldThrow(true)}>
      Click to throw error
    </button>
  );
};

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders default error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders custom fallback function with error details', () => {
    const customFallbackFn = (error: Error, errorInfo: React.ErrorInfo) => (
      <div>
        <div>Error: {error.message}</div>
        <div>Component Stack: {errorInfo.componentStack}</div>
      </div>
    );
    
    render(
      <ErrorBoundary fallback={customFallbackFn}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
    expect(screen.getByText(/Component Stack:/)).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('shows retry button by default', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('hides retry button when showRetry is false', () => {
    render(
      <ErrorBoundary showRetry={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('resets error state when retry button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Click retry button
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    
    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    // Should show normal content
    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('catches errors thrown during event handlers', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorOnClick />
      </ErrorBoundary>
    );
    
    // Initially no error
    expect(screen.getByText('Click to throw error')).toBeInTheDocument();
    
    // Click to throw error
    fireEvent.click(screen.getByRole('button'));
    
    // Error boundary should catch it
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('applies custom className to error container', () => {
    render(
      <ErrorBoundary className="custom-error-class">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const errorContainer = screen.getByText('Something went wrong').closest('div');
    expect(errorContainer).toHaveClass('custom-error-class');
  });

  it('shows error details when showDetails is true', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error Details')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('hides error details by default', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
  });

  it('supports different error levels', () => {
    render(
      <ErrorBoundary level="warning">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveClass('border-warning');
  });

  it('resets error state when children change', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Change children
    rerender(
      <ErrorBoundary>
        <div>New content</div>
      </ErrorBoundary>
    );
    
    // Should show new content
    expect(screen.getByText('New content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});