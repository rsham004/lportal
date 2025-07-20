import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/',
    '/about',
    '/contact',
    '/courses',
    '/courses/(.*)',
    '/api/health',
    '/sign-in(.*)',
    '/sign-up(.*)',
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    '/api/webhooks(.*)',
    '/_next(.*)',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
  // Routes that require authentication
  protectedRoutes: [
    '/dashboard(.*)',
    '/profile(.*)',
    '/settings(.*)',
    '/admin(.*)',
  ],
  // Redirect to sign-in page after sign out
  afterSignOutUrl: '/',
  // Redirect to dashboard after sign in
  afterSignInUrl: '/dashboard',
  // Redirect to dashboard after sign up
  afterSignUpUrl: '/dashboard',
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}