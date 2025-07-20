/**
 * User Registration Component
 * 
 * Handles user registration and onboarding flow with role assignment
 * and integration with existing authentication and authorization systems.
 */

'use client'

import React, { useState } from 'react'
import { SignUp } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import { Can } from '../authorization/Can'
import { Form } from '../ui/Form'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { UserRole } from '../../lib/authorization/roles'
import { auditHelpers } from '../../lib/authorization/audit'

interface UserRegistrationProps {
  showRoleSelection?: boolean
  showOnboarding?: boolean
  onRegistrationComplete?: (data: { user: any; role: UserRole }) => void
  onOnboardingComplete?: (data: { userId: string; profileData: any; preferences: any }) => void
  onRegistrationError?: (error: Error) => void
}

interface OnboardingStep {
  id: string
  title: string
  description: string
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Learning Portal!',
    description: 'Let\'s get you set up with your new account.',
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Tell us a bit about yourself and your learning goals.',
  },
  {
    id: 'preferences',
    title: 'Set Your Preferences',
    description: 'Customize your learning experience.',
  },
]

export function UserRegistration({
  showRoleSelection = false,
  showOnboarding = false,
  onRegistrationComplete,
  onOnboardingComplete,
  onRegistrationError,
}: UserRegistrationProps) {
  const { user, isLoaded } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [profileData, setProfileData] = useState({
    bio: '',
    learningGoals: '',
  })
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    theme: 'system',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegistrationComplete = async (clerkUser: any) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Log registration event
      auditHelpers.logLogin(clerkUser.user?.id || 'unknown', {
        action: 'registration',
        role: selectedRole,
      })

      if (onRegistrationComplete) {
        await onRegistrationComplete({
          user: clerkUser.user,
          role: selectedRole,
        })
      }

      setRegistrationComplete(true)

      if (showOnboarding) {
        setCurrentStep(0)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Registration failed')
      setError('Registration failed. Please try again.')
      if (onRegistrationError) {
        onRegistrationError(error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOnboardingNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleOnboardingComplete = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (onOnboardingComplete) {
        await onOnboardingComplete({
          userId: user?.id || 'unknown',
          profileData,
          preferences,
        })
      }
    } catch (err) {
      setError('Failed to complete onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!registrationComplete) {
      setError('Please complete the registration form')
      return
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Show onboarding if registration is complete and onboarding is enabled
  if (registrationComplete && showOnboarding) {
    const step = onboardingSteps[currentStep]

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">{step.title}</h1>
            <p className="text-muted-foreground mt-2">{step.description}</p>
            <div className="flex justify-center mt-4 space-x-2">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {step.id === 'welcome' && (
            <div data-testid="onboarding-welcome" className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <p className="text-lg text-muted-foreground">
                Your account has been created successfully! Let's personalize your experience.
              </p>
              <Button onClick={handleOnboardingNext} size="lg">
                Next
              </Button>
            </div>
          )}

          {step.id === 'profile' && (
            <div data-testid="onboarding-profile" className="space-y-6">
              <Form className="space-y-4">
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium mb-2">
                    Bio
                  </label>
                  <Input
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label htmlFor="learningGoals" className="block text-sm font-medium mb-2">
                    Learning Goals
                  </label>
                  <Input
                    id="learningGoals"
                    value={profileData.learningGoals}
                    onChange={(e) => setProfileData({ ...profileData, learningGoals: e.target.value })}
                    placeholder="What do you want to learn?"
                  />
                </div>
              </Form>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </Button>
                <Button onClick={handleOnboardingNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step.id === 'preferences' && (
            <div data-testid="onboarding-preferences" className="space-y-6">
              <Form className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={preferences.emailNotifications}
                    onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                    className="rounded border-border"
                  />
                  <label htmlFor="emailNotifications" className="text-sm font-medium">
                    Email Notifications
                  </label>
                </div>
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium mb-2">
                    Theme Preference
                  </label>
                  <select
                    id="theme"
                    value={preferences.theme}
                    onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                    className="w-full p-2 border border-border rounded-md bg-background"
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </Form>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </Button>
                <Button 
                  onClick={handleOnboardingComplete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Completing...' : 'Complete Onboarding'}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <Form data-testid="user-registration" onSubmit={handleFormSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">Create Your Account</h1>
            <p className="text-muted-foreground mt-2">
              Join Learning Portal and start your learning journey
            </p>
          </div>

          {/* Role Selection for Admins */}
          {showRoleSelection && (
            <Can action="manage" subject="User">
              <div data-testid="role-selection" className="space-y-3">
                <label className="block text-sm font-medium">Assign Role</label>
                <div className="space-y-2">
                  {[UserRole.STUDENT, UserRole.INSTRUCTOR].map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={role}
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        className="rounded border-border"
                      />
                      <label htmlFor={role} className="text-sm capitalize">
                        {role.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </Can>
          )}

          {/* Clerk SignUp Component */}
          <div className="space-y-4">
            <SignUp
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
                  card: 'bg-card text-card-foreground border border-border shadow-lg',
                  headerTitle: 'text-foreground',
                  headerSubtitle: 'text-muted-foreground',
                  socialButtonsBlockButton: 'border border-border bg-background text-foreground hover:bg-accent',
                  formFieldInput: 'border border-border bg-background text-foreground',
                  footerActionLink: 'text-primary hover:text-primary/80',
                },
              }}
              afterSignUpUrl="/dashboard"
              redirectUrl="/dashboard"
              onComplete={handleRegistrationComplete}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
        </Form>
      </Card>
    </div>
  )
}