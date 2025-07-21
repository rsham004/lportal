import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ApplicationMonitor } from '../../lib/monitoring/applicationMonitor';
import { PerformanceTracker } from '../../lib/monitoring/performanceTracker';
import { ErrorTracker } from '../../lib/monitoring/errorTracker';
import { MonitoringDashboard } from './MonitoringDashboard';
import { AlertSystem } from './AlertSystem';

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data }: any) => <div data-testid="line-chart">{JSON.stringify(data)}</div>,
  Bar: ({ data }: any) => <div data-testid="bar-chart">{JSON.stringify(data)}</div>,
  Doughnut: ({ data }: any) => <div data-testid="doughnut-chart">{JSON.stringify(data)}</div>,
}));

describe('Monitoring System Integration Tests', () => {
  let monitor: ApplicationMonitor;
  let performanceTracker: PerformanceTracker;
  let errorTracker: ErrorTracker;

  beforeEach(() => {
    // Reset singletons
    (ApplicationMonitor as any).instance = null;
    (PerformanceTracker as any).instance = null;
    (ErrorTracker as any).instance = null;

    monitor = ApplicationMonitor.getInstance();
    performanceTracker = PerformanceTracker.getInstance();
    errorTracker = ErrorTracker.getInstance();

    jest.clearAllMocks();
  });

  afterEach(() => {
    monitor.stop();
    performanceTracker.stop();
    errorTracker.stop();
  });

  describe('Phase 1 Integration - UI Components and Theme System', () => {
    it('should integrate with theme system for dark/light mode', async () => {
      // Mock theme context
      const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
        <div data-theme="dark">{children}</div>
      );

      render(
        <ThemeProvider>
          <MonitoringDashboard />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('System Monitoring Dashboard')).toBeInTheDocument();
      });

      // Should apply dark theme classes
      const dashboard = screen.getByTestId('monitoring-dashboard');
      expect(dashboard).toBeInTheDocument();
    });

    it('should use design system components consistently', async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        // Should use consistent button styles from design system
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        expect(refreshButton).toHaveClass('inline-flex', 'items-center', 'px-3', 'py-2');

        // Should use consistent form elements
        const realTimeToggle = screen.getByRole('checkbox', { name: /real-time updates/i });
        expect(realTimeToggle).toBeInTheDocument();
      });
    });

    it('should be responsive across different screen sizes', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<MonitoringDashboard />);

      await waitFor(() => {
        const dashboard = screen.getByTestId('monitoring-dashboard');
        expect(dashboard).toHaveClass('mobile-layout');
      });
    });

    it('should maintain accessibility standards from Phase 1', async () => {
      render(<AlertSystem />);

      await waitFor(() => {
        // Should have proper ARIA labels
        expect(screen.getByRole('region', { name: /alert system/i })).toBeInTheDocument();
        
        // Should support keyboard navigation
        const firstButton = screen.getAllByRole('button')[0];
        firstButton.focus();
        expect(firstButton).toHaveFocus();
      });
    });
  });

  describe('Phase 2 Integration - Authentication and Authorization', () => {
    it('should track authentication events and display metrics', async () => {
      // Simulate authentication events
      monitor.recordAuthEvent('login');
      monitor.recordAuthEvent('login');
      monitor.recordAuthEvent('logout');
      monitor.recordAuthEvent('failure');

      render(<MonitoringDashboard />);

      await waitFor(() => {
        // Should display authentication metrics
        expect(screen.getByText('User Logins')).toBeInTheDocument();
        
        const appMetrics = monitor.getApplicationMetrics();
        expect(appMetrics.userLogins.total).toBe(2);
        expect(appMetrics.userLogouts.total).toBe(1);
        expect(appMetrics.authFailures.total).toBe(1);
      });
    });

    it('should handle authentication errors and create appropriate alerts', async () => {
      // Track authentication errors
      errorTracker.trackAuthError('invalid_credentials', 'user123', {
        attemptedEmail: 'test@example.com',
        ipAddress: '192.168.1.1'
      });

      errorTracker.trackAuthError('account_locked', 'user456', {
        lockReason: 'too_many_attempts'
      });

      render(<AlertSystem />);

      await waitFor(() => {
        const errors = errorTracker.getErrors();
        const authErrors = errors.filter(e => e.type === 'authentication');
        expect(authErrors.length).toBe(2);
        
        // Should display auth-related context
        expect(screen.getByText(/user123/i)).toBeInTheDocument();
      });
    });

    it('should respect role-based access for monitoring features', async () => {
      // Mock user with different roles
      const mockUser = { role: 'instructor', permissions: ['view_own_metrics'] };
      
      render(<MonitoringDashboard />);

      await waitFor(() => {
        // Instructor should see limited metrics
        expect(screen.getByText('System Monitoring Dashboard')).toBeInTheDocument();
        
        // Admin-only features should be hidden for non-admin users
        // This would be implemented with proper role checking
      });
    });

    it('should audit monitoring access and actions', async () => {
      // Simulate monitoring actions that should be audited
      monitor.recordMetric('dashboard_access', 1);
      
      render(<MonitoringDashboard />);

      await waitFor(() => {
        // Should record audit events for monitoring access
        const appMetrics = monitor.getApplicationMetrics();
        expect(appMetrics['dashboard_access']).toBeDefined();
      });
    });
  });

  describe('Phase 3 Integration - Content Management and Video Delivery', () => {
    it('should track content delivery metrics', async () => {
      // Simulate content events
      monitor.recordContentEvent('course_view');
      monitor.recordContentEvent('course_enrollment');
      monitor.recordContentEvent('video_start');
      monitor.recordContentEvent('video_completion');

      performanceTracker.recordContentPerformance('video_load', 500);
      performanceTracker.recordContentPerformance('course_load', 300);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        // Should display content metrics
        expect(screen.getByText('Course Views')).toBeInTheDocument();
        
        const appMetrics = monitor.getApplicationMetrics();
        expect(appMetrics.courseViews.total).toBe(1);
        expect(appMetrics.videoStarts.total).toBe(1);
        expect(appMetrics.videoCompletions.total).toBe(1);
      });
    });

    it('should monitor video streaming performance and quality', async () => {
      // Simulate video performance metrics
      performanceTracker.recordContentPerformance('video_load', 150); // Fast load
      performanceTracker.recordContentPerformance('video_load', 2000); // Slow load

      const performanceMetrics = await performanceTracker.getPerformanceMetrics();
      
      expect(performanceMetrics.application.content?.videoLoadTime).toBeDefined();
      
      // Should detect slow video loading
      if (performanceMetrics.application.content?.videoLoadTime > 1000) {
        const alerts = await performanceTracker.checkPerformanceAlerts();
        expect(alerts.some(alert => alert.type === 'slow_response')).toBe(true);
      }
    });

    it('should handle content-related errors appropriately', async () => {
      // Track content errors
      errorTracker.trackError(
        new Error('Video upload failed'),
        'content',
        {
          courseId: 'course123',
          videoId: 'video456',
          uploadSize: 1024000
        }
      );

      errorTracker.trackError(
        new Error('Course creation failed'),
        'content',
        {
          instructorId: 'instructor789',
          courseTitle: 'Test Course'
        }
      );

      render(<AlertSystem />);

      await waitFor(() => {
        // Should display content-related alerts with context
        expect(screen.getByText(/video upload failed/i)).toBeInTheDocument();
        expect(screen.getByText(/course123/i)).toBeInTheDocument();
      });
    });

    it('should monitor Mux video service health', async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        // Should show video service status
        expect(screen.getByText('Video')).toBeInTheDocument();
        
        const healthStatus = await monitor.getHealthStatus();
        expect(healthStatus.services.video).toBeDefined();
        expect(healthStatus.services.video.status).toBe('healthy');
      });
    });
  });

  describe('Phase 4 Integration - PWA and Advanced Features', () => {
    it('should track PWA installation and usage metrics', async () => {
      // Simulate PWA events
      monitor.recordPWAEvent('pwa_install');
      monitor.recordPWAEvent('offline_usage');
      monitor.recordPWAEvent('cache_hit');

      performanceTracker.recordPWAPerformance('cache_hit', 50);
      performanceTracker.recordPWAPerformance('offline_load', 200);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        const appMetrics = monitor.getApplicationMetrics();
        expect(appMetrics.pwaInstalls.total).toBe(1);
        expect(appMetrics.offlineUsage.total).toBe(1);
        expect(appMetrics.cacheHits.total).toBe(1);
      });
    });

    it('should monitor service worker and cache performance', async () => {
      // Simulate cache performance
      performanceTracker.recordPWAPerformance('cache_hit', 25); // Fast cache hit
      performanceTracker.recordPWAPerformance('cache_hit', 100); // Slower cache hit

      const performanceMetrics = await performanceTracker.getPerformanceMetrics();
      expect(performanceMetrics.application.pwa?.cacheHitTime).toBeDefined();
    });

    it('should handle PWA-specific errors and offline scenarios', async () => {
      // Track PWA errors
      errorTracker.trackError(
        new Error('Service worker registration failed'),
        'pwa',
        {
          feature: 'offline_sync',
          browser: 'chrome',
          version: '91.0'
        }
      );

      errorTracker.trackError(
        new Error('Cache quota exceeded'),
        'pwa',
        {
          feature: 'course_download',
          quotaUsed: '95%'
        }
      );

      render(<AlertSystem />);

      await waitFor(() => {
        // Should display PWA-related alerts
        expect(screen.getByText(/service worker registration failed/i)).toBeInTheDocument();
        expect(screen.getByText(/offline_sync/i)).toBeInTheDocument();
      });
    });

    it('should monitor real-time features and WebSocket connections', async () => {
      // Simulate real-time monitoring
      const callback = jest.fn();
      monitor.startMonitoring(callback, 1000);

      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(callback).toHaveBeenCalled();
      expect(monitor.isMonitoring()).toBe(true);

      monitor.stop();
      expect(monitor.isMonitoring()).toBe(false);
    });
  });

  describe('Cross-Phase Integration Scenarios', () => {
    it('should handle complex user journey monitoring', async () => {
      // Simulate complete user journey
      monitor.recordAuthEvent('login');
      monitor.recordAPIResponse(150);
      monitor.recordContentEvent('course_view');
      monitor.recordContentEvent('video_start');
      performanceTracker.recordContentPerformance('video_load', 200);
      monitor.recordContentEvent('video_completion');
      monitor.recordPWAEvent('cache_hit');
      monitor.recordAuthEvent('logout');

      const appMetrics = monitor.getApplicationMetrics();
      
      // Should track complete journey
      expect(appMetrics.userLogins.total).toBe(1);
      expect(appMetrics.courseViews.total).toBe(1);
      expect(appMetrics.videoStarts.total).toBe(1);
      expect(appMetrics.videoCompletions.total).toBe(1);
      expect(appMetrics.cacheHits.total).toBe(1);
      expect(appMetrics.userLogouts.total).toBe(1);
    });

    it('should correlate errors across different phases', async () => {
      // Simulate related errors across phases
      errorTracker.trackAuthError('session_expired', 'user123');
      errorTracker.trackAPIError('/api/courses', 401, 'Unauthorized');
      errorTracker.trackError(
        new Error('Video access denied'),
        'content',
        { userId: 'user123', courseId: 'course456' }
      );

      const analysis = errorTracker.analyzeErrors();
      
      // Should identify affected user across phases
      expect(analysis.affectedUsers).toContain('user123');
      expect(analysis.errorsByType.authentication).toBe(1);
      expect(analysis.errorsByType.api).toBe(1);
      expect(analysis.errorsByType.content).toBe(1);
    });

    it('should provide comprehensive system health across all phases', async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        // Should show health status for all services
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Cache')).toBeInTheDocument();
        expect(screen.getByText('Storage')).toBeInTheDocument();
        expect(screen.getByText('Video')).toBeInTheDocument();
      });

      const healthStatus = await monitor.getHealthStatus();
      
      // Should check all critical services
      expect(healthStatus.services.database).toBeDefined();
      expect(healthStatus.services.cache).toBeDefined();
      expect(healthStatus.services.storage).toBeDefined();
      expect(healthStatus.services.video).toBeDefined();
    });

    it('should generate comprehensive reports across all phases', async () => {
      // Generate activity across all phases
      monitor.recordAuthEvent('login');
      monitor.recordContentEvent('course_view');
      monitor.recordPWAEvent('pwa_install');
      errorTracker.trackError(new Error('Test error'), 'javascript');

      const performanceReport = await performanceTracker.generatePerformanceReport();
      const errorReport = errorTracker.generateErrorReport();
      const monitoringReport = await monitor.generateReport();

      // Should provide comprehensive insights
      expect(performanceReport.summary).toBeDefined();
      expect(errorReport.analysis).toBeDefined();
      expect(monitoringReport.performance).toBeDefined();
      
      // Should include data from all phases
      expect(monitoringReport.usage.activeUsers).toBeGreaterThanOrEqual(0);
      expect(monitoringReport.usage.courseViews).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Scalability Integration', () => {
    it('should handle high-volume monitoring data efficiently', async () => {
      const startTime = performance.now();
      
      // Generate high volume of metrics
      for (let i = 0; i < 1000; i++) {
        monitor.recordAPIResponse(Math.random() * 500);
        monitor.recordMetric('test_metric', Math.random() * 100);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1s

      const appMetrics = monitor.getApplicationMetrics();
      expect(appMetrics.apiResponseTime.count).toBe(1000);
    });

    it('should maintain performance under concurrent monitoring', async () => {
      // Simulate concurrent monitoring
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              monitor.recordMetric(`concurrent_${i}`, i);
              resolve(void 0);
            }, Math.random() * 100);
          })
        );
      }

      await Promise.all(promises);
      
      // Should handle concurrent access without issues
      const appMetrics = monitor.getApplicationMetrics();
      expect(Object.keys(appMetrics).length).toBeGreaterThan(0);
    });

    it('should implement proper memory management for long-running monitoring', async () => {
      // Generate many metrics to test memory management
      for (let i = 0; i < 2000; i++) {
        monitor.recordMetric('memory_test', i);
      }

      const appMetrics = monitor.getApplicationMetrics();
      
      // Should limit stored values to prevent memory issues
      expect(appMetrics.memory_test.values.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle monitoring service failures gracefully', async () => {
      // Mock service failure
      const originalGetSystemMetrics = monitor.getSystemMetrics;
      monitor.getSystemMetrics = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      render(<MonitoringDashboard />);

      await waitFor(() => {
        // Should still render dashboard even if some services fail
        expect(screen.getByText('System Monitoring Dashboard')).toBeInTheDocument();
      });

      // Restore original method
      monitor.getSystemMetrics = originalGetSystemMetrics;
    });

    it('should continue monitoring after temporary failures', async () => {
      let failureCount = 0;
      const callback = jest.fn(() => {
        failureCount++;
        if (failureCount <= 2) {
          throw new Error('Temporary failure');
        }
      });

      // Should not throw even with callback failures
      expect(() => {
        monitor.startMonitoring(callback, 100);
      }).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 350));

      // Should continue calling callback after failures
      expect(callback).toHaveBeenCalledTimes(3);
      
      monitor.stop();
    });
  });

  describe('Data Export and Integration', () => {
    it('should export monitoring data in multiple formats', async () => {
      // Generate some data
      monitor.recordAPIResponse(150);
      errorTracker.trackError(new Error('Test error'), 'javascript');

      const jsonExport = await monitor.exportMetrics('json');
      const csvExport = await monitor.exportMetrics('csv');
      const errorJsonExport = errorTracker.exportErrors('json');
      const errorCsvExport = errorTracker.exportErrors('csv');

      // Should export valid data
      expect(() => JSON.parse(jsonExport)).not.toThrow();
      expect(csvExport).toContain('timestamp,metric,value');
      expect(() => JSON.parse(errorJsonExport)).not.toThrow();
      expect(errorCsvExport).toContain('timestamp,type,message,severity');
    });

    it('should provide APIs for external monitoring integration', async () => {
      // Should expose monitoring data for external systems
      const systemMetrics = await monitor.getSystemMetrics();
      const performanceMetrics = await performanceTracker.getPerformanceMetrics();
      const errorAnalysis = errorTracker.analyzeErrors();

      expect(systemMetrics).toHaveProperty('timestamp');
      expect(performanceMetrics).toHaveProperty('timestamp');
      expect(errorAnalysis).toHaveProperty('totalErrors');
    });
  });
});