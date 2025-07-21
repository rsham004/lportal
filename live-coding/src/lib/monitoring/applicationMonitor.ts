import { EdgeCache } from '../services/edgeCache';
import { RedisCache } from '../security/redis-cache';

export interface SystemMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  uptime: number;
}

export interface ApplicationMetrics {
  apiResponseTime: MetricData;
  userLogins: MetricData;
  userLogouts: MetricData;
  authFailures: MetricData;
  courseViews: MetricData;
  courseEnrollments: MetricData;
  videoStarts: MetricData;
  videoCompletions: MetricData;
  pwaInstalls: MetricData;
  offlineUsage: MetricData;
  cacheHits: MetricData;
  [key: string]: MetricData;
}

export interface MetricData {
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
  values: number[];
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: number;
  details?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    storage: ServiceHealth;
    video: ServiceHealth;
  };
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    responseTime: number;
  };
}

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

export interface MonitoringReport {
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    cacheHitRate: number;
  };
  usage: {
    activeUsers: number;
    courseViews: number;
    videoWatched: number;
  };
  health: HealthStatus;
}

export class ApplicationMonitor {
  private static instance: ApplicationMonitor;
  private metrics: Map<string, number[]> = new Map();
  private alerts: Alert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Thresholds for alerts
  private readonly thresholds = {
    memoryUsage: 80, // percentage
    cpuUsage: 80, // percentage
    responseTime: 1000, // milliseconds
    errorRate: 5, // percentage
  };

  private constructor() {
    this.initializeMetrics();
  }

  public static getInstance(): ApplicationMonitor {
    if (!ApplicationMonitor.instance) {
      ApplicationMonitor.instance = new ApplicationMonitor();
    }
    return ApplicationMonitor.instance;
  }

  private initializeMetrics(): void {
    const metricKeys = [
      'api_response_time',
      'user_login',
      'user_logout',
      'auth_failure',
      'course_view',
      'course_enrollment',
      'video_start',
      'video_completion',
      'pwa_install',
      'offline_usage',
      'cache_hit',
    ];

    metricKeys.forEach(key => {
      this.metrics.set(key, []);
    });
  }

  public async getSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();
    
    // Get memory usage (simulated for browser environment)
    const memoryInfo = this.getMemoryInfo();
    const cpuUsage = this.getCpuUsage();
    const uptime = this.getUptime();

