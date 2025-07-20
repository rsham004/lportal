/**
 * Security Monitoring Implementation
 * 
 * Provides comprehensive security monitoring, threat detection,
 * and alerting system for the learning portal.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRedisCache } from './redis-cache'
import { auditLogger } from '../authorization/audit'

export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SecurityEvent {
  type: string
  threatLevel: ThreatLevel
  source: string
  userId?: string
  details?: Record<string, any>
  timestamp: Date
}

export interface SecurityAlert {
  id: string
  threatLevel: ThreatLevel
  message: string
  source: string
  timestamp: Date
  priority: 'immediate' | 'high' | 'medium' | 'low'
  context: {
    source: string
    userId?: string
    details?: Record<string, any>
    relatedEvents?: SecurityEvent[]
  }
}

export interface ThreatPattern {
  type: string
  threatLevel: ThreatLevel
  confidence: number
  events: SecurityEvent[]
  description: string
}

export interface SecurityMonitorConfig {
  alertThresholds: Record<ThreatLevel, number>
  monitoringWindow: number // seconds
  enableRealTimeAlerts: boolean
  enableThreatDetection: boolean
  blockedIPs?: string[]
  suspiciousUserAgents?: string[]
  maxEventsPerWindow?: number
}

export interface SecurityStats {
  eventsLogged: number
  threatsDetected: number
  alertsSent: number
  averageResponseTime: number
  blockedRequests: number
}

const DEFAULT_CONFIG: SecurityMonitorConfig = {
  alertThresholds: {
    [ThreatLevel.LOW]: 50,
    [ThreatLevel.MEDIUM]: 10,
    [ThreatLevel.HIGH]: 5,
    [ThreatLevel.CRITICAL]: 1,
  },
  monitoringWindow: 900, // 15 minutes
  enableRealTimeAlerts: true,
  enableThreatDetection: true,
  suspiciousUserAgents: [
    'sqlmap',
    'nikto',
    'nmap',
    'masscan',
    'zap',
    'burp',
    'w3af',
    'skipfish',
  ],
  maxEventsPerWindow: 1000,
}

/**
 * Security Monitor Class
 */
export class SecurityMonitor {
  private config: SecurityMonitorConfig
  private redis = getRedisCache()
  private stats: SecurityStats = {
    eventsLogged: 0,
    threatsDetected: 0,
    alertsSent: 0,
    averageResponseTime: 0,
    blockedRequests: 0,
  }
  private alertQueue: SecurityAlert[] = []

  constructor(config: Partial<SecurityMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Log a security event
   */
  async logEvent(event: SecurityEvent): Promise<void> {
    const startTime = Date.now()

    try {
      this.validateEvent(event)
      this.stats.eventsLogged++

      // Store event in Redis with TTL
      const eventKey = `security_event:${event.source}:${Date.now()}`
      await this.redis.setObject(eventKey, event, this.config.monitoringWindow)

      // Log to audit system
      auditLogger.logSecurityEvent(
        event.userId || 'anonymous',
        event.type,
        event.source,
        event.details
      )

      // Check for immediate threats
      if (this.config.enableThreatDetection) {
        await this.checkForThreats(event)
      }

      // Send immediate alert for critical threats
      if (event.threatLevel === ThreatLevel.CRITICAL && this.config.enableRealTimeAlerts) {
        await this.sendImmediateAlert(event)
      }

      // Update performance stats
      const responseTime = Date.now() - startTime
      this.updateAverageResponseTime(responseTime)
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  /**
   * Detect threat patterns
   */
  async detectThreats(source: string): Promise<ThreatPattern[]> {
    try {
      const events = await this.getRecentEvents(source)
      const patterns: ThreatPattern[] = []

      // Detect brute force attacks
      const bruteForcePattern = this.detectBruteForce(events)
      if (bruteForcePattern) {
        patterns.push(bruteForcePattern)
      }

      // Detect SQL injection attempts
      const sqlInjectionPattern = this.detectSQLInjection(events)
      if (sqlInjectionPattern) {
        patterns.push(sqlInjectionPattern)
      }

      // Detect unusual access patterns
      const unusualAccessPattern = this.detectUnusualAccess(events)
      if (unusualAccessPattern) {
        patterns.push(unusualAccessPattern)
      }

      // Detect account takeover attempts
      const takeoverPattern = this.detectAccountTakeover(events)
      if (takeoverPattern) {
        patterns.push(takeoverPattern)
      }

      this.stats.threatsDetected += patterns.length
      return patterns
    } catch (error) {
      console.error('Error detecting threats:', error)
      return []
    }
  }

  /**
   * Send security alert
   */
  async sendAlert(alert: SecurityAlert): Promise<void> {
    try {
      this.stats.alertsSent++

      // In production, this would integrate with:
      // - Email notifications
      // - Slack/Teams webhooks
      // - PagerDuty/OpsGenie
      // - SMS alerts
      // - Security dashboard

      console.warn('SECURITY ALERT:', {
        id: alert.id,
        threatLevel: alert.threatLevel,
        message: alert.message,
        source: alert.source,
        priority: alert.priority,
        timestamp: alert.timestamp,
      })

      // Store alert for dashboard
      const alertKey = `security_alert:${alert.id}`
      await this.redis.setObject(alertKey, alert, 86400) // 24 hours

      // Rate limit alerts to prevent spam
      await this.rateLimit(`alert:${alert.source}`, 5, 300) // 5 alerts per 5 minutes
    } catch (error) {
      console.error('Error sending security alert:', error)
    }
  }

  /**
   * Process batched alerts
   */
  async processBatchedAlerts(): Promise<void> {
    if (this.alertQueue.length === 0) {
      return
    }

    try {
      // Group alerts by threat level and source
      const groupedAlerts = this.groupAlerts(this.alertQueue)

      for (const [key, alerts] of Object.entries(groupedAlerts)) {
        const batchAlert: SecurityAlert = {
          id: `batch_${Date.now()}_${key}`,
          threatLevel: alerts[0].threatLevel,
          message: `Batch alert: ${alerts.length} ${alerts[0].threatLevel} threats detected`,
          source: alerts[0].source,
          timestamp: new Date(),
          priority: this.getPriorityFromThreatLevel(alerts[0].threatLevel),
          context: {
            source: alerts[0].source,
            relatedEvents: alerts.flatMap(a => a.context.relatedEvents || []),
          },
        }

        await this.sendAlert(batchAlert)
      }

      // Clear the queue
      this.alertQueue = []
    } catch (error) {
      console.error('Error processing batched alerts:', error)
    }
  }

  /**
   * Get recent events for analysis
   */
  async getRecentEvents(source: string): Promise<SecurityEvent[]> {
    try {
      // In production, this would use Redis SCAN to get all matching keys
      // This is a simplified implementation
      const events: SecurityEvent[] = []
      
      // Mock implementation - in real scenario, scan Redis for events
      const eventKey = `security_events:${source}`
      const storedEvents = await this.redis.getObject<SecurityEvent[]>(eventKey)
      
      return storedEvents || []
    } catch (error) {
      console.error('Error getting recent events:', error)
      return []
    }
  }

  /**
   * Clean up old events
   */
  async cleanupOldEvents(): Promise<void> {
    try {
      // Remove events older than monitoring window
      // This would use Redis SCAN and TTL in production
      console.log('Cleaning up old security events')
    } catch (error) {
      console.error('Error cleaning up old events:', error)
    }
  }

  /**
   * Get security statistics
   */
  async getStats(): Promise<SecurityStats> {
    return { ...this.stats }
  }

  /**
   * Get configuration
   */
  getConfig(): SecurityMonitorConfig {
    return { ...this.config }
  }

  /**
   * Validate security event
   */
  private validateEvent(event: SecurityEvent): void {
    if (!event.type || !event.threatLevel || !event.source || !event.timestamp) {
      throw new Error('Invalid security event: missing required fields')
    }

    if (!Object.values(ThreatLevel).includes(event.threatLevel)) {
      throw new Error('Invalid threat level')
    }
  }

  /**
   * Check for immediate threats
   */
  private async checkForThreats(event: SecurityEvent): Promise<void> {
    const threats = await this.detectThreats(event.source)
    
    for (const threat of threats) {
      if (threat.threatLevel === ThreatLevel.HIGH || threat.threatLevel === ThreatLevel.CRITICAL) {
        await this.sendImmediateAlert(event, threat)
      }
    }
  }

  /**
   * Send immediate alert
   */
  private async sendImmediateAlert(event: SecurityEvent, threat?: ThreatPattern): Promise<void> {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${event.source}`,
      threatLevel: threat?.threatLevel || event.threatLevel,
      message: threat?.description || `${event.type} detected from ${event.source}`,
      source: event.source,
      timestamp: new Date(),
      priority: 'immediate',
      context: {
        source: event.source,
        userId: event.userId,
        details: event.details,
        relatedEvents: threat?.events || [event],
      },
    }

    await this.sendAlert(alert)
  }

  /**
   * Detect brute force attacks
   */
  private detectBruteForce(events: SecurityEvent[]): ThreatPattern | null {
    const failedLogins = events.filter(e => e.type === 'failed_login')
    
    if (failedLogins.length >= 5) {
      return {
        type: 'brute_force_attack',
        threatLevel: ThreatLevel.HIGH,
        confidence: Math.min(failedLogins.length / 10, 1),
        events: failedLogins,
        description: `Brute force attack detected: ${failedLogins.length} failed login attempts`,
      }
    }

    // Check for repeated failed logins
    if (failedLogins.length >= 3) {
      return {
        type: 'repeated_failed_login',
        threatLevel: ThreatLevel.MEDIUM,
        confidence: failedLogins.length / 5,
        events: failedLogins,
        description: `Repeated failed login attempts: ${failedLogins.length} attempts`,
      }
    }

    return null
  }

  /**
   * Detect SQL injection attempts
   */
  private detectSQLInjection(events: SecurityEvent[]): ThreatPattern | null {
    const sqlEvents = events.filter(e => e.type === 'sql_injection_attempt')
    
    if (sqlEvents.length > 0) {
      return {
        type: 'sql_injection_attempt',
        threatLevel: ThreatLevel.CRITICAL,
        confidence: 1,
        events: sqlEvents,
        description: 'SQL injection attempt detected',
      }
    }

    return null
  }

  /**
   * Detect unusual access patterns
   */
  private detectUnusualAccess(events: SecurityEvent[]): ThreatPattern | null {
    const accessEvents = events.filter(e => e.type === 'api_access')
    
    if (accessEvents.length > 50) {
      return {
        type: 'unusual_access_pattern',
        threatLevel: ThreatLevel.MEDIUM,
        confidence: Math.min(accessEvents.length / 100, 1),
        events: accessEvents,
        description: `Unusual access pattern: ${accessEvents.length} requests in short time`,
      }
    }

    return null
  }

  /**
   * Detect account takeover attempts
   */
  private detectAccountTakeover(events: SecurityEvent[]): ThreatPattern | null {
    const loginEvents = events.filter(e => e.type === 'login_success')
    const passwordChanges = events.filter(e => e.type === 'password_change')
    
    if (loginEvents.length > 0 && passwordChanges.length > 0) {
      // Check if login and password change happened from different IPs
      const loginSources = new Set(loginEvents.map(e => e.source))
      const changeSources = new Set(passwordChanges.map(e => e.source))
      
      const hasOverlap = [...loginSources].some(source => changeSources.has(source))
      
      if (!hasOverlap) {
        return {
          type: 'account_takeover_attempt',
          threatLevel: ThreatLevel.HIGH,
          confidence: 0.8,
          events: [...loginEvents, ...passwordChanges],
          description: 'Potential account takeover: login and password change from different sources',
        }
      }
    }

    return null
  }

  /**
   * Group alerts for batching
   */
  private groupAlerts(alerts: SecurityAlert[]): Record<string, SecurityAlert[]> {
    return alerts.reduce((groups, alert) => {
      const key = `${alert.threatLevel}_${alert.source}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(alert)
      return groups
    }, {} as Record<string, SecurityAlert[]>)
  }

  /**
   * Get priority from threat level
   */
  private getPriorityFromThreatLevel(threatLevel: ThreatLevel): SecurityAlert['priority'] {
    switch (threatLevel) {
      case ThreatLevel.CRITICAL:
        return 'immediate'
      case ThreatLevel.HIGH:
        return 'high'
      case ThreatLevel.MEDIUM:
        return 'medium'
      case ThreatLevel.LOW:
        return 'low'
      default:
        return 'low'
    }
  }

  /**
   * Rate limit alerts
   */
  private async rateLimit(key: string, limit: number, window: number): Promise<boolean> {
    try {
      const count = await this.redis.incrementRateLimit(key, window)
      return count <= limit
    } catch (error) {
      console.error('Error in rate limiting:', error)
      return true // Fail open
    }
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    const totalEvents = this.stats.eventsLogged
    const currentAverage = this.stats.averageResponseTime
    
    this.stats.averageResponseTime = 
      (currentAverage * (totalEvents - 1) + responseTime) / totalEvents
  }
}

/**
 * Create security monitoring middleware
 */
export function createSecurityMiddleware(
  config: Partial<SecurityMonitorConfig> = {}
): (request: NextRequest) => Promise<NextResponse | undefined> {
  const monitor = new SecurityMonitor(config)

  return async (request: NextRequest): Promise<NextResponse | undefined> => {
    try {
      const source = getClientIP(request)
      const userAgent = request.headers.get('user-agent') || ''

      // Check blocked IPs
      if (config.blockedIPs?.includes(source)) {
        monitor.stats.blockedRequests++
        
        await monitor.logEvent({
          type: 'blocked_ip_access',
          threatLevel: ThreatLevel.HIGH,
          source,
          details: { userAgent, url: request.url },
          timestamp: new Date(),
        })

        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      // Check suspicious user agents
      const suspiciousUA = config.suspiciousUserAgents?.some(ua => 
        userAgent.toLowerCase().includes(ua.toLowerCase())
      )

      if (suspiciousUA) {
        await monitor.logEvent({
          type: 'malicious_user_agent',
          threatLevel: ThreatLevel.HIGH,
          source,
          details: { userAgent, url: request.url },
          timestamp: new Date(),
        })
      }

      // Monitor for SQL injection in query parameters
      const url = new URL(request.url)
      const queryString = url.search
      
      if (containsSQLInjection(queryString)) {
        await monitor.logEvent({
          type: 'sql_injection_attempt',
          threatLevel: ThreatLevel.CRITICAL,
          source,
          details: { query: queryString, userAgent },
          timestamp: new Date(),
        })
      }

      // Monitor for XSS attempts
      if (request.method === 'POST') {
        try {
          const body = await request.clone().text()
          if (containsXSS(body)) {
            await monitor.logEvent({
              type: 'xss_attempt',
              threatLevel: ThreatLevel.HIGH,
              source,
              details: { body: body.substring(0, 500), userAgent },
              timestamp: new Date(),
            })
          }
        } catch (error) {
          // Ignore body parsing errors
        }
      }

      // Log normal request
      await monitor.logEvent({
        type: 'api_access',
        threatLevel: ThreatLevel.LOW,
        source,
        details: { 
          method: request.method,
          url: request.url,
          userAgent 
        },
        timestamp: new Date(),
      })

      return undefined // Continue processing
    } catch (error) {
      console.error('Security middleware error:', error)
      return undefined // Fail open
    }
  }
}

/**
 * Utility functions
 */

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.ip ||
    'unknown'
  )
}

function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\'|\"|;|--|\*|\|)/,
    /(\bOR\b|\bAND\b).*(\=|\<|\>)/i,
  ]

  return sqlPatterns.some(pattern => pattern.test(input))
}

function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

// Singleton instance
let securityMonitorInstance: SecurityMonitor | null = null

export function getSecurityMonitor(config?: Partial<SecurityMonitorConfig>): SecurityMonitor {
  if (!securityMonitorInstance) {
    securityMonitorInstance = new SecurityMonitor(config)
  }
  return securityMonitorInstance
}