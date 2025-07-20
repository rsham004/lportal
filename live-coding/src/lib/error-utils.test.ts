import {
  classifyError,
  ErrorLogger,
  withRetry,
  withErrorRecovery,
  formatValidationErrors,
  isRetryableError,
  learningPlatformErrors,
} from './error-utils';

describe('Error Utilities', () => {
  describe('classifyError', () => {
    it('classifies network errors correctly', () => {
      const networkError = new Error('fetch failed');
      networkError.name = 'NetworkError';
      
      const result = classifyError(networkError);
      
      expect(result.type).toBe('network');
      expect(result.severity).toBe('high');
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toBe('fetch failed');
    });

    it('classifies authentication errors correctly', () => {
      const authError = new Error('401 Unauthorized');
      
      const result = classifyError(authError);
      
      expect(result.type).toBe('authentication');
      expect(result.severity).toBe('high');
      expect(result.code).toBe('AUTH_ERROR');
    });

    it('classifies validation errors correctly', () => {
      const validationError = new Error('validation failed');
      validationError.name = 'ValidationError';
      
      const result = classifyError(validationError);
      
      expect(result.type).toBe('validation');
      expect(result.severity).toBe('low');
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('classifies unknown errors as unknown type', () => {
      const unknownError = new Error('Something went wrong');
      
      const result = classifyError(unknownError);
      
      expect(result.type).toBe('unknown');
      expect(result.severity).toBe('medium');
      expect(result.message).toBe('Something went wrong');
    });

    it('handles non-Error objects', () => {
      const result = classifyError('string error');
      
      expect(result.type).toBe('unknown');
      expect(result.message).toBe('An unknown error occurred');
    });
  });

  describe('ErrorLogger', () => {
    let logger: ErrorLogger;

    beforeEach(() => {
      logger = ErrorLogger.getInstance();
      logger.clearLogs();
    });

    it('logs errors and returns error info', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      const result = logger.log(error, context);
      
      expect(result.message).toBe('Test error');
      expect(result.context).toEqual(context);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('maintains log history', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      logger.log(error1);
      logger.log(error2);
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('Error 2'); // Most recent first
      expect(logs[1].message).toBe('Error 1');
    });

    it('limits log history to max logs', () => {
      // Create more than maxLogs (100) errors
      for (let i = 0; i < 105; i++) {
        logger.log(new Error(`Error ${i}`));
      }
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(100);
    });

    it('clears logs when requested', () => {
      logger.log(new Error('Test error'));
      expect(logger.getLogs()).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('withRetry', () => {
    it('succeeds on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockResolvedValue('success');
      
      const result = await withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffFactor: 2,
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('throws error after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(withRetry(operation, {
        maxAttempts: 2,
        baseDelay: 10,
        maxDelay: 100,
        backoffFactor: 2,
      })).rejects.toThrow('Always fails');
      
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('respects retry condition', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Non-retryable'));
      const retryCondition = jest.fn().mockReturnValue(false);
      
      await expect(withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffFactor: 2,
        retryCondition,
      })).rejects.toThrow('Non-retryable');
      
      expect(operation).toHaveBeenCalledTimes(1);
      expect(retryCondition).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('withErrorRecovery', () => {
    it('returns result on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await withErrorRecovery(operation);
      
      expect(result).toBe('success');
    });

    it('returns fallback value on error', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'));
      
      const result = await withErrorRecovery(operation, {
        fallbackValue: 'fallback',
        silent: true,
      });
      
      expect(result).toBe('fallback');
    });

    it('calls onError callback on failure', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'));
      const onError = jest.fn();
      
      await withErrorRecovery(operation, {
        onError,
        silent: true,
      });
      
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Failed',
        type: 'unknown',
      }));
    });

    it('uses retry configuration when provided', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockResolvedValue('success');
      
      const result = await withErrorRecovery(operation, {
        retry: {
          maxAttempts: 2,
          baseDelay: 10,
          maxDelay: 100,
          backoffFactor: 2,
        },
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('formatValidationErrors', () => {
    it('formats field errors correctly', () => {
      const errors = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password must be at least 8 characters' },
      ];
      
      const result = formatValidationErrors(errors);
      
      expect(result.fields).toEqual({
        email: 'Email is required',
        password: 'Password must be at least 8 characters',
      });
      expect(result.general).toBeUndefined();
    });

    it('handles general errors', () => {
      const errors = [
        { field: 'email', message: 'Email is required' },
        { field: 'general', message: 'Form submission failed' },
      ];
      
      const result = formatValidationErrors(errors);
      
      expect(result.fields).toEqual({
        email: 'Email is required',
      });
      expect(result.general).toBe('Form submission failed');
    });
  });

  describe('isRetryableError', () => {
    it('identifies retryable HTTP status codes', () => {
      const error500 = new Error('500 Internal Server Error');
      const error503 = new Error('503 Service Unavailable');
      const error404 = new Error('404 Not Found');
      
      expect(isRetryableError(error500)).toBe(true);
      expect(isRetryableError(error503)).toBe(true);
      expect(isRetryableError(error404)).toBe(false);
    });

    it('identifies retryable network errors', () => {
      const timeoutError = new Error('Request timeout');
      const networkError = new Error('Network connection failed');
      const validationError = new Error('Validation failed');
      
      expect(isRetryableError(timeoutError)).toBe(true);
      expect(isRetryableError(networkError)).toBe(true);
      expect(isRetryableError(validationError)).toBe(false);
    });
  });

  describe('learningPlatformErrors', () => {
    it('creates course not found error', () => {
      const error = learningPlatformErrors.courseNotFound('course-123');
      
      expect(error.message).toBe('Course with ID "course-123" was not found');
      expect(error.code).toBe('COURSE_NOT_FOUND');
      expect(error.type).toBe('client');
      expect(error.severity).toBe('medium');
    });

    it('creates enrollment failed error', () => {
      const error = learningPlatformErrors.enrollmentFailed('course-123', 'Course is full');
      
      expect(error.message).toBe('Failed to enroll in course "course-123": Course is full');
      expect(error.code).toBe('ENROLLMENT_FAILED');
      expect(error.type).toBe('server');
      expect(error.severity).toBe('high');
    });

    it('creates video playback error', () => {
      const error = learningPlatformErrors.videoPlaybackError('video-456');
      
      expect(error.message).toBe('Unable to play video "video-456"');
      expect(error.code).toBe('VIDEO_PLAYBACK_ERROR');
      expect(error.type).toBe('client');
      expect(error.severity).toBe('medium');
    });

    it('creates assignment submission failed error', () => {
      const error = learningPlatformErrors.assignmentSubmissionFailed('assignment-789');
      
      expect(error.message).toBe('Failed to submit assignment "assignment-789"');
      expect(error.code).toBe('ASSIGNMENT_SUBMISSION_FAILED');
      expect(error.type).toBe('network');
      expect(error.severity).toBe('high');
    });

    it('creates quiz time expired error', () => {
      const error = learningPlatformErrors.quizTimeExpired('quiz-101');
      
      expect(error.message).toBe('Time expired for quiz "quiz-101"');
      expect(error.code).toBe('QUIZ_TIME_EXPIRED');
      expect(error.type).toBe('client');
      expect(error.severity).toBe('medium');
    });
  });
});