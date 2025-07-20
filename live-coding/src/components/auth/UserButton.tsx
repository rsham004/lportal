'use client'

import { UserButton as ClerkUserButton, useAuth } from '@clerk/nextjs'

interface UserButtonProps {
  afterSignOutUrl?: string
  showName?: boolean
  appearance?: {
    elements?: Record<string, string>
  }
}

export function UserButton({
  afterSignOutUrl = '/',
  showName = false,
  appearance,
}: UserButtonProps) {
  const { isSignedIn, isLoaded } = useAuth()

  // Don't render if user is not signed in
  if (!isSignedIn) {
    return null
  }

  // Show loading state if auth is not loaded
  if (!isLoaded) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    )
  }

  return (
    <ClerkUserButton
      afterSignOutUrl={afterSignOutUrl}
      showName={showName}
      appearance={{
        elements: {
          avatarBox: 'h-8 w-8',
          userButtonPopoverCard: 'bg-popover text-popover-foreground border border-border shadow-md',
          userButtonPopoverActions: 'bg-popover',
          userButtonPopoverActionButton: 'text-foreground hover:bg-accent hover:text-accent-foreground',
          userButtonPopoverActionButtonText: 'text-foreground',
          userButtonPopoverFooter: 'bg-popover border-t border-border',
          ...appearance?.elements,
        },
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorBackground: 'hsl(var(--popover))',
          colorText: 'hsl(var(--popover-foreground))',
          colorTextSecondary: 'hsl(var(--muted-foreground))',
          borderRadius: '0.5rem',
        },
        ...appearance,
      }}
    />
  )
}