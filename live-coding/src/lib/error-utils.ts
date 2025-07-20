/**
 * Error Handling Utilities for Learning Portal Platform
 * Comprehensive error management, logging, and recovery mechanisms
 */

// Error Types
export interface ErrorInfo {
  message: string;
  code?: string;
  type: 'validation' | 'network' | 'authentication' | 'authorization' | 'server' | 'client' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  stack?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export interface ErrorRecoveryOptions {
  fallbackValue?: any;
  onError?: (error: ErrorInfo) => void;
  retry?: RetryConfig;
  silent?: boolean;
}

// Error Classification
export const classifyError = (error: Error | unknown): ErrorInfo => {
  const timestamp = Date.now();
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';

  // Default error info
  let errorInfo: ErrorInfo = {
    message: 'An unknown error occurred',
    type: 'unknown',
    severity: 'medium',
    timestamp,
    url,
    userAgent,
  };

  if (error instanceof Error) {
    errorInfo.message = error.message;
    errorInfo.stack = error.stack;

    // Network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      errorInfo.type = 'network';
      errorInfo.severity = 'high';
      errorInfo.code = 'NETWORK_ERROR';
    }
    // Authentication errors
    else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorInfo.type = 'authentication';
      errorInfo.severity = 'high';
      errorInfo.code = 'AUTH_ERROR';
    }
    // Authorization errors
    else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      errorInfo.type = 'authorization';
      errorInfo.severity = 'medium';
      errorInfo.code = 'AUTHZ_ERROR';
    }
    // Server errors
    else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      errorInfo.type = 'server';
      errorInfo.severity = 'critical';
      errorInfo.code = 'SERVER_ERROR';
    }
    // Validation errors
    else if (error.name === 'ValidationError' || error.message.includes('validation')) {
      errorInfo.type = 'validation';
      errorInfo.severity = 'low';
      errorInfo.code = 'VALIDATION_ERROR';
    }
    // Client errors
    else if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      errorInfo.type = 'client';
      errorInfo.severity = 'medium';
      errorInfo.code = 'CLIENT_ERROR';
    }
  }

  return errorInfo;
};

// Error Logging
export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorInfo[] = [];
  private maxLogs = 100;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: Error | unknown, context?: Record<string, any>): ErrorInfo {
    const errorInfo = classifyError(error);
    
    if (context) {
      errorInfo.context = context;
    }

    // Add to local logs
    this.logs.unshift(errorInfo);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorInfo);
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(errorInfo);
    }

    return errorInfo;
  }

  getLogs(): ErrorInfo[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  private async sendToLoggingService(errorInfo: ErrorInfo): Promise<void> {
    try {
      // In a real application, this would send to a service like Sentry, LogRocket, etc.
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorInfo),
      });
    } catch (loggingError) {
      console.error('Failed to send error to logging service:', loggingError);
    }
  }
}

// Retry Mechanism
export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  }
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry this error
      if (config.retryCondition && !config.retryCondition(lastError)) {
        throw lastError;
      }
      
      // Don't retry on last attempt
      if (attempt === config.maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError!;
};

// Error Recovery Wrapper
export const withErrorRecovery = async <T>(
  operation: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
): Promise<T | undefined> => {
  try {
    if (options.retry) {
      return await withRetry(operation, options.retry);
    } else {
      return await operation();
    }
  } catch (error) {
    const errorInfo = ErrorLogger.getInstance().log(error, options);
    
    if (options.onError) {
      options.onError(errorInfo);
    }
    
    if (!options.silent) {
      console.error('Operation failed:', errorInfo);
    }
    
    return options.fallbackValue;
  }
};

// Form Validation Error Handling
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

export interface FormErrors {
  fields: Record<string, string>;
  general?: string;
}

export const formatValidationErrors = (errors: FieldError[]): FormErrors => {
  const formErrors: FormErrors = {
    fields: {},
  };
  
  errors.forEach(error => {
    if (error.field === '_general' || error.field === 'general') {
      formErrors.general = error.message;
    } else {
      formErrors.fields[error.field] = error.message;
    }
  });
  
  return formErrors;
};

// Network Error Recovery
export const isRetryableError = (error: Error): boolean => {
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  const retryableMessages = ['timeout', 'network', 'connection'];
  
  // Check for HTTP status codes
  const statusMatch = error.message.match(/(\d{3})/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1]);
    return retryableStatuses.includes(status);
  }
  
  // Check for network-related error messages
  return retryableMessages.some(msg => 
    error.message.toLowerCase().includes(msg)
  );
};

// Global Error Handler
export const setupGlobalErrorHandler = (): void => {
  if (typeof window === 'undefined') return;
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorInfo = ErrorLogger.getInstance().log(event.reason, {
      type: 'unhandled_promise_rejection',
      promise: event.promise,
    });
    
    console.error('Unhandled promise rejection:', errorInfo);
    
    // Prevent the default browser behavior
    event.preventDefault();
  });
  
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const errorInfo = ErrorLogger.getInstance().log(event.error || event.message, {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    
    console.error('Uncaught error:', errorInfo);
  });
};

// Learning Platform Specific Error Handlers
export const learningPlatformErrors = {
  courseNotFound: (courseId: string) => ({
    message: `Course with ID "${courseId}" was not found`,
    code: 'COURSE_NOT_FOUND',
    type: 'client' as const,
    severity: 'medium' as const,
  }),
  
  enrollmentFailed: (courseId: string, reason?: string) => ({
    message: `Failed to enroll in course "${courseId}"${reason ? `: ${reason}` : ''}`,
    code: 'ENROLLMENT_FAILED',
    type: 'server' as const,
    severity: 'high' as const,
  }),
  
  videoPlaybackError: (videoId: string) => ({
    message: `Unable to play video "${videoId}"`,
    code: 'VIDEO_PLAYBACK_ERROR',
    type: 'client' as const,
    severity: 'medium' as const,
  }),
  
  assignmentSubmissionFailed: (assignmentId: string) => ({
    message: `Failed to submit assignment "${assignmentId}"`,
    code: 'ASSIGNMENT_SUBMISSION_FAILED',
    type: 'network' as const,
    severity: 'high' as const,
  }),
  
  quizTimeExpired: (quizId: string) => ({
    message: `Time expired for quiz "${quizId}"`,
    code: 'QUIZ_TIME_EXPIRED',
    type: 'client' as const,
    severity: 'medium' as const,
  }),
};

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();