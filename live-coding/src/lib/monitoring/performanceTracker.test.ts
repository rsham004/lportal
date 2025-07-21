import { PerformanceTracker, type PerformanceMetrics, type KPIDashboard } from './performanceTracker';
import { ApplicationMonitor } from './applicationMonitor';

// Mock ApplicationMonitor
jest.mock('./applicationMonitor', () => ({
  ApplicationMonitor: {
    getInstance: jest.fn(() => ({
      getSystemMetrics: jest.fn().mockResolvedValue({
        timestamp: Date.now(),
        memory: { used: 500, total: 1000, percentage: 50 },
        cpu: { usage: 30 },
        uptime: 3600
      }),
      getApplicationMetrics: jest.fn().mockReturnValue({
        apiResponseTime: { average: 150, min: 50, max: 300, count: 100, total: 15000, values: [] },
        userLogins: { total: 50, average: 50, min: 50, max: 50, count: 1, values: [50] },
        courseViews: { total: 200, average: 200, min: 200, max: 200, count: 1, values: [200] }
      }),
      getHealthStatus: jest.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: Date.now(),
        services: {
          database: { status: 'healthy', responseTime: 10 },
          cache: { status: 'healthy', responseTime: 5 },
          storage: { status: 'healthy', responseTime: 15 },
          video: { status: 'healthy', responseTime: 20 }
        },
        metrics: { memoryUsage: 50, cpuUsage: 30, responseTime: 150 }
      })
    }))
  }
}));

