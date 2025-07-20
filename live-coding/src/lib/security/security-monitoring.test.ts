/**
 * Security Monitoring Test
 * 
 * TDD tests for security monitoring and alerting system
 * with integration testing for threat detection and response.
 */

import { 
  SecurityMonitor, 
  SecurityEvent, 
  ThreatLevel, 
  SecurityAlert,
  createSecurityMiddleware 
} from './security-monitoring'
import { NextRequest, NextResponse } from 'next/server'

// Mock dependencies
jest.mock('./redis-cache')
jest.mock('../authorization/audit')

const mockRedisCache = {
  incrementRateLimit: jest.fn(),
  getRateLimitCount: jest.fn(),
  setObject: jest.fn(),
  getObject: jest.fn(),
  isHealthy: jest.fn(),
}

const mockAuditLogger = {
  logSecurityEvent: jest.fn(),
  getEvents: jest.fn(),
}

describe('Security Monitoring', () => {
  let securityMonitor: SecurityMonitor

  beforeEach(() => {
    jest.clearAllMocks()
    mockRedisCache.isHealthy.mockResolvedValue(true)
    
    securityMonitor = new SecurityMonitor({
      alertThresholds: {
        [ThreatLevel.LOW]: 10,
        [ThreatLevel.MEDIUM]: 5,
        [ThreatLevel.HIGH]: 3,
        [ThreatLevel.CRITICAL]: 1,
      },
      monitoringWindow: 300, // 5 minutes
      enableRealTimeAlerts: true,
    })
  })

  describe('SecurityMonitor Class', () => {
    it('creates security monitor with default configuration', () => {
      const defaultMonitor = new SecurityMonitor()
      const config = defaultMonitor.getConfig()

      expect(config.alertThresholds[ThreatLevel.CRITICAL]).toBe(1)
      expect(config.monitoringWindow).toBe(900) // 15 minutes default
      expect(config.enableRealTimeAlerts).toBe(true)
    })

    it('creates security monitor with custom configuration', () => {
      const customConfig = {
        alertThresholds: {
          [ThreatLevel.LOW]: 20,
          [ThreatLevel.MEDIUM]: 10,
          [ThreatLevel.HIGH]: 5,
          [ThreatLevel.CRITICAL]: 2,
        },
        monitoringWindow: 600,
        enableRealTimeAlerts: false,
      }

      const customMonitor = new SecurityMonitor(customConfig)
      const config = customMonitor.getConfig()

      expect(config.alertThresholds[ThreatLevel.CRITICAL]).toBe(2)
      expect(config.monitoringWindow).toBe(600)
      expect(config.enableRealTimeAlerts).toBe(false)
    })

    it('logs security events correctly', async () => {
      const event: SecurityEvent = {
        type: 'failed_login',
        threatLevel: ThreatLevel.MEDIUM,
        source: '192.168.1.100',
        userId: 'user_123',
        details: { attempts: 3 },
        timestamp: new Date(),
      }

      mockRedisCache.setObject.mockResolvedValue(undefined)

      await securityMonitor.logEvent(event)

      expect(mockRedisCache.setObject).toHaveBeenCalledWith(
        expect.stringContaining('security_event:'),
        event,
        300
      )
    })

    it('detects threat patterns', async () => {
      const events: SecurityEvent[] = [
        {
          type: 'failed_login',
          threatLevel: ThreatLevel.MEDIUM,
          source: '192.168.1.100',
          timestamp: new Date(),
        },
        {
          type: 'failed_login',
          threatLevel: ThreatLevel.MEDIUM,
          source: '192.168.1.100',
          timestamp: new Date(),
        },
        {
          type: 'failed_login',
          threatLevel: ThreatLevel.MEDIUM,
          source: '192.168.1.100',
          timestamp: new Date(),
        },
      ]

      mockRedisCache.getObject.mockResolvedValue(events)

      const threats = await securityMonitor.detectThreats('192.168.1.100')

      expect(threats).toHaveLength(1)
      expect(threats[0].type).toBe('repeated_failed_login')
      expect(threats[0].threatLevel).toBe(ThreatLevel.HIGH)
    })

    it('triggers alerts when thresholds are exceeded', async () => {
      const criticalEvent: SecurityEvent = {
        type: 'sql_injection_attempt',
        threatLevel: ThreatLevel.CRITICAL,
        source: '192.168.1.100',
        timestamp: new Date(),
      }

      const alertSpy = jest.spyOn(securityMonitor, 'sendAlert')
      alertSpy.mockResolvedValue(undefined)

      await securityMonitor.logEvent(criticalEvent)

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          threatLevel: ThreatLevel.CRITICAL,
          message: expect.stringContaining('sql_injection_attempt'),
        })
      )
    })

    it('handles multiple concurrent events', async () => {
      const events = Array.from({ length: 10 }, (_, i) => ({
        type: 'suspicious_activity',
        threatLevel: ThreatLevel.LOW,
        source: `192.168.1.${100 + i}`,
        timestamp: new Date(),
      }))

      mockRedisCache.setObject.mockResolvedValue(undefined)

      const promises = events.map(event => securityMonitor.logEvent(event))
      await Promise.all(promises)

      expect(mockRedisCache.setObject).toHaveBeenCalledTimes(10)
    })
  })

  describe('Threat Detection', () => {
    it('detects brute force attacks', async () => {
      const bruteForceEvents = Array.from({ length: 10 }, () => ({
        type: 'failed_login',
        threatLevel: ThreatLevel.MEDIUM,
        source: '192.168.1.100',
        userId: 'user_123',
        timestamp: new Date(),
      }))

      mockRedisCache.getObject.mockResolvedValue(bruteForceEvents)

      const threats = await securityMonitor.detectThreats('192.168.1.100')

      expect(threats.some(t => t.type === 'brute_force_attack')).toBe(true)
    })

    it('detects SQL injection attempts', async () => {
      const sqlInjectionEvent: SecurityEvent = {
        type: 'sql_injection_attempt',
        threatLevel: ThreatLevel.CRITICAL,
        source: '192.168.1.100',
        details: { 
          query: "'; DROP TABLE users; --",
          endpoint: '/api/search'
        },
        timestamp: new Date(),
      }

      await securityMonitor.logEvent(sqlInjectionEvent)

      const threats = await securityMonitor.detectThreats('192.168.1.100')
      expect(threats.some(t => t.type === 'sql_injection_attempt')).toBe(true)
    })

    it('detects XSS attempts', async () => {
      const xssEvent: SecurityEvent = {
        type: 'xss_attempt',
        threatLevel: ThreatLevel.HIGH,
        source: '192.168.1.100',
        details: { 
          payload: '<script>alert("xss")</script>',
          field: 'comment'
        },
        timestamp: new Date(),
      }

      await securityMonitor.logEvent(xssEvent)

      const threats = await securityMonitor.detectThreats('192.168.1.100')
      expect(threats.some(t => t.type === 'xss_attempt')).toBe(true)
    })

    it('detects unusual access patterns', async () => {
      const accessEvents = Array.from({ length: 100 }, (_, i) => ({
        type: 'api_access',
        threatLevel: ThreatLevel.LOW,
        source: '192.168.1.100',
        details: { endpoint: `/api/endpoint${i}` },
        timestamp: new Date(Date.now() - i * 1000),
      }))

      mockRedisCache.getObject.mockResolvedValue(accessEvents)

      const threats = await securityMonitor.detectThreats('192.168.1.100')

      expect(threats.some(t => t.type === 'unusual_access_pattern')).toBe(true)
    })

    it('detects privilege escalation attempts', async () => {
      const escalationEvent: SecurityEvent = {
        type: 'privilege_escalation',
        threatLevel: ThreatLevel.CRITICAL,
        source: '192.168.1.100',
        userId: 'user_123',
        details: { 
          attemptedRole: 'admin',
          currentRole: 'student'
        },
        timestamp: new Date(),
      }

      await securityMonitor.logEvent(escalationEvent)

      const threats = await securityMonitor.detectThreats('192.168.1.100')
      expect(threats.some(t => t.type === 'privilege_escalation')).toBe(true)
    })
  })

  describe('Alert System', () => {
    it('sends immediate alerts for critical threats', async () => {
      const criticalEvent: SecurityEvent = {
        type: 'data_breach_attempt',
        threatLevel: ThreatLevel.CRITICAL,
        source: '192.168.1.100',
        timestamp: new Date(),
      }

      const sendAlertSpy = jest.spyOn(securityMonitor, 'sendAlert')
      sendAlertSpy.mockResolvedValue(undefined)

      await securityMonitor.logEvent(criticalEvent)

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          threatLevel: ThreatLevel.CRITICAL,
          priority: 'immediate',
        })
      )
    })

    it('batches alerts for lower priority threats', async () => {
      const lowThreatEvents = Array.from({ length: 5 }, () => ({
        type: 'suspicious_activity',
        threatLevel: ThreatLevel.LOW,
        source: '192.168.1.100',
        timestamp: new Date(),
      }))

      const sendAlertSpy = jest.spyOn(securityMonitor, 'sendAlert')
      sendAlertSpy.mockResolvedValue(undefined)

      for (const event of lowThreatEvents) {
        await securityMonitor.logEvent(event)
      }

      // Should not send immediate alerts for low threats
      expect(sendAlertSpy).not.toHaveBeenCalled()

      // Should send batched alert after threshold
      await securityMonitor.processBatchedAlerts()
      expect(sendAlertSpy).toHaveBeenCalled()
    })

    it('includes relevant context in alerts', async () => {
      const event: SecurityEvent = {
        type: 'failed_login',
        threatLevel: ThreatLevel.HIGH,
        source: '192.168.1.100',
        userId: 'user_123',
        details: { 
          userAgent: 'Mozilla/5.0...',
          attempts: 5
        },
        timestamp: new Date(),
      }

      const sendAlertSpy = jest.spyOn(securityMonitor, 'sendAlert')
      sendAlertSpy.mockResolvedValue(undefined)

      await securityMonitor.logEvent(event)

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            source: '192.168.1.100',
            userId: 'user_123',
            details: expect.any(Object),
          })
        })
      )
    })

    it('prevents alert spam with rate limiting', async () => {
      const events = Array.from({ length: 20 }, () => ({
        type: 'failed_login',
        threatLevel: ThreatLevel.CRITICAL,
        source: '192.168.1.100',
        timestamp: new Date(),
      }))

      const sendAlertSpy = jest.spyOn(securityMonitor, 'sendAlert')
      sendAlertSpy.mockResolvedValue(undefined)

      for (const event of events) {
        await securityMonitor.logEvent(event)
      }

      // Should not send 20 alerts, should be rate limited
      expect(sendAlertSpy.mock.calls.length).toBeLessThan(20)
    })
  })

  describe('Security Middleware', () => {
    it('creates security monitoring middleware', () => {
      const middleware = createSecurityMiddleware({
        enableThreatDetection: true,
        enableRealTimeAlerts: true,
      })

      expect(middleware).toBeInstanceOf(Function)
    })

    it('monitors requests for security threats', async () => {
      const middleware = createSecurityMiddleware()

      const suspiciousRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'user-agent': 'sqlmap/1.0',
        },
        body: JSON.stringify({
          query: "'; DROP TABLE users; --"
        }),
      })

      const logEventSpy = jest.spyOn(SecurityMonitor.prototype, 'logEvent')
      logEventSpy.mockResolvedValue(undefined)

      await middleware(suspiciousRequest)

      expect(logEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('suspicious'),
          threatLevel: expect.any(String),
        })
      )
    })

    it('detects malicious user agents', async () => {
      const middleware = createSecurityMiddleware()

      const maliciousRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'user-agent': 'Nikto/2.1.6',
        },
      })

      const logEventSpy = jest.spyOn(SecurityMonitor.prototype, 'logEvent')
      logEventSpy.mockResolvedValue(undefined)

      await middleware(maliciousRequest)

      expect(logEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'malicious_user_agent',
          threatLevel: ThreatLevel.HIGH,
        })
      )
    })

    it('monitors for suspicious request patterns', async () => {
      const middleware = createSecurityMiddleware()

      const rapidRequests = Array.from({ length: 100 }, (_, i) => 
        new NextRequest(`http://localhost:3000/api/endpoint${i}`, {
          headers: {
            'x-forwarded-for': '192.168.1.100',
          },
        })
      )

      const logEventSpy = jest.spyOn(SecurityMonitor.prototype, 'logEvent')
      logEventSpy.mockResolvedValue(undefined)

      for (const request of rapidRequests) {
        await middleware(request)
      }

      expect(logEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('rapid_requests'),
        })
      )
    })

    it('blocks requests from known malicious IPs', async () => {
      const middleware = createSecurityMiddleware({
        blockedIPs: ['192.168.1.100'],
      })

      const blockedRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      })

      const response = await middleware(blockedRequest)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(403)
    })
  })

  describe('Integration with Authentication System', () => {
    it('monitors authentication events', async () => {
      const authEvent: SecurityEvent = {
        type: 'login_success',
        threatLevel: ThreatLevel.LOW,
        source: '192.168.1.100',
        userId: 'user_123',
        details: { method: 'password' },
        timestamp: new Date(),
      }

      mockRedisCache.setObject.mockResolvedValue(undefined)

      await securityMonitor.logEvent(authEvent)

      expect(mockRedisCache.setObject).toHaveBeenCalledWith(
        expect.stringContaining('security_event:'),
        authEvent,
        300
      )
    })

    it('detects account takeover attempts', async () => {
      const takeoverEvents = [
        {
          type: 'login_success',
          threatLevel: ThreatLevel.LOW,
          source: '192.168.1.100',
          userId: 'user_123',
          timestamp: new Date(Date.now() - 60000),
        },
        {
          type: 'password_change',
          threatLevel: ThreatLevel.MEDIUM,
          source: '192.168.1.200',
          userId: 'user_123',
          timestamp: new Date(),
        },
      ]

      mockRedisCache.getObject.mockResolvedValue(takeoverEvents)

      const threats = await securityMonitor.detectThreats('user_123')

      expect(threats.some(t => t.type === 'account_takeover_attempt')).toBe(true)
    })

    it('monitors role changes for privilege escalation', async () => {
      const roleChangeEvent: SecurityEvent = {
        type: 'role_change',
        threatLevel: ThreatLevel.MEDIUM,
        source: '192.168.1.100',
        userId: 'user_123',
        details: { 
          oldRole: 'student',
          newRole: 'admin',
          changedBy: 'user_456'
        },
        timestamp: new Date(),
      }

      await securityMonitor.logEvent(roleChangeEvent)

      const threats = await securityMonitor.detectThreats('user_123')
      expect(threats.some(t => t.type === 'role_change')).toBe(true)
    })
  })

  describe('Performance and Scalability', () => {
    it('handles high volume of security events', async () => {
      const events = Array.from({ length: 1000 }, (_, i) => ({
        type: 'api_access',
        threatLevel: ThreatLevel.LOW,
        source: `192.168.1.${100 + (i % 100)}`,
        timestamp: new Date(),
      }))

      mockRedisCache.setObject.mockResolvedValue(undefined)

      const startTime = Date.now()
      
      const promises = events.map(event => securityMonitor.logEvent(event))
      await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
    })

    it('provides security monitoring statistics', async () => {
      const stats = await securityMonitor.getStats()

      expect(stats).toHaveProperty('eventsLogged')
      expect(stats).toHaveProperty('threatsDetected')
      expect(stats).toHaveProperty('alertsSent')
      expect(stats).toHaveProperty('averageResponseTime')
    })

    it('cleans up old security events', async () => {
      mockRedisCache.getObject.mockResolvedValue([])

      await securityMonitor.cleanupOldEvents()

      // Should call Redis cleanup operations
      expect(mockRedisCache.getObject).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Resilience', () => {
    it('handles Redis failures gracefully', async () => {
      mockRedisCache.setObject.mockRejectedValue(new Error('Redis error'))

      const event: SecurityEvent = {
        type: 'test_event',
        threatLevel: ThreatLevel.LOW,
        source: '192.168.1.100',
        timestamp: new Date(),
      }

      // Should not throw error
      await expect(securityMonitor.logEvent(event)).resolves.not.toThrow()
    })

    it('continues monitoring when alert system fails', async () => {
      const sendAlertSpy = jest.spyOn(securityMonitor, 'sendAlert')
      sendAlertSpy.mockRejectedValue(new Error('Alert system error'))

      const criticalEvent: SecurityEvent = {
        type: 'critical_threat',
        threatLevel: ThreatLevel.CRITICAL,
        source: '192.168.1.100',
        timestamp: new Date(),
      }

      // Should not throw error
      await expect(securityMonitor.logEvent(criticalEvent)).resolves.not.toThrow()
    })

    it('validates security event data', async () => {
      const invalidEvent = {
        // Missing required fields
        threatLevel: ThreatLevel.LOW,
        timestamp: new Date(),
      } as SecurityEvent

      await expect(securityMonitor.logEvent(invalidEvent)).rejects.toThrow()
    })
  })
})