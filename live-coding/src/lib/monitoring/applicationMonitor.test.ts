import { ApplicationMonitor, type ApplicationMetrics, type HealthStatus } from './applicationMonitor';

// Mock dependencies
jest.mock('../services/edgeCache', () => ({
  EdgeCache: {
    getInstance: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      getStats: jest.fn(() => ({
        hitRate: 0.85,
        memoryUsage: 0.65,
        totalRequests: 1000,
        cacheSize: 500
      }))
    }))
  }
}));

jest.mock('../security/redis-cache', () => ({
  RedisCache: {
    getInstance: jest.fn(() => ({
      isConnected: jest.fn(() => true),
      getConnectionStats: jest.fn(() => ({
        connected: true,
        uptime: 3600,
        memoryUsage: 0.45
      }))
    }))
  }
}));

describe('ApplicationMonitor', () => {
  let monitor: ApplicationMonitor;

  beforeEach(() => {
    monitor = ApplicationMonitor.getInstance();
    // Reset singleton for testing
    (ApplicationMonitor as any).instance = null;
    monitor = ApplicationMonitor.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    monitor.stop();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ApplicationMonitor.getInstance();
      const instance2 = ApplicationMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Performance Monitoring', () => {
    it('should collect system metrics', async () => {
      const metrics = await monitor.getSystemMetrics();
      
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics.memory.used).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.total).toBeGreaterThan(0);
      expect(metrics.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should track application metrics', async () => {
      monitor.recordMetric('api_response_time', 150);
      monitor.recordMetric('user_login', 1);
      monitor.recordMetric('course_view', 1);

      const metrics = await monitor.getApplicationMetrics();
      
      expect(metrics.apiResponseTime).toBeDefined();
      expect(metrics.userLogins).toBeDefined();
      expect(metrics.courseViews).toBeDefined();
      expect(metrics.apiResponseTime.average).toBe(150);
      expect(metrics.userLogins.total).toBe(1);
      expect(metrics.courseViews.total).toBe(1);
    });

    it('should calculate average response times', () => {
      monitor.recordMetric('api_response_time', 100);
      monitor.recordMetric('api_response_time', 200);
      monitor.recordMetric('api_response_time', 300);

      const metrics = monitor.getApplicationMetrics();
      expect(metrics.apiResponseTime.average).toBe(200);
      expect(metrics.apiResponseTime.min).toBe(100);
      expect(metrics.apiResponseTime.max).toBe(300);
      expect(metrics.apiResponseTime.count).toBe(3);
    });
  });

  describe('Health Monitoring', () => {
    it('should check application health', async () => {
      const health = await monitor.getHealthStatus();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('services');
      expect(health).toHaveProperty('metrics');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });

    it('should detect unhealthy services', async () => {
      // Mock unhealthy cache
      const mockCache = {
        isConnected: jest.fn(() => false),
        getConnectionStats: jest.fn(() => ({
          connected: false,
          uptime: 0,
          memoryUsage: 0
        }))
      };
      
      require('../security/redis-cache').RedisCache.getInstance.mockReturnValue(mockCache);
      
      const health = await monitor.getHealthStatus();
      expect(health.services.cache.status).toBe('unhealthy');
      expect(health.status).toBe('degraded');
    });

    it('should track service dependencies', async () => {
      const health = await monitor.getHealthStatus();
      
      expect(health.services).toHaveProperty('database');
      expect(health.services).toHaveProperty('cache');
      expect(health.services).toHaveProperty('storage');
      expect(health.services).toHaveProperty('video');
      
      Object.values(health.services).forEach(service => {
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('responseTime');
        expect(['healthy', 'degraded', 'unhealthy']).toContain(service.status);
      });
    });
  });

  describe('Real-time Monitoring', () => {
    it('should start monitoring with interval', () => {
      const callback = jest.fn();
      monitor.startMonitoring(callback, 100);
      
      expect(monitor.isMonitoring()).toBe(true);
      
      // Wait for at least one callback
      return new Promise(resolve => {
        setTimeout(() => {
          expect(callback).toHaveBeenCalled();
          monitor.stop();
          resolve(void 0);
        }, 150);
      });
    });

    it('should stop monitoring', () => {
      const callback = jest.fn();
      monitor.startMonitoring(callback, 100);
      expect(monitor.isMonitoring()).toBe(true);
      
      monitor.stop();
      expect(monitor.isMonitoring()).toBe(false);
    });

    it('should handle monitoring errors gracefully', () => {
      const callback = jest.fn(() => {
        throw new Error('Monitoring error');
      });
      
      expect(() => {
        monitor.startMonitoring(callback, 100);
      }).not.toThrow();
      
      monitor.stop();
    });
  });

  describe('Alert Thresholds', () => {
    it('should detect high memory usage', async () => {
      // Mock high memory usage
      const originalGetSystemMetrics = monitor.getSystemMetrics;
      monitor.getSystemMetrics = jest.fn().mockResolvedValue({
        timestamp: Date.now(),
        memory: { used: 900, total: 1000, percentage: 90 },
        cpu: { usage: 50 },
        uptime: 3600
      });

      const health = await monitor.getHealthStatus();
      expect(health.status).toBe('degraded');
      
      monitor.getSystemMetrics = originalGetSystemMetrics;
    });

    it('should detect slow response times', () => {
      // Record slow response times
      for (let i = 0; i < 10; i++) {
        monitor.recordMetric('api_response_time', 2000); // 2 seconds
      }

      const metrics = monitor.getApplicationMetrics();
      expect(metrics.apiResponseTime.average).toBe(2000);
      
      // Should trigger alert for slow responses
      const alerts = monitor.getActiveAlerts();
      expect(alerts.some(alert => alert.type === 'slow_response')).toBe(true);
    });

    it('should clear alerts when conditions improve', () => {
      // Record slow response times
      monitor.recordMetric('api_response_time', 2000);
      let alerts = monitor.getActiveAlerts();
      expect(alerts.some(alert => alert.type === 'slow_response')).toBe(true);

      // Record fast response times
      for (let i = 0; i < 10; i++) {
        monitor.recordMetric('api_response_time', 100);
      }

      alerts = monitor.getActiveAlerts();
      expect(alerts.some(alert => alert.type === 'slow_response')).toBe(false);
    });
  });

  describe('Integration with Previous Phases', () => {
    it('should monitor authentication metrics', () => {
      monitor.recordMetric('user_login', 1);
      monitor.recordMetric('user_logout', 1);
      monitor.recordMetric('auth_failure', 1);

      const metrics = monitor.getApplicationMetrics();
      expect(metrics.userLogins.total).toBe(1);
      expect(metrics.userLogouts.total).toBe(1);
      expect(metrics.authFailures.total).toBe(1);
    });

    it('should monitor content delivery metrics', () => {
      monitor.recordMetric('video_start', 1);
      monitor.recordMetric('video_completion', 1);
      monitor.recordMetric('course_enrollment', 1);

      const metrics = monitor.getApplicationMetrics();
      expect(metrics.videoStarts.total).toBe(1);
      expect(metrics.videoCompletions.total).toBe(1);
      expect(metrics.courseEnrollments.total).toBe(1);
    });

    it('should monitor PWA metrics', () => {
      monitor.recordMetric('pwa_install', 1);
      monitor.recordMetric('offline_usage', 1);
      monitor.recordMetric('cache_hit', 1);

      const metrics = monitor.getApplicationMetrics();
      expect(metrics.pwaInstalls.total).toBe(1);
      expect(metrics.offlineUsage.total).toBe(1);
      expect(metrics.cacheHits.total).toBe(1);
    });
  });

  describe('Data Export and Reporting', () => {
    it('should export metrics in JSON format', async () => {
      monitor.recordMetric('api_response_time', 150);
      monitor.recordMetric('user_login', 1);

      const exportData = await monitor.exportMetrics('json');
      expect(exportData).toContain('apiResponseTime');
      expect(exportData).toContain('userLogins');
      
      const parsed = JSON.parse(exportData);
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('systemMetrics');
      expect(parsed).toHaveProperty('applicationMetrics');
    });

    it('should export metrics in CSV format', async () => {
      monitor.recordMetric('api_response_time', 150);
      
      const exportData = await monitor.exportMetrics('csv');
      expect(exportData).toContain('timestamp,metric,value');
      expect(exportData).toContain('api_response_time,150');
    });

    it('should generate summary reports', async () => {
      // Record various metrics
      monitor.recordMetric('api_response_time', 100);
      monitor.recordMetric('api_response_time', 200);
      monitor.recordMetric('user_login', 1);
      monitor.recordMetric('user_login', 1);

      const report = await monitor.generateReport();
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('usage');
      expect(report).toHaveProperty('health');
      expect(report.summary.totalRequests).toBeGreaterThan(0);
    });
  });
});