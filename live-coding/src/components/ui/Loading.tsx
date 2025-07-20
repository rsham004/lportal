import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from './Button';

// Spinner Component
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Spinner.displayName = 'Spinner';

// Skeleton Component
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: 'sm' | 'md' | 'lg' | 'full' | string;
  height?: 'sm' | 'md' | 'lg' | 'xl' | string;
  circle?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width = 'full', height = 'md', circle = false, ...props }, ref) => {
    const widthClasses = {
      sm: 'w-16',
      md: 'w-32',
      lg: 'w-48',
      full: 'w-full',
    };

    const heightClasses = {
      sm: 'h-4',
      md: 'h-6',
      lg: 'h-8',
      xl: 'h-12',
    };

    const getWidthClass = () => {
      if (typeof width === 'string' && width in widthClasses) {
        return widthClasses[width as keyof typeof widthClasses];
      }
      return typeof width === 'string' ? width : 'w-full';
    };

    const getHeightClass = () => {
      if (typeof height === 'string' && height in heightClasses) {
        return heightClasses[height as keyof typeof heightClasses];
      }
      return typeof height === 'string' ? height : 'h-6';
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading content"
        data-testid="skeleton"
        className={cn(
          'animate-pulse bg-muted',
          circle ? 'rounded-full' : 'rounded-md',
          getWidthClass(),
          getHeightClass(),
          className
        )}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Skeleton.displayName = 'Skeleton';

// LoadingCard Component
interface LoadingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  showHeader?: boolean;
  showFooter?: boolean;
  lines?: number;
}

const LoadingCard = React.forwardRef<HTMLDivElement, LoadingCardProps>(
  ({ className, showHeader = false, showFooter = false, lines = 3, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          className
        )}
        {...props}
      >
        {showHeader && (
          <div className="flex flex-col space-y-1.5 p-6">
            <Skeleton height="lg" width="lg" />
            <Skeleton height="sm" width="full" />
          </div>
        )}
        
        <div className="p-6 pt-0 space-y-3">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton
              key={i}
              height="sm"
              width={i === lines - 1 ? 'lg' : 'full'}
            />
          ))}
        </div>

        {showFooter && (
          <div className="flex items-center p-6 pt-0 space-x-2">
            <Skeleton height="lg" width="md" />
            <Skeleton height="lg" width="sm" />
          </div>
        )}
      </div>
    );
  }
);
LoadingCard.displayName = 'LoadingCard';

// LoadingButton Component
interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, loading = false, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(className)}
        disabled={loading || disabled}
        aria-disabled={loading || disabled}
        {...props}
      >
        {loading && (
          <Spinner size="sm" className="mr-2" />
        )}
        {loading && loadingText ? loadingText : children}
      </Button>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';

// LoadingOverlay Component
interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
  text?: string;
  spinnerSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ className, visible = false, text = 'Loading...', spinnerSize = 'lg', ...props }, ref) => {
    if (!visible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center space-y-4">
          <Spinner size={spinnerSize} />
          {text && (
            <p className="text-sm text-muted-foreground">{text}</p>
          )}
        </div>
      </div>
    );
  }
);
LoadingOverlay.displayName = 'LoadingOverlay';

// LoadingDots Component
interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-1 h-1',
      md: 'w-2 h-2',
      lg: 'w-3 h-3',
    };

    const dotClass = sizeClasses[size];

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn('flex space-x-1', className)}
        {...props}
      >
        <div className={cn(dotClass, 'bg-current rounded-full animate-bounce')} style={{ animationDelay: '0ms' }} />
        <div className={cn(dotClass, 'bg-current rounded-full animate-bounce')} style={{ animationDelay: '150ms' }} />
        <div className={cn(dotClass, 'bg-current rounded-full animate-bounce')} style={{ animationDelay: '300ms' }} />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
LoadingDots.displayName = 'LoadingDots';

// LoadingPulse Component
interface LoadingPulseProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingPulse = React.forwardRef<HTMLDivElement, LoadingPulseProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(
          'relative inline-flex',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 rounded-full bg-current opacity-75 animate-ping" />
        <div className="relative rounded-full bg-current" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
LoadingPulse.displayName = 'LoadingPulse';

export {
  Spinner,
  Skeleton,
  LoadingCard,
  LoadingButton,
  LoadingOverlay,
  LoadingDots,
  LoadingPulse,
};