'use client';

import * as React from 'react';
import { createContext, useContext, useReducer, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Types
interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface Toast {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  showProgress?: boolean;
  pauseOnHover?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  actions?: ToastAction[];
  createdAt: number;
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction_Type = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'DISMISS_TOAST'; id: string }
  | { type: 'DISMISS_ALL' };

interface ToastContextType {
  toasts: Toast[];
  toast: {
    error: (message: string, options?: Partial<Toast>) => void;
    warning: (message: string, options?: Partial<Toast>) => void;
    info: (message: string, options?: Partial<Toast>) => void;
    success: (message: string, options?: Partial<Toast>) => void;
  };
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Reducer
const toastReducer = (state: ToastState, action: ToastAction_Type): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };
    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.id),
      };
    case 'DISMISS_ALL':
      return {
        ...state,
        toasts: [],
      };
    default:
      return state;
  }
};

// Provider Props
interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  defaultPosition?: Toast['position'];
  defaultDuration?: number;
}

// Provider Component
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
  defaultPosition = 'top-right',
  defaultDuration = 5000,
}) => {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const addToast = useCallback((toast: Toast) => {
    // Limit number of toasts
    if (state.toasts.length >= maxToasts) {
      // Remove oldest toast
      const oldestToast = state.toasts[0];
      dispatch({ type: 'DISMISS_TOAST', id: oldestToast.id });
    }
    
    dispatch({ type: 'ADD_TOAST', toast });
  }, [state.toasts.length, maxToasts]);

  const dismiss = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_TOAST', id });
  }, []);

  const dismissAll = useCallback(() => {
    dispatch({ type: 'DISMISS_ALL' });
  }, []);

  const createToast = useCallback((
    type: Toast['type'],
    message: string,
    options: Partial<Toast> = {}
  ) => {
    const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const toast: Toast = {
      id,
      type,
      message,
      duration: defaultDuration,
      dismissible: true,
      showProgress: true,
      pauseOnHover: true,
      position: defaultPosition,
      createdAt: Date.now(),
      ...options,
    };

    addToast(toast);
  }, [addToast, defaultDuration, defaultPosition]);

  const toastMethods = {
    error: (message: string, options?: Partial<Toast>) => createToast('error', message, options),
    warning: (message: string, options?: Partial<Toast>) => createToast('warning', message, options),
    info: (message: string, options?: Partial<Toast>) => createToast('info', message, options),
    success: (message: string, options?: Partial<Toast>) => createToast('success', message, options),
  };

  const value: ToastContextType = {
    toasts: state.toasts,
    toast: toastMethods,
    dismiss,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Hook
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Component
interface ErrorToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ toast, onDismiss }) => {
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

  const Icon = icons[toast.type];

  const typeStyles = {
    error: 'bg-destructive/10 border-destructive text-destructive',
    warning: 'bg-warning/10 border-warning text-warning',
    info: 'bg-info/10 border-info text-info',
    success: 'bg-success/10 border-success text-success',
  };

  const ariaLive = toast.type === 'error' ? 'assertive' : 'polite';

  // Auto-dismiss functionality
  const startTimer = React.useCallback(() => {
    if (!toast.duration) return;

    startTimeRef.current = Date.now();
    remainingTimeRef.current = toast.duration;

    timeoutRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);

    if (toast.showProgress) {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, toast.duration! - elapsed);
        const progressValue = (remaining / toast.duration!) * 100;
        setProgress(progressValue);

        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
        }
      }, 50);
    }
  }, [toast.duration, toast.showProgress, toast.id, onDismiss]);

  const pauseTimer = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, toast.duration! - elapsed);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [toast.duration]);

  const resumeTimer = React.useCallback(() => {
    if (!toast.duration || remainingTimeRef.current <= 0) return;

    startTimeRef.current = Date.now();
    
    timeoutRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, remainingTimeRef.current);

    if (toast.showProgress) {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, remainingTimeRef.current - elapsed);
        const progressValue = (remaining / toast.duration!) * 100;
        setProgress(progressValue);

        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
        }
      }, 50);
    }
  }, [toast.duration, toast.showProgress, toast.id, onDismiss]);

  React.useEffect(() => {
    if (toast.duration) {
      startTimer();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [toast.duration, startTimer]);

  const handleMouseEnter = () => {
    if (toast.pauseOnHover && toast.duration) {
      setIsPaused(true);
      pauseTimer();
    }
  };

  const handleMouseLeave = () => {
    if (toast.pauseOnHover && toast.duration && isPaused) {
      setIsPaused(false);
      resumeTimer();
    }
  };

  const handleDismiss = () => {
    onDismiss(toast.id);
  };

  return (
    <div
      role="alert"
      aria-live={ariaLive}
      className={cn(
        'relative rounded-lg border p-4 shadow-lg animate-slide-in max-w-md w-full',
        typeStyles[toast.type]
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 space-y-1">
          {toast.title && (
            <h4 className="font-semibold text-sm">
              {toast.title}
            </h4>
          )}
          
          <p className={cn(
            'text-sm',
            toast.title ? 'text-current/80' : 'font-medium'
          )}>
            {toast.message}
          </p>
          
          {toast.actions && toast.actions.length > 0 && (
            <div className="flex space-x-2 mt-2">
              {toast.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                  className="h-7 px-2 text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {toast.dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-current/10 transition-colors"
            aria-label="Close toast"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {toast.duration && toast.showProgress && (
        <div className="absolute bottom-0 left-0 right-0">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="bg-current/30 h-1 rounded-b-lg transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Toast Container Component
const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  // Group toasts by position
  const toastsByPosition = React.useMemo(() => {
    const groups: Record<string, Toast[]> = {};
    
    toasts.forEach(toast => {
      const position = toast.position || 'top-right';
      if (!groups[position]) {
        groups[position] = [];
      }
      groups[position].push(toast);
    });
    
    return groups;
  }, [toasts]);

  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          data-testid="toast-container"
          className={cn(
            'fixed z-50 flex flex-col space-y-2 pointer-events-none',
            positionStyles[position as keyof typeof positionStyles]
          )}
        >
          {positionToasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ErrorToast toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

export { ToastProvider, useToast };
export type { Toast, ToastAction };