describe('PerformanceTracker', () => {
  let tracker: PerformanceTracker;
  let mockMonitor: any;

  beforeEach(() => {
    tracker = PerformanceTracker.getInstance();
    // Reset singleton for testing
    (PerformanceTracker as any).instance = null;
    tracker = PerformanceTracker.getInstance();
    
    mockMonitor = ApplicationMonitor.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PerformanceTracker.getInstance();
      const instance2 = PerformanceTracker.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Performance Metrics Collection', () => {
    it('should collect comprehensive performance metrics', async () => {
      const metrics = await tracker.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('system');
      expect(metrics).toHaveProperty('application');
      expect(metrics).toHaveProperty('network');
      expect(metrics).toHaveProperty('user');
      
      expect(metrics.system).toHaveProperty('memory');
      expect(metrics.system).toHaveProperty('cpu');
      expect(metrics.application).toHaveProperty('responseTime');
      expect(metrics.network).toHaveProperty('latency');
      expect(metrics.user).toHaveProperty('activeUsers');
    });

    it('should track performance trends over time', async () => {
      // Collect multiple metrics
      await tracker.collectMetrics();
      await new Promise(resolve => setTimeout(resolve, 10));
      await tracker.collectMetrics();
      await new Promise(resolve => setTimeout(resolve, 10));
      await tracker.collectMetrics();

      const trends = tracker.getPerformanceTrends();
      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0]).toHaveProperty('timestamp');
      expect(trends[0]).toHaveProperty('metrics');
    });

    it('should calculate performance scores', async () => {
      const score = await tracker.calculatePerformanceScore();
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('breakdown');
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      
      expect(score.breakdown).toHaveProperty('system');
      expect(score.breakdown).toHaveProperty('application');
      expect(score.breakdown).toHaveProperty('user');
    });
  });

  describe('KPI Dashboard', () => {
    it('should generate KPI dashboard data', async () => {
      const dashboard = await tracker.getKPIDashboard();
      
      expect(dashboard).toHaveProperty('timestamp');
      expect(dashboard).toHaveProperty('kpis');
      expect(dashboard).toHaveProperty('charts');
      expect(dashboard).toHaveProperty('alerts');
      
      expect(dashboard.kpis).toHaveProperty('uptime');
      expect(dashboard.kpis).toHaveProperty('responseTime');
      expect(dashboard.kpis).toHaveProperty('throughput');
      expect(dashboard.kpis).toHaveProperty('errorRate');
      expect(dashboard.kpis).toHaveProperty('userSatisfaction');
    });

    it('should provide chart data for visualization', async () => {
      // Collect some metrics first
      await tracker.collectMetrics();
      await tracker.collectMetrics();
      
      const dashboard = await tracker.getKPIDashboard();
      
      expect(dashboard.charts).toHaveProperty('responseTime');
      expect(dashboard.charts).toHaveProperty('throughput');
      expect(dashboard.charts).toHaveProperty('memoryUsage');
      expect(dashboard.charts).toHaveProperty('cpuUsage');
      
      expect(dashboard.charts.responseTime.data).toBeInstanceOf(Array);
      expect(dashboard.charts.responseTime.labels).toBeInstanceOf(Array);
    });

    it('should track SLA compliance', async () => {
      const dashboard = await tracker.getKPIDashboard();
      
      expect(dashboard.kpis.uptime).toHaveProperty('value');
      expect(dashboard.kpis.uptime).toHaveProperty('target');
      expect(dashboard.kpis.uptime).toHaveProperty('status');
      expect(dashboard.kpis.responseTime).toHaveProperty('value');
      expect(dashboard.kpis.responseTime).toHaveProperty('target');
      expect(dashboard.kpis.responseTime).toHaveProperty('status');
    });
  });

  describe('Real-time Monitoring', () => {
    it('should start real-time performance tracking', () => {
      const callback = jest.fn();
      tracker.startRealTimeTracking(callback, 100);
      
      expect(tracker.isTracking()).toBe(true);
      
      return new Promise(resolve => {
        setTimeout(() => {
          expect(callback).toHaveBeenCalled();
          tracker.stop();
          resolve(void 0);
        }, 150);
      });
    });

    it('should stop real-time tracking', () => {
      const callback = jest.fn();
      tracker.startRealTimeTracking(callback, 100);
      expect(tracker.isTracking()).toBe(true);
      
      tracker.stop();
      expect(tracker.isTracking()).toBe(false);
    });

    it('should handle tracking errors gracefully', () => {
      const callback = jest.fn(() => {
        throw new Error('Tracking error');
      });
      
      expect(() => {
        tracker.startRealTimeTracking(callback, 100);
      }).not.toThrow();
      
      tracker.stop();
    });
  });

  describe('Performance Alerts', () => {
    it('should detect performance degradation', async () => {
      // Mock degraded performance
      mockMonitor.getSystemMetrics.mockResolvedValue({
        timestamp: Date.now(),
        memory: { used: 900, total: 1000, percentage: 90 },
        cpu: { usage: 85 },
        uptime: 3600
      });

      mockMonitor.getApplicationMetrics.mockReturnValue({
        apiResponseTime: { average: 2000, min: 1500, max: 3000, count: 10, total: 20000, values: [] }
      });

      const alerts = await tracker.checkPerformanceAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.type === 'high_memory')).toBe(true);
      expect(alerts.some(alert => alert.type === 'slow_response')).toBe(true);
    });

    it('should clear alerts when performance improves', async () => {
      // First, trigger alerts
      mockMonitor.getSystemMetrics.mockResolvedValue({
        timestamp: Date.now(),
        memory: { used: 900, total: 1000, percentage: 90 },
        cpu: { usage: 85 },
        uptime: 3600
      });

      let alerts = await tracker.checkPerformanceAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      // Then improve performance
      mockMonitor.getSystemMetrics.mockResolvedValue({
        timestamp: Date.now(),
        memory: { used: 400, total: 1000, percentage: 40 },
        cpu: { usage: 20 },
        uptime: 3600
      });

      alerts = await tracker.checkPerformanceAlerts();
      expect(alerts.filter(alert => !alert.resolved).length).toBe(0);
    });

    it('should categorize alerts by severity', async () => {
      mockMonitor.getSystemMetrics.mockResolvedValue({
        timestamp: Date.now(),
        memory: { used: 950, total: 1000, percentage: 95 },
        cpu: { usage: 95 },
        uptime: 3600
      });

      const alerts = await tracker.checkPerformanceAlerts();
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization Suggestions', () => {
    it('should provide optimization recommendations', async () => {
      const suggestions = await tracker.getOptimizationSuggestions();
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('category');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('impact');
        expect(suggestion).toHaveProperty('effort');
      });
    });

    it('should prioritize suggestions by impact', async () => {
      const suggestions = await tracker.getOptimizationSuggestions();
      const highImpact = suggestions.filter(s => s.impact === 'high');
      const lowImpact = suggestions.filter(s => s.impact === 'low');
      
      // High impact suggestions should come first
      if (highImpact.length > 0 && lowImpact.length > 0) {
        const highIndex = suggestions.findIndex(s => s.impact === 'high');
        const lowIndex = suggestions.findIndex(s => s.impact === 'low');
        expect(highIndex).toBeLessThan(lowIndex);
      }
    });
  });

  describe('Integration with Previous Phases', () => {
    it('should track authentication performance', async () => {
      tracker.recordAuthPerformance('login', 250);
      tracker.recordAuthPerformance('logout', 100);
      
      const metrics = await tracker.getPerformanceMetrics();
      expect(metrics.application.auth).toBeDefined();
      expect(metrics.application.auth.loginTime).toBe(250);
      expect(metrics.application.auth.logoutTime).toBe(100);
    });

    it('should track content delivery performance', async () => {
      tracker.recordContentPerformance('video_load', 500);
      tracker.recordContentPerformance('course_load', 300);
      
      const metrics = await tracker.getPerformanceMetrics();
      expect(metrics.application.content).toBeDefined();
      expect(metrics.application.content.videoLoadTime).toBe(500);
      expect(metrics.application.content.courseLoadTime).toBe(300);
    });

    it('should track PWA performance', async () => {
      tracker.recordPWAPerformance('cache_hit', 50);
      tracker.recordPWAPerformance('offline_load', 200);
      
      const metrics = await tracker.getPerformanceMetrics();
      expect(metrics.application.pwa).toBeDefined();
      expect(metrics.application.pwa.cacheHitTime).toBe(50);
      expect(metrics.application.pwa.offlineLoadTime).toBe(200);
    });
  });

  describe('Performance Reporting', () => {
    it('should generate performance reports', async () => {
      const report = await tracker.generatePerformanceReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('slaCompliance');
      
      expect(report.summary).toHaveProperty('averageResponseTime');
      expect(report.summary).toHaveProperty('uptime');
      expect(report.summary).toHaveProperty('throughput');
    });

    it('should export performance data', async () => {
      await tracker.collectMetrics();
      
      const jsonData = await tracker.exportData('json');
      expect(() => JSON.parse(jsonData)).not.toThrow();
      
      const csvData = await tracker.exportData('csv');
      expect(csvData).toContain('timestamp,metric,value');
    });

    it('should calculate performance benchmarks', async () => {
      const benchmarks = await tracker.calculateBenchmarks();
      
      expect(benchmarks).toHaveProperty('responseTime');
      expect(benchmarks).toHaveProperty('throughput');
      expect(benchmarks).toHaveProperty('availability');
      expect(benchmarks).toHaveProperty('userSatisfaction');
      
      expect(benchmarks.responseTime).toHaveProperty('p50');
      expect(benchmarks.responseTime).toHaveProperty('p95');
      expect(benchmarks.responseTime).toHaveProperty('p99');
    });
  });
});