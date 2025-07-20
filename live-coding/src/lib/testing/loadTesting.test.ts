import { LoadTestRunner, LoadTestConfig, LoadTestResult } from './loadTesting';

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
  writable: true,
});

// Mock fetch for load testing
global.fetch = jest.fn();

describe('LoadTestRunner', () => {
  let loadTestRunner: LoadTestRunner;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    loadTestRunner = new LoadTestRunner();
    jest.clearAllMocks();
    
    // Mock successful responses
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ success: true }),
      text: () => Promise.resolve('OK'),
      headers: new Headers(),
      url: 'http://localhost:3000/api/test',
    } as Response);
  });

  describe('Configuration Validation', () => {
    it('should validate load test configuration', () => {
      const validConfig: LoadTestConfig = {
        name: 'API Load Test',
        url: 'http://localhost:3000/api/courses',
        method: 'GET',
        concurrentUsers: 100,
        duration: 60000, // 1 minute
        rampUpTime: 10000, // 10 seconds
        headers: { 'Content-Type': 'application/json' },
      };

      expect(() => loadTestRunner.validateConfig(validConfig)).not.toThrow();
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        name: '',
        url: 'invalid-url',
        concurrentUsers: -1,
        duration: 0,
      } as LoadTestConfig;

      expect(() => loadTestRunner.validateConfig(invalidConfig)).toThrow();
    });

    it('should validate concurrent user limits', () => {
      const config: LoadTestConfig = {
        name: 'High Load Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 200000, // Too high
        duration: 60000,
        rampUpTime: 10000,
      };

      expect(() => loadTestRunner.validateConfig(config)).toThrow('Concurrent users exceeds maximum limit');
    });

    it('should validate duration limits', () => {
      const config: LoadTestConfig = {
        name: 'Long Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 100,
        duration: 7200000, // 2 hours - too long
        rampUpTime: 10000,
      };

      expect(() => loadTestRunner.validateConfig(config)).toThrow('Duration exceeds maximum limit');
    });
  });

  describe('Load Test Execution', () => {
    it('should execute basic load test', async () => {
      const config: LoadTestConfig = {
        name: 'Basic Load Test',
        url: 'http://localhost:3000/api/health',
        method: 'GET',
        concurrentUsers: 10,
        duration: 5000, // 5 seconds
        rampUpTime: 1000, // 1 second
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.testName).toBe('Basic Load Test');
      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.successfulRequests).toBeGreaterThan(0);
      expect(result.failedRequests).toBe(0);
      expect(result.averageResponseTime).toBeGreaterThan(0);
      expect(result.requestsPerSecond).toBeGreaterThan(0);
    });

    it('should handle concurrent users correctly', async () => {
      const config: LoadTestConfig = {
        name: 'Concurrent Test',
        url: 'http://localhost:3000/api/courses',
        method: 'GET',
        concurrentUsers: 50,
        duration: 3000,
        rampUpTime: 500,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.concurrentUsers).toBe(50);
      expect(result.totalRequests).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should measure response times accurately', async () => {
      // Mock performance.now to return predictable values
      let timeCounter = 0;
      (performance.now as jest.Mock).mockImplementation(() => {
        timeCounter += 100; // 100ms per call
        return timeCounter;
      });

      const config: LoadTestConfig = {
        name: 'Response Time Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 5,
        duration: 2000,
        rampUpTime: 200,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.averageResponseTime).toBeGreaterThan(0);
      expect(result.minResponseTime).toBeGreaterThan(0);
      expect(result.maxResponseTime).toBeGreaterThan(0);
      expect(result.p95ResponseTime).toBeGreaterThan(0);
    });

    it('should handle failed requests', async () => {
      // Mock some failed responses
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as Response)
        .mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
        } as Response);

      const config: LoadTestConfig = {
        name: 'Error Handling Test',
        url: 'http://localhost:3000/api/error',
        method: 'GET',
        concurrentUsers: 10,
        duration: 2000,
        rampUpTime: 200,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.failedRequests).toBeGreaterThan(0);
      expect(result.errorRate).toBeGreaterThan(0);
      expect(result.errors).toBeDefined();
      expect(Object.keys(result.errors)).toContain('500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const config: LoadTestConfig = {
        name: 'Network Error Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 5,
        duration: 1000,
        rampUpTime: 100,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.failedRequests).toBeGreaterThan(0);
      expect(result.errors).toBeDefined();
      expect(result.errors['Network Error']).toBeGreaterThan(0);
    });
  });

  describe('Ramp-up Strategy', () => {
    it('should gradually increase concurrent users', async () => {
      const config: LoadTestConfig = {
        name: 'Ramp-up Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 20,
        duration: 5000,
        rampUpTime: 2000, // 2 seconds ramp-up
      };

      const startTime = Date.now();
      const result = await loadTestRunner.runTest(config);
      const endTime = Date.now();

      expect(result.rampUpTime).toBe(2000);
      expect(endTime - startTime).toBeGreaterThanOrEqual(5000);
    });

    it('should handle zero ramp-up time', async () => {
      const config: LoadTestConfig = {
        name: 'No Ramp-up Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 10,
        duration: 2000,
        rampUpTime: 0,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.rampUpTime).toBe(0);
      expect(result.totalRequests).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate requests per second', async () => {
      const config: LoadTestConfig = {
        name: 'RPS Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 10,
        duration: 2000,
        rampUpTime: 200,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.requestsPerSecond).toBeGreaterThan(0);
      expect(result.requestsPerSecond).toBe(
        result.totalRequests / (result.actualDuration / 1000)
      );
    });

    it('should calculate percentile response times', async () => {
      // Mock varying response times
      const responseTimes = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
      let timeIndex = 0;
      
      (performance.now as jest.Mock).mockImplementation(() => {
        const time = responseTimes[timeIndex % responseTimes.length];
        timeIndex++;
        return time;
      });

      const config: LoadTestConfig = {
        name: 'Percentile Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 5,
        duration: 2000,
        rampUpTime: 200,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.p50ResponseTime).toBeGreaterThan(0);
      expect(result.p95ResponseTime).toBeGreaterThan(0);
      expect(result.p99ResponseTime).toBeGreaterThan(0);
      expect(result.p95ResponseTime).toBeGreaterThanOrEqual(result.p50ResponseTime);
      expect(result.p99ResponseTime).toBeGreaterThanOrEqual(result.p95ResponseTime);
    });

    it('should track throughput over time', async () => {
      const config: LoadTestConfig = {
        name: 'Throughput Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 15,
        duration: 3000,
        rampUpTime: 300,
        trackThroughput: true,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.throughputData).toBeDefined();
      expect(result.throughputData!.length).toBeGreaterThan(0);
      expect(result.throughputData![0]).toHaveProperty('timestamp');
      expect(result.throughputData![0]).toHaveProperty('requestsPerSecond');
    });
  });

  describe('POST Request Testing', () => {
    it('should handle POST requests with body', async () => {
      const config: LoadTestConfig = {
        name: 'POST Test',
        url: 'http://localhost:3000/api/courses',
        method: 'POST',
        concurrentUsers: 5,
        duration: 2000,
        rampUpTime: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Course', description: 'Load test course' }),
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.totalRequests).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/courses',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        })
      );
    });

    it('should handle authentication headers', async () => {
      const config: LoadTestConfig = {
        name: 'Auth Test',
        url: 'http://localhost:3000/api/protected',
        method: 'GET',
        concurrentUsers: 3,
        duration: 1500,
        rampUpTime: 150,
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.totalRequests).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('Test Scenarios', () => {
    it('should run multiple test scenarios', async () => {
      const scenarios: LoadTestConfig[] = [
        {
          name: 'Light Load',
          url: 'http://localhost:3000/api/health',
          method: 'GET',
          concurrentUsers: 10,
          duration: 2000,
          rampUpTime: 200,
        },
        {
          name: 'Medium Load',
          url: 'http://localhost:3000/api/courses',
          method: 'GET',
          concurrentUsers: 50,
          duration: 3000,
          rampUpTime: 500,
        },
      ];

      const results = await loadTestRunner.runScenarios(scenarios);

      expect(results).toHaveLength(2);
      expect(results[0].testName).toBe('Light Load');
      expect(results[1].testName).toBe('Medium Load');
      expect(results[0].totalRequests).toBeGreaterThan(0);
      expect(results[1].totalRequests).toBeGreaterThan(0);
    });

    it('should handle scenario failures gracefully', async () => {
      const scenarios: LoadTestConfig[] = [
        {
          name: 'Valid Test',
          url: 'http://localhost:3000/api/health',
          method: 'GET',
          concurrentUsers: 5,
          duration: 1000,
          rampUpTime: 100,
        },
        {
          name: 'Invalid Test',
          url: 'invalid-url',
          method: 'GET',
          concurrentUsers: 5,
          duration: 1000,
          rampUpTime: 100,
        },
      ];

      const results = await loadTestRunner.runScenarios(scenarios);

      expect(results).toHaveLength(2);
      expect(results[0].testName).toBe('Valid Test');
      expect(results[0].totalRequests).toBeGreaterThan(0);
      expect(results[1].testName).toBe('Invalid Test');
      expect(results[1].failedRequests).toBeGreaterThan(0);
    });
  });

  describe('Resource Monitoring', () => {
    it('should monitor memory usage during test', async () => {
      // Mock memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50000000, // 50MB
          totalJSHeapSize: 100000000, // 100MB
          jsHeapSizeLimit: 2000000000, // 2GB
        },
        writable: true,
      });

      const config: LoadTestConfig = {
        name: 'Memory Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 20,
        duration: 2000,
        rampUpTime: 200,
        monitorResources: true,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.resourceUsage).toBeDefined();
      expect(result.resourceUsage!.peakMemoryUsage).toBeGreaterThan(0);
      expect(result.resourceUsage!.averageMemoryUsage).toBeGreaterThan(0);
    });

    it('should track CPU usage patterns', async () => {
      const config: LoadTestConfig = {
        name: 'CPU Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 30,
        duration: 3000,
        rampUpTime: 300,
        monitorResources: true,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result.resourceUsage).toBeDefined();
      expect(result.resourceUsage!.cpuUsageData).toBeDefined();
      expect(result.resourceUsage!.cpuUsageData!.length).toBeGreaterThan(0);
    });
  });

  describe('Test Reporting', () => {
    it('should generate comprehensive test report', async () => {
      const config: LoadTestConfig = {
        name: 'Report Test',
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        concurrentUsers: 25,
        duration: 4000,
        rampUpTime: 400,
        trackThroughput: true,
        monitorResources: true,
      };

      const result = await loadTestRunner.runTest(config);

      expect(result).toHaveProperty('testName');
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('actualDuration');
      expect(result).toHaveProperty('totalRequests');
      expect(result).toHaveProperty('successfulRequests');
      expect(result).toHaveProperty('failedRequests');
      expect(result).toHaveProperty('averageResponseTime');
      expect(result).toHaveProperty('minResponseTime');
      expect(result).toHaveProperty('maxResponseTime');
      expect(result).toHaveProperty('p50ResponseTime');
      expect(result).toHaveProperty('p95ResponseTime');
      expect(result).toHaveProperty('p99ResponseTime');
      expect(result).toHaveProperty('requestsPerSecond');
      expect(result).toHaveProperty('errorRate');
      expect(result).toHaveProperty('throughputData');
      expect(result).toHaveProperty('resourceUsage');
    });

    it('should export results to JSON', () => {
      const result: LoadTestResult = {
        testName: 'Export Test',
        startTime: new Date(),
        endTime: new Date(),
        actualDuration: 5000,
        concurrentUsers: 10,
        rampUpTime: 500,
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        averageResponseTime: 150,
        minResponseTime: 50,
        maxResponseTime: 500,
        p50ResponseTime: 140,
        p95ResponseTime: 300,
        p99ResponseTime: 450,
        requestsPerSecond: 20,
        errorRate: 0.05,
        errors: { '500': 3, 'Network Error': 2 },
      };

      const jsonReport = loadTestRunner.exportToJSON(result);
      const parsed = JSON.parse(jsonReport);

      expect(parsed.testName).toBe('Export Test');
      expect(parsed.totalRequests).toBe(100);
      expect(parsed.errorRate).toBe(0.05);
    });
  });
});