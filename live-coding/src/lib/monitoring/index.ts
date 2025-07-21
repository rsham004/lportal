// Monitoring Services
export { ApplicationMonitor } from './applicationMonitor';
export type { 
  SystemMetrics, 
  ApplicationMetrics, 
  HealthStatus, 
  Alert,
  ServiceHealth 
} from './applicationMonitor';

export { PerformanceTracker } from './performanceTracker';
export type { 
  PerformanceMetrics, 
  KPIDashboard, 
  KPIData,
  ChartData,
  OptimizationSuggestion,
  PerformanceReport,
  PerformanceBenchmarks 
} from './performanceTracker';

export { ErrorTracker } from './errorTracker';
export type { 
  ErrorEvent, 
  ErrorAnalysis, 
  Incident,
  IncidentResponse,
  ErrorReport,
  ErrorStatistics 
} from './errorTracker';

// Monitoring Components
export { MonitoringDashboard } from '../../components/monitoring/MonitoringDashboard';
export { AlertSystem } from '../../components/monitoring/AlertSystem';

// Utility functions for monitoring integration
export const createMonitoringInstance = () => {
  const monitor = ApplicationMonitor.getInstance();
  const performanceTracker = PerformanceTracker.getInstance();
  const errorTracker = ErrorTracker.getInstance();

  return {
    monitor,
    performanceTracker,
    errorTracker,
    
    // Convenience methods for common operations
    startMonitoring: (callback?: (data: any) => void, interval = 5000) => {
      monitor.startMonitoring(callback || (() => {}), interval);
      performanceTracker.startRealTimeTracking(callback || (() => {}), interval);
    },
    
    stopMonitoring: () => {
      monitor.stop();
      performanceTracker.stop();
    },
    
    recordUserAction: (action: string, userId?: string, context?: Record<string, any>) => {
      switch (action) {
        case 'login':
          monitor.recordAuthEvent('login');
          break;
        case 'logout':
          monitor.recordAuthEvent('logout');
          break;
        case 'course_view':
          monitor.recordContentEvent('course_view');
          break;
        case 'video_start':
          monitor.recordContentEvent('video_start');
          break;
        case 'video_completion':
          monitor.recordContentEvent('video_completion');
          break;
        case 'pwa_install':
          monitor.recordPWAEvent('pwa_install');
          break;
        default:
          monitor.recordMetric(action, 1);
      }
    },
    
    recordError: (error: Error, type?: string, context?: Record<string, any>) => {
      errorTracker.trackError(error, type as any, context);
    },
    
    recordPerformance: (metric: string, value: number, category?: 'auth' | 'content' | 'pwa') => {
      if (category === 'auth') {
        performanceTracker.recordAuthPerformance(metric as any, value);
      } else if (category === 'content') {
        performanceTracker.recordContentPerformance(metric as any, value);
      } else if (category === 'pwa') {
        performanceTracker.recordPWAPerformance(metric as any, value);
      } else {
        monitor.recordAPIResponse(value);
      }
    },
    
    getHealthStatus: () => monitor.getHealthStatus(),
    getPerformanceScore: () => performanceTracker.calculatePerformanceScore(),
    getErrorSummary: () => errorTracker.analyzeErrors(),
    
    exportData: async (format: 'json' | 'csv' = 'json') => {
      const [monitoringData, performanceData, errorData] = await Promise.all([
        monitor.exportMetrics(format),
        performanceTracker.exportData(format),
        errorTracker.exportErrors(format)
      ]);
      
      if (format === 'json') {
        return JSON.stringify({
          timestamp: Date.now(),
          monitoring: JSON.parse(monitoringData),
          performance: JSON.parse(performanceData),
          errors: JSON.parse(errorData)
        }, null, 2);
      }
      
      return `${monitoringData}\n\n${performanceData}\n\n${errorData}`;
    }
  };
};

// React hooks for monitoring
export const useMonitoring = () => {
  const monitoring = createMonitoringInstance();
  
  return {
    ...monitoring,
    
    // React-specific helpers
    useRealTimeMonitoring: (callback: (data: any) => void, enabled = true) => {
      if (enabled) {
        monitoring.startMonitoring(callback);
        return () => monitoring.stopMonitoring();
      }
      return () => {};
    }
  };
};

// Constants for monitoring configuration
export const MONITORING_CONFIG = {
  DEFAULT_REFRESH_INTERVAL: 5000,
  MAX_STORED_METRICS: 1000,
  MAX_STORED_ERRORS: 10000,
  ALERT_THRESHOLDS: {
    MEMORY_USAGE: 80,
    CPU_USAGE: 80,
    RESPONSE_TIME: 1000,
    ERROR_RATE: 5
  },
  SLA_TARGETS: {
    UPTIME: 99.9,
    RESPONSE_TIME: 200,
    THROUGHPUT: 1000,
    ERROR_RATE: 1
  }
};