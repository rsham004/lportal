import { AuditLogger, AuditEvent, AuditAction, createAuditEvent, logSecurityEvent } from './audit'

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('Audit Logging System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('AuditEvent Creation', () => {
    it('creates audit event with required fields', () => {
      const event = createAuditEvent({
        action: AuditAction.LOGIN,
        userId: 'user_123',
        resource: 'authentication',
        details: { method: 'email' }
      })

      expect(event.id).toBeDefined()
      expect(event.timestamp).toBeInstanceOf(Date)
      expect(event.action).toBe(AuditAction.LOGIN)
      expect(event.userId).toBe('user_123')
      expect(event.resource).toBe('authentication')
      expect(event.details).toEqual({ method: 'email' })
      expect(event.severity).toBe('info')
    })

    it('creates audit event with custom severity', () => {
      const event = createAuditEvent({
        action: AuditAction.ACCESS_DENIED,
        userId: 'user_123',
        resource: 'course',
        severity: 'warning'
      })

      expect(event.severity).toBe('warning')
    })

    it('creates audit event with IP address and user agent', () => {
      const event = createAuditEvent({
        action: AuditAction.LOGIN,
        userId: 'user_123',
        resource: 'authentication',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })

      expect(event.ipAddress).toBe('192.168.1.1')
      expect(event.userAgent).toBe('Mozilla/5.0')
    })
  })

  describe('AuditLogger', () => {
    let logger: AuditLogger

    beforeEach(() => {
      logger = new AuditLogger()
    })

    it('logs audit events', () => {
      const event = createAuditEvent({
        action: AuditAction.LOGIN,
        userId: 'user_123',
        resource: 'authentication'
      })

      logger.log(event)

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('LOGIN'),
        expect.stringContaining('user_123')
      )
    })

    it('logs warning events with console.warn', () => {
      const event = createAuditEvent({
        action: AuditAction.ACCESS_DENIED,
        userId: 'user_123',
        resource: 'course',
        severity: 'warning'
      })

      logger.log(event)

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('ACCESS_DENIED'),
        expect.stringContaining('user_123')
      )
    })

    it('logs error events with console.error', () => {
      const event = createAuditEvent({
        action: AuditAction.SECURITY_VIOLATION,
        userId: 'user_123',
        resource: 'system',
        severity: 'error'
      })

      logger.log(event)

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('SECURITY_VIOLATION'),
        expect.stringContaining('user_123')
      )
    })

    it('stores events in memory', () => {
      const event1 = createAuditEvent({
        action: AuditAction.LOGIN,
        userId: 'user_123',
        resource: 'authentication'
      })

      const event2 = createAuditEvent({
        action: AuditAction.LOGOUT,
        userId: 'user_123',
        resource: 'authentication'
      })

      logger.log(event1)
      logger.log(event2)

      const events = logger.getEvents()
      expect(events).toHaveLength(2)
      expect(events[0]).toEqual(event1)
      expect(events[1]).toEqual(event2)
    })

    it('limits stored events to maximum count', () => {
      const logger = new AuditLogger({ maxEvents: 2 })

      for (let i = 0; i < 5; i++) {
        const event = createAuditEvent({
          action: AuditAction.LOGIN,
          userId: `user_${i}`,
          resource: 'authentication'
        })
        logger.log(event)
      }

      const events = logger.getEvents()
      expect(events).toHaveLength(2)
      expect(events[0].userId).toBe('user_3')
      expect(events[1].userId).toBe('user_4')
    })

    it('filters events by user ID', () => {
      const event1 = createAuditEvent({
        action: AuditAction.LOGIN,
        userId: 'user_123',
        resource: 'authentication'
      })

      const event2 = createAuditEvent({
        action: AuditAction.LOGIN,
        userId: 'user_456',
        resource: 'authentication'
      })

      logger.log(event1)
      logger.log(event2)

      const userEvents = logger.getEventsByUser('user_123')
      expect(userEvents).toHaveLength(1)
      expect(userEvents[0].userId).toBe('user_123')
    })

    it('filters events by action', () => {
      const event1 = createAuditEvent({
        action: AuditAction.LOGIN,
        userId: 'user_123',
        resource: 'authentication'
      })

      const event2 = createAuditEvent({
        action: AuditAction.LOGOUT,
        userId: 'user_123',
        resource: 'authentication'
      })

      logger.log(event1)
      logger.log(event2)

      const loginEvents = logger.getEventsByAction(AuditAction.LOGIN)
      expect(loginEvents).toHaveLength(1)
      expect(loginEvents[0].action).toBe(AuditAction.LOGIN)
    })

    it('filters events by date range', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      jest.setSystemTime(yesterday)
      const oldEvent = createAuditEvent({
        action: AuditAction.LOGIN,
        userId: 'user_123',
        resource: 'authentication'
      })
      logger.log(oldEvent)

      jest.setSystemTime(now)
      const newEvent = createAuditEvent({
        action: AuditAction.LOGIN,
        userId: 'user_456',
        resource: 'authentication'
      })
      logger.log(newEvent)

      const recentEvents = logger.getEventsByDateRange(
        new Date(now.getTime() - 1000),
        tomorrow
      )
      expect(recentEvents).toHaveLength(1)
      expect(recentEvents[0].userId).toBe('user_456')
    })
  })

  describe('Security Event Logging', () => {
    it('logs security events with high severity', () => {
      logSecurityEvent({
        action: AuditAction.SECURITY_VIOLATION,
        userId: 'user_123',
        resource: 'system',
        details: { violation: 'unauthorized_access' }
      })

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('SECURITY_VIOLATION'),
        expect.stringContaining('user_123')
      )
    })

    it('logs access denied events', () => {
      logSecurityEvent({
        action: AuditAction.ACCESS_DENIED,
        userId: 'user_123',
        resource: 'course',
        details: { courseId: 'course_456' }
      })

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('ACCESS_DENIED'),
        expect.stringContaining('user_123')
      )
    })
  })

  describe('AuditAction enum', () => {
    it('defines all required audit actions', () => {
      expect(AuditAction.LOGIN).toBe('login')
      expect(AuditAction.LOGOUT).toBe('logout')
      expect(AuditAction.ACCESS_DENIED).toBe('access_denied')
      expect(AuditAction.PERMISSION_GRANTED).toBe('permission_granted')
      expect(AuditAction.ROLE_CHANGED).toBe('role_changed')
      expect(AuditAction.RESOURCE_CREATED).toBe('resource_created')
      expect(AuditAction.RESOURCE_UPDATED).toBe('resource_updated')
      expect(AuditAction.RESOURCE_DELETED).toBe('resource_deleted')
      expect(AuditAction.SECURITY_VIOLATION).toBe('security_violation')
    })
  })
})