    return {
      timestamp,
      memory: memoryInfo,
      cpu: { usage: cpuUsage },
      uptime,
    };
  }

  private getMemoryInfo() {
    // In a real browser environment, we'd use performance.memory
    // For testing, we'll simulate realistic values
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }

    // Fallback simulation
    const used = Math.floor(Math.random() * 500) + 200; // 200-700MB
    const total = 1024; // 1GB
    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  }

  private getCpuUsage(): number {
    // Simulate CPU usage (in real app, this would come from system monitoring)
    return Math.floor(Math.random() * 30) + 10; // 10-40%
  }

  private getUptime(): number {
    // Return uptime in seconds
    return Math.floor(Date.now() / 1000) - Math.floor(Date.now() / 1000 - 3600); // Simulate 1 hour uptime
  }

  public recordMetric(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    const values = this.metrics.get(metricName)!;
    values.push(value);

    // Keep only last 1000 values to prevent memory issues
    if (values.length > 1000) {
      values.shift();
    }

    // Check for alerts
    this.checkAlerts(metricName, value);
  }

  public getApplicationMetrics(): ApplicationMetrics {
    const createMetricData = (metricName: string): MetricData => {
      const values = this.metrics.get(metricName) || [];
      
      if (values.length === 0) {
        return { total: 0, average: 0, min: 0, max: 0, count: 0, values: [] };
      }

      const total = values.reduce((sum, val) => sum + val, 0);
      const average = total / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      return {
        total,
        average,
        min,
        max,
        count: values.length,
        values: [...values],
      };
    };

    return {
      apiResponseTime: createMetricData('api_response_time'),
      userLogins: createMetricData('user_login'),
      userLogouts: createMetricData('user_logout'),
      authFailures: createMetricData('auth_failure'),
      courseViews: createMetricData('course_view'),
      courseEnrollments: createMetricData('course_enrollment'),
      videoStarts: createMetricData('video_start'),
      videoCompletions: createMetricData('video_completion'),
      pwaInstalls: createMetricData('pwa_install'),
      offlineUsage: createMetricData('offline_usage'),
      cacheHits: createMetricData('cache_hit'),
    };
  }

  public async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = Date.now();
    const systemMetrics = await this.getSystemMetrics();
    
    // Check service health
    const services = {
      database: await this.checkDatabaseHealth(),
      cache: await this.checkCacheHealth(),
      storage: await this.checkStorageHealth(),
      video: await this.checkVideoHealth(),
    };

    // Determine overall health
    const serviceStatuses = Object.values(services).map(s => s.status);
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (serviceStatuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (serviceStatuses.includes('degraded') || systemMetrics.memory.percentage > this.thresholds.memoryUsage) {
      overallStatus = 'degraded';
    }

    const appMetrics = this.getApplicationMetrics();
    
    return {
      status: overallStatus,
      timestamp,
      services,
      metrics: {
        memoryUsage: systemMetrics.memory.percentage,
        cpuUsage: systemMetrics.cpu.usage,
        responseTime: appMetrics.apiResponseTime.average || 0,
      },
    };
  }

  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // In a real app, this would ping the database
      // For now, simulate a health check
      await new Promise(resolve => setTimeout(resolve, 10));
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkCacheHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const redisCache = RedisCache.getInstance();
      const isConnected = redisCache.isConnected();
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        details: isConnected ? undefined : 'Redis connection failed',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        details: error instanceof Error ? error.message : 'Cache check failed',
      };
    }
  }

  private async checkStorageHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simulate storage health check
      await new Promise(resolve => setTimeout(resolve, 5));
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        details: error instanceof Error ? error.message : 'Storage check failed',
      };
    }
  }

  private async checkVideoHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simulate Mux health check
      await new Promise(resolve => setTimeout(resolve, 15));
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        details: error instanceof Error ? error.message : 'Video service check failed',
      };
    }
  }

  public startMonitoring(callback: (data: any) => void, intervalMs: number = 5000): void {
    if (this.isRunning) {
      this.stop();
    }

    this.isRunning = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        const systemMetrics = await this.getSystemMetrics();
        const applicationMetrics = this.getApplicationMetrics();
        const healthStatus = await this.getHealthStatus();
        
        callback({
          system: systemMetrics,
          application: applicationMetrics,
          health: healthStatus,
          alerts: this.getActiveAlerts(),
        });
      } catch (error) {
        console.error('Monitoring error:', error);
        // Continue monitoring even if there's an error
      }
    }, intervalMs);
  }

  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
  }

  public isMonitoring(): boolean {
    return this.isRunning;
  }

  private checkAlerts(metricName: string, value: number): void {
    const alertId = `${metricName}_${Date.now()}`;
    
    // Check for slow response times
    if (metricName === 'api_response_time' && value > this.thresholds.responseTime) {
      this.addAlert({
        id: alertId,
        type: 'slow_response',
        severity: value > 2000 ? 'high' : 'medium',
        message: `Slow API response time: ${value}ms`,
        timestamp: Date.now(),
        resolved: false,
      });
    }

    // Auto-resolve alerts when conditions improve
    this.resolveAlertsIfImproved(metricName);
  }

  private resolveAlertsIfImproved(metricName: string): void {
    if (metricName === 'api_response_time') {
      const values = this.metrics.get(metricName) || [];
      const recentValues = values.slice(-10); // Last 10 values
      const averageRecent = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      
      if (averageRecent < this.thresholds.responseTime) {
        this.alerts = this.alerts.map(alert => 
          alert.type === 'slow_response' && !alert.resolved
            ? { ...alert, resolved: true }
            : alert
        );
      }
    }
  }

  private addAlert(alert: Alert): void {
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  public async exportMetrics(format: 'json' | 'csv'): Promise<string> {
    const systemMetrics = await this.getSystemMetrics();
    const applicationMetrics = this.getApplicationMetrics();
    
    if (format === 'json') {
      return JSON.stringify({
        timestamp: Date.now(),
        systemMetrics,
        applicationMetrics,
        alerts: this.alerts,
      }, null, 2);
    }

    if (format === 'csv') {
      const lines = ['timestamp,metric,value'];
      
      Object.entries(applicationMetrics).forEach(([metricName, data]) => {
        data.values.forEach(value => {
          lines.push(`${Date.now()},${metricName},${value}`);
        });
      });
      
      return lines.join('\n');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  public async generateReport(): Promise<MonitoringReport> {
    const systemMetrics = await this.getSystemMetrics();
    const applicationMetrics = this.getApplicationMetrics();
    const healthStatus = await this.getHealthStatus();
    
    // Calculate summary statistics
    const totalRequests = Object.values(applicationMetrics)
      .reduce((sum, metric) => sum + metric.count, 0);
    
    const errorRate = applicationMetrics.authFailures.count > 0
      ? (applicationMetrics.authFailures.count / applicationMetrics.userLogins.count) * 100
      : 0;

    // Get cache stats
    const edgeCache = EdgeCache.getInstance();
    const cacheStats = edgeCache.getStats();

    return {
      summary: {
        totalRequests,
        averageResponseTime: applicationMetrics.apiResponseTime.average || 0,
        errorRate,
        uptime: systemMetrics.uptime,
      },
      performance: {
        memoryUsage: systemMetrics.memory.percentage,
        cpuUsage: systemMetrics.cpu.usage,
        cacheHitRate: cacheStats.hitRate * 100,
      },
      usage: {
        activeUsers: applicationMetrics.userLogins.total - applicationMetrics.userLogouts.total,
        courseViews: applicationMetrics.courseViews.total,
        videoWatched: applicationMetrics.videoStarts.total,
      },
      health: healthStatus,
    };
  }

  // Integration methods for previous phases
  public recordAuthEvent(event: 'login' | 'logout' | 'failure'): void {
    switch (event) {
      case 'login':
        this.recordMetric('user_login', 1);
        break;
      case 'logout':
        this.recordMetric('user_logout', 1);
        break;
      case 'failure':
        this.recordMetric('auth_failure', 1);
        break;
    }
  }

  public recordContentEvent(event: 'course_view' | 'course_enrollment' | 'video_start' | 'video_completion'): void {
    this.recordMetric(event, 1);
  }

  public recordPWAEvent(event: 'pwa_install' | 'offline_usage' | 'cache_hit'): void {
    this.recordMetric(event, 1);
  }

  public recordAPIResponse(responseTime: number): void {
    this.recordMetric('api_response_time', responseTime);
  }
}