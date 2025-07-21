import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ErrorToast, ToastProvider, useToast } from './ErrorToast';

// Test component that uses the toast hook
const TestComponent = () => {
  const { toast, dismiss, dismissAll } = useToast();
  
  return (
    <div>
      <button onClick={() => toast.error('Test error message')}>
        Show Error Toast
      </button>
      <button onClick={() => toast.success('Test success message')}>
        Show Success Toast
      </button>
      <button onClick={() => toast.warning('Test warning message')}>
        Show Warning Toast
      </button>
      <button onClick={() => toast.info('Test info message')}>
        Show Info Toast
      </button>
      <button onClick={() => dismiss('test-id')}>
        Dismiss Specific
      </button>
      <button onClick={() => dismissAll()}>
        Dismiss All
      </button>
    </div>
  );
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ErrorToast System', () => {
  describe('ToastProvider', () => {
    it('renders children without errors', () => {
      render(
        <ToastProvider>
          <div>Test content</div>
        </ToastProvider>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('provides toast context to children', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(screen.getByText('Show Error Toast')).toBeInTheDocument();
    });
  });

  describe('useToast Hook', () => {
    it('shows error toast when called', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      fireEvent.click(screen.getByText('Show Error Toast'));
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('border-destructive');
    });

    it('shows different toast types correctly', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Test error toast
      fireEvent.click(screen.getByText('Show Error Toast'));
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      
      // Test success toast
      fireEvent.click(screen.getByText('Show Success Toast'));
      expect(screen.getByText('Test success message')).toBeInTheDocument();
      
      // Test warning toast
      fireEvent.click(screen.getByText('Show Warning Toast'));
      expect(screen.getByText('Test warning message')).toBeInTheDocument();
      
      // Test info toast
      fireEvent.click(screen.getByText('Show Info Toast'));
      expect(screen.getByText('Test info message')).toBeInTheDocument();
    });

    it('auto-dismisses toasts after timeout', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      fireEvent.click(screen.getByText('Show Error Toast'));
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      
      // Wait for auto-dismiss (default 5 seconds)
      await waitFor(() => {
        expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
      }, { timeout: 6000 });
    });

    it('dismisses specific toast by id', () => {
      const TestDismissComponent = () => {
        const { toast, dismiss } = useToast();
        
        const showToast = () => {
          toast.error('Test message', { id: 'test-toast-id' });
        };
        
        const dismissToast = () => {
          dismiss('test-toast-id');
        };
        
        return (
          <div>
            <button onClick={showToast}>Show Toast</button>
            <button onClick={dismissToast}>Dismiss Toast</button>
          </div>
        );
      };
      
      render(
        <TestWrapper>
          <TestDismissComponent />
        </TestWrapper>
      );
      
      fireEvent.click(screen.getByText('Show Toast'));
      expect(screen.getByText('Test message')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Dismiss Toast'));
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('dismisses all toasts', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Show multiple toasts
      fireEvent.click(screen.getByText('Show Error Toast'));
      fireEvent.click(screen.getByText('Show Success Toast'));
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText('Test success message')).toBeInTheDocument();
      
      // Dismiss all
      fireEvent.click(screen.getByText('Dismiss All'));
      
      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
      expect(screen.queryByText('Test success message')).not.toBeInTheDocument();
    });
  });

  describe('ErrorToast Component', () => {
    const defaultToast = {
      id: 'test-toast',
      type: 'error' as const,
      title: 'Test Title',
      message: 'Test message',
      duration: 5000,
      dismissible: true,
      showProgress: true,
      createdAt: Date.now(),
    };

    it('renders toast with message', () => {
      const onDismiss = jest.fn();
      
      render(
        <ErrorToast 
          toast={defaultToast}
          onDismiss={onDismiss}
        />
      );
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('shows dismiss button when dismissible', () => {
      const onDismiss = jest.fn();
      
      render(
        <ErrorToast 
          toast={defaultToast}
          onDismiss={onDismiss}
        />
      );
      
      const dismissButton = screen.getByRole('button', { name: /close/i });
      expect(dismissButton).toBeInTheDocument();
      
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalledWith('test-toast');
    });

    it('hides dismiss button when not dismissible', () => {
      const onDismiss = jest.fn();
      
      render(
        <ErrorToast 
          toast={{ ...defaultToast, dismissible: false }}
          onDismiss={onDismiss}
        />
      );
      
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('shows progress bar when showProgress is true', () => {
      const onDismiss = jest.fn();
      
      render(
        <ErrorToast 
          toast={defaultToast}
          onDismiss={onDismiss}
        />
      );
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('hides progress bar when showProgress is false', () => {
      const onDismiss = jest.fn();
      
      render(
        <ErrorToast 
          toast={{ ...defaultToast, showProgress: false }}
          onDismiss={onDismiss}
        />
      );
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('pauses on hover when pauseOnHover is true', async () => {
      const onDismiss = jest.fn();
      
      render(
        <ErrorToast 
          toast={{ ...defaultToast, duration: 1000, pauseOnHover: true }}
          onDismiss={onDismiss}
        />
      );
      
      const toast = screen.getByRole('alert');
      
      // Hover over toast
      fireEvent.mouseEnter(toast);
      
      // Wait longer than duration
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Should not have been dismissed
      expect(onDismiss).not.toHaveBeenCalled();
      
      // Mouse leave should resume timer
      fireEvent.mouseLeave(toast);
      
      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledWith('test-toast');
      }, { timeout: 1500 });
    });

    it('shows action buttons when provided', () => {
      const onDismiss = jest.fn();
      const onAction = jest.fn();
      
      render(
        <ErrorToast 
          toast={{
            ...defaultToast,
            actions: [
              { label: 'Retry', onClick: onAction },
              { label: 'Cancel', onClick: onAction, variant: 'outline' },
            ]
          }}
          onDismiss={onDismiss}
        />
      );
      
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(onAction).toHaveBeenCalled();
    });

    it('has proper accessibility attributes', () => {
      const onDismiss = jest.fn();
      
      render(
        <ErrorToast 
          toast={defaultToast}
          onDismiss={onDismiss}
        />
      );
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
    });

    it('uses polite aria-live for non-error types', () => {
      const onDismiss = jest.fn();
      
      render(
        <ErrorToast 
          toast={{ ...defaultToast, type: 'info' }}
          onDismiss={onDismiss}
        />
      );
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Toast Container', () => {
    it('positions toasts correctly', () => {
      const TestPositionComponent = () => {
        const { toast } = useToast();
        
        return (
          <button onClick={() => toast.error('Test', { position: 'top-right' })}>
            Show Toast
          </button>
        );
      };
      
      render(
        <TestWrapper>
          <TestPositionComponent />
        </TestWrapper>
      );
      
      fireEvent.click(screen.getByText('Show Toast'));
      
      const container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('top-4', 'right-4');
    });

    it('stacks multiple toasts', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Show multiple toasts
      fireEvent.click(screen.getByText('Show Error Toast'));
      fireEvent.click(screen.getByText('Show Success Toast'));
      fireEvent.click(screen.getByText('Show Warning Toast'));
      
      const toasts = screen.getAllByRole('alert');
      expect(toasts).toHaveLength(3);
    });

    it('limits number of toasts when maxToasts is set', () => {
      const TestMaxToastsComponent = () => {
        const { toast } = useToast();
        
        const showToasts = () => {
          for (let i = 0; i < 5; i++) {
            toast.error(`Toast ${i + 1}`);
          }
        };
        
        return <button onClick={showToasts}>Show 5 Toasts</button>;
      };
      
      render(
        <ToastProvider maxToasts={3}>
          <TestMaxToastsComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show 5 Toasts'));
      
      const toasts = screen.getAllByRole('alert');
      expect(toasts).toHaveLength(3);
    });
  });

  describe('Toast Animations', () => {
    it('applies enter animation classes', () => {
      const onDismiss = jest.fn();
      
      render(
        <ErrorToast 
          toast={defaultToast}
          onDismiss={onDismiss}
        />
      );
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('animate-slide-in');
    });
  });
});