export interface LoadTestConfig {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  concurrentUsers: number;
  duration: number; // in milliseconds
  rampUpTime: number; // in milliseconds
  headers?: Record<string, string>;
  body?: string;
  trackThroughput?: boolean;
  monitorResources?: boolean;
}

export interface LoadTestResult {
  testName: string;
  startTime: Date;
  endTime: Date;
  actualDuration: number;
  concurrentUsers: number;
  rampUpTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  errors: Record<string, number>;
  throughputData?: ThroughputDataPoint[];
  resourceUsage?: ResourceUsage;
}

export interface ThroughputDataPoint {
  timestamp: number;
  requestsPerSecond: number;
  activeUsers: number;
}

export interface ResourceUsage {
  peakMemoryUsage: number;
  averageMemoryUsage: number;
  cpuUsageData?: CpuDataPoint[];
}

export interface CpuDataPoint {
  timestamp: number;
  usage: number;
}

interface RequestResult {
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
}

export class LoadTestRunner {
  private readonly MAX_CONCURRENT_USERS = 100000;
  private readonly MAX_DURATION = 3600000; // 1 hour
  private readonly THROUGHPUT_INTERVAL = 1000; // 1 second

  /**
   * Validate load test configuration
   */
  validateConfig(config: LoadTestConfig): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Test name is required');
    }

    if (!config.url || !this.isValidUrl(config.url)) {
      throw new Error('Valid URL is required');
    }

    if (config.concurrentUsers <= 0) {
      throw new Error('Concurrent users must be greater than 0');
    }

    if (config.concurrentUsers > this.MAX_CONCURRENT_USERS) {
      throw new Error('Concurrent users exceeds maximum limit');
    }

    if (config.duration <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    if (config.duration > this.MAX_DURATION) {
      throw new Error('Duration exceeds maximum limit');
    }

    if (config.rampUpTime < 0) {
      throw new Error('Ramp-up time cannot be negative');
    }

    if (config.rampUpTime >= config.duration) {
      throw new Error('Ramp-up time must be less than total duration');
    }
  }

  /**
   * Run a single load test
   */
  async runTest(config: LoadTestConfig): Promise<LoadTestResult> {
    this.validateConfig(config);

    const startTime = new Date();
    const results: RequestResult[] = [];
    const throughputData: ThroughputDataPoint[] = [];
    const resourceUsage: ResourceUsage = {
      peakMemoryUsage: 0,
      averageMemoryUsage: 0,
      cpuUsageData: [],
    };

    let activeUsers = 0;
    let testRunning = true;

    // Setup throughput monitoring
    let throughputInterval: NodeJS.Timeout | null = null;
    if (config.trackThroughput) {
      throughputInterval = setInterval(() => {
        if (testRunning) {
          const currentTime = Date.now();
          const recentRequests = results.filter(
            r => currentTime - (r as any).timestamp < this.THROUGHPUT_INTERVAL
          ).length;
          
          throughputData.push({
            timestamp: currentTime,
            requestsPerSecond: recentRequests,
            activeUsers,
          });
        }
      }, this.THROUGHPUT_INTERVAL);
    }

    // Setup resource monitoring
    let resourceInterval: NodeJS.Timeout | null = null;
    if (config.monitorResources) {
      resourceInterval = setInterval(() => {
        if (testRunning) {
          this.monitorResources(resourceUsage);
        }
      }, 500); // Monitor every 500ms
    }

    // Calculate user ramp-up schedule
    const userSchedule = this.calculateUserSchedule(config);

    // Start users according to schedule
    const userPromises: Promise<void>[] = [];
    
    for (const { delay, userId } of userSchedule) {
      const userPromise = new Promise<void>((resolve) => {
        setTimeout(async () => {
          activeUsers++;
          await this.runUserSession(config, results, startTime);
          activeUsers--;
          resolve();
        }, delay);
      });
      
      userPromises.push(userPromise);
    }

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, config.duration));
    testRunning = false;

    // Cleanup intervals
    if (throughputInterval) clearInterval(throughputInterval);
    if (resourceInterval) clearInterval(resourceInterval);

    // Wait for all users to complete (with timeout)
    await Promise.race([
      Promise.all(userPromises),
      new Promise(resolve => setTimeout(resolve, 10000)) // 10 second timeout
    ]);

    const endTime = new Date();

    return this.calculateResults(config, startTime, endTime, results, throughputData, resourceUsage);
  }

  /**
   * Run multiple test scenarios
   */
  async runScenarios(scenarios: LoadTestConfig[]): Promise<LoadTestResult[]> {
    const results: LoadTestResult[] = [];

    for (const scenario of scenarios) {
      try {
        console.log(`Running scenario: ${scenario.name}`);
        const result = await this.runTest(scenario);
        results.push(result);
        
        // Wait between scenarios to avoid interference
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Scenario ${scenario.name} failed:`, error);
        
        // Create error result
        const errorResult: LoadTestResult = {
          testName: scenario.name,
          startTime: new Date(),
          endTime: new Date(),
          actualDuration: 0,
          concurrentUsers: scenario.concurrentUsers,
          rampUpTime: scenario.rampUpTime,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 1,
          averageResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0,
          p50ResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          requestsPerSecond: 0,
          errorRate: 1,
          errors: { 'Configuration Error': 1 },
        };
        
        results.push(errorResult);
      }
    }

    return results;
  }

  /**
   * Export results to JSON
   */
  exportToJSON(result: LoadTestResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Export results to CSV
   */
  exportToCSV(results: LoadTestResult[]): string {
    const headers = [
      'Test Name',
      'Start Time',
      'Duration (ms)',
      'Concurrent Users',
      'Total Requests',
      'Successful Requests',
      'Failed Requests',
      'Average Response Time (ms)',
      'P95 Response Time (ms)',
      'Requests/Second',
      'Error Rate (%)',
    ];

    const rows = results.map(result => [
      result.testName,
      result.startTime.toISOString(),
      result.actualDuration,
      result.concurrentUsers,
      result.totalRequests,
      result.successfulRequests,
      result.failedRequests,
      Math.round(result.averageResponseTime),
      Math.round(result.p95ResponseTime),
      Math.round(result.requestsPerSecond * 100) / 100,
      Math.round(result.errorRate * 10000) / 100,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Calculate user ramp-up schedule
   */
  private calculateUserSchedule(config: LoadTestConfig): Array<{ delay: number; userId: number }> {
    const schedule: Array<{ delay: number; userId: number }> = [];
    
    if (config.rampUpTime === 0) {
      // Start all users immediately
      for (let i = 0; i < config.concurrentUsers; i++) {
        schedule.push({ delay: 0, userId: i });
      }
    } else {
      // Gradually ramp up users
      const delayBetweenUsers = config.rampUpTime / config.concurrentUsers;
      
      for (let i = 0; i < config.concurrentUsers; i++) {
        schedule.push({
          delay: Math.round(i * delayBetweenUsers),
          userId: i,
        });
      }
    }

    return schedule;
  }

  /**
   * Run a single user session
   */
  private async runUserSession(
    config: LoadTestConfig,
    results: RequestResult[],
    testStartTime: Date
  ): Promise<void> {
    const sessionEndTime = testStartTime.getTime() + config.duration;
    
    while (Date.now() < sessionEndTime) {
      const requestStart = performance.now();
      
      try {
        const response = await fetch(config.url, {
          method: config.method,
          headers: config.headers,
          body: config.body,
        });

        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;

        const result: RequestResult & { timestamp: number } = {
          success: response.ok,
          responseTime,
          statusCode: response.status,
          timestamp: Date.now(),
        };

        if (!response.ok) {
          result.error = `HTTP ${response.status}`;
        }

        results.push(result);
      } catch (error) {
        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;

        results.push({
          success: false,
          responseTime,
          error: error instanceof Error ? error.message : 'Network Error',
          timestamp: Date.now(),
        } as RequestResult & { timestamp: number });
      }

      // Small delay between requests to simulate realistic user behavior
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    }
  }

  /**
   * Calculate test results
   */
  private calculateResults(
    config: LoadTestConfig,
    startTime: Date,
    endTime: Date,
    results: RequestResult[],
    throughputData: ThroughputDataPoint[],
    resourceUsage: ResourceUsage
  ): LoadTestResult {
    const actualDuration = endTime.getTime() - startTime.getTime();
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.filter(r => !r.success).length;
    const totalRequests = results.length;

    // Response time calculations
    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const minResponseTime = responseTimes.length > 0 ? responseTimes[0] : 0;
    const maxResponseTime = responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0;
    
    const p50ResponseTime = this.calculatePercentile(responseTimes, 50);
    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(responseTimes, 99);

    // Error analysis
    const errors: Record<string, number> = {};
    results.filter(r => !r.success).forEach(r => {
      const errorKey = r.statusCode ? r.statusCode.toString() : (r.error || 'Unknown Error');
      errors[errorKey] = (errors[errorKey] || 0) + 1;
    });

    const requestsPerSecond = totalRequests / (actualDuration / 1000);
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

    return {
      testName: config.name,
      startTime,
      endTime,
      actualDuration,
      concurrentUsers: config.concurrentUsers,
      rampUpTime: config.rampUpTime,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      p50ResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      errorRate,
      errors,
      throughputData: config.trackThroughput ? throughputData : undefined,
      resourceUsage: config.monitorResources ? resourceUsage : undefined,
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  /**
   * Monitor system resources
   */
  private monitorResources(resourceUsage: ResourceUsage): void {
    // Monitor memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const currentMemory = memory.usedJSHeapSize;
      
      if (currentMemory > resourceUsage.peakMemoryUsage) {
        resourceUsage.peakMemoryUsage = currentMemory;
      }
      
      // Update average (simple moving average)
      if (resourceUsage.averageMemoryUsage === 0) {
        resourceUsage.averageMemoryUsage = currentMemory;
      } else {
        resourceUsage.averageMemoryUsage = (resourceUsage.averageMemoryUsage + currentMemory) / 2;
      }
    }

    // Monitor CPU usage (simplified)
    const cpuUsage = this.estimateCpuUsage();
    if (resourceUsage.cpuUsageData) {
      resourceUsage.cpuUsageData.push({
        timestamp: Date.now(),
        usage: cpuUsage,
      });
    }
  }

  /**
   * Estimate CPU usage (simplified approach)
   */
  private estimateCpuUsage(): number {
    // This is a simplified CPU usage estimation
    // In a real implementation, you might use more sophisticated methods
    const start = performance.now();
    let iterations = 0;
    const maxTime = 10; // 10ms sample
    
    while (performance.now() - start < maxTime) {
      iterations++;
    }
    
    // Normalize to percentage (this is very rough)
    return Math.min(100, (iterations / 100000) * 100);
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}