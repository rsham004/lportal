import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface ErrorDetails {
  code?: string;
  timestamp?: string;
  stack?: string;
  [key: string]: any;
}

interface ErrorDisplayProps {
  message: string;
  title?: string;
  description?: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  variant?: 'filled' | 'outlined' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryText?: string;
  dismissText?: string;
  retryLoading?: boolean;
  actions?: React.ReactNode;
  details?: ErrorDetails;
  showDetails?: boolean;
  className?: string;
}

const ErrorDisplay = React.forwardRef<HTMLDivElement, ErrorDisplayProps>(
  ({
    message,
    title,
    description,
    type = 'error',
    variant = 'outlined',
    size = 'md',
    showIcon = true,
    onRetry,
    onDismiss,
    retryText = 'Try Again',
    dismissText = 'Dismiss',
    retryLoading = false,
    actions,
    details,
    showDetails = false,
    className,
    ...props
  }, ref) => {
    const [detailsVisible, setDetailsVisible] = React.useState(showDetails);

    const icons = {
      error: ExclamationCircleIcon,
      warning: ExclamationTriangleIcon,
      info: InformationCircleIcon,
      success: CheckCircleIcon,
    };

    const Icon = icons[type];

    const typeStyles = {
      filled: {
        error: 'bg-destructive text-destructive-foreground border-destructive',
        warning: 'bg-warning text-warning-foreground border-warning',
        info: 'bg-info text-info-foreground border-info',
        success: 'bg-success text-success-foreground border-success',
      },
      outlined: {
        error: 'border-destructive text-destructive bg-background',
        warning: 'border-warning text-warning bg-background',
        info: 'border-info text-info bg-background',
        success: 'border-success text-success bg-background',
      },
      subtle: {
        error: 'bg-destructive/10 text-destructive border-destructive/20',
        warning: 'bg-warning/10 text-warning border-warning/20',
        info: 'bg-info/10 text-info border-info/20',
        success: 'bg-success/10 text-success border-success/20',
      },
    };

    const sizeStyles = {
      sm: 'p-3 text-sm',
      md: 'p-4',
      lg: 'p-6 text-lg',
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const borderStyles = {
      filled: 'border',
      outlined: 'border-2',
      subtle: 'border',
    };

    const ariaLive = type === 'error' ? 'assertive' : 'polite';

    return (
      <div
        ref={ref}
        role="alert"
        aria-live={ariaLive}
        className={cn(
          'rounded-lg',
          typeStyles[variant][type],
          sizeStyles[size],
          borderStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start space-x-3">
          {showIcon && (
            <Icon className={cn('flex-shrink-0 mt-0.5', iconSizes[size])} />
          )}
          
          <div className="flex-1 space-y-2">
            {title && (
              <h3 className={cn(
                'font-semibold',
                size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
              )}>
                {title}
              </h3>
            )}
            
            <p className={cn(
              title ? 'text-sm' : 'font-medium',
              variant === 'filled' ? 'text-current' : 'text-foreground'
            )}>
              {message}
            </p>
            
            {description && (
              <p className={cn(
                'text-sm',
                variant === 'filled' ? 'text-current/80' : 'text-muted-foreground'
              )}>
                {description}
              </p>
            )}

            {/* Action buttons */}
            {(onRetry || onDismiss || actions || details) && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    disabled={retryLoading}
                    size="sm"
                    variant={variant === 'filled' ? 'secondary' : 'outline'}
                    className="flex items-center space-x-1"
                  >
                    {retryLoading && <ArrowPathIcon className="h-3 w-3 animate-spin" />}
                    <span>{retryText}</span>
                  </Button>
                )}
                
                {onDismiss && (
                  <Button
                    onClick={onDismiss}
                    size="sm"
                    variant="ghost"
                    className="flex items-center space-x-1"
                  >
                    <XMarkIcon className="h-3 w-3" />
                    <span>{dismissText}</span>
                  </Button>
                )}

                {details && (
                  <Button
                    onClick={() => setDetailsVisible(!detailsVisible)}
                    size="sm"
                    variant="ghost"
                    className="flex items-center space-x-1"
                  >
                    {detailsVisible ? (
                      <ChevronUpIcon className="h-3 w-3" />
                    ) : (
                      <ChevronDownIcon className="h-3 w-3" />
                    )}
                    <span>{detailsVisible ? 'Hide Details' : 'Show Details'}</span>
                  </Button>
                )}
                
                {actions}
              </div>
            )}

            {/* Error details */}
            {details && detailsVisible && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Error Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {details.code && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Code: </span>
                        <span className="text-xs font-mono">{details.code}</span>
                      </div>
                    )}
                    {details.timestamp && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Time: </span>
                        <span className="text-xs font-mono">{details.timestamp}</span>
                      </div>
                    )}
                    {details.stack && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Stack: </span>
                        <pre className="text-xs font-mono bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                          {details.stack}
                        </pre>
                      </div>
                    )}
                    {Object.entries(details).map(([key, value]) => {
                      if (['code', 'timestamp', 'stack'].includes(key)) return null;
                      return (
                        <div key={key}>
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {key}: 
                          </span>
                          <span className="text-xs font-mono ml-1">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ErrorDisplay.displayName = 'ErrorDisplay';

export { ErrorDisplay };
export type { ErrorDisplayProps, ErrorDetails };