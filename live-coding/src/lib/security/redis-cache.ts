/**
 * Redis Cache Implementation
 * 
 * Provides Redis caching functionality for session storage, data caching,
 * and integration with authentication system.
 */

import { createClient, RedisClientType } from 'redis'
import { UserRole } from '../authorization/roles'

export interface SessionData {
  userId: string
  role: UserRole
  loginTime: string
  ipAddress?: string
  userAgent?: string
  lastActivity?: string
}

export interface UserAuthData {
  id: string
  role: UserRole
  permissions: string[]
  lastLogin: string
}

export interface CacheStats {
  connected: boolean
  operations: number
  errors: number
  hitRate?: number
}

export class RedisCache {
  private client: RedisClientType
  private isConnected = false
  private operationCount = 0
  private errorCount = 0

  constructor(config?: {
    host?: string
    port?: number
    password?: string
    database?: number
  }) {
    const {
      host = process.env.REDIS_HOST || 'localhost',
      port = parseInt(process.env.REDIS_PORT || '6379'),
      password = process.env.REDIS_PASSWORD,
      database = parseInt(process.env.REDIS_DB || '0'),
    } = config || {}

    this.client = createClient({
      socket: {
        host,
        port,
      },
      password,
      database,
    }) as RedisClientType

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err)
      this.errorCount++
    })

    this.client.on('connect', () => {
      console.log('Redis Client Connected')
      this.isConnected = true
    })

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected')
      this.isConnected = false
    })
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<boolean> {
    try {
      await this.client.connect()
      await this.ping()
      return true
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      this.errorCount++
      return false
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.quit()
      }
    } catch (error) {
      console.error('Error disconnecting from Redis:', error)
      this.errorCount++
    }
  }

  /**
   * Check Redis connection health
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.ping()
      return response === 'PONG'
    } catch (error) {
      return false
    }
  }

  /**
   * Ping Redis server
   */
  private async ping(): Promise<string> {
    this.operationCount++
    return await this.client.ping()
  }

  /**
   * Set a string value with optional TTL
   */
  async set(key: string, value: string, ttlSeconds = 3600): Promise<void> {
    try {
      this.operationCount++
      await this.client.set(key, value, { EX: ttlSeconds })
    } catch (error) {
      console.error('Redis SET error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Get a string value
   */
  async get(key: string): Promise<string | null> {
    try {
      this.operationCount++
      return await this.client.get(key)
    } catch (error) {
      console.error('Redis GET error:', error)
      this.errorCount++
      return null
    }
  }

  /**
   * Set an object as JSON with optional TTL
   */
  async setObject<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      await this.set(key, serialized, ttlSeconds)
    } catch (error) {
      console.error('Redis SET OBJECT error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Get an object from JSON
   */
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Redis GET OBJECT error:', error)
      this.errorCount++
      return null
    }
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<boolean> {
    try {
      this.operationCount++
      const result = await this.client.del(key)
      return result > 0
    } catch (error) {
      console.error('Redis DELETE error:', error)
      this.errorCount++
      return false
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      this.operationCount++
      const result = await this.client.exists(key)
      return result > 0
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      this.errorCount++
      return false
    }
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    try {
      this.operationCount++
      return await this.client.ttl(key)
    } catch (error) {
      console.error('Redis TTL error:', error)
      this.errorCount++
      return -1
    }
  }

  /**
   * Set session data
   */
  async setSession(sessionId: string, data: SessionData, ttlSeconds = 86400): Promise<void> {
    try {
      this.operationCount++
      const key = `session:${sessionId}`
      
      // Store session data as hash
      await this.client.hSet(key, {
        userId: data.userId,
        role: data.role,
        loginTime: data.loginTime,
        ipAddress: data.ipAddress || '',
        userAgent: data.userAgent || '',
        lastActivity: data.lastActivity || new Date().toISOString(),
      })

      // Set expiration
      await this.client.expire(key, ttlSeconds)

      // Add to user sessions set
      await this.addUserSession(data.userId, sessionId)
    } catch (error) {
      console.error('Redis SET SESSION error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      this.operationCount++
      const key = `session:${sessionId}`
      const data = await this.client.hGetAll(key)
      
      if (!data || Object.keys(data).length === 0) {
        return null
      }

      return {
        userId: data.userId,
        role: data.role as UserRole,
        loginTime: data.loginTime,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        lastActivity: data.lastActivity,
      }
    } catch (error) {
      console.error('Redis GET SESSION error:', error)
      this.errorCount++
      return null
    }
  }

  /**
   * Delete session data
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      this.operationCount++
      const key = `session:${sessionId}`
      
      // Get session data to remove from user sessions
      const sessionData = await this.getSession(sessionId)
      if (sessionData) {
        await this.removeUserSession(sessionData.userId, sessionId)
      }

      const result = await this.client.del(key)
      return result > 0
    } catch (error) {
      console.error('Redis DELETE SESSION error:', error)
      this.errorCount++
      return false
    }
  }

  /**
   * Extend session expiry
   */
  async extendSession(sessionId: string, ttlSeconds = 86400): Promise<void> {
    try {
      this.operationCount++
      const key = `session:${sessionId}`
      await this.client.expire(key, ttlSeconds)
    } catch (error) {
      console.error('Redis EXTEND SESSION error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<string[]> {
    try {
      this.operationCount++
      const key = `user_sessions:${userId}`
      return await this.client.sMembers(key)
    } catch (error) {
      console.error('Redis GET USER SESSIONS error:', error)
      this.errorCount++
      return []
    }
  }

  /**
   * Add session to user session set
   */
  async addUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      this.operationCount++
      const key = `user_sessions:${userId}`
      await this.client.sAdd(key, sessionId)
      // Set expiration for user sessions set
      await this.client.expire(key, 86400 * 7) // 7 days
    } catch (error) {
      console.error('Redis ADD USER SESSION error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Remove session from user session set
   */
  async removeUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      this.operationCount++
      const key = `user_sessions:${userId}`
      await this.client.sRem(key, sessionId)
    } catch (error) {
      console.error('Redis REMOVE USER SESSION error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Increment rate limit counter
   */
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    try {
      this.operationCount++
      const count = await this.client.incr(key)
      
      // Set expiration only on first increment
      if (count === 1) {
        await this.client.expire(key, windowSeconds)
      }
      
      return count
    } catch (error) {
      console.error('Redis INCREMENT RATE LIMIT error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Get current rate limit count
   */
  async getRateLimitCount(key: string): Promise<number> {
    try {
      this.operationCount++
      const count = await this.client.get(key)
      return count ? parseInt(count, 10) : 0
    } catch (error) {
      console.error('Redis GET RATE LIMIT error:', error)
      this.errorCount++
      return 0
    }
  }

  /**
   * Reset rate limit counter
   */
  async resetRateLimit(key: string): Promise<void> {
    try {
      this.operationCount++
      await this.client.del(key)
    } catch (error) {
      console.error('Redis RESET RATE LIMIT error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Invalidate cache by pattern (simplified implementation)
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      this.operationCount++
      // Note: In production, you'd use SCAN for large datasets
      // This is a simplified implementation
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        return await this.client.del(keys)
      }
      return 0
    } catch (error) {
      console.error('Redis INVALIDATE PATTERN error:', error)
      this.errorCount++
      return 0
    }
  }

  /**
   * Clear all cache data
   */
  async clearAll(): Promise<void> {
    try {
      this.operationCount++
      await this.client.flushAll()
    } catch (error) {
      console.error('Redis CLEAR ALL error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Cache user authentication data
   */
  async cacheUserAuth(userId: string, authData: UserAuthData, ttlSeconds = 3600): Promise<void> {
    try {
      const key = `user_auth:${userId}`
      await this.setObject(key, authData, ttlSeconds)
    } catch (error) {
      console.error('Redis CACHE USER AUTH error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Get cached user authentication data
   */
  async getUserAuth(userId: string): Promise<UserAuthData | null> {
    try {
      const key = `user_auth:${userId}`
      return await this.getObject<UserAuthData>(key)
    } catch (error) {
      console.error('Redis GET USER AUTH error:', error)
      this.errorCount++
      return null
    }
  }

  /**
   * Invalidate user cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      const key = `user_auth:${userId}`
      await this.delete(key)
    } catch (error) {
      console.error('Redis INVALIDATE USER CACHE error:', error)
      this.errorCount++
      throw error
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    return {
      connected: this.isConnected,
      operations: this.operationCount,
      errors: this.errorCount,
      hitRate: this.operationCount > 0 ? (this.operationCount - this.errorCount) / this.operationCount : 0,
    }
  }
}

// Singleton instance
let redisInstance: RedisCache | null = null

export function getRedisCache(): RedisCache {
  if (!redisInstance) {
    redisInstance = new RedisCache()
  }
  return redisInstance
}

export async function initializeRedis(): Promise<boolean> {
  const redis = getRedisCache()
  return await redis.connect()
}

export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.disconnect()
    redisInstance = null
  }
}