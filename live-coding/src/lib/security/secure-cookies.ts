/**
 * Secure Cookie Handling Implementation
 * 
 * Provides secure cookie management with proper security attributes,
 * encryption support, and integration with authentication system.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export interface CookieOptions {
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  domain?: string
  path?: string
  maxAge?: number // seconds
  expires?: Date
}

export interface CookieStats {
  cookiesSet: number
  cookiesRead: number
  securityViolations: number
  encryptionErrors: number
}

const DEFAULT_OPTIONS: Required<Omit<CookieOptions, 'domain' | 'expires'>> & {
  domain?: string
  expires?: Date
} = {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict',
  path: '/',
  maxAge: 86400, // 24 hours
  domain: undefined,
  expires: undefined,
}

/**
 * Secure Cookie Manager Class
 */
export class SecureCookieManager {
  private config: Required<Omit<CookieOptions, 'domain' | 'expires'>> & {
    domain?: string
    expires?: Date
  }
  private stats: CookieStats = {
    cookiesSet: 0,
    cookiesRead: 0,
    securityViolations: 0,
    encryptionErrors: 0,
  }

  constructor(options: CookieOptions = {}) {
    this.config = { ...DEFAULT_OPTIONS, ...options }
    
    // Validate security in production
    if (process.env.NODE_ENV === 'production') {
      const warnings = this.validateSecurity(this.config)
      if (warnings.length > 0) {
        console.warn('Cookie security warnings:', warnings)
        this.stats.securityViolations += warnings.length
      }
    }
  }

  /**
   * Set a secure cookie
   */
  set(
    response: NextResponse,
    name: string,
    value: string,
    options: Partial<CookieOptions> = {}
  ): void {
    try {
      this.validateCookieName(name)
      this.validateCookieValue(value)

      const cookieOptions = { ...this.config, ...options }
      const cookieString = this.buildCookieString(name, value, cookieOptions)

      response.headers.append('Set-Cookie', cookieString)
      this.stats.cookiesSet++
    } catch (error) {
      console.error('Error setting cookie:', error)
      throw error
    }
  }

  /**
   * Get a cookie value from request
   */
  get(request: NextRequest, name: string): string | null {
    try {
      this.stats.cookiesRead++
      
      const cookieHeader = request.headers.get('cookie')
      if (!cookieHeader) {
        return null
      }

      const cookies = this.parseCookieHeader(cookieHeader)
      return cookies[name] || null
    } catch (error) {
      console.error('Error getting cookie:', error)
      return null
    }
  }

  /**
   * Delete a cookie
   */
  delete(response: NextResponse, name: string, options: Partial<CookieOptions> = {}): void {
    const deleteOptions = {
      ...options,
      maxAge: 0,
      expires: new Date(0),
    }

    this.set(response, name, '', deleteOptions)
  }

  /**
   * Set session cookie
   */
  setSession(
    response: NextResponse,
    sessionId: string,
    options: Partial<CookieOptions> = {}
  ): void {
    this.set(response, 'session', sessionId, {
      httpOnly: true,
      secure: this.config.secure,
      sameSite: 'strict',
      ...options,
    })
  }

  /**
   * Set CSRF token cookie
   */
  setCSRFToken(
    response: NextResponse,
    token: string,
    options: Partial<CookieOptions> = {}
  ): void {
    this.set(response, 'csrf-token', token, {
      httpOnly: true,
      secure: this.config.secure,
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      ...options,
    })
  }

  /**
   * Set user preferences cookie
   */
  setUserPreferences(
    response: NextResponse,
    preferences: Record<string, any>,
    options: Partial<CookieOptions> = {}
  ): void {
    const preferencesString = JSON.stringify(preferences)
    
    this.set(response, 'user-preferences', preferencesString, {
      httpOnly: false, // Allow client-side access for preferences
      secure: this.config.secure,
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      ...options,
    })
  }

  /**
   * Clear all authentication cookies
   */
  clearAuthCookies(response: NextResponse): void {
    const authCookies = ['session', 'csrf-token', 'auth-token', 'refresh-token']
    
    authCookies.forEach(cookieName => {
      this.delete(response, cookieName, {
        path: '/',
        domain: this.config.domain,
      })
    })
  }

  /**
   * Validate cookie security
   */
  validateSecurity(options: Partial<CookieOptions> = this.config): string[] {
    const warnings: string[] = []

    if (process.env.NODE_ENV === 'production') {
      if (!options.secure) {
        warnings.push('Cookie should be Secure in production')
      }

      if (!options.httpOnly) {
        warnings.push('Cookie should be HttpOnly for security')
      }

      if (options.sameSite === 'none' && !options.secure) {
        warnings.push('SameSite=None requires Secure flag')
      }
    }

    return warnings
  }

  /**
   * Get configuration
   */
  getConfig(): Required<Omit<CookieOptions, 'domain' | 'expires'>> & {
    domain?: string
    expires?: Date
  } {
    return { ...this.config }
  }

  /**
   * Get statistics
   */
  getStats(): CookieStats {
    return { ...this.stats }
  }

  /**
   * Build cookie string with all attributes
   */
  private buildCookieString(
    name: string,
    value: string,
    options: CookieOptions
  ): string {
    const sanitizedValue = this.sanitizeValue(value)
    let cookieString = `${name}=${sanitizedValue}`

    if (options.maxAge !== undefined) {
      cookieString += `; Max-Age=${options.maxAge}`
    }

    if (options.expires) {
      cookieString += `; Expires=${options.expires.toUTCString()}`
    }

    if (options.path) {
      cookieString += `; Path=${options.path}`
    }

    if (options.domain) {
      cookieString += `; Domain=${options.domain}`
    }

    if (options.secure) {
      cookieString += '; Secure'
    }

    if (options.httpOnly) {
      cookieString += '; HttpOnly'
    }

    if (options.sameSite) {
      cookieString += `; SameSite=${options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)}`
    }

    return cookieString
  }

  /**
   * Parse cookie header
   */
  private parseCookieHeader(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {}

    cookieHeader.split(';').forEach(cookie => {
      const [name, ...valueParts] = cookie.trim().split('=')
      if (name) {
        const value = valueParts.join('=')
        cookies[name] = decodeURIComponent(value || '')
      }
    })

    return cookies
  }

  /**
   * Validate cookie name
   */
  private validateCookieName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Cookie name is required and must be a string')
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error('Invalid cookie name: contains invalid characters')
    }
  }

  /**
   * Validate cookie value
   */
  private validateCookieValue(value: string): void {
    if (typeof value !== 'string') {
      throw new Error('Cookie value must be a string')
    }

    // Check size limit (4KB is typical browser limit)
    if (value.length > 4096) {
      throw new Error('Cookie value exceeds maximum size (4KB)')
    }
  }

  /**
   * Sanitize cookie value
   */
  private sanitizeValue(value: string): string {
    // Remove control characters and potential injection attempts
    return value
      .replace(/[\r\n]/g, '') // Remove line breaks
      .replace(/[;,\\]/g, '') // Remove cookie delimiters
      .trim()
  }
}

/**
 * Encrypted Cookie Manager Class
 */
export class EncryptedCookieManager extends SecureCookieManager {
  private encryptionKey: string
  private algorithm = 'aes-256-cbc'

  constructor(options: CookieOptions & { encryptionKey: string }) {
    super(options)
    
    if (!options.encryptionKey || options.encryptionKey.length < 32) {
      throw new Error('Encryption key must be at least 32 characters long')
    }
    
    this.encryptionKey = options.encryptionKey
  }

  /**
   * Set encrypted cookie
   */
  setEncrypted(
    response: NextResponse,
    name: string,
    value: string,
    options: Partial<CookieOptions> = {}
  ): void {
    try {
      const encryptedValue = this.encrypt(value)
      this.set(response, name, encryptedValue, options)
    } catch (error) {
      console.error('Error setting encrypted cookie:', error)
      this.getStats().encryptionErrors++
      throw error
    }
  }

  /**
   * Get decrypted cookie value
   */
  getDecrypted(request: NextRequest, name: string): string | null {
    try {
      const encryptedValue = this.get(request, name)
      if (!encryptedValue) {
        return null
      }

      return this.decrypt(encryptedValue)
    } catch (error) {
      console.error('Error getting decrypted cookie:', error)
      this.getStats().encryptionErrors++
      return null
    }
  }

  /**
   * Encrypt value
   */
  private encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey)
      
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      return iv.toString('hex') + ':' + encrypted
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt cookie value')
    }
  }

  /**
   * Decrypt value
   */
  private decrypt(encryptedText: string): string {
    try {
      const [ivHex, encrypted] = encryptedText.split(':')
      if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted format')
      }

      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt cookie value')
    }
  }

  /**
   * Generate secure encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}

/**
 * Utility Functions
 */

/**
 * Create secure cookie string
 */
export function createSecureCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  const manager = new SecureCookieManager(options)
  const response = new NextResponse()
  
  manager.set(response, name, value, options)
  
  const setCookieHeader = response.headers.get('set-cookie')
  if (!setCookieHeader) {
    throw new Error('Failed to create cookie')
  }
  
  return setCookieHeader
}

/**
 * Parse cookie string
 */
export function parseSecureCookie(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  if (!cookieString) {
    return cookies
  }

  cookieString.split(';').forEach(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=')
    if (name) {
      const value = valueParts.join('=')
      try {
        cookies[name] = decodeURIComponent(value || '')
      } catch (error) {
        // Handle malformed URI components
        cookies[name] = value || ''
      }
    }
  })

  return cookies
}

/**
 * Cookie security middleware
 */
export function createCookieSecurityMiddleware(options: CookieOptions = {}) {
  const cookieManager = new SecureCookieManager(options)

  return (request: NextRequest): NextResponse => {
    const response = NextResponse.next()

    // Add security headers for cookie protection
    response.headers.set('Set-Cookie', 
      response.headers.get('Set-Cookie') || ''
    )

    // Validate existing cookies
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const warnings = cookieManager.validateSecurity()
      if (warnings.length > 0) {
        console.warn('Cookie security warnings for request:', warnings)
      }
    }

    return response
  }
}

/**
 * Predefined secure cookie configurations
 */
export const cookieConfigs = {
  /**
   * Session cookie configuration
   */
  session: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 86400, // 24 hours
    path: '/',
  },

  /**
   * CSRF token cookie configuration
   */
  csrf: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 3600, // 1 hour
    path: '/',
  },

  /**
   * User preferences cookie configuration
   */
  preferences: {
    secure: true,
    httpOnly: false, // Allow client access
    sameSite: 'lax' as const,
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/',
  },

  /**
   * Authentication token configuration
   */
  auth: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 3600, // 1 hour
    path: '/',
  },

  /**
   * Development configuration (less strict)
   */
  development: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 86400,
    path: '/',
  },
}

// Singleton instances
let cookieManagerInstance: SecureCookieManager | null = null
let encryptedCookieManagerInstance: EncryptedCookieManager | null = null

export function getCookieManager(options?: CookieOptions): SecureCookieManager {
  if (!cookieManagerInstance) {
    cookieManagerInstance = new SecureCookieManager(options)
  }
  return cookieManagerInstance
}

export function getEncryptedCookieManager(
  options: CookieOptions & { encryptionKey: string }
): EncryptedCookieManager {
  if (!encryptedCookieManagerInstance) {
    encryptedCookieManagerInstance = new EncryptedCookieManager(options)
  }
  return encryptedCookieManagerInstance
}