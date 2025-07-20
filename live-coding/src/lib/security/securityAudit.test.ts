import { SecurityAuditor, SecurityAuditConfig, SecurityAuditResult } from './securityAudit';

// Mock fetch for security testing
global.fetch = jest.fn();

describe('SecurityAuditor', () => {
  let securityAuditor: SecurityAuditor;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    securityAuditor = new SecurityAuditor();
    jest.clearAllMocks();
  });

  describe('Configuration Validation', () => {
    it('should validate security audit configuration', () => {
      const validConfig: SecurityAuditConfig = {
        baseUrl: 'https://localhost:3000',
        authToken: 'test-token',
        testDepth: 'standard',
        includeTests: ['xss', 'sql-injection', 'csrf', 'authentication'],
        excludeEndpoints: ['/health'],
      };

      expect(() => securityAuditor.validateConfig(validConfig)).not.toThrow();
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        baseUrl: 'invalid-url',
        testDepth: 'invalid-depth',
      } as SecurityAuditConfig;

      expect(() => securityAuditor.validateConfig(invalidConfig)).toThrow();
    });

    it('should validate base URL format', () => {
      const config: SecurityAuditConfig = {
        baseUrl: 'not-a-url',
        testDepth: 'standard',
      };

      expect(() => securityAuditor.validateConfig(config)).toThrow('Invalid base URL format');
    });
  });

  describe('XSS Vulnerability Testing', () => {
    it('should detect reflected XSS vulnerabilities', async () => {
      // Mock vulnerable response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<script>alert("xss")</script>'),
        headers: new Headers(),
      } as Response);

      const config: SecurityAuditConfig = {
        baseUrl: 'https://localhost:3000',
        testDepth: 'standard',
        includeTests: ['xss'],
      };

      const result = await securityAuditor.runAudit(config);

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('XSS');
      expect(result.vulnerabilities[0].severity).toBe('HIGH');
    });

    it('should test for stored XSS vulnerabilities', async () => {
      // Mock responses for stored XSS test
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('<script>alert("stored-xss")</script>'),
        } as Response);

      const result = await securityAuditor.testStoredXSS('https://localhost:3000/api/comments');

      expect(result.vulnerable).toBe(true);
      expect(result.type).toBe('Stored XSS');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should test for DOM-based XSS', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(`
          <script>
            document.getElementById('content').innerHTML = location.hash.substring(1);
          </script>
          <div id="content"></div>
        `),
      } as Response);

      const result = await securityAuditor.testDOMXSS('https://localhost:3000/page');

      expect(result.vulnerable).toBe(true);
      expect(result.type).toBe('DOM XSS');
    });
  });

  describe('SQL Injection Testing', () => {
    it('should detect SQL injection vulnerabilities', async () => {
      // Mock error response indicating SQL injection
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('SQL syntax error near'),
        headers: new Headers(),
      } as Response);

      const result = await securityAuditor.testSQLInjection('https://localhost:3000/api/users');

      expect(result.vulnerable).toBe(true);
      expect(result.type).toBe('SQL Injection');
      expect(result.evidence).toContain('SQL syntax error');
    });

    it('should test various SQL injection payloads', async () => {
      const payloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "1' AND (SELECT COUNT(*) FROM users) > 0 --",
      ];

      // Mock different responses for different payloads
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: 1 }, { id: 2 }]), // More results than expected
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Table users dropped'),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ username: 'admin' }]), // Unexpected data
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ count: 5 }), // Boolean-based injection
        } as Response);

      const results = await securityAuditor.testSQLInjectionPayloads(
        'https://localhost:3000/api/search',
        payloads
      );

      expect(results.some(r => r.vulnerable)).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('CSRF Protection Testing', () => {
    it('should test CSRF protection on state-changing endpoints', async () => {
      // Mock successful request without CSRF token
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await securityAuditor.testCSRF('https://localhost:3000/api/users', 'POST');

      expect(result.vulnerable).toBe(true);
      expect(result.type).toBe('CSRF');
      expect(result.description).toContain('accepts requests without CSRF protection');
    });

    it('should verify CSRF token validation', async () => {
      // Mock rejection of request with invalid CSRF token
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Invalid CSRF token' }),
      } as Response);

      const result = await securityAuditor.testCSRFTokenValidation(
        'https://localhost:3000/api/users',
        'invalid-token'
      );

      expect(result.vulnerable).toBe(false);
      expect(result.type).toBe('CSRF Token Validation');
    });
  });

  describe('Authentication Testing', () => {
    it('should test for weak authentication mechanisms', async () => {
      const config: SecurityAuditConfig = {
        baseUrl: 'https://localhost:3000',
        testDepth: 'standard',
        includeTests: ['authentication'],
      };

      // Mock various authentication responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ token: 'weak-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        } as Response);

      const result = await securityAuditor.runAudit(config);

      expect(result.authenticationTests).toBeDefined();
      expect(result.authenticationTests!.length).toBeGreaterThan(0);
    });

    it('should test for brute force protection', async () => {
      // Mock responses for brute force testing
      const responses = Array(10).fill(null).map((_, index) => ({
        ok: false,
        status: index < 5 ? 401 : 429, // Rate limiting after 5 attempts
        json: () => Promise.resolve({ 
          error: index < 5 ? 'Invalid credentials' : 'Too many attempts' 
        }),
      }));

      mockFetch.mockImplementation(() => Promise.resolve(responses.shift() as Response));

      const result = await securityAuditor.testBruteForceProtection(
        'https://localhost:3000/api/auth/login'
      );

      expect(result.protected).toBe(true);
      expect(result.type).toBe('Brute Force Protection');
    });

    it('should test session management', async () => {
      // Mock session-related responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'Set-Cookie': 'sessionId=abc123; HttpOnly; Secure; SameSite=Strict'
          }),
          json: () => Promise.resolve({ success: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ user: 'test' }),
        } as Response);

      const result = await securityAuditor.testSessionManagement(
        'https://localhost:3000/api/auth/login'
      );

      expect(result.secure).toBe(true);
      expect(result.findings).toContain('HttpOnly flag present');
      expect(result.findings).toContain('Secure flag present');
    });
  });

  describe('Authorization Testing', () => {
    it('should test for privilege escalation vulnerabilities', async () => {
      // Mock responses for different user roles
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ role: 'user' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ users: [] }), // Should be forbidden
        } as Response);

      const result = await securityAuditor.testPrivilegeEscalation(
        'https://localhost:3000/api/admin/users',
        'user-token'
      );

      expect(result.vulnerable).toBe(true);
      expect(result.type).toBe('Privilege Escalation');
    });

    it('should test horizontal privilege escalation', async () => {
      // Mock access to another user's data
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ userId: 2, email: 'other@example.com' }),
      } as Response);

      const result = await securityAuditor.testHorizontalPrivilegeEscalation(
        'https://localhost:3000/api/users/2',
        'user1-token'
      );

      expect(result.vulnerable).toBe(true);
      expect(result.type).toBe('Horizontal Privilege Escalation');
    });
  });

  describe('Input Validation Testing', () => {
    it('should test for input validation vulnerabilities', async () => {
      const testInputs = [
        '<script>alert("xss")</script>',
        "'; DROP TABLE users; --",
        '../../../etc/passwd',
        '${7*7}', // Template injection
        'A'.repeat(10000), // Buffer overflow attempt
      ];

      // Mock responses for different inputs
      mockFetch.mockImplementation((url) => {
        const urlStr = url as string;
        if (urlStr.includes('script')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: () => Promise.resolve('<script>alert("xss")</script>'),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      });

      const results = await securityAuditor.testInputValidation(
        'https://localhost:3000/api/search',
        testInputs
      );

      expect(results.some(r => r.vulnerable)).toBe(true);
    });

    it('should test file upload vulnerabilities', async () => {
      // Mock file upload response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ 
          filename: 'malicious.php',
          path: '/uploads/malicious.php'
        }),
      } as Response);

      const result = await securityAuditor.testFileUpload(
        'https://localhost:3000/api/upload'
      );

      expect(result.vulnerable).toBe(true);
      expect(result.type).toBe('File Upload');
    });
  });

  describe('Security Headers Testing', () => {
    it('should check for security headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Security-Policy': "default-src 'self'",
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Strict-Transport-Security': 'max-age=31536000',
        }),
        text: () => Promise.resolve('OK'),
      } as Response);

      const result = await securityAuditor.checkSecurityHeaders('https://localhost:3000');

      expect(result.score).toBeGreaterThan(80);
      expect(result.headers['Content-Security-Policy']).toBe('PASS');
      expect(result.headers['X-Frame-Options']).toBe('PASS');
    });

    it('should identify missing security headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: () => Promise.resolve('OK'),
      } as Response);

      const result = await securityAuditor.checkSecurityHeaders('https://localhost:3000');

      expect(result.score).toBeLessThan(50);
      expect(result.headers['Content-Security-Policy']).toBe('MISSING');
      expect(result.headers['X-Frame-Options']).toBe('MISSING');
    });
  });

  describe('SSL/TLS Testing', () => {
    it('should test SSL/TLS configuration', async () => {
      // Mock HTTPS response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        }),
        text: () => Promise.resolve('OK'),
      } as Response);

      const result = await securityAuditor.testSSLTLS('https://localhost:3000');

      expect(result.secure).toBe(true);
      expect(result.findings).toContain('HTTPS enabled');
      expect(result.findings).toContain('HSTS header present');
    });

    it('should detect insecure HTTP usage', async () => {
      const result = await securityAuditor.testSSLTLS('http://localhost:3000');

      expect(result.secure).toBe(false);
      expect(result.findings).toContain('HTTP protocol used');
    });
  });

  describe('Comprehensive Security Audit', () => {
    it('should run comprehensive security audit', async () => {
      const config: SecurityAuditConfig = {
        baseUrl: 'https://localhost:3000',
        testDepth: 'comprehensive',
        includeTests: ['xss', 'sql-injection', 'csrf', 'authentication', 'authorization'],
      };

      // Mock various responses for comprehensive testing
      mockFetch.mockImplementation((url, options) => {
        const method = options?.method || 'GET';
        const urlStr = url as string;

        if (urlStr.includes('xss') || (options?.body && (options.body as string).includes('script'))) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: () => Promise.resolve('<script>alert("xss")</script>'),
          } as Response);
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
          headers: new Headers({
            'Content-Security-Policy': "default-src 'self'",
            'X-Frame-Options': 'DENY',
          }),
        } as Response);
      });

      const result = await securityAuditor.runAudit(config);

      expect(result.summary.totalTests).toBeGreaterThan(0);
      expect(result.summary.vulnerabilitiesFound).toBeGreaterThan(0);
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.securityScore).toBeGreaterThan(0);
      expect(result.securityScore).toBeLessThanOrEqual(100);
    });

    it('should generate security report', () => {
      const result: SecurityAuditResult = {
        timestamp: new Date(),
        baseUrl: 'https://localhost:3000',
        testDepth: 'standard',
        summary: {
          totalTests: 10,
          vulnerabilitiesFound: 2,
          criticalVulnerabilities: 1,
          highVulnerabilities: 1,
          mediumVulnerabilities: 0,
          lowVulnerabilities: 0,
        },
        vulnerabilities: [
          {
            type: 'XSS',
            severity: 'CRITICAL',
            endpoint: '/api/search',
            description: 'Reflected XSS vulnerability',
            evidence: '<script>alert("xss")</script>',
            recommendation: 'Implement input sanitization',
          },
          {
            type: 'SQL Injection',
            severity: 'HIGH',
            endpoint: '/api/users',
            description: 'SQL injection vulnerability',
            evidence: 'SQL syntax error',
            recommendation: 'Use parameterized queries',
          },
        ],
        securityScore: 65,
        recommendations: [
          'Implement Content Security Policy',
          'Add input validation',
          'Use parameterized queries',
        ],
      };

      const report = securityAuditor.generateReport(result);

      expect(report).toContain('Security Audit Report');
      expect(report).toContain('2 vulnerabilities found');
      expect(report).toContain('XSS');
      expect(report).toContain('SQL Injection');
    });
  });

  describe('Penetration Testing', () => {
    it('should perform automated penetration testing', async () => {
      const config: SecurityAuditConfig = {
        baseUrl: 'https://localhost:3000',
        testDepth: 'penetration',
        includeTests: ['xss', 'sql-injection', 'csrf', 'authentication', 'authorization'],
        authToken: 'test-token',
      };

      // Mock responses for penetration testing
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      } as Response));

      const result = await securityAuditor.runPenetrationTest(config);

      expect(result.testType).toBe('Penetration Test');
      expect(result.summary.totalTests).toBeGreaterThan(0);
      expect(result.penetrationFindings).toBeDefined();
    });
  });
});