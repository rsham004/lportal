/**
 * Secure Cookie Handling Test
 * 
 * TDD tests for secure cookie management with proper security attributes
 * and integration with authentication system.
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  SecureCookieManager, 
  createSecureCookie, 
  parseSecureCookie,
  CookieOptions,
  EncryptedCookieManager 
} from './secure-cookies'

// Mock crypto for consistent testing
const mockCrypto = {
  randomBytes: jest.fn(),
  createCipher: jest.fn(),
  createDecipher: jest.fn(),
  pbkdf2Sync: jest.fn(),
}

jest.mock('crypto', () => mockCrypto)

describe('Secure Cookie Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock crypto functions
    mockCrypto.randomBytes.mockImplementation((size: number) => {
      return Buffer.from('a'.repeat(size))
    })

    const mockCipher = {
      update: jest.fn().mockReturnValue('encrypted'),
      final: jest.fn().mockReturnValue('data'),
    }
    
    const mockDecipher = {
      update: jest.fn().mockReturnValue('decrypted'),
      final: jest.fn().mockReturnValue('data'),
    }

    mockCrypto.createCipher.mockReturnValue(mockCipher)
    mockCrypto.createDecipher.mockReturnValue(mockDecipher)
    mockCrypto.pbkdf2Sync.mockReturnValue(Buffer.from('derived-key'))
  })

  describe('SecureCookieManager', () => {
    let cookieManager: SecureCookieManager

    beforeEach(() => {
      cookieManager = new SecureCookieManager({
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        domain: 'example.com',
        path: '/',
      })
    })

    it('creates secure cookie manager with default options', () => {
      const defaultManager = new SecureCookieManager()
      const config = defaultManager.getConfig()

      expect(config.secure).toBe(true) // Should default to true in production
      expect(config.httpOnly).toBe(true)
      expect(config.sameSite).toBe('strict')
    })

    it('creates secure cookie manager with custom options', () => {
      const customOptions: CookieOptions = {
        secure: false,
        httpOnly: false,
        sameSite: 'lax',
        domain: 'custom.com',
        path: '/api',
        maxAge: 7200,
      }

      const customManager = new SecureCookieManager(customOptions)
      const config = customManager.getConfig()

      expect(config.secure).toBe(false)
      expect(config.httpOnly).toBe(false)
      expect(config.sameSite).toBe('lax')
      expect(config.domain).toBe('custom.com')
      expect(config.path).toBe('/api')
      expect(config.maxAge).toBe(7200)
    })

    it('sets secure cookie with proper attributes', () => {
      const response = new NextResponse()
      const value = 'test-value'
      const name = 'test-cookie'

      cookieManager.set(response, name, value)

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain(`${name}=${value}`)
      expect(setCookieHeader).toContain('Secure')
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader).toContain('SameSite=Strict')
      expect(setCookieHeader).toContain('Domain=example.com')
      expect(setCookieHeader).toContain('Path=/')
    })

    it('sets cookie with custom expiration', () => {
      const response = new NextResponse()
      const value = 'test-value'
      const name = 'test-cookie'
      const maxAge = 3600

      cookieManager.set(response, name, value, { maxAge })

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain(`Max-Age=${maxAge}`)
    })

    it('gets cookie value from request', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          cookie: 'test-cookie=test-value; other-cookie=other-value',
        },
      })

      const value = cookieManager.get(request, 'test-cookie')
      expect(value).toBe('test-value')
    })

    it('returns null for non-existent cookie', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          cookie: 'other-cookie=other-value',
        },
      })

      const value = cookieManager.get(request, 'non-existent')
      expect(value).toBeNull()
    })

    it('deletes cookie by setting expired date', () => {
      const response = new NextResponse()
      const name = 'test-cookie'

      cookieManager.delete(response, name)

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain(`${name}=`)
      expect(setCookieHeader).toContain('Max-Age=0')
      expect(setCookieHeader).toContain('Expires=Thu, 01 Jan 1970')
    })

    it('validates cookie security attributes', () => {
      const insecureOptions: CookieOptions = {
        secure: false,
        httpOnly: false,
        sameSite: 'none',
      }

      const warnings = cookieManager.validateSecurity(insecureOptions)

      expect(warnings).toContain('Cookie should be Secure in production')
      expect(warnings).toContain('Cookie should be HttpOnly for security')
      expect(warnings).toContain('SameSite=None requires Secure flag')
    })

    it('passes security validation for secure cookies', () => {
      const secureOptions: CookieOptions = {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
      }

      const warnings = cookieManager.validateSecurity(secureOptions)

      expect(warnings).toHaveLength(0)
    })
  })

  describe('EncryptedCookieManager', () => {
    let encryptedManager: EncryptedCookieManager

    beforeEach(() => {
      encryptedManager = new EncryptedCookieManager({
        encryptionKey: 'test-encryption-key-32-characters',
        secure: true,
        httpOnly: true,
      })
    })

    it('creates encrypted cookie manager with encryption key', () => {
      expect(encryptedManager).toBeInstanceOf(EncryptedCookieManager)
    })

    it('encrypts cookie values before setting', () => {
      const response = new NextResponse()
      const value = 'sensitive-data'
      const name = 'encrypted-cookie'

      encryptedManager.setEncrypted(response, name, value)

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain(`${name}=`)
      expect(setCookieHeader).not.toContain(value) // Original value should not appear
    })

    it('decrypts cookie values when getting', () => {
      // Mock the encryption/decryption process
      const originalValue = 'sensitive-data'
      const encryptedValue = 'encrypted-sensitive-data'

      const request = new NextRequest('http://localhost:3000', {
        headers: {
          cookie: `encrypted-cookie=${encryptedValue}`,
        },
      })

      const decryptedValue = encryptedManager.getDecrypted(request, 'encrypted-cookie')
      expect(decryptedValue).toBe('decrypteddata') // Based on mock implementation
    })

    it('handles encryption errors gracefully', () => {
      mockCrypto.createCipher.mockImplementation(() => {
        throw new Error('Encryption failed')
      })

      const response = new NextResponse()
      
      expect(() => {
        encryptedManager.setEncrypted(response, 'test', 'value')
      }).toThrow('Encryption failed')
    })

    it('handles decryption errors gracefully', () => {
      mockCrypto.createDecipher.mockImplementation(() => {
        throw new Error('Decryption failed')
      })

      const request = new NextRequest('http://localhost:3000', {
        headers: {
          cookie: 'encrypted-cookie=invalid-encrypted-data',
        },
      })

      const result = encryptedManager.getDecrypted(request, 'encrypted-cookie')
      expect(result).toBeNull()
    })

    it('generates secure encryption keys', () => {
      const key = EncryptedCookieManager.generateKey()
      
      expect(key).toBeDefined()
      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)
    })

    it('validates encryption key strength', () => {
      const weakKey = 'weak'
      const strongKey = 'strong-encryption-key-32-characters'

      expect(() => new EncryptedCookieManager({ encryptionKey: weakKey }))
        .toThrow('Encryption key must be at least 32 characters')

      expect(() => new EncryptedCookieManager({ encryptionKey: strongKey }))
        .not.toThrow()
    })
  })

  describe('Cookie Utility Functions', () => {
    it('creates secure cookie string with all attributes', () => {
      const options: CookieOptions = {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        domain: 'example.com',
        path: '/api',
        maxAge: 3600,
      }

      const cookieString = createSecureCookie('test-cookie', 'test-value', options)

      expect(cookieString).toContain('test-cookie=test-value')
      expect(cookieString).toContain('Secure')
      expect(cookieString).toContain('HttpOnly')
      expect(cookieString).toContain('SameSite=Strict')
      expect(cookieString).toContain('Domain=example.com')
      expect(cookieString).toContain('Path=/api')
      expect(cookieString).toContain('Max-Age=3600')
    })

    it('creates cookie string with minimal attributes', () => {
      const cookieString = createSecureCookie('simple-cookie', 'simple-value')

      expect(cookieString).toContain('simple-cookie=simple-value')
      expect(cookieString).toContain('Secure')
      expect(cookieString).toContain('HttpOnly')
      expect(cookieString).toContain('SameSite=Strict')
    })

    it('parses cookie string correctly', () => {
      const cookieString = 'name1=value1; name2=value2; name3=value3'
      const cookies = parseSecureCookie(cookieString)

      expect(cookies).toEqual({
        name1: 'value1',
        name2: 'value2',
        name3: 'value3',
      })
    })

    it('handles empty cookie string', () => {
      const cookies = parseSecureCookie('')
      expect(cookies).toEqual({})
    })

    it('handles malformed cookie string', () => {
      const cookieString = 'malformed; =value; name='
      const cookies = parseSecureCookie(cookieString)

      expect(cookies).toEqual({
        name: '',
      })
    })

    it('handles URL-encoded cookie values', () => {
      const cookieString = 'encoded=hello%20world; special=test%3Dvalue'
      const cookies = parseSecureCookie(cookieString)

      expect(cookies).toEqual({
        encoded: 'hello world',
        special: 'test=value',
      })
    })
  })

  describe('Integration with Authentication', () => {
    let cookieManager: SecureCookieManager

    beforeEach(() => {
      cookieManager = new SecureCookieManager({
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
      })
    })

    it('manages session cookies securely', () => {
      const response = new NextResponse()
      const sessionId = 'session_abc123'

      cookieManager.setSession(response, sessionId, {
        maxAge: 86400, // 24 hours
        path: '/',
      })

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain(`session=${sessionId}`)
      expect(setCookieHeader).toContain('Max-Age=86400')
      expect(setCookieHeader).toContain('Secure')
      expect(setCookieHeader).toContain('HttpOnly')
    })

    it('manages CSRF token cookies', () => {
      const response = new NextResponse()
      const csrfToken = 'csrf_token_xyz789'

      cookieManager.setCSRFToken(response, csrfToken)

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain(`csrf-token=${csrfToken}`)
      expect(setCookieHeader).toContain('Secure')
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader).toContain('SameSite=Strict')
    })

    it('manages user preference cookies', () => {
      const response = new NextResponse()
      const preferences = { theme: 'dark', language: 'en' }

      cookieManager.setUserPreferences(response, preferences, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: false, // Preferences can be read by client
      })

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('user-preferences=')
      expect(setCookieHeader).toContain('Max-Age=31536000')
      expect(setCookieHeader).not.toContain('HttpOnly')
    })

    it('clears authentication cookies on logout', () => {
      const response = new NextResponse()

      cookieManager.clearAuthCookies(response)

      const setCookieHeaders = response.headers.getSetCookie()
      expect(setCookieHeaders.some(header => header.includes('session=') && header.includes('Max-Age=0'))).toBe(true)
      expect(setCookieHeaders.some(header => header.includes('csrf-token=') && header.includes('Max-Age=0'))).toBe(true)
    })

    it('validates cookie security in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const insecureManager = new SecureCookieManager({
        secure: false,
        httpOnly: false,
      })

      const warnings = insecureManager.validateSecurity()
      expect(warnings.length).toBeGreaterThan(0)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Security Features', () => {
    it('prevents cookie injection attacks', () => {
      const maliciousValue = 'value; Path=/; Domain=evil.com'
      const cookieString = createSecureCookie('test', maliciousValue)

      // Should escape or reject malicious characters
      expect(cookieString).not.toContain('Domain=evil.com')
    })

    it('enforces secure attributes in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const cookieString = createSecureCookie('prod-cookie', 'value')

      expect(cookieString).toContain('Secure')
      expect(cookieString).toContain('HttpOnly')

      process.env.NODE_ENV = originalEnv
    })

    it('allows insecure cookies in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const cookieString = createSecureCookie('dev-cookie', 'value', {
        secure: false,
      })

      expect(cookieString).not.toContain('Secure')

      process.env.NODE_ENV = originalEnv
    })

    it('implements cookie size limits', () => {
      const largeValue = 'x'.repeat(5000) // Larger than typical cookie limit
      
      expect(() => {
        createSecureCookie('large-cookie', largeValue)
      }).toThrow('Cookie value exceeds maximum size')
    })

    it('validates cookie name format', () => {
      const invalidNames = ['invalid name', 'invalid;name', 'invalid=name']
      
      invalidNames.forEach(name => {
        expect(() => {
          createSecureCookie(name, 'value')
        }).toThrow('Invalid cookie name')
      })
    })

    it('sanitizes cookie values', () => {
      const unsafeValue = 'value\r\nSet-Cookie: malicious=true'
      const cookieString = createSecureCookie('safe', unsafeValue)

      expect(cookieString).not.toContain('\r\n')
      expect(cookieString).not.toContain('malicious=true')
    })
  })

  describe('Performance and Monitoring', () => {
    it('measures cookie operations performance', () => {
      const cookieManager = new SecureCookieManager()
      const response = new NextResponse()

      const startTime = Date.now()
      
      for (let i = 0; i < 100; i++) {
        cookieManager.set(response, `cookie${i}`, `value${i}`)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(1000) // Should complete quickly
    })

    it('provides cookie usage statistics', () => {
      const cookieManager = new SecureCookieManager()
      const stats = cookieManager.getStats()

      expect(stats).toHaveProperty('cookiesSet')
      expect(stats).toHaveProperty('cookiesRead')
      expect(stats).toHaveProperty('securityViolations')
    })

    it('tracks security violations', () => {
      const cookieManager = new SecureCookieManager()
      
      // Attempt to set insecure cookie
      try {
        cookieManager.validateSecurity({ secure: false, httpOnly: false })
      } catch (error) {
        // Expected
      }

      const stats = cookieManager.getStats()
      expect(stats.securityViolations).toBeGreaterThan(0)
    })
  })
})