'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, errorInfo: React.ErrorInfo) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showRetry?: boolean;
  showDetails?: boolean;
  level?: 'error' | 'warning' | 'info';
  className?: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { children } = this.props;
    const { hasError } = this.state;

    // Reset error state if children change
    if (hasError && prevProps.children !== children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { 
      children, 
      fallback, 
      showRetry = true, 
      showDetails = false, 
      level = 'error',
      className 
    } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError && error) {
      // If custom fallback is provided, use it
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, errorInfo!);
        }
        return fallback;
      }

      // Default error UI
      const levelStyles = {
        error: 'border-destructive bg-destructive/5',
        warning: 'border-warning bg-warning/5',
        info: 'border-info bg-info/5',
      };

      const iconStyles = {
        error: 'text-destructive',
        warning: 'text-warning',
        info: 'text-info',
      };

      return (
        <div
          role="alert"
          aria-live="assertive"
          className={cn(
            'rounded-lg border p-6',
            levelStyles[level],
            className
          )}
        >
          <div className="flex items-start space-x-4">
            <ExclamationTriangleIcon 
              className={cn('h-6 w-6 flex-shrink-0 mt-0.5', iconStyles[level])} 
            />
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Something went wrong
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  An unexpected error occurred while rendering this component.
                </p>
              </div>

              {showDetails && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Error Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Message:</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded text-foreground">
                          {error.message}
                        </p>
                      </div>
                      {errorInfo?.componentStack && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Component Stack:</p>
                          <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-32 text-foreground">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {showRetry && (
                <div className="flex space-x-2">
                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Try Again</span>
                  </Button>
                  {showDetails === false && (
                    <Button
                      onClick={() => this.setState({ ...this.state })}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                    >
                      Report Issue
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook version for functional components
interface UseErrorBoundaryReturn {
  resetError: () => void;
  captureError: (error: Error) => void;
}

const useErrorBoundary = (): UseErrorBoundaryReturn => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { resetError, captureError };
};

// Higher-order component for wrapping components with error boundary
const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export { ErrorBoundary, useErrorBoundary, withErrorBoundary };
export type { ErrorBoundaryProps };