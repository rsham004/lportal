import { ApplicationMonitor, type SystemMetrics, type ApplicationMetrics, type Alert } from './applicationMonitor';

export interface PerformanceMetrics {
  timestamp: number;
  system: {
    memory: {
      usage: number;
      available: number;
      pressure: 'low' | 'medium' | 'high';
    };
    cpu: {
      usage: number;
      load: number;
      pressure: 'low' | 'medium' | 'high';
    };
    disk: {
      usage: number;
      iops: number;
    };
  };
  application: {
    responseTime: {
      average: number;
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: {
      requestsPerSecond: number;
      bytesPerSecond: number;
    };
    errors: {
      rate: number;
      count: number;
    };
    auth?: {
      loginTime: number;
      logoutTime: number;
    };
    content?: {
      videoLoadTime: number;
      courseLoadTime: number;
    };
    pwa?: {
      cacheHitTime: number;
      offlineLoadTime: number;
    };
  };
  network: {
    latency: number;
    bandwidth: number;
    packetLoss: number;
  };
  user: {
    activeUsers: number;
    sessionDuration: number;
    bounceRate: number;
  };
}

export interface KPIData {
  value: number;
  target: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number; // percentage change from previous period
}

export interface ChartData {
  labels: string[];
  data: number[];
  type: 'line' | 'bar' | 'area';
  color: string;
}

export interface KPIDashboard {
  timestamp: number;
  kpis: {
    uptime: KPIData;
    responseTime: KPIData;
    throughput: KPIData;
    errorRate: KPIData;
    userSatisfaction: KPIData;
    memoryUsage: KPIData;
    cpuUsage: KPIData;
  };
  charts: {
    responseTime: ChartData;
    throughput: ChartData;
    memoryUsage: ChartData;
    cpuUsage: ChartData;
    errorRate: ChartData;
  };
  alerts: Alert[];
}

export interface OptimizationSuggestion {
  id: string;
  category: 'performance' | 'scalability' | 'reliability' | 'cost';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: string;
  implementation: string[];
}

export interface PerformanceReport {
  summary: {
    averageResponseTime: number;
    uptime: number;
    throughput: number;
    errorRate: number;
    userSatisfaction: number;
  };
  trends: {
    responseTime: number[]; // last 24 hours
    throughput: number[];
    errorRate: number[];
  };
  recommendations: OptimizationSuggestion[];
  slaCompliance: {
    availability: { target: number; actual: number; status: 'met' | 'missed' };
    responseTime: { target: number; actual: number; status: 'met' | 'missed' };
    throughput: { target: number; actual: number; status: 'met' | 'missed' };
  };
}

export interface PerformanceBenchmarks {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    peak: number;
    average: number;
    minimum: number;
  };
  availability: {
    uptime: number;
    mtbf: number; // Mean Time Between Failures
    mttr: number; // Mean Time To Recovery
  };
  userSatisfaction: {
    score: number;
    responseTimeScore: number;
    reliabilityScore: number;
  };
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private monitor: ApplicationMonitor;
  private metricsHistory: PerformanceMetrics[] = [];
  private trackingInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private customMetrics: Map<string, number> = new Map();

  // SLA targets
  private readonly slaTargets = {
    uptime: 99.9, // percentage
    responseTime: 200, // milliseconds
    throughput: 1000, // requests per second
    errorRate: 1, // percentage
  };

  private constructor() {
    this.monitor = ApplicationMonitor.getInstance();
  }

  public static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  public async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const systemMetrics = await this.monitor.getSystemMetrics();
    const appMetrics = this.monitor.getApplicationMetrics();
    
    const timestamp = Date.now();
    
    // Calculate percentiles for response time
    const responseTimes = appMetrics.apiResponseTime.values || [];
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    
    const p50 = this.calculatePercentile(sortedTimes, 50);
    const p95 = this.calculatePercentile(sortedTimes, 95);
    const p99 = this.calculatePercentile(sortedTimes, 99);

