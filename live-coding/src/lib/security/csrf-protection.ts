/**
 * CSRF Protection Implementation
 * 
 * Provides CSRF protection middleware and token validation
 * for secure authentication flows and API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export interface CSRFConfig {
  secret?: string
  tokenExpiry?: number // seconds
  excludePaths?: string[]
  tokenHeader?: string
  cookieName?: string
  sameSite?: 'strict' | 'lax' | 'none'
  secure?: boolean
}

export interface SessionData {
  userId: string
  role: string
}

const DEFAULT_CONFIG: Required<CSRFConfig> = {
  secret: process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  tokenExpiry: 3600, // 1 hour
  excludePaths: ['/api/health', '/api/public'],
  tokenHeader: 'x-csrf-token',
  cookieName: 'csrf-token',
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
}

/**
 * Generate a CSRF token with timestamp and HMAC signature
 */
export function generateCSRFToken(
  expirySeconds = DEFAULT_CONFIG.tokenExpiry,
  secret = DEFAULT_CONFIG.secret
): string {
  try {
    // Generate random bytes for token uniqueness
    const randomBytes = crypto.randomBytes(32)
    
    // Create timestamp
    const timestamp = Date.now()
    const expiry = timestamp + (expirySeconds * 1000)
    
    // Create payload
    const payload = {
      random: randomBytes.toString('hex'),
      timestamp,
      expiry,
    }
    
    // Create HMAC signature
    const payloadString = JSON.stringify(payload)
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payloadString)
    const signature = hmac.digest('hex')
    
    // Combine payload and signature
    const token = {
      payload,
      signature,
    }
    
    // Return base64 encoded token
    return Buffer.from(JSON.stringify(token)).toString('base64')
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    throw error
  }
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(
  token: string | null,
  secret = DEFAULT_CONFIG.secret
): boolean {
  if (!token) {
    return false
  }

  try {
    // Decode base64 token
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString())
    
    if (!tokenData.payload || !tokenData.signature) {
      return false
    }
    
    const { payload, signature } = tokenData
    
    // Check expiry
    if (Date.now() > payload.expiry) {
      return false
    }
    
    // Verify HMAC signature
    const payloadString = JSON.stringify(payload)
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payloadString)
    const expectedSignature = hmac.digest('hex')
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Error validating CSRF token:', error)
    return false
  }
}

/**
 * CSRF Protection Middleware Class
 */
export class CSRFProtection {
  private config: Required<CSRFConfig>

  constructor(config: CSRFConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Middleware function for Next.js
   */
  async middleware(request: NextRequest): Promise<NextResponse | undefined> {
    const { pathname } = request.nextUrl
    const method = request.method.toUpperCase()

    // Skip CSRF protection for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return undefined
    }

    // Skip CSRF protection for excluded paths
    if (this.isPathExcluded(pathname)) {
      return undefined
    }

    // Get CSRF token from request
    const token = this.extractToken(request)

    // Validate CSRF token
    if (!token || !validateCSRFToken(token, this.config.secret)) {
      return this.createErrorResponse()
    }

    // Token is valid, continue
    return undefined
  }

  /**
   * Check if path is excluded from CSRF protection
   */
  private isPathExcluded(pathname: string): boolean {
    return this.config.excludePaths.some(excludePath => {
      if (excludePath.endsWith('*')) {
        const prefix = excludePath.slice(0, -1)
        return pathname.startsWith(prefix)
      }
      return pathname === excludePath
    })
  }

  /**
   * Extract CSRF token from request headers or cookies
   */
  private extractToken(request: NextRequest): string | null {
    // Try header first
    const headerToken = request.headers.get(this.config.tokenHeader)
    if (headerToken) {
      return headerToken
    }

    // Try cookie
    const cookieToken = request.cookies.get(this.config.cookieName)?.value
    if (cookieToken) {
      return cookieToken
    }

    return null
  }

  /**
   * Create error response for CSRF validation failure
   */
  private createErrorResponse(): NextResponse {
    return NextResponse.json(
      {
        error: 'CSRF token validation failed',
        code: 'CSRF_INVALID',
      },
      { status: 403 }
    )
  }

  /**
   * Generate CSRF token endpoint
   */
  async generateTokenEndpoint(
    request: NextRequest,
    getSession: (request: NextRequest) => Promise<SessionData | null>
  ): Promise<NextResponse> {
    try {
      // Verify user is authenticated
      const session = await getSession(request)
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Generate new CSRF token
      const csrfToken = generateCSRFToken(
        this.config.tokenExpiry,
        this.config.secret
      )

      // Create response with token
      const response = NextResponse.json({
        csrfToken,
        expiresIn: this.config.tokenExpiry,
      })

      // Set secure cookie
      response.cookies.set(this.config.cookieName, csrfToken, {
        httpOnly: true,
        secure: this.config.secure,
        sameSite: this.config.sameSite,
        maxAge: this.config.tokenExpiry,
        path: '/',
      })

      return response
    } catch (error) {
      console.error('Error generating CSRF token:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  /**
   * Get configuration
   */
  getConfig(): Required<CSRFConfig> {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CSRFConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Singleton instance
let csrfInstance: CSRFProtection | null = null

export function getCSRFProtection(config?: CSRFConfig): CSRFProtection {
  if (!csrfInstance) {
    csrfInstance = new CSRFProtection(config)
  }
  return csrfInstance
}

/**
 * Security Headers Configuration
 */
export interface SecurityHeaders {
  'Content-Security-Policy'?: string
  'X-Frame-Options'?: string
  'X-Content-Type-Options'?: string
  'Referrer-Policy'?: string
  'Permissions-Policy'?: string
  'Strict-Transport-Security'?: string
  'X-XSS-Protection'?: string
}

/**
 * Default security headers
 */
export const DEFAULT_SECURITY_HEADERS: SecurityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
  ].join(', '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-XSS-Protection': '1; mode=block',
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  customHeaders: Partial<SecurityHeaders> = {}
): NextResponse {
  const headers = { ...DEFAULT_SECURITY_HEADERS, ...customHeaders }

  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value)
    }
  })

  return response
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(
  customHeaders: Partial<SecurityHeaders> = {}
) {
  return (request: NextRequest): NextResponse => {
    const response = NextResponse.next()
    return applySecurityHeaders(response, customHeaders)
  }
}

/**
 * Combined security middleware (CSRF + Headers)
 */
export function createSecurityMiddleware(
  csrfConfig?: CSRFConfig,
  securityHeaders?: Partial<SecurityHeaders>
) {
  const csrf = new CSRFProtection(csrfConfig)

  return async (request: NextRequest): Promise<NextResponse> => {
    // Apply CSRF protection
    const csrfResponse = await csrf.middleware(request)
    if (csrfResponse) {
      // CSRF validation failed, apply security headers and return error
      return applySecurityHeaders(csrfResponse, securityHeaders)
    }

    // CSRF passed, apply security headers to successful response
    const response = NextResponse.next()
    return applySecurityHeaders(response, securityHeaders)
  }
}