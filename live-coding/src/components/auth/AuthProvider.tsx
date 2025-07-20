'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    console.warn('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable')
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined, // Will be set based on theme context
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorBackground: 'hsl(var(--background))',
          colorInputBackground: 'hsl(var(--background))',
          colorInputText: 'hsl(var(--foreground))',
          colorText: 'hsl(var(--foreground))',
          colorTextSecondary: 'hsl(var(--muted-foreground))',
          colorDanger: 'hsl(var(--destructive))',
          colorSuccess: 'hsl(var(--success))',
          colorWarning: 'hsl(var(--warning))',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
          card: 'bg-card text-card-foreground border border-border',
          headerTitle: 'text-foreground',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 'border border-border bg-background text-foreground hover:bg-accent',
          formFieldInput: 'border border-border bg-background text-foreground',
          footerActionLink: 'text-primary hover:text-primary/80',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}