    return {
      timestamp,
      system: {
        memory: {
          usage: systemMetrics.memory.percentage,
          available: systemMetrics.memory.total - systemMetrics.memory.used,
          pressure: this.calculatePressure(systemMetrics.memory.percentage, 70, 85),
        },
        cpu: {
          usage: systemMetrics.cpu.usage,
          load: systemMetrics.cpu.usage / 100,
          pressure: this.calculatePressure(systemMetrics.cpu.usage, 70, 85),
        },
        disk: {
          usage: 45, // Simulated
          iops: 1000, // Simulated
        },
      },
      application: {
        responseTime: {
          average: appMetrics.apiResponseTime.average || 0,
          p50,
          p95,
          p99,
        },
        throughput: {
          requestsPerSecond: this.calculateThroughput(appMetrics),
          bytesPerSecond: this.calculateBandwidth(),
        },
        errors: {
          rate: this.calculateErrorRate(appMetrics),
          count: appMetrics.authFailures?.total || 0,
        },
        auth: {
          loginTime: this.customMetrics.get('auth_login_time') || 0,
          logoutTime: this.customMetrics.get('auth_logout_time') || 0,
        },
        content: {
          videoLoadTime: this.customMetrics.get('content_video_load') || 0,
          courseLoadTime: this.customMetrics.get('content_course_load') || 0,
        },
        pwa: {
          cacheHitTime: this.customMetrics.get('pwa_cache_hit') || 0,
          offlineLoadTime: this.customMetrics.get('pwa_offline_load') || 0,
        },
      },
      network: {
        latency: this.calculateNetworkLatency(),
        bandwidth: this.calculateBandwidth(),
        packetLoss: 0.1, // Simulated
      },
      user: {
        activeUsers: this.calculateActiveUsers(appMetrics),
        sessionDuration: 1800, // 30 minutes average
        bounceRate: 15, // 15% bounce rate
      },
    };
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private calculatePressure(value: number, warningThreshold: number, criticalThreshold: number): 'low' | 'medium' | 'high' {
    if (value >= criticalThreshold) return 'high';
    if (value >= warningThreshold) return 'medium';
    return 'low';
  }

  private calculateThroughput(appMetrics: ApplicationMetrics): number {
    const totalRequests = Object.values(appMetrics).reduce((sum, metric) => sum + metric.count, 0);
    const timeWindow = 60; // 1 minute
    return totalRequests / timeWindow;
  }

  private calculateBandwidth(): number {
    // Simulate bandwidth calculation
    return Math.floor(Math.random() * 1000000) + 500000; // 0.5-1.5 MB/s
  }

  private calculateErrorRate(appMetrics: ApplicationMetrics): number {
    const totalRequests = appMetrics.apiResponseTime.count || 1;
    const errors = appMetrics.authFailures?.total || 0;
    return (errors / totalRequests) * 100;
  }

  private calculateNetworkLatency(): number {
    // Simulate network latency
    return Math.floor(Math.random() * 50) + 10; // 10-60ms
  }

  private calculateActiveUsers(appMetrics: ApplicationMetrics): number {
    const logins = appMetrics.userLogins?.total || 0;
    const logouts = appMetrics.userLogouts?.total || 0;
    return Math.max(0, logins - logouts);
  }

  public async collectMetrics(): Promise<void> {
    const metrics = await this.getPerformanceMetrics();
    this.metricsHistory.push(metrics);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift();
    }
  }

  public getPerformanceTrends(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  public async calculatePerformanceScore(): Promise<{ overall: number; breakdown: any }> {
    const metrics = await this.getPerformanceMetrics();
    
    // Calculate individual scores (0-100)
    const systemScore = this.calculateSystemScore(metrics.system);
    const applicationScore = this.calculateApplicationScore(metrics.application);
    const userScore = this.calculateUserScore(metrics.user);
    
    const overall = (systemScore + applicationScore + userScore) / 3;
    
    return {
      overall: Math.round(overall),
      breakdown: {
        system: Math.round(systemScore),
        application: Math.round(applicationScore),
        user: Math.round(userScore),
      },
    };
  }

  private calculateSystemScore(system: PerformanceMetrics['system']): number {
    const memoryScore = Math.max(0, 100 - system.memory.usage);
    const cpuScore = Math.max(0, 100 - system.cpu.usage);
    return (memoryScore + cpuScore) / 2;
  }

  private calculateApplicationScore(application: PerformanceMetrics['application']): number {
    const responseTimeScore = Math.max(0, 100 - (application.responseTime.average / 10));
    const errorScore = Math.max(0, 100 - (application.errors.rate * 10));
    return (responseTimeScore + errorScore) / 2;
  }

  private calculateUserScore(user: PerformanceMetrics['user']): number {
    const bounceScore = Math.max(0, 100 - user.bounceRate);
    const sessionScore = Math.min(100, (user.sessionDuration / 1800) * 100);
    return (bounceScore + sessionScore) / 2;
  }

  public async getKPIDashboard(): Promise<KPIDashboard> {
    const metrics = await this.getPerformanceMetrics();
    const healthStatus = await this.monitor.getHealthStatus();
    const alerts = this.monitor.getActiveAlerts();
    
    // Calculate uptime
    const uptime = this.calculateUptime();
    
    // Get historical data for charts
    const chartData = this.generateChartData();
    
    return {
      timestamp: Date.now(),
      kpis: {
        uptime: {
          value: uptime,
          target: this.slaTargets.uptime,
          status: uptime >= this.slaTargets.uptime ? 'good' : 'critical',
          trend: 'stable',
          change: 0,
        },
        responseTime: {
          value: metrics.application.responseTime.average,
          target: this.slaTargets.responseTime,
          status: metrics.application.responseTime.average <= this.slaTargets.responseTime ? 'good' : 'warning',
          trend: 'stable',
          change: 0,
        },
        throughput: {
          value: metrics.application.throughput.requestsPerSecond,
          target: this.slaTargets.throughput,
          status: metrics.application.throughput.requestsPerSecond >= this.slaTargets.throughput ? 'good' : 'warning',
          trend: 'up',
          change: 5,
        },
        errorRate: {
          value: metrics.application.errors.rate,
          target: this.slaTargets.errorRate,
          status: metrics.application.errors.rate <= this.slaTargets.errorRate ? 'good' : 'critical',
          trend: 'down',
          change: -2,
        },
        userSatisfaction: {
          value: 85,
          target: 80,
          status: 'good',
          trend: 'up',
          change: 3,
        },
        memoryUsage: {
          value: metrics.system.memory.usage,
          target: 80,
          status: metrics.system.memory.usage <= 80 ? 'good' : 'warning',
          trend: 'stable',
          change: 0,
        },
        cpuUsage: {
          value: metrics.system.cpu.usage,
          target: 80,
          status: metrics.system.cpu.usage <= 80 ? 'good' : 'warning',
          trend: 'stable',
          change: 0,
        },
      },
      charts: chartData,
      alerts,
    };
  }

  private calculateUptime(): number {
    // Calculate uptime based on health checks
    // For now, simulate 99.9% uptime
    return 99.9;
  }

  private generateChartData(): KPIDashboard['charts'] {
    const last24Hours = this.metricsHistory.slice(-24);
    const labels = last24Hours.map(m => new Date(m.timestamp).toLocaleTimeString());
    
    return {
      responseTime: {
        labels,
        data: last24Hours.map(m => m.application.responseTime.average),
        type: 'line',
        color: '#3B82F6',
      },
      throughput: {
        labels,
        data: last24Hours.map(m => m.application.throughput.requestsPerSecond),
        type: 'area',
        color: '#10B981',
      },
      memoryUsage: {
        labels,
        data: last24Hours.map(m => m.system.memory.usage),
        type: 'line',
        color: '#F59E0B',
      },
      cpuUsage: {
        labels,
        data: last24Hours.map(m => m.system.cpu.usage),
        type: 'line',
        color: '#EF4444',
      },
      errorRate: {
        labels,
        data: last24Hours.map(m => m.application.errors.rate),
        type: 'bar',
        color: '#DC2626',
      },
    };
  }

  public startRealTimeTracking(callback: (data: any) => void, intervalMs: number = 5000): void {
    if (this.isRunning) {
      this.stop();
    }

    this.isRunning = true;
    this.trackingInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        const dashboard = await this.getKPIDashboard();
        const score = await this.calculatePerformanceScore();
        
        callback({
          dashboard,
          score,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Performance tracking error:', error);
      }
    }, intervalMs);
  }

  public stop(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.isRunning = false;
  }

  public isTracking(): boolean {
    return this.isRunning;
  }

  public async checkPerformanceAlerts(): Promise<Alert[]> {
    const metrics = await this.getPerformanceMetrics();
    const alerts: Alert[] = [];
    
    // Check memory usage
    if (metrics.system.memory.usage > 90) {
      alerts.push({
        id: `memory_${Date.now()}`,
        type: 'high_memory',
        severity: metrics.system.memory.usage > 95 ? 'critical' : 'high',
        message: `High memory usage: ${metrics.system.memory.usage.toFixed(1)}%`,
        timestamp: Date.now(),
        resolved: false,
      });
    }

    // Check CPU usage
    if (metrics.system.cpu.usage > 85) {
      alerts.push({
        id: `cpu_${Date.now()}`,
        type: 'high_cpu',
        severity: metrics.system.cpu.usage > 95 ? 'critical' : 'high',
        message: `High CPU usage: ${metrics.system.cpu.usage.toFixed(1)}%`,
        timestamp: Date.now(),
        resolved: false,
      });
    }

    // Check response time
    if (metrics.application.responseTime.average > 1000) {
      alerts.push({
        id: `response_${Date.now()}`,
        type: 'slow_response',
        severity: metrics.application.responseTime.average > 2000 ? 'critical' : 'medium',
        message: `Slow response time: ${metrics.application.responseTime.average.toFixed(0)}ms`,
        timestamp: Date.now(),
        resolved: false,
      });
    }

    // Auto-resolve alerts if conditions improve
    return this.resolveImprovedAlerts(alerts, metrics);
  }

  private resolveImprovedAlerts(alerts: Alert[], metrics: PerformanceMetrics): Alert[] {
    return alerts.map(alert => {
      let shouldResolve = false;
      
      switch (alert.type) {
        case 'high_memory':
          shouldResolve = metrics.system.memory.usage < 80;
          break;
        case 'high_cpu':
          shouldResolve = metrics.system.cpu.usage < 70;
          break;
        case 'slow_response':
          shouldResolve = metrics.application.responseTime.average < 500;
          break;
      }
      
      return shouldResolve ? { ...alert, resolved: true } : alert;
    });
  }

  public async getOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    const metrics = await this.getPerformanceMetrics();
    const suggestions: OptimizationSuggestion[] = [];
    
    // Memory optimization
    if (metrics.system.memory.usage > 70) {
      suggestions.push({
        id: 'memory_optimization',
        category: 'performance',
        priority: metrics.system.memory.usage > 85 ? 'high' : 'medium',
        description: 'Optimize memory usage to improve system performance',
        impact: 'high',
        effort: 'medium',
        estimatedImprovement: '15-25% memory reduction',
        implementation: [
          'Implement memory pooling for frequently used objects',
          'Add garbage collection optimization',
          'Review and optimize large data structures',
          'Implement lazy loading for non-critical components'
        ],
      });
    }

    // Response time optimization
    if (metrics.application.responseTime.average > 500) {
      suggestions.push({
        id: 'response_time_optimization',
        category: 'performance',
        priority: 'high',
        description: 'Reduce API response times for better user experience',
        impact: 'high',
        effort: 'medium',
        estimatedImprovement: '30-50% response time reduction',
        implementation: [
          'Implement database query optimization',
          'Add response caching for frequently requested data',
          'Optimize API endpoint logic',
          'Implement connection pooling'
        ],
      });
    }

    // Caching optimization
    suggestions.push({
      id: 'caching_optimization',
      category: 'performance',
      priority: 'medium',
      description: 'Enhance caching strategy for better performance',
      impact: 'medium',
      effort: 'low',
      estimatedImprovement: '20-30% load time reduction',
      implementation: [
        'Implement browser caching headers',
        'Add CDN for static assets',
        'Optimize cache invalidation strategy',
        'Implement service worker caching'
      ],
    });

    // Sort by priority and impact
    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const impactOrder = { high: 3, medium: 2, low: 1 };
      
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      const aImpact = impactOrder[a.impact];
      const bImpact = impactOrder[b.impact];
      
      return (bPriority + bImpact) - (aPriority + aImpact);
    });
  }

  // Integration methods for previous phases
  public recordAuthPerformance(event: 'login' | 'logout', responseTime: number): void {
    this.customMetrics.set(`auth_${event}_time`, responseTime);
  }

  public recordContentPerformance(event: 'video_load' | 'course_load', responseTime: number): void {
    this.customMetrics.set(`content_${event}`, responseTime);
  }

  public recordPWAPerformance(event: 'cache_hit' | 'offline_load', responseTime: number): void {
    this.customMetrics.set(`pwa_${event}`, responseTime);
  }

  public async generatePerformanceReport(): Promise<PerformanceReport> {
    const metrics = await this.getPerformanceMetrics();
    const suggestions = await this.getOptimizationSuggestions();
    
    // Calculate trends from last 24 hours
    const last24Hours = this.metricsHistory.slice(-24);
    
    return {
      summary: {
        averageResponseTime: metrics.application.responseTime.average,
        uptime: this.calculateUptime(),
        throughput: metrics.application.throughput.requestsPerSecond,
        errorRate: metrics.application.errors.rate,
        userSatisfaction: 85, // Simulated
      },
      trends: {
        responseTime: last24Hours.map(m => m.application.responseTime.average),
        throughput: last24Hours.map(m => m.application.throughput.requestsPerSecond),
        errorRate: last24Hours.map(m => m.application.errors.rate),
      },
      recommendations: suggestions,
      slaCompliance: {
        availability: {
          target: this.slaTargets.uptime,
          actual: this.calculateUptime(),
          status: this.calculateUptime() >= this.slaTargets.uptime ? 'met' : 'missed',
        },
        responseTime: {
          target: this.slaTargets.responseTime,
          actual: metrics.application.responseTime.average,
          status: metrics.application.responseTime.average <= this.slaTargets.responseTime ? 'met' : 'missed',
        },
        throughput: {
          target: this.slaTargets.throughput,
          actual: metrics.application.throughput.requestsPerSecond,
          status: metrics.application.throughput.requestsPerSecond >= this.slaTargets.throughput ? 'met' : 'missed',
        },
      },
    };
  }

  public async exportData(format: 'json' | 'csv'): Promise<string> {
    const metrics = this.metricsHistory;
    
    if (format === 'json') {
      return JSON.stringify({
        timestamp: Date.now(),
        metrics,
        summary: await this.generatePerformanceReport(),
      }, null, 2);
    }

    if (format === 'csv') {
      const lines = ['timestamp,responseTime,throughput,memoryUsage,cpuUsage,errorRate'];
      
      metrics.forEach(metric => {
        lines.push([
          metric.timestamp,
          metric.application.responseTime.average,
          metric.application.throughput.requestsPerSecond,
          metric.system.memory.usage,
          metric.system.cpu.usage,
          metric.application.errors.rate,
        ].join(','));
      });
      
      return lines.join('\n');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  public async calculateBenchmarks(): Promise<PerformanceBenchmarks> {
    const metrics = this.metricsHistory;
    
    if (metrics.length === 0) {
      // Return default benchmarks if no data
      return {
        responseTime: { p50: 0, p95: 0, p99: 0 },
        throughput: { peak: 0, average: 0, minimum: 0 },
        availability: { uptime: 99.9, mtbf: 720, mttr: 5 },
        userSatisfaction: { score: 85, responseTimeScore: 90, reliabilityScore: 95 },
      };
    }

    const responseTimes = metrics.map(m => m.application.responseTime.average);
    const throughputs = metrics.map(m => m.application.throughput.requestsPerSecond);
    
    return {
      responseTime: {
        p50: this.calculatePercentile(responseTimes.sort((a, b) => a - b), 50),
        p95: this.calculatePercentile(responseTimes.sort((a, b) => a - b), 95),
        p99: this.calculatePercentile(responseTimes.sort((a, b) => a - b), 99),
      },
      throughput: {
        peak: Math.max(...throughputs),
        average: throughputs.reduce((sum, val) => sum + val, 0) / throughputs.length,
        minimum: Math.min(...throughputs),
      },
      availability: {
        uptime: this.calculateUptime(),
        mtbf: 720, // 30 days in hours
        mttr: 5, // 5 minutes
      },
      userSatisfaction: {
        score: 85,
        responseTimeScore: Math.max(0, 100 - (responseTimes[responseTimes.length - 1] / 10)),
        reliabilityScore: this.calculateUptime(),
      },
    };
  }
}