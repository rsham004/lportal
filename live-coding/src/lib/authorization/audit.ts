/**
 * Audit Logging System
 * 
 * Provides comprehensive audit logging for security events and user actions.
 * Tracks authentication, authorization, and resource access events.
 */

export enum AuditAction {
  // Authentication events
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  
  // Authorization events
  ACCESS_DENIED = 'access_denied',
  PERMISSION_GRANTED = 'permission_granted',
  ROLE_CHANGED = 'role_changed',
  
  // Resource events
  RESOURCE_CREATED = 'resource_created',
  RESOURCE_UPDATED = 'resource_updated',
  RESOURCE_DELETED = 'resource_deleted',
  RESOURCE_ACCESSED = 'resource_accessed',
  
  // Security events
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
}

export interface AuditEvent {
  id: string
  timestamp: Date
  action: AuditAction
  userId?: string
  userRole?: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  severity: 'info' | 'warning' | 'error'
  sessionId?: string
}

export interface AuditEventInput {
  action: AuditAction
  userId?: string
  userRole?: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  severity?: 'info' | 'warning' | 'error'
  sessionId?: string
}

/**
 * Create a new audit event
 */
export function createAuditEvent(input: AuditEventInput): AuditEvent {
  return {
    id: generateEventId(),
    timestamp: new Date(),
    severity: 'info',
    ...input,
  }
}

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Audit Logger Class
 */
export class AuditLogger {
  private events: AuditEvent[] = []
  private maxEvents: number
  private enableConsoleLogging: boolean

  constructor(options: { maxEvents?: number; enableConsoleLogging?: boolean } = {}) {
    this.maxEvents = options.maxEvents || 1000
    this.enableConsoleLogging = options.enableConsoleLogging !== false
  }

  /**
   * Log an audit event
   */
  log(event: AuditEvent): void {
    // Add to in-memory storage
    this.events.push(event)
    
    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Console logging
    if (this.enableConsoleLogging) {
      this.logToConsole(event)
    }

    // In a real application, you would also:
    // - Send to external logging service
    // - Store in database
    // - Send alerts for critical events
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(event: AuditEvent): void {
    const message = this.formatEventMessage(event)
    
    switch (event.severity) {
      case 'error':
        console.error('[AUDIT]', message, event)
        break
      case 'warning':
        console.warn('[AUDIT]', message, event)
        break
      default:
        console.log('[AUDIT]', message, event)
        break
    }
  }

  /**
   * Format event message for logging
   */
  private formatEventMessage(event: AuditEvent): string {
    const parts = [
      event.action.toUpperCase(),
      event.userId ? `user:${event.userId}` : 'anonymous',
      `resource:${event.resource}`,
      event.resourceId ? `id:${event.resourceId}` : null,
    ].filter(Boolean)

    return parts.join(' | ')
  }

  /**
   * Get all events
   */
  getEvents(): AuditEvent[] {
    return [...this.events]
  }

  /**
   * Get events by user ID
   */
  getEventsByUser(userId: string): AuditEvent[] {
    return this.events.filter(event => event.userId === userId)
  }

  /**
   * Get events by action
   */
  getEventsByAction(action: AuditAction): AuditEvent[] {
    return this.events.filter(event => event.action === action)
  }

  /**
   * Get events by resource
   */
  getEventsByResource(resource: string): AuditEvent[] {
    return this.events.filter(event => event.resource === resource)
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity: 'info' | 'warning' | 'error'): AuditEvent[] {
    return this.events.filter(event => event.severity === severity)
  }

  /**
   * Get events within date range
   */
  getEventsByDateRange(startDate: Date, endDate: Date): AuditEvent[] {
    return this.events.filter(
      event => event.timestamp >= startDate && event.timestamp <= endDate
    )
  }

  /**
   * Get security events (warnings and errors)
   */
  getSecurityEvents(): AuditEvent[] {
    return this.events.filter(
      event => event.severity === 'warning' || event.severity === 'error'
    )
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = []
  }
}

// Global audit logger instance
const globalAuditLogger = new AuditLogger()

/**
 * Log an audit event using the global logger
 */
export function logAuditEvent(input: AuditEventInput): void {
  const event = createAuditEvent(input)
  globalAuditLogger.log(event)
}

/**
 * Log a security event with appropriate severity
 */
export function logSecurityEvent(input: Omit<AuditEventInput, 'severity'>): void {
  const severity = getSecurityEventSeverity(input.action)
  logAuditEvent({ ...input, severity })
}

/**
 * Determine severity for security events
 */
function getSecurityEventSeverity(action: AuditAction): 'warning' | 'error' {
  const errorActions = [
    AuditAction.SECURITY_VIOLATION,
    AuditAction.LOGIN_FAILED,
  ]

  return errorActions.includes(action) ? 'error' : 'warning'
}

/**
 * Get the global audit logger instance
 */
export function getAuditLogger(): AuditLogger {
  return globalAuditLogger
}

/**
 * Helper functions for common audit events
 */
export const auditHelpers = {
  logLogin: (userId: string, details?: Record<string, any>) => {
    logAuditEvent({
      action: AuditAction.LOGIN,
      userId,
      resource: 'authentication',
      details,
    })
  },

  logLogout: (userId: string, details?: Record<string, any>) => {
    logAuditEvent({
      action: AuditAction.LOGOUT,
      userId,
      resource: 'authentication',
      details,
    })
  },

  logAccessDenied: (userId: string, resource: string, resourceId?: string, details?: Record<string, any>) => {
    logSecurityEvent({
      action: AuditAction.ACCESS_DENIED,
      userId,
      resource,
      resourceId,
      details,
    })
  },

  logPermissionGranted: (userId: string, resource: string, resourceId?: string, details?: Record<string, any>) => {
    logAuditEvent({
      action: AuditAction.PERMISSION_GRANTED,
      userId,
      resource,
      resourceId,
      details,
    })
  },

  logRoleChanged: (userId: string, oldRole: string, newRole: string, changedBy?: string) => {
    logAuditEvent({
      action: AuditAction.ROLE_CHANGED,
      userId,
      resource: 'user_role',
      details: { oldRole, newRole, changedBy },
      severity: 'warning',
    })
  },

  logResourceAccess: (userId: string, resource: string, resourceId: string, action: string) => {
    logAuditEvent({
      action: AuditAction.RESOURCE_ACCESSED,
      userId,
      resource,
      resourceId,
      details: { action },
    })
  },
}