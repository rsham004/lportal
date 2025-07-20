/**
 * Redis Cache Test
 * 
 * TDD tests for Redis caching functionality including session storage,
 * data caching, and integration with authentication system.
 */

import { RedisCache } from './redis-cache'
import { UserRole } from '../authorization/roles'

// Mock Redis client
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  flushall: jest.fn(),
  quit: jest.fn(),
  ping: jest.fn(),
  hget: jest.fn(),
  hset: jest.fn(),
  hdel: jest.fn(),
  hgetall: jest.fn(),
  sadd: jest.fn(),
  srem: jest.fn(),
  smembers: jest.fn(),
  incr: jest.fn(),
  decr: jest.fn(),
}

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}))

describe('RedisCache', () => {
  let redisCache: RedisCache

  beforeEach(() => {
    jest.clearAllMocks()
    redisCache = new RedisCache()
  })

  afterEach(async () => {
    await redisCache.disconnect()
  })

  describe('Connection Management', () => {
    it('connects to Redis successfully', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')

      const isConnected = await redisCache.connect()

      expect(isConnected).toBe(true)
      expect(mockRedisClient.ping).toHaveBeenCalled()
    })

    it('handles connection failures gracefully', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Connection failed'))

      const isConnected = await redisCache.connect()

      expect(isConnected).toBe(false)
    })

    it('disconnects from Redis properly', async () => {
      mockRedisClient.quit.mockResolvedValue('OK')

      await redisCache.disconnect()

      expect(mockRedisClient.quit).toHaveBeenCalled()
    })

    it('checks connection health', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')

      const isHealthy = await redisCache.isHealthy()

      expect(isHealthy).toBe(true)
      expect(mockRedisClient.ping).toHaveBeenCalled()
    })
  })

  describe('Basic Cache Operations', () => {
    beforeEach(async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')
      await redisCache.connect()
    })

    it('sets and gets string values', async () => {
      const key = 'test:key'
      const value = 'test value'

      mockRedisClient.set.mockResolvedValue('OK')
      mockRedisClient.get.mockResolvedValue(value)

      await redisCache.set(key, value)
      const result = await redisCache.get(key)

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value, { EX: 3600 })
      expect(result).toBe(value)
    })

    it('sets values with custom TTL', async () => {
      const key = 'test:key'
      const value = 'test value'
      const ttl = 1800

      mockRedisClient.set.mockResolvedValue('OK')

      await redisCache.set(key, value, ttl)

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value, { EX: ttl })
    })

    it('sets and gets JSON objects', async () => {
      const key = 'test:object'
      const value = { id: '123', name: 'Test User', role: UserRole.STUDENT }
      const serializedValue = JSON.stringify(value)

      mockRedisClient.set.mockResolvedValue('OK')
      mockRedisClient.get.mockResolvedValue(serializedValue)

      await redisCache.setObject(key, value)
      const result = await redisCache.getObject(key)

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, serializedValue, { EX: 3600 })
      expect(result).toEqual(value)
    })

    it('returns null for non-existent keys', async () => {
      mockRedisClient.get.mockResolvedValue(null)

      const result = await redisCache.get('non:existent')

      expect(result).toBeNull()
    })

    it('deletes keys successfully', async () => {
      const key = 'test:delete'

      mockRedisClient.del.mockResolvedValue(1)

      const deleted = await redisCache.delete(key)

      expect(deleted).toBe(true)
      expect(mockRedisClient.del).toHaveBeenCalledWith(key)
    })

    it('checks if keys exist', async () => {
      const key = 'test:exists'

      mockRedisClient.exists.mockResolvedValue(1)

      const exists = await redisCache.exists(key)

      expect(exists).toBe(true)
      expect(mockRedisClient.exists).toHaveBeenCalledWith(key)
    })

    it('gets TTL for keys', async () => {
      const key = 'test:ttl'
      const ttl = 1800

      mockRedisClient.ttl.mockResolvedValue(ttl)

      const result = await redisCache.getTTL(key)

      expect(result).toBe(ttl)
      expect(mockRedisClient.ttl).toHaveBeenCalledWith(key)
    })
  })

  describe('Session Management', () => {
    beforeEach(async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')
      await redisCache.connect()
    })

    it('stores session data', async () => {
      const sessionId = 'session_123'
      const sessionData = {
        userId: 'user_456',
        role: UserRole.STUDENT,
        loginTime: new Date().toISOString(),
        ipAddress: '192.168.1.100',
      }

      mockRedisClient.hset.mockResolvedValue(1)

      await redisCache.setSession(sessionId, sessionData)

      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        `session:${sessionId}`,
        expect.objectContaining({
          userId: sessionData.userId,
          role: sessionData.role,
          loginTime: sessionData.loginTime,
          ipAddress: sessionData.ipAddress,
        })
      )
    })

    it('retrieves session data', async () => {
      const sessionId = 'session_123'
      const sessionData = {
        userId: 'user_456',
        role: UserRole.STUDENT,
        loginTime: new Date().toISOString(),
        ipAddress: '192.168.1.100',
      }

      mockRedisClient.hgetall.mockResolvedValue(sessionData)

      const result = await redisCache.getSession(sessionId)

      expect(result).toEqual(sessionData)
      expect(mockRedisClient.hgetall).toHaveBeenCalledWith(`session:${sessionId}`)
    })

    it('deletes session data', async () => {
      const sessionId = 'session_123'

      mockRedisClient.del.mockResolvedValue(1)

      const deleted = await redisCache.deleteSession(sessionId)

      expect(deleted).toBe(true)
      expect(mockRedisClient.del).toHaveBeenCalledWith(`session:${sessionId}`)
    })

    it('extends session expiry', async () => {
      const sessionId = 'session_123'
      const ttl = 7200

      mockRedisClient.expire.mockResolvedValue(1)

      await redisCache.extendSession(sessionId, ttl)

      expect(mockRedisClient.expire).toHaveBeenCalledWith(`session:${sessionId}`, ttl)
    })

    it('gets all active sessions for a user', async () => {
      const userId = 'user_456'
      const sessionIds = ['session_123', 'session_456']

      mockRedisClient.smembers.mockResolvedValue(sessionIds)

      const result = await redisCache.getUserSessions(userId)

      expect(result).toEqual(sessionIds)
      expect(mockRedisClient.smembers).toHaveBeenCalledWith(`user_sessions:${userId}`)
    })

    it('adds session to user session set', async () => {
      const userId = 'user_456'
      const sessionId = 'session_123'

      mockRedisClient.sadd.mockResolvedValue(1)

      await redisCache.addUserSession(userId, sessionId)

      expect(mockRedisClient.sadd).toHaveBeenCalledWith(`user_sessions:${userId}`, sessionId)
    })

    it('removes session from user session set', async () => {
      const userId = 'user_456'
      const sessionId = 'session_123'

      mockRedisClient.srem.mockResolvedValue(1)

      await redisCache.removeUserSession(userId, sessionId)

      expect(mockRedisClient.srem).toHaveBeenCalledWith(`user_sessions:${userId}`, sessionId)
    })
  })

  describe('Rate Limiting', () => {
    beforeEach(async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')
      await redisCache.connect()
    })

    it('increments rate limit counter', async () => {
      const key = 'rate_limit:192.168.1.100'
      const currentCount = 5

      mockRedisClient.incr.mockResolvedValue(currentCount)
      mockRedisClient.expire.mockResolvedValue(1)

      const count = await redisCache.incrementRateLimit(key, 60)

      expect(count).toBe(currentCount)
      expect(mockRedisClient.incr).toHaveBeenCalledWith(key)
      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, 60)
    })

    it('gets current rate limit count', async () => {
      const key = 'rate_limit:192.168.1.100'
      const count = 3

      mockRedisClient.get.mockResolvedValue(count.toString())

      const result = await redisCache.getRateLimitCount(key)

      expect(result).toBe(count)
      expect(mockRedisClient.get).toHaveBeenCalledWith(key)
    })

    it('returns 0 for non-existent rate limit keys', async () => {
      const key = 'rate_limit:new_ip'

      mockRedisClient.get.mockResolvedValue(null)

      const result = await redisCache.getRateLimitCount(key)

      expect(result).toBe(0)
    })

    it('resets rate limit counter', async () => {
      const key = 'rate_limit:192.168.1.100'

      mockRedisClient.del.mockResolvedValue(1)

      await redisCache.resetRateLimit(key)

      expect(mockRedisClient.del).toHaveBeenCalledWith(key)
    })
  })

  describe('Cache Invalidation', () => {
    beforeEach(async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')
      await redisCache.connect()
    })

    it('invalidates cache by pattern', async () => {
      const pattern = 'user:*'
      const keys = ['user:123', 'user:456', 'user:789']

      // Mock Redis SCAN operation (simplified)
      mockRedisClient.del.mockResolvedValue(keys.length)

      const deletedCount = await redisCache.invalidatePattern(pattern)

      expect(deletedCount).toBe(keys.length)
    })

    it('clears all cache data', async () => {
      mockRedisClient.flushall.mockResolvedValue('OK')

      await redisCache.clearAll()

      expect(mockRedisClient.flushall).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')
      await redisCache.connect()
    })

    it('handles Redis operation failures gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'))

      const result = await redisCache.get('test:key')

      expect(result).toBeNull()
    })

    it('handles JSON parsing errors', async () => {
      mockRedisClient.get.mockResolvedValue('invalid json')

      const result = await redisCache.getObject('test:object')

      expect(result).toBeNull()
    })

    it('handles session operation failures', async () => {
      mockRedisClient.hgetall.mockRejectedValue(new Error('Redis error'))

      const result = await redisCache.getSession('session_123')

      expect(result).toBeNull()
    })
  })

  describe('Performance and Monitoring', () => {
    beforeEach(async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')
      await redisCache.connect()
    })

    it('measures operation latency', async () => {
      mockRedisClient.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('value'), 10))
      )

      const startTime = Date.now()
      await redisCache.get('test:key')
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(10)
    })

    it('provides cache statistics', async () => {
      const stats = await redisCache.getStats()

      expect(stats).toHaveProperty('connected')
      expect(stats).toHaveProperty('operations')
      expect(stats).toHaveProperty('errors')
    })
  })

  describe('Integration with Authentication', () => {
    beforeEach(async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')
      await redisCache.connect()
    })

    it('caches user authentication data', async () => {
      const userId = 'user_123'
      const authData = {
        id: userId,
        role: UserRole.STUDENT,
        permissions: ['read_courses', 'submit_assignments'],
        lastLogin: new Date().toISOString(),
      }

      mockRedisClient.set.mockResolvedValue('OK')
      mockRedisClient.get.mockResolvedValue(JSON.stringify(authData))

      await redisCache.cacheUserAuth(userId, authData)
      const result = await redisCache.getUserAuth(userId)

      expect(result).toEqual(authData)
    })

    it('invalidates user cache on role change', async () => {
      const userId = 'user_123'

      mockRedisClient.del.mockResolvedValue(1)

      await redisCache.invalidateUserCache(userId)

      expect(mockRedisClient.del).toHaveBeenCalledWith(`user_auth:${userId}`)
    })
  })
})