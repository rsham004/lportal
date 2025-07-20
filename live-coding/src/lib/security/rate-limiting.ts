/**
 * Rate Limiting Implementation
 * 
 * Provides rate limiting middleware with Redis backend
 * for authentication endpoints and API protection.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRedisCache } from './redis-cache'

export interface RateLimitConfig {
  windowMs?: number // Time window in milliseconds
  maxRequests?: number | ((req: NextRequest) => number) // Max requests per window
  keyGenerator?: (req: NextRequest) => string // Function to generate rate limit key
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  message?: string // Custom error message
  statusCode?: number // Custom status code for rate limit exceeded
  headers?: boolean // Include rate limit headers in response
  logViolations?: boolean // Log rate limit violations
}

export interface RateLimitResult {
  allowed: boolean
  count: number
  remaining: number
  resetTime: Date
  retryAfter?: number
}

export interface RateLimitStats {
  requests: number
  blocked: number
  errors: number
  averageResponseTime: number
}

const DEFAULT_CONFIG: Required<Omit<RateLimitConfig, 'maxRequests'>> & { maxRequests: number } = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (req) => getClientIP(req),
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: 'Too many requests, please try again later.',
  statusCode: 429,
  headers: true,
  logViolations: false,
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check X-Forwarded-For header (most common)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP in the chain
    return forwardedFor.split(',')[0].trim()
  }

  // Check X-Real-IP header
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }

  // Fallback to request IP
  return request.ip || 'unknown'
}

/**
 * Rate Limiter Class
 */
export class RateLimiter {
  private config: Required<Omit<RateLimitConfig, 'maxRequests'>> & { 
    maxRequests: number | ((req: NextRequest) => number) 
  }
  private redis = getRedisCache()
  private stats: RateLimitStats = {
    requests: 0,
    blocked: 0,
    errors: 0,
    averageResponseTime: 0,
  }

  constructor(config: RateLimitConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const startTime = Date.now()
    this.stats.requests++

    try {
      // Check if Redis is healthy
      const isRedisHealthy = await this.redis.isHealthy()
      if (!isRedisHealthy) {
        // Fail open - allow request when Redis is unavailable
        return this.createAllowedResult(0)
      }

      // Generate rate limit key
      const key = `rate_limit:${this.config.keyGenerator(request)}`
      
      // Get max requests for this request
      const maxRequests = typeof this.config.maxRequests === 'function' 
        ? this.config.maxRequests(request)
        : this.config.maxRequests

      // Increment counter
      const windowSeconds = Math.floor(this.config.windowMs / 1000)
      const currentCount = await this.redis.incrementRateLimit(key, windowSeconds)

      // Calculate reset time
      const resetTime = new Date(Date.now() + this.config.windowMs)

      // Check if limit exceeded
      const allowed = currentCount <= maxRequests
      const remaining = Math.max(0, maxRequests - currentCount)

      if (!allowed) {
        this.stats.blocked++
        
        if (this.config.logViolations) {
          console.warn(`Rate limit exceeded for key: ${key}, count: ${currentCount}, limit: ${maxRequests}`)
        }
      }

      // Update performance stats
      const responseTime = Date.now() - startTime
      this.updateAverageResponseTime(responseTime)

      return {
        allowed,
        count: currentCount,
        remaining,
        resetTime,
        retryAfter: allowed ? undefined : Math.ceil(this.config.windowMs / 1000),
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      this.stats.errors++
      
      // Fail open - allow request on error
      return this.createAllowedResult(0)
    }
  }

  /**
   * Reset rate limit for a request
   */
  async resetLimit(request: NextRequest): Promise<void> {
    try {
      const key = `rate_limit:${this.config.keyGenerator(request)}`
      await this.redis.resetRateLimit(key)
    } catch (error) {
      console.error('Error resetting rate limit:', error)
    }
  }

  /**
   * Get current count for a request
   */
  async getCurrentCount(request: NextRequest): Promise<number> {
    try {
      const key = `rate_limit:${this.config.keyGenerator(request)}`
      return await this.redis.getRateLimitCount(key)
    } catch (error) {
      console.error('Error getting rate limit count:', error)
      return 0
    }
  }

  /**
   * Get rate limiter statistics
   */
  async getStats(): Promise<RateLimitStats> {
    return { ...this.stats }
  }

  /**
   * Get configuration
   */
  getConfig(): Required<Omit<RateLimitConfig, 'maxRequests'>> & { 
    maxRequests: number | ((req: NextRequest) => number) 
  } {
    return { ...this.config }
  }

  /**
   * Create allowed result
   */
  private createAllowedResult(count: number): RateLimitResult {
    const maxRequests = typeof this.config.maxRequests === 'function' 
      ? 100 // Default fallback
      : this.config.maxRequests

    return {
      allowed: true,
      count,
      remaining: maxRequests - count,
      resetTime: new Date(Date.now() + this.config.windowMs),
    }
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    const totalRequests = this.stats.requests
    const currentAverage = this.stats.averageResponseTime
    
    this.stats.averageResponseTime = 
      (currentAverage * (totalRequests - 1) + responseTime) / totalRequests
  }
}

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(
  config: RateLimitConfig = {}
): (request: NextRequest) => Promise<NextResponse | undefined> {
  const rateLimiter = new RateLimiter(config)

  return async (request: NextRequest): Promise<NextResponse | undefined> => {
    try {
      // Check rate limit
      const result = await rateLimiter.checkLimit(request)

      // If allowed, continue with request
      if (result.allowed) {
        // Add rate limit headers if enabled
        if (rateLimiter.getConfig().headers) {
          // Note: In middleware, we can't modify the response headers directly
          // This would be handled in the API route or by wrapping the response
          return undefined
        }
        return undefined
      }

      // Rate limit exceeded - create error response
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimiter.getConfig().message,
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: rateLimiter.getConfig().statusCode }
      )

      // Add rate limit headers
      if (rateLimiter.getConfig().headers) {
        const maxRequests = typeof rateLimiter.getConfig().maxRequests === 'function'
          ? rateLimiter.getConfig().maxRequests(request)
          : rateLimiter.getConfig().maxRequests

        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', result.resetTime.getTime().toString())
        
        if (result.retryAfter) {
          response.headers.set('Retry-After', result.retryAfter.toString())
        }
      }

      return response
    } catch (error) {
      console.error('Rate limiting middleware error:', error)
      // Fail open - allow request on error
      return undefined
    }
  }
}

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Strict rate limiter for authentication endpoints
   */
  auth: createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyGenerator: (req) => `auth:${getClientIP(req)}`,
    message: 'Too many authentication attempts, please try again later.',
    logViolations: true,
  }),

  /**
   * Very strict rate limiter for password reset
   */
  passwordReset: createRateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    keyGenerator: (req) => `reset:${getClientIP(req)}`,
    message: 'Too many password reset attempts, please try again later.',
    logViolations: true,
  }),

  /**
   * Moderate rate limiter for API endpoints
   */
  api: createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id')
      return userId ? `api:user:${userId}` : `api:ip:${getClientIP(req)}`
    },
  }),

  /**
   * Lenient rate limiter for public endpoints
   */
  public: createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per 15 minutes
    keyGenerator: (req) => `public:${getClientIP(req)}`,
  }),

  /**
   * User-specific rate limiter with role-based limits
   */
  userBased: createRateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: (req) => {
      const role = req.headers.get('x-user-role')
      switch (role) {
        case 'super_admin': return 10000
        case 'admin': return 5000
        case 'instructor': return 1000
        case 'student': return 500
        default: return 100
      }
    },
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id')
      const role = req.headers.get('x-user-role')
      return userId ? `user:${role}:${userId}` : `ip:${getClientIP(req)}`
    },
  }),
}

/**
 * Rate limiting utility functions
 */
export const rateLimitUtils = {
  /**
   * Get client IP with fallbacks
   */
  getClientIP,

  /**
   * Create custom key generator for specific use cases
   */
  createKeyGenerator: (prefix: string, extractor: (req: NextRequest) => string) => {
    return (req: NextRequest) => `${prefix}:${extractor(req)}`
  },

  /**
   * Create sliding window rate limiter
   */
  createSlidingWindow: (config: RateLimitConfig & { precision?: number }) => {
    // Implementation would use Redis sorted sets for sliding window
    // This is a simplified version
    return createRateLimitMiddleware(config)
  },

  /**
   * Create distributed rate limiter for multiple instances
   */
  createDistributed: (config: RateLimitConfig & { instanceId?: string }) => {
    const instanceId = config.instanceId || process.env.INSTANCE_ID || 'default'
    
    return createRateLimitMiddleware({
      ...config,
      keyGenerator: (req) => {
        const baseKey = config.keyGenerator ? config.keyGenerator(req) : getClientIP(req)
        return `${instanceId}:${baseKey}`
      },
    })
  },
}

/**
 * Rate limit response helper
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  maxRequests: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.resetTime.getTime().toString())
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString())
  }

  return response
}