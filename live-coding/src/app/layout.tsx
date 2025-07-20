import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { PWAProvider } from '@/components/pwa/PWAProvider'
import { EdgeCacheProvider } from '@/components/pwa/EdgeCacheProvider'
import { MobileOptimization } from '@/components/pwa/MobileOptimization'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Learning Portal',
  description: 'Advanced learning platform with offline capabilities',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Learning Portal',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Learning Portal',
    title: 'Learning Portal',
    description: 'Advanced learning platform with offline capabilities',
  },
  twitter: {
    card: 'summary',
    title: 'Learning Portal',
    description: 'Advanced learning platform with offline capabilities',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Learning Portal" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            enableSystem
            disableTransitionOnChange
          >
            <PWAProvider>
              <EdgeCacheProvider>
                <MobileOptimization>
                  {children}
                  <OfflineIndicator />
                  <InstallPrompt />
                </MobileOptimization>
              </EdgeCacheProvider>
            </PWAProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}