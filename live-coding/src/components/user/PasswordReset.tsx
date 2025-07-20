/**
 * Password Reset Component
 * 
 * Provides password reset and account recovery functionality
 * with security validation and integration with Clerk authentication.
 */

'use client'

import React, { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Form, FormField, FormLabel, FormError, FormDescription } from '../ui/Form'

export interface PasswordResetProps {
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

type ResetStep = 'email' | 'verification' | 'newPassword' | 'success'

export function PasswordReset({
  onSuccess,
  onCancel,
  className = '',
}: PasswordResetProps) {
  const { signIn, isLoaded } = useSignIn()
  
  const [step, setStep] = useState<ResetStep>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setIsSubmitting(true)
    setError('')

    try {
      // Start password reset flow with Clerk
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      
      setStep('verification')
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setIsSubmitting(true)
    setError('')

    try {
      // Verify the reset code
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: verificationCode,
      })

      if (result.status === 'needs_new_password') {
        setStep('newPassword')
      } else {
        setError('Verification failed. Please check your code and try again.')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Set the new password
      await signIn.resetPassword({
        password: newPassword,
      })

      setStep('success')
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderEmailStep = () => (
    <Form onSubmit={handleEmailSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
        <p className="text-muted-foreground mt-2">
          Enter your email address and we'll send you a verification code.
        </p>
      </div>

      <FormField>
        <FormLabel htmlFor="reset-email">Email Address</FormLabel>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          required
          disabled={isSubmitting}
          data-testid="reset-email-input"
        />
        <FormDescription>
          We'll send a verification code to this email address.
        </FormDescription>
      </FormField>

      {error && <FormError>{error}</FormError>}

      <div className="flex space-x-3">
        <Button
          type="submit"
          disabled={isSubmitting || !email}
          className="flex-1"
          data-testid="send-reset-email"
        >
          {isSubmitting ? 'Sending...' : 'Send Reset Code'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            data-testid="cancel-reset"
          >
            Cancel
          </Button>
        )}
      </div>
    </Form>
  )

  const renderVerificationStep = () => (
    <Form onSubmit={handleVerificationSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Enter Verification Code</h2>
        <p className="text-muted-foreground mt-2">
          We sent a verification code to <strong>{email}</strong>
        </p>
      </div>

      <FormField>
        <FormLabel htmlFor="verification-code">Verification Code</FormLabel>
        <Input
          id="verification-code"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter 6-digit code"
          maxLength={6}
          required
          disabled={isSubmitting}
          data-testid="verification-code-input"
        />
        <FormDescription>
          Check your email for the 6-digit verification code.
        </FormDescription>
      </FormField>

      {error && <FormError>{error}</FormError>}

      <div className="flex space-x-3">
        <Button
          type="submit"
          disabled={isSubmitting || verificationCode.length !== 6}
          className="flex-1"
          data-testid="verify-code"
        >
          {isSubmitting ? 'Verifying...' : 'Verify Code'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('email')}
          disabled={isSubmitting}
          data-testid="back-to-email"
        >
          Back
        </Button>
      </div>
    </Form>
  )

  const renderPasswordStep = () => (
    <Form onSubmit={handlePasswordSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Set New Password</h2>
        <p className="text-muted-foreground mt-2">
          Choose a strong password for your account.
        </p>
      </div>

      <FormField>
        <FormLabel htmlFor="new-password">New Password</FormLabel>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          minLength={8}
          required
          disabled={isSubmitting}
          data-testid="new-password-input"
        />
        <FormDescription>
          Password must be at least 8 characters long.
        </FormDescription>
      </FormField>

      <FormField>
        <FormLabel htmlFor="confirm-password">Confirm Password</FormLabel>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          minLength={8}
          required
          disabled={isSubmitting}
          data-testid="confirm-password-input"
        />
        <FormDescription>
          Re-enter your new password to confirm.
        </FormDescription>
      </FormField>

      {error && <FormError>{error}</FormError>}

      <div className="flex space-x-3">
        <Button
          type="submit"
          disabled={isSubmitting || !newPassword || !confirmPassword}
          className="flex-1"
          data-testid="reset-password"
        >
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('verification')}
          disabled={isSubmitting}
          data-testid="back-to-verification"
        >
          Back
        </Button>
      </div>
    </Form>
  )

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto">
        <svg
          className="w-8 h-8 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-foreground">Password Reset Successful</h2>
      <p className="text-muted-foreground">
        Your password has been successfully reset. You can now sign in with your new password.
      </p>
      
      <Button
        onClick={onSuccess}
        className="mt-6"
        data-testid="continue-to-signin"
      >
        Continue to Sign In
      </Button>
    </div>
  )

  return (
    <Card 
      className={`max-w-md mx-auto p-6 ${className}`}
      data-testid="password-reset-form"
    >
      {step === 'email' && renderEmailStep()}
      {step === 'verification' && renderVerificationStep()}
      {step === 'newPassword' && renderPasswordStep()}
      {step === 'success' && renderSuccessStep()}
    </Card>
  )
}