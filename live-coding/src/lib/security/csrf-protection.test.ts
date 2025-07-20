/**
 * CSRF Protection Test
 * 
 * TDD tests for CSRF protection middleware and token validation
 * with integration testing for authentication flows.
 */

import { NextRequest, NextResponse } from 'next/server'
import { CSRFProtection, generateCSRFToken, validateCSRFToken } from './csrf-protection'

// Mock crypto for consistent testing
const mockCrypto = {
  randomBytes: jest.fn(),
  createHmac: jest.fn(),
}

jest.mock('crypto', () => mockCrypto)

describe('CSRF Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock crypto.randomBytes
    mockCrypto.randomBytes.mockImplementation((size: number) => {
      return Buffer.from('a'.repeat(size))
    })

    // Mock crypto.createHmac
    const mockHmac = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mocked-hmac-signature'),
    }
    mockCrypto.createHmac.mockReturnValue(mockHmac)
  })

  describe('CSRF Token Generation', () => {
    it('generates a valid CSRF token', () => {
      const token = generateCSRFToken()

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('generates unique tokens on each call', () => {
      // Mock different random bytes for each call
      mockCrypto.randomBytes
        .mockReturnValueOnce(Buffer.from('a'.repeat(32)))
        .mockReturnValueOnce(Buffer.from('b'.repeat(32)))

      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()

      expect(token1).not.toBe(token2)
    })

    it('includes timestamp in token', () => {
      const token = generateCSRFToken()
      
      // Token should be base64 encoded and contain timestamp
      expect(token).toMatch(/^[A-Za-z0-9+/]+=*$/)
    })

    it('generates token with custom expiry', () => {
      const customExpiry = 7200 // 2 hours
      const token = generateCSRFToken(customExpiry)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })
  })

  describe('CSRF Token Validation', () => {
    it('validates a valid token', () => {
      const token = generateCSRFToken()
      const isValid = validateCSRFToken(token)

      expect(isValid).toBe(true)
    })

    it('rejects invalid token format', () => {
      const invalidToken = 'invalid-token'
      const isValid = validateCSRFToken(invalidToken)

      expect(isValid).toBe(false)
    })

    it('rejects empty token', () => {
      const isValid = validateCSRFToken('')

      expect(isValid).toBe(false)
    })

    it('rejects null token', () => {
      const isValid = validateCSRFToken(null)

      expect(isValid).toBe(false)
    })

    it('rejects expired token', () => {
      // Mock an old timestamp
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
      const expiredToken = generateCSRFToken(3600) // 1 hour expiry

      // Mock Date.now to return old timestamp during generation
      const originalDateNow = Date.now
      Date.now = jest.fn(() => oldTimestamp)
      
      const token = generateCSRFToken(3600)
      
      // Restore Date.now
      Date.now = originalDateNow

      const isValid = validateCSRFToken(token)

      expect(isValid).toBe(false)
    })

    it('validates token with custom secret', () => {
      const customSecret = 'custom-secret-key'
      const token = generateCSRFToken(3600, customSecret)
      const isValid = validateCSRFToken(token, customSecret)

      expect(isValid).toBe(true)
    })

    it('rejects token with wrong secret', () => {
      const token = generateCSRFToken(3600, 'secret1')
      const isValid = validateCSRFToken(token, 'secret2')

      expect(isValid).toBe(false)
    })
  })

  describe('CSRF Middleware', () => {
    let csrfProtection: CSRFProtection

    beforeEach(() => {
      csrfProtection = new CSRFProtection({
        secret: 'test-secret',
        excludePaths: ['/api/health', '/api/public'],
        tokenHeader: 'x-csrf-token',
        cookieName: 'csrf-token',
      })
    })

    it('allows GET requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeUndefined() // Should pass through
    })

    it('allows HEAD requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'HEAD',
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeUndefined()
    })

    it('allows OPTIONS requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeUndefined()
    })

    it('blocks POST requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(403)
    })

    it('blocks PUT requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'PUT',
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(403)
    })

    it('blocks DELETE requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'DELETE',
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(403)
    })

    it('allows requests with valid CSRF token in header', async () => {
      const token = generateCSRFToken()
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
        },
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeUndefined() // Should pass through
    })

    it('allows requests with valid CSRF token in cookie', async () => {
      const token = generateCSRFToken()
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          cookie: `csrf-token=${token}`,
        },
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeUndefined()
    })

    it('blocks requests with invalid CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'invalid-token',
        },
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(403)
    })

    it('excludes specified paths from CSRF protection', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'POST',
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeUndefined() // Should pass through
    })

    it('excludes public API paths from CSRF protection', async () => {
      const request = new NextRequest('http://localhost:3000/api/public/data', {
        method: 'POST',
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeUndefined()
    })

    it('returns proper error response for CSRF failures', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      })

      const response = await csrfProtection.middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(403)
      
      const body = await response?.json()
      expect(body).toEqual({
        error: 'CSRF token validation failed',
        code: 'CSRF_INVALID',
      })
    })

    it('handles requests with both header and cookie tokens', async () => {
      const headerToken = generateCSRFToken()
      const cookieToken = generateCSRFToken()
      
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': headerToken,
          cookie: `csrf-token=${cookieToken}`,
        },
      })

      // Should prioritize header token
      const response = await csrfProtection.middleware(request)

      expect(response).toBeUndefined() // Should pass through with valid header token
    })
  })

  describe('CSRF Token API Endpoint', () => {
    it('generates token for authenticated users', async () => {
      const request = new NextRequest('http://localhost:3000/api/csrf-token', {
        method: 'GET',
        headers: {
          cookie: 'session=valid-session',
        },
      })

      // Mock authenticated session
      const mockGetSession = jest.fn().mockResolvedValue({
        userId: 'user_123',
        role: 'student',
      })

      const csrfProtection = new CSRFProtection()
      const response = await csrfProtection.generateTokenEndpoint(request, mockGetSession)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('csrfToken')
      expect(typeof body.csrfToken).toBe('string')
    })

    it('rejects token generation for unauthenticated users', async () => {
      const request = new NextRequest('http://localhost:3000/api/csrf-token', {
        method: 'GET',
      })

      const mockGetSession = jest.fn().mockResolvedValue(null)

      const csrfProtection = new CSRFProtection()
      const response = await csrfProtection.generateTokenEndpoint(request, mockGetSession)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(401)
    })

    it('sets CSRF token in secure cookie', async () => {
      const request = new NextRequest('http://localhost:3000/api/csrf-token', {
        method: 'GET',
        headers: {
          cookie: 'session=valid-session',
        },
      })

      const mockGetSession = jest.fn().mockResolvedValue({
        userId: 'user_123',
        role: 'student',
      })

      const csrfProtection = new CSRFProtection()
      const response = await csrfProtection.generateTokenEndpoint(request, mockGetSession)

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('csrf-token=')
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader).toContain('Secure')
      expect(setCookieHeader).toContain('SameSite=Strict')
    })
  })

  describe('Integration with Authentication', () => {
    it('integrates with Clerk session validation', async () => {
      const token = generateCSRFToken()
      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: {
          'x-csrf-token': token,
          authorization: 'Bearer clerk-token',
        },
      })

      const csrfProtection = new CSRFProtection()
      const response = await csrfProtection.middleware(request)

      expect(response).toBeUndefined() // Should pass CSRF validation
    })

    it('works with user management endpoints', async () => {
      const token = generateCSRFToken()
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_user',
          userData: { name: 'Test User' },
        }),
      })

      const csrfProtection = new CSRFProtection()
      const response = await csrfProtection.middleware(request)

      expect(response).toBeUndefined()
    })

    it('protects password reset endpoints', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
        }),
      })

      const csrfProtection = new CSRFProtection()
      const response = await csrfProtection.middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(403)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles malformed tokens gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'malformed.token.here',
        },
      })

      const csrfProtection = new CSRFProtection()
      const response = await csrfProtection.middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(403)
    })

    it('handles missing configuration gracefully', () => {
      const csrfProtection = new CSRFProtection()
      
      expect(csrfProtection).toBeInstanceOf(CSRFProtection)
    })

    it('handles crypto errors gracefully', () => {
      mockCrypto.randomBytes.mockImplementation(() => {
        throw new Error('Crypto error')
      })

      expect(() => generateCSRFToken()).toThrow('Crypto error')
    })

    it('validates token length limits', () => {
      const veryLongToken = 'a'.repeat(10000)
      const isValid = validateCSRFToken(veryLongToken)

      expect(isValid).toBe(false)
    })
  })

  describe('Performance and Security', () => {
    it('generates tokens efficiently', () => {
      const startTime = Date.now()
      
      for (let i = 0; i < 100; i++) {
        generateCSRFToken()
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('validates tokens efficiently', () => {
      const tokens = Array.from({ length: 100 }, () => generateCSRFToken())
      
      const startTime = Date.now()
      
      tokens.forEach(token => validateCSRFToken(token))
      
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(1000)
    })

    it('uses secure random generation', () => {
      generateCSRFToken()

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32)
    })

    it('uses HMAC for token integrity', () => {
      generateCSRFToken()

      expect(mockCrypto.createHmac).toHaveBeenCalledWith('sha256', expect.any(String))
    })
  })
})