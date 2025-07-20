'use client'

import { SignInButton as ClerkSignInButton, useAuth } from '@clerk/nextjs'
import { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

interface SignInButtonProps {
  children?: ReactNode
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onClick?: () => void
  redirectUrl?: string
  mode?: 'redirect' | 'modal'
}

export function SignInButton({
  children,
  className,
  variant = 'default',
  size = 'default',
  onClick,
  redirectUrl,
  mode = 'redirect',
}: SignInButtonProps) {
  const { isSignedIn, isLoaded } = useAuth()

  // Don't render if user is already signed in
  if (isSignedIn) {
    return null
  }

  // Show loading state if auth is not loaded
  if (!isLoaded) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        Loading...
      </Button>
    )
  }

  return (
    <ClerkSignInButton
      mode={mode}
      redirectUrl={redirectUrl}
      afterSignInUrl={redirectUrl || '/dashboard'}
    >
      <Button
        variant={variant}
        size={size}
        className={cn('cursor-pointer', className)}
        onClick={onClick}
      >
        {children || 'Sign In'}
      </Button>
    </ClerkSignInButton>
  )
}