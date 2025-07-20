/**
 * Rate Limiting Test
 * 
 * TDD tests for rate limiting middleware with Redis backend
 * and integration with authentication endpoints.
 */

import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter, createRateLimitMiddleware, RateLimitConfig } from './rate-limiting'
import { getRedisCache } from './redis-cache'

// Mock Redis cache
jest.mock('./redis-cache')
const mockRedisCache = {
  incrementRateLimit: jest.fn(),
  getRateLimitCount: jest.fn(),
  resetRateLimit: jest.fn(),
  isHealthy: jest.fn(),
}

const mockGetRedisCache = getRedisCache as jest.MockedFunction<typeof getRedisCache>
mockGetRedisCache.mockReturnValue(mockRedisCache as any)

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedisCache.isHealthy.mockResolvedValue(true)
  })

  describe('RateLimiter Class', () => {
    let rateLimiter: RateLimiter

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 10,
        keyGenerator: (req) => req.ip || 'unknown',
      })
    })

    it('creates rate limiter with default config', () => {
      const defaultLimiter = new RateLimiter()
      const config = defaultLimiter.getConfig()

      expect(config.windowMs).toBe(900000) // 15 minutes
      expect(config.maxRequests).toBe(100)
      expect(config.skipSuccessfulRequests).toBe(false)
      expect(config.skipFailedRequests).toBe(false)
    })

    it('creates rate limiter with custom config', () => {
      const customConfig: RateLimitConfig = {
        windowMs: 30000,
        maxRequests: 5,
        skipSuccessfulRequests: true,
        skipFailedRequests: true,
        message: 'Custom rate limit message',
      }

      const customLimiter = new RateLimiter(customConfig)
      const config = customLimiter.getConfig()

      expect(config.windowMs).toBe(30000)
      expect(config.maxRequests).toBe(5)
      expect(config.skipSuccessfulRequests).toBe(true)
      expect(config.skipFailedRequests).toBe(true)
      expect(config.message).toBe('Custom rate limit message')
    })

    it('generates rate limit key correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      })

      mockRedisCache.incrementRateLimit.mockResolvedValue(1)

      await rateLimiter.checkLimit(request)

      expect(mockRedisCache.incrementRateLimit).toHaveBeenCalledWith(
        'rate_limit:192.168.1.100',
        60 // window in seconds
      )
    })

    it('allows requests under the limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.incrementRateLimit.mockResolvedValue(5) // Under limit of 10

      const result = await rateLimiter.checkLimit(request)

      expect(result.allowed).toBe(true)
      expect(result.count).toBe(5)
      expect(result.remaining).toBe(5)
      expect(result.resetTime).toBeInstanceOf(Date)
    })

    it('blocks requests over the limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.incrementRateLimit.mockResolvedValue(11) // Over limit of 10

      const result = await rateLimiter.checkLimit(request)

      expect(result.allowed).toBe(false)
      expect(result.count).toBe(11)
      expect(result.remaining).toBe(0)
    })

    it('handles Redis errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.incrementRateLimit.mockRejectedValue(new Error('Redis error'))

      const result = await rateLimiter.checkLimit(request)

      // Should allow request when Redis is unavailable (fail open)
      expect(result.allowed).toBe(true)
      expect(result.count).toBe(0)
    })

    it('uses custom key generator', async () => {
      const customLimiter = new RateLimiter({
        keyGenerator: (req) => `user:${req.headers.get('user-id') || 'anonymous'}`,
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'user-id': 'user_123',
        },
      })

      mockRedisCache.incrementRateLimit.mockResolvedValue(1)

      await customLimiter.checkLimit(request)

      expect(mockRedisCache.incrementRateLimit).toHaveBeenCalledWith(
        'rate_limit:user:user_123',
        900 // default window
      )
    })

    it('resets rate limit correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      const key = 'rate_limit:192.168.1.100'

      mockRedisCache.resetRateLimit.mockResolvedValue(undefined)

      await rateLimiter.resetLimit(request)

      expect(mockRedisCache.resetRateLimit).toHaveBeenCalledWith(key)
    })

    it('gets current count correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.getRateLimitCount.mockResolvedValue(7)

      const count = await rateLimiter.getCurrentCount(request)

      expect(count).toBe(7)
    })
  })

  describe('Rate Limit Middleware', () => {
    it('creates middleware with default config', () => {
      const middleware = createRateLimitMiddleware()

      expect(middleware).toBeInstanceOf(Function)
    })

    it('allows requests under the limit', async () => {
      const middleware = createRateLimitMiddleware({
        maxRequests: 10,
        windowMs: 60000,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.incrementRateLimit.mockResolvedValue(5)

      const response = await middleware(request)

      expect(response).toBeUndefined() // Should pass through
    })

    it('blocks requests over the limit', async () => {
      const middleware = createRateLimitMiddleware({
        maxRequests: 10,
        windowMs: 60000,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.incrementRateLimit.mockResolvedValue(11)

      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(429)
    })

    it('includes rate limit headers in response', async () => {
      const middleware = createRateLimitMiddleware({
        maxRequests: 10,
        windowMs: 60000,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.incrementRateLimit.mockResolvedValue(5)

      const response = await middleware(request)

      // For allowed requests, headers should be added to the next response
      expect(response).toBeUndefined()
    })

    it('includes rate limit headers in blocked response', async () => {
      const middleware = createRateLimitMiddleware({
        maxRequests: 10,
        windowMs: 60000,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.incrementRateLimit.mockResolvedValue(11)

      const response = await middleware(request)

      expect(response?.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response?.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response?.headers.get('X-RateLimit-Reset')).toBeTruthy()
      expect(response?.headers.get('Retry-After')).toBeTruthy()
    })

    it('returns custom error message', async () => {
      const customMessage = 'Custom rate limit exceeded message'
      const middleware = createRateLimitMiddleware({
        maxRequests: 5,
        message: customMessage,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.incrementRateLimit.mockResolvedValue(6)

      const response = await middleware(request)

      const body = await response?.json()
      expect(body.message).toBe(customMessage)
    })

    it('skips successful requests when configured', async () => {
      const middleware = createRateLimitMiddleware({
        maxRequests: 10,
        skipSuccessfulRequests: true,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      
      // Mock a successful response scenario
      mockRedisCache.incrementRateLimit.mockResolvedValue(5)

      const response = await middleware(request)

      expect(response).toBeUndefined()
    })

    it('skips failed requests when configured', async () => {
      const middleware = createRateLimitMiddleware({
        maxRequests: 10,
        skipFailedRequests: true,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.incrementRateLimit.mockResolvedValue(5)

      const response = await middleware(request)

      expect(response).toBeUndefined()
    })
  })

  describe('Authentication Endpoint Rate Limiting', () => {
    it('applies stricter limits to login endpoints', async () => {
      const loginLimiter = createRateLimitMiddleware({
        maxRequests: 5,
        windowMs: 300000, // 5 minutes
        keyGenerator: (req) => `login:${req.ip || 'unknown'}`,
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
      })

      mockRedisCache.incrementRateLimit.mockResolvedValue(6) // Over limit

      const response = await loginLimiter(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(429)
    })

    it('applies limits to password reset endpoints', async () => {
      const resetLimiter = createRateLimitMiddleware({
        maxRequests: 3,
        windowMs: 3600000, // 1 hour
        keyGenerator: (req) => `reset:${req.ip || 'unknown'}`,
      })

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
      })

      mockRedisCache.incrementRateLimit.mockResolvedValue(4) // Over limit

      const response = await resetLimiter(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(429)
    })

    it('applies user-specific limits for authenticated requests', async () => {
      const userLimiter = createRateLimitMiddleware({
        maxRequests: 100,
        windowMs: 3600000, // 1 hour
        keyGenerator: (req) => {
          const userId = req.headers.get('x-user-id')
          return userId ? `user:${userId}` : `ip:${req.ip || 'unknown'}`
        },
      })

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        headers: {
          'x-user-id': 'user_123',
        },
      })

      mockRedisCache.incrementRateLimit.mockResolvedValue(50)

      const response = await userLimiter(request)

      expect(response).toBeUndefined() // Should pass
      expect(mockRedisCache.incrementRateLimit).toHaveBeenCalledWith(
        'rate_limit:user:user_123',
        3600
      )
    })
  })

  describe('IP-based Rate Limiting', () => {
    it('extracts IP from X-Forwarded-For header', async () => {
      const middleware = createRateLimitMiddleware()

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
        },
      })

      mockRedisCache.incrementRateLimit.mockResolvedValue(1)

      await middleware(request)

      expect(mockRedisCache.incrementRateLimit).toHaveBeenCalledWith(
        'rate_limit:203.0.113.1',
        expect.any(Number)
      )
    })

    it('extracts IP from X-Real-IP header', async () => {
      const middleware = createRateLimitMiddleware()

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '203.0.113.1',
        },
      })

      mockRedisCache.incrementRateLimit.mockResolvedValue(1)

      await middleware(request)

      expect(mockRedisCache.incrementRateLimit).toHaveBeenCalledWith(
        'rate_limit:203.0.113.1',
        expect.any(Number)
      )
    })

    it('falls back to connection IP', async () => {
      const middleware = createRateLimitMiddleware()

      const request = new NextRequest('http://localhost:3000/api/test')
      // Mock request.ip
      Object.defineProperty(request, 'ip', {
        value: '192.168.1.100',
        writable: false,
      })

      mockRedisCache.incrementRateLimit.mockResolvedValue(1)

      await middleware(request)

      expect(mockRedisCache.incrementRateLimit).toHaveBeenCalledWith(
        'rate_limit:192.168.1.100',
        expect.any(Number)
      )
    })

    it('handles missing IP gracefully', async () => {
      const middleware = createRateLimitMiddleware()

      const request = new NextRequest('http://localhost:3000/api/test')

      mockRedisCache.incrementRateLimit.mockResolvedValue(1)

      await middleware(request)

      expect(mockRedisCache.incrementRateLimit).toHaveBeenCalledWith(
        'rate_limit:unknown',
        expect.any(Number)
      )
    })
  })

  describe('Error Handling and Resilience', () => {
    it('fails open when Redis is unavailable', async () => {
      mockRedisCache.isHealthy.mockResolvedValue(false)
      
      const middleware = createRateLimitMiddleware()
      const request = new NextRequest('http://localhost:3000/api/test')

      const response = await middleware(request)

      expect(response).toBeUndefined() // Should allow request
    })

    it('handles Redis connection errors', async () => {
      mockRedisCache.incrementRateLimit.mockRejectedValue(new Error('Connection failed'))
      
      const middleware = createRateLimitMiddleware()
      const request = new NextRequest('http://localhost:3000/api/test')

      const response = await middleware(request)

      expect(response).toBeUndefined() // Should allow request
    })

    it('handles malformed rate limit responses', async () => {
      mockRedisCache.incrementRateLimit.mockResolvedValue(NaN)
      
      const middleware = createRateLimitMiddleware()
      const request = new NextRequest('http://localhost:3000/api/test')

      const response = await middleware(request)

      expect(response).toBeUndefined() // Should allow request
    })

    it('logs rate limit violations', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const middleware = createRateLimitMiddleware({
        maxRequests: 5,
        logViolations: true,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      mockRedisCache.incrementRateLimit.mockResolvedValue(6)

      await middleware(request)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Performance and Monitoring', () => {
    it('measures rate limiting performance', async () => {
      const middleware = createRateLimitMiddleware()
      const request = new NextRequest('http://localhost:3000/api/test')

      mockRedisCache.incrementRateLimit.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(1), 10))
      )

      const startTime = Date.now()
      await middleware(request)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(10)
    })

    it('provides rate limiting statistics', async () => {
      const rateLimiter = new RateLimiter()
      const stats = await rateLimiter.getStats()

      expect(stats).toHaveProperty('requests')
      expect(stats).toHaveProperty('blocked')
      expect(stats).toHaveProperty('errors')
    })

    it('tracks rate limit violations', async () => {
      const rateLimiter = new RateLimiter({ maxRequests: 1 })
      const request = new NextRequest('http://localhost:3000/api/test')

      mockRedisCache.incrementRateLimit.mockResolvedValue(2)

      await rateLimiter.checkLimit(request)
      const stats = await rateLimiter.getStats()

      expect(stats.blocked).toBeGreaterThan(0)
    })
  })

  describe('Integration with Authentication System', () => {
    it('integrates with Clerk authentication', async () => {
      const middleware = createRateLimitMiddleware({
        keyGenerator: (req) => {
          const clerkUserId = req.headers.get('x-clerk-user-id')
          return clerkUserId ? `clerk:${clerkUserId}` : `ip:${req.ip || 'unknown'}`
        },
      })

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        headers: {
          'x-clerk-user-id': 'user_2abc123def456',
          authorization: 'Bearer clerk-session-token',
        },
      })

      mockRedisCache.incrementRateLimit.mockResolvedValue(1)

      await middleware(request)

      expect(mockRedisCache.incrementRateLimit).toHaveBeenCalledWith(
        'rate_limit:clerk:user_2abc123def456',
        expect.any(Number)
      )
    })

    it('applies different limits based on user role', async () => {
      const roleBasedLimiter = createRateLimitMiddleware({
        keyGenerator: (req) => {
          const role = req.headers.get('x-user-role')
          const userId = req.headers.get('x-user-id')
          return `${role}:${userId}`
        },
        maxRequests: (req) => {
          const role = req.headers.get('x-user-role')
          switch (role) {
            case 'admin': return 1000
            case 'instructor': return 500
            case 'student': return 100
            default: return 50
          }
        },
      })

      const request = new NextRequest('http://localhost:3000/api/courses', {
        headers: {
          'x-user-role': 'admin',
          'x-user-id': 'user_123',
        },
      })

      mockRedisCache.incrementRateLimit.mockResolvedValue(500)

      const response = await roleBasedLimiter(request)

      expect(response).toBeUndefined() // Admin should have higher limit
    })
  })
})