import { ErrorTracker, type ErrorEvent, type ErrorAnalysis, type IncidentResponse } from './errorTracker';

// Mock dependencies
jest.mock('./applicationMonitor', () => ({
  ApplicationMonitor: {
    getInstance: jest.fn(() => ({
      recordMetric: jest.fn(),
      getActiveAlerts: jest.fn(() => []),
    }))
  }
}));

describe('ErrorTracker', () => {
  let tracker: ErrorTracker;

  beforeEach(() => {
    tracker = ErrorTracker.getInstance();
    // Reset singleton for testing
    (ErrorTracker as any).instance = null;
    tracker = ErrorTracker.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ErrorTracker.getInstance();
      const instance2 = ErrorTracker.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Error Tracking', () => {
    it('should track JavaScript errors', () => {
      const error = new Error('Test error');
      tracker.trackError(error, 'javascript', { userId: 'user123', page: '/dashboard' });

      const errors = tracker.getErrors();
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Test error');
      expect(errors[0].type).toBe('javascript');
      expect(errors[0].context.userId).toBe('user123');
    });

    it('should track API errors', () => {
      tracker.trackAPIError('/api/courses', 500, 'Internal Server Error', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const errors = tracker.getErrors();
      expect(errors.length).toBe(1);
      expect(errors[0].type).toBe('api');
      expect(errors[0].statusCode).toBe(500);
      expect(errors[0].endpoint).toBe('/api/courses');
    });

    it('should track authentication errors', () => {
      tracker.trackAuthError('invalid_credentials', 'user123', {
        attemptedEmail: 'test@example.com',
        ipAddress: '192.168.1.1'
      });

      const errors = tracker.getErrors();
      expect(errors.length).toBe(1);
      expect(errors[0].type).toBe('authentication');
      expect(errors[0].authErrorType).toBe('invalid_credentials');
      expect(errors[0].userId).toBe('user123');
    });

    it('should track validation errors', () => {
      tracker.trackValidationError('course_creation', {
        title: 'Title is required',
        duration: 'Duration must be a positive number'
      }, { formData: { title: '', duration: -1 } });

      const errors = tracker.getErrors();
      expect(errors.length).toBe(1);
      expect(errors[0].type).toBe('validation');
      expect(errors[0].validationErrors).toEqual({
        title: 'Title is required',
        duration: 'Duration must be a positive number'
      });
    });

    it('should track system errors', () => {
      tracker.trackSystemError('database_connection', 'Failed to connect to database', {
        service: 'postgresql',
        host: 'localhost',
        port: 5432
      });

      const errors = tracker.getErrors();
      expect(errors.length).toBe(1);
      expect(errors[0].type).toBe('system');
      expect(errors[0].systemComponent).toBe('database_connection');
    });
  });

  describe('Error Analysis', () => {
    beforeEach(() => {
      // Add some test errors
      tracker.trackError(new Error('Error 1'), 'javascript');
      tracker.trackError(new Error('Error 1'), 'javascript'); // Duplicate
      tracker.trackAPIError('/api/test', 500, 'Server Error');
      tracker.trackAuthError('invalid_credentials', 'user1');
      tracker.trackAuthError('invalid_credentials', 'user2');
    });

    it('should analyze error patterns', () => {
      const analysis = tracker.analyzeErrors();
      
      expect(analysis).toHaveProperty('totalErrors');
      expect(analysis).toHaveProperty('errorsByType');
      expect(analysis).toHaveProperty('topErrors');
      expect(analysis).toHaveProperty('errorTrends');
      expect(analysis).toHaveProperty('affectedUsers');
      
      expect(analysis.totalErrors).toBe(5);
      expect(analysis.errorsByType.javascript).toBe(2);
      expect(analysis.errorsByType.api).toBe(1);
      expect(analysis.errorsByType.authentication).toBe(2);
    });

    it('should identify top errors by frequency', () => {
      const analysis = tracker.analyzeErrors();
      
      expect(analysis.topErrors.length).toBeGreaterThan(0);
      expect(analysis.topErrors[0]).toHaveProperty('message');
      expect(analysis.topErrors[0]).toHaveProperty('count');
      expect(analysis.topErrors[0]).toHaveProperty('percentage');
    });

    it('should track error trends over time', () => {
      const analysis = tracker.analyzeErrors();
      
      expect(analysis.errorTrends).toHaveProperty('hourly');
      expect(analysis.errorTrends).toHaveProperty('daily');
      expect(analysis.errorTrends.hourly).toBeInstanceOf(Array);
    });

    it('should identify affected users', () => {
      const analysis = tracker.analyzeErrors();
      
      expect(analysis.affectedUsers).toBeInstanceOf(Array);
      expect(analysis.affectedUsers.length).toBeGreaterThan(0);
    });
  });

  describe('Incident Response', () => {
    it('should detect critical error patterns', () => {
      // Simulate high error rate
      for (let i = 0; i < 10; i++) {
        tracker.trackAPIError('/api/critical', 500, 'Critical Error');
      }

      const incidents = tracker.detectIncidents();
      expect(incidents.length).toBeGreaterThan(0);
      expect(incidents[0].severity).toBe('critical');
      expect(incidents[0].type).toBe('high_error_rate');
    });

    it('should create incident response plan', () => {
      // Create a critical incident
      for (let i = 0; i < 15; i++) {
        tracker.trackSystemError('database_connection', 'DB Connection Failed');
      }

      const incidents = tracker.detectIncidents();
      expect(incidents.length).toBeGreaterThan(0);
      
      const response = tracker.createIncidentResponse(incidents[0]);
      expect(response).toHaveProperty('incidentId');
      expect(response).toHaveProperty('severity');
      expect(response).toHaveProperty('actions');
      expect(response).toHaveProperty('escalation');
      expect(response.actions.length).toBeGreaterThan(0);
    });

    it('should escalate critical incidents', () => {
      const incident = {
        id: 'test-incident',
        type: 'system_failure',
        severity: 'critical' as const,
        message: 'System failure detected',
        timestamp: Date.now(),
        errorCount: 20,
        affectedUsers: ['user1', 'user2'],
        component: 'database'
      };

      const response = tracker.createIncidentResponse(incident);
      expect(response.escalation.required).toBe(true);
      expect(response.escalation.level).toBe('immediate');
    });

    it('should track incident resolution', () => {
      const incident = {
        id: 'test-incident',
        type: 'high_error_rate',
        severity: 'high' as const,
        message: 'High error rate detected',
        timestamp: Date.now(),
        errorCount: 10,
        affectedUsers: [],
        component: 'api'
      };

      tracker.resolveIncident(incident.id, 'Fixed API endpoint', 'developer');
      
      const resolvedIncidents = tracker.getResolvedIncidents();
      expect(resolvedIncidents.length).toBe(1);
      expect(resolvedIncidents[0].resolution).toBe('Fixed API endpoint');
      expect(resolvedIncidents[0].resolvedBy).toBe('developer');
    });
  });

  describe('Error Filtering and Search', () => {
    beforeEach(() => {
      tracker.trackError(new Error('Error A'), 'javascript', { userId: 'user1' });
      tracker.trackAPIError('/api/test', 404, 'Not Found');
      tracker.trackAuthError('session_expired', 'user2');
    });

    it('should filter errors by type', () => {
      const jsErrors = tracker.getErrorsByType('javascript');
      expect(jsErrors.length).toBe(1);
      expect(jsErrors[0].type).toBe('javascript');

      const apiErrors = tracker.getErrorsByType('api');
      expect(apiErrors.length).toBe(1);
      expect(apiErrors[0].type).toBe('api');
    });

    it('should filter errors by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const recentErrors = tracker.getErrorsByTimeRange(oneHourAgo, now);
      expect(recentErrors.length).toBe(3);
    });

    it('should filter errors by user', () => {
      const user1Errors = tracker.getErrorsByUser('user1');
      expect(user1Errors.length).toBe(1);
      expect(user1Errors[0].context?.userId).toBe('user1');
    });

    it('should search errors by message', () => {
      const searchResults = tracker.searchErrors('Error A');
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].message).toContain('Error A');
    });
  });

  describe('Error Notifications', () => {
    it('should trigger notifications for critical errors', () => {
      const notificationSpy = jest.fn();
      tracker.onCriticalError(notificationSpy);

      // Trigger critical error
      for (let i = 0; i < 10; i++) {
        tracker.trackSystemError('critical_service', 'Critical failure');
      }

      expect(notificationSpy).toHaveBeenCalled();
    });

    it('should batch notifications to prevent spam', () => {
      const notificationSpy = jest.fn();
      tracker.onCriticalError(notificationSpy);

      // Trigger multiple errors quickly
      for (let i = 0; i < 20; i++) {
        tracker.trackError(new Error('Spam error'), 'javascript');
      }

      // Should not call notification for each error
      expect(notificationSpy.mock.calls.length).toBeLessThan(20);
    });
  });

  describe('Integration with Previous Phases', () => {
    it('should track authentication phase errors', () => {
      tracker.trackAuthError('login_failed', 'user123', {
        provider: 'clerk',
        reason: 'invalid_password'
      });

      const errors = tracker.getErrors();
      expect(errors[0].context?.provider).toBe('clerk');
      expect(errors[0].context?.reason).toBe('invalid_password');
    });

    it('should track content management errors', () => {
      tracker.trackError(new Error('Video upload failed'), 'content', {
        courseId: 'course123',
        videoId: 'video456',
        uploadSize: 1024000
      });

      const errors = tracker.getErrors();
      expect(errors[0].context?.courseId).toBe('course123');
      expect(errors[0].context?.videoId).toBe('video456');
    });

    it('should track PWA errors', () => {
      tracker.trackError(new Error('Service worker registration failed'), 'pwa', {
        feature: 'offline_sync',
        browser: 'chrome'
      });

      const errors = tracker.getErrors();
      expect(errors[0].context?.feature).toBe('offline_sync');
      expect(errors[0].context?.browser).toBe('chrome');
    });
  });

  describe('Error Reporting', () => {
    beforeEach(() => {
      tracker.trackError(new Error('Test error 1'), 'javascript');
      tracker.trackAPIError('/api/test', 500, 'Server Error');
      tracker.trackAuthError('invalid_credentials', 'user1');
    });

    it('should generate error reports', () => {
      const report = tracker.generateErrorReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('analysis');
      expect(report).toHaveProperty('incidents');
      expect(report).toHaveProperty('recommendations');
      
      expect(report.summary.totalErrors).toBe(3);
      expect(report.analysis.errorsByType).toHaveProperty('javascript');
      expect(report.analysis.errorsByType).toHaveProperty('api');
      expect(report.analysis.errorsByType).toHaveProperty('authentication');
    });

    it('should export error data', () => {
      const jsonData = tracker.exportErrors('json');
      expect(() => JSON.parse(jsonData)).not.toThrow();
      
      const csvData = tracker.exportErrors('csv');
      expect(csvData).toContain('timestamp,type,message,severity');
    });

    it('should provide error statistics', () => {
      const stats = tracker.getErrorStatistics();
      
      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('errorRate');
      expect(stats).toHaveProperty('mttr'); // Mean Time To Resolution
      expect(stats).toHaveProperty('topErrorTypes');
      expect(stats).toHaveProperty('criticalIncidents');
    });
  });
});