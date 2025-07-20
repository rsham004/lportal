'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ErrorAlertProps {
  message: string;
  title?: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  visible?: boolean;
  dismissible?: boolean;
  autoClose?: number; // milliseconds
  showProgress?: boolean;
  pauseOnHover?: boolean;
  showIcon?: boolean;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  animation?: 'slide' | 'fade' | 'none';
  actions?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const ErrorAlert = React.forwardRef<HTMLDivElement, ErrorAlertProps>(
  ({
    message,
    title,
    type = 'error',
    visible = true,
    dismissible = true,
    autoClose,
    showProgress = true,
    pauseOnHover = true,
    showIcon = true,
    position,
    animation = 'slide',
    actions,
    onDismiss,
    className,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(visible);
    const [progress, setProgress] = React.useState(100);
    const [isPaused, setIsPaused] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = React.useRef<number>(0);
    const remainingTimeRef = React.useRef<number>(0);

    const icons = {
      error: ExclamationCircleIcon,
      warning: ExclamationTriangleIcon,
      info: InformationCircleIcon,
      success: CheckCircleIcon,
    };

    const Icon = icons[type];

    const typeStyles = {
      error: 'bg-destructive/10 border-destructive/20 text-destructive',
      warning: 'bg-warning/10 border-warning/20 text-warning',
      info: 'bg-info/10 border-info/20 text-info',
      success: 'bg-success/10 border-success/20 text-success',
    };

    const positionStyles = {
      top: 'top-4 left-1/2 transform -translate-x-1/2',
      bottom: 'bottom-4 left-1/2 transform -translate-x-1/2',
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
    };

    const animationStyles = {
      slide: 'animate-slide-in',
      fade: 'animate-fade-in',
      none: '',
    };

    const ariaLive = type === 'error' ? 'assertive' : 'polite';

    // Auto-close functionality
    const startTimer = React.useCallback(() => {
      if (!autoClose || !onDismiss) return;

      startTimeRef.current = Date.now();
      remainingTimeRef.current = autoClose;

      timeoutRef.current = setTimeout(() => {
        onDismiss();
      }, autoClose);

      if (showProgress) {
        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, autoClose - elapsed);
          const progressValue = (remaining / autoClose) * 100;
          setProgress(progressValue);

          if (remaining <= 0) {
            clearInterval(intervalRef.current!);
          }
        }, 50);
      }
    }, [autoClose, onDismiss, showProgress]);

    const pauseTimer = React.useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, autoClose! - elapsed);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, [autoClose]);

    const resumeTimer = React.useCallback(() => {
      if (!autoClose || !onDismiss || remainingTimeRef.current <= 0) return;

      startTimeRef.current = Date.now();
      
      timeoutRef.current = setTimeout(() => {
        onDismiss();
      }, remainingTimeRef.current);

      if (showProgress) {
        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, remainingTimeRef.current - elapsed);
          const progressValue = (remaining / autoClose) * 100;
          setProgress(progressValue);

          if (remaining <= 0) {
            clearInterval(intervalRef.current!);
          }
        }, 50);
      }
    }, [autoClose, onDismiss, showProgress]);

    // Handle visibility changes
    React.useEffect(() => {
      setIsVisible(visible);
    }, [visible]);

    // Handle auto-close timer
    React.useEffect(() => {
      if (isVisible && autoClose && onDismiss) {
        startTimer();
      }

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [isVisible, autoClose, onDismiss, startTimer, message]); // Reset timer when message changes

    // Handle pause/resume on hover
    const handleMouseEnter = () => {
      if (pauseOnHover && autoClose) {
        setIsPaused(true);
        pauseTimer();
      }
    };

    const handleMouseLeave = () => {
      if (pauseOnHover && autoClose && isPaused) {
        setIsPaused(false);
        resumeTimer();
      }
    };

    const handleDismiss = () => {
      setIsVisible(false);
      if (onDismiss) {
        onDismiss();
      }
    };

    if (!isVisible) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="alert"
        aria-live={ariaLive}
        className={cn(
          'rounded-lg border p-4 shadow-lg',
          typeStyles[type],
          position && 'fixed z-50 max-w-md',
          position && positionStyles[position],
          animation && animationStyles[animation],
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <div className="flex items-start space-x-3">
          {showIcon && (
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          )}
          
          <div className="flex-1 space-y-1">
            {title && (
              <h4 className="font-semibold text-sm">
                {title}
              </h4>
            )}
            
            <p className={cn(
              'text-sm',
              title ? 'text-current/80' : 'font-medium'
            )}>
              {message}
            </p>
            
            {actions && (
              <div className="mt-2">
                {actions}
              </div>
            )}
          </div>

          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-md hover:bg-current/10 transition-colors"
              aria-label="Close alert"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && showProgress && (
          <div className="mt-3">
            <div className="w-full bg-current/20 rounded-full h-1">
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="bg-current h-1 rounded-full transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

ErrorAlert.displayName = 'ErrorAlert';

export { ErrorAlert };
export type { ErrorAlertProps };