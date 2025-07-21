import { APP_CONFIG, ROUTES, API_ENDPOINTS, UI_CONFIG, PERFORMANCE, CACHE_DURATION } from './constants'

// Mock environment variables for testing
jest.mock('./env', () => ({
  env: {
    NEXT_PUBLIC_APP_NAME: 'Test Learning Portal',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Test description',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/test-sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/test-sign-up',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/test-dashboard',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/test-onboarding',
  }
}))

describe('Constants', () => {
  describe('APP_CONFIG', () => {
    it('has correct application configuration', () => {
      expect(APP_CONFIG.name).toBe('Test Learning Portal')
      expect(APP_CONFIG.description).toBe('Test description')
      expect(APP_CONFIG.url).toBe('http://localhost:3000')
      expect(APP_CONFIG.version).toBeDefined()
    })

    it('is immutable', () => {
      expect(() => {
        // @ts-expect-error - Testing immutability
        APP_CONFIG.name = 'Modified'
      }).toThrow()
    })
  })

  describe('ROUTES', () => {
    it('has all required routes', () => {
      expect(ROUTES.HOME).toBe('/')
      expect(ROUTES.DASHBOARD).toBe('/dashboard')
      expect(ROUTES.COURSES).toBe('/courses')
      expect(ROUTES.PROFILE).toBe('/profile')
      expect(ROUTES.SIGN_IN).toBe('/test-sign-in')
      expect(ROUTES.SIGN_UP).toBe('/test-sign-up')
      expect(ROUTES.AFTER_SIGN_IN).toBe('/test-dashboard')
      expect(ROUTES.AFTER_SIGN_UP).toBe('/test-onboarding')
    })

    it('is immutable', () => {
      expect(() => {
        // @ts-expect-error - Testing immutability
        ROUTES.HOME = '/modified'
      }).toThrow()
    })
  })

  describe('API_ENDPOINTS', () => {
    it('has all required API endpoints', () => {
      expect(API_ENDPOINTS.GRAPHQL).toBe('/api/graphql')
      expect(API_ENDPOINTS.AUTH).toBe('/api/auth')
      expect(API_ENDPOINTS.WEBHOOKS).toBe('/api/webhooks')
      expect(API_ENDPOINTS.HEALTH).toBe('/api/health')
    })

    it('all endpoints start with /api', () => {
      Object.values(API_ENDPOINTS).forEach(endpoint => {
        expect(endpoint).toMatch(/^\/api\//)
      })
    })
  })

  describe('UI_CONFIG', () => {
    it('has correct UI configuration values', () => {
      expect(UI_CONFIG.HEADER_HEIGHT).toBe(64)
      expect(UI_CONFIG.SIDEBAR_WIDTH).toBe(256)
      expect(UI_CONFIG.MOBILE_BREAKPOINT).toBe(768)
      expect(UI_CONFIG.ANIMATION_DURATION).toBe(200)
    })

    it('has numeric values', () => {
      Object.values(UI_CONFIG).forEach(value => {
        expect(typeof value).toBe('number')
        expect(value).toBeGreaterThan(0)
      })
    })
  })

  describe('PERFORMANCE', () => {
    it('has correct Lighthouse thresholds', () => {
      expect(PERFORMANCE.LIGHTHOUSE_THRESHOLDS.PERFORMANCE).toBe(90)
      expect(PERFORMANCE.LIGHTHOUSE_THRESHOLDS.ACCESSIBILITY).toBe(90)
      expect(PERFORMANCE.LIGHTHOUSE_THRESHOLDS.BEST_PRACTICES).toBe(90)
      expect(PERFORMANCE.LIGHTHOUSE_THRESHOLDS.SEO).toBe(90)
      expect(PERFORMANCE.LIGHTHOUSE_THRESHOLDS.PWA).toBe(80)
    })

    it('has correct Core Web Vitals', () => {
      expect(PERFORMANCE.CORE_WEB_VITALS.LCP).toBe(2500)
      expect(PERFORMANCE.CORE_WEB_VITALS.FID).toBe(100)
      expect(PERFORMANCE.CORE_WEB_VITALS.CLS).toBe(0.1)
    })

    it('has realistic performance values', () => {
      // LCP should be in milliseconds and reasonable
      expect(PERFORMANCE.CORE_WEB_VITALS.LCP).toBeGreaterThan(1000)
      expect(PERFORMANCE.CORE_WEB_VITALS.LCP).toBeLessThan(5000)
      
      // FID should be in milliseconds and low
      expect(PERFORMANCE.CORE_WEB_VITALS.FID).toBeGreaterThan(0)
      expect(PERFORMANCE.CORE_WEB_VITALS.FID).toBeLessThan(300)
      
      // CLS should be a small decimal
      expect(PERFORMANCE.CORE_WEB_VITALS.CLS).toBeGreaterThan(0)
      expect(PERFORMANCE.CORE_WEB_VITALS.CLS).toBeLessThan(1)
    })
  })

  describe('CACHE_DURATION', () => {
    it('has correct cache durations in seconds', () => {
      expect(CACHE_DURATION.STATIC_ASSETS).toBe(31536000) // 1 year
      expect(CACHE_DURATION.API_RESPONSES).toBe(300)      // 5 minutes
      expect(CACHE_DURATION.USER_SESSION).toBe(3600)      // 1 hour
      expect(CACHE_DURATION.COURSE_DATA).toBe(1800)       // 30 minutes
    })

    it('has reasonable cache durations', () => {
      // Static assets should have long cache
      expect(CACHE_DURATION.STATIC_ASSETS).toBeGreaterThan(86400) // > 1 day
      
      // API responses should have short cache
      expect(CACHE_DURATION.API_RESPONSES).toBeLessThan(3600) // < 1 hour
      
      // All durations should be positive
      Object.values(CACHE_DURATION).forEach(duration => {
        expect(duration).toBeGreaterThan(0)
      })
    })

    it('has logical cache hierarchy', () => {
      // Static assets should cache longest
      expect(CACHE_DURATION.STATIC_ASSETS).toBeGreaterThan(CACHE_DURATION.USER_SESSION)
      expect(CACHE_DURATION.STATIC_ASSETS).toBeGreaterThan(CACHE_DURATION.COURSE_DATA)
      expect(CACHE_DURATION.STATIC_ASSETS).toBeGreaterThan(CACHE_DURATION.API_RESPONSES)
      
      // User session should be longer than course data
      expect(CACHE_DURATION.USER_SESSION).toBeGreaterThan(CACHE_DURATION.COURSE_DATA)
      
      // Course data should be longer than API responses
      expect(CACHE_DURATION.COURSE_DATA).toBeGreaterThan(CACHE_DURATION.API_RESPONSES)
    })
  })
})