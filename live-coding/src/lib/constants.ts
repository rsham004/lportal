import { env } from './env'

// Application constants
export const APP_CONFIG = {
  name: env.NEXT_PUBLIC_APP_NAME,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION || 'High-performance learning platform',
  url: env.NEXT_PUBLIC_APP_URL,
  version: process.env.npm_package_version || '1.0.0',
} as const

// Route constants
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  PROFILE: '/profile',
  SIGN_IN: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  SIGN_UP: env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  AFTER_SIGN_IN: env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  AFTER_SIGN_UP: env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
} as const

// API endpoints
export const API_ENDPOINTS = {
  GRAPHQL: '/api/graphql',
  AUTH: '/api/auth',
  WEBHOOKS: '/api/webhooks',
  HEALTH: '/api/health',
} as const

// UI constants
export const UI_CONFIG = {
  HEADER_HEIGHT: 64,
  SIDEBAR_WIDTH: 256,
  MOBILE_BREAKPOINT: 768,
  ANIMATION_DURATION: 200,
} as const

// Performance constants
export const PERFORMANCE = {
  LIGHTHOUSE_THRESHOLDS: {
    PERFORMANCE: 90,
    ACCESSIBILITY: 90,
    BEST_PRACTICES: 90,
    SEO: 90,
    PWA: 80,
  },
  CORE_WEB_VITALS: {
    LCP: 2500, // ms
    FID: 100,  // ms
    CLS: 0.1,  // score
  },
} as const

// Cache durations (in seconds)
export const CACHE_DURATION = {
  STATIC_ASSETS: 31536000, // 1 year
  API_RESPONSES: 300,      // 5 minutes
  USER_SESSION: 3600,      // 1 hour
  COURSE_DATA: 1800,       // 30 minutes
} as const