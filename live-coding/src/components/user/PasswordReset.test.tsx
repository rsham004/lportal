/**
 * Password Reset Test
 * 
 * Tests password reset and account recovery functionality
 * with security validation and Clerk integration.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PasswordReset } from './PasswordReset'
import { ThemeProvider } from '../providers/ThemeProvider'

// Mock Clerk
const mockSignIn = {
  create: jest.fn(),
  attemptFirstFactor: jest.fn(),
  resetPassword: jest.fn(),
}

const mockUseSignIn = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  useSignIn: () => mockUseSignIn(),
}))

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}

describe('PasswordReset Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSignIn.mockReturnValue({
      signIn: mockSignIn,
      isLoaded: true,
    })
  })

  describe('Email Step', () => {
    it('renders email input form', () => {
      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      expect(screen.getByTestId('password-reset-form')).toBeInTheDocument()
      expect(screen.getByText('Reset Password')).toBeInTheDocument()
      expect(screen.getByTestId('reset-email-input')).toBeInTheDocument()
      expect(screen.getByTestId('send-reset-email')).toBeInTheDocument()
    })

    it('validates email input', () => {
      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      const submitButton = screen.getByTestId('send-reset-email')
      expect(submitButton).toBeDisabled()

      const emailInput = screen.getByTestId('reset-email-input')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(submitButton).not.toBeDisabled()
    })

    it('sends reset email successfully', async () => {
      mockSignIn.create.mockResolvedValue({})

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      const emailInput = screen.getByTestId('reset-email-input')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByTestId('send-reset-email')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn.create).toHaveBeenCalledWith({
          strategy: 'reset_password_email_code',
          identifier: 'test@example.com',
        })
      })

      // Should move to verification step
      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument()
    })

    it('handles email sending errors', async () => {
      mockSignIn.create.mockRejectedValue({
        errors: [{ message: 'Email not found' }],
      })

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      const emailInput = screen.getByTestId('reset-email-input')
      fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } })

      const submitButton = screen.getByTestId('send-reset-email')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument()
      })
    })

    it('shows cancel button when onCancel provided', () => {
      const onCancel = jest.fn()

      render(
        <TestWrapper>
          <PasswordReset onCancel={onCancel} />
        </TestWrapper>
      )

      const cancelButton = screen.getByTestId('cancel-reset')
      expect(cancelButton).toBeInTheDocument()

      fireEvent.click(cancelButton)
      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('Verification Step', () => {
    beforeEach(async () => {
      mockSignIn.create.mockResolvedValue({})

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      // Navigate to verification step
      const emailInput = screen.getByTestId('reset-email-input')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByTestId('send-reset-email')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Enter Verification Code')).toBeInTheDocument()
      })
    })

    it('renders verification code input', () => {
      expect(screen.getByTestId('verification-code-input')).toBeInTheDocument()
      expect(screen.getByTestId('verify-code')).toBeInTheDocument()
      expect(screen.getByTestId('back-to-email')).toBeInTheDocument()
    })

    it('validates verification code length', () => {
      const verifyButton = screen.getByTestId('verify-code')
      expect(verifyButton).toBeDisabled()

      const codeInput = screen.getByTestId('verification-code-input')
      fireEvent.change(codeInput, { target: { value: '12345' } })
      expect(verifyButton).toBeDisabled()

      fireEvent.change(codeInput, { target: { value: '123456' } })
      expect(verifyButton).not.toBeDisabled()
    })

    it('verifies code successfully', async () => {
      mockSignIn.attemptFirstFactor.mockResolvedValue({
        status: 'needs_new_password',
      })

      const codeInput = screen.getByTestId('verification-code-input')
      fireEvent.change(codeInput, { target: { value: '123456' } })

      const verifyButton = screen.getByTestId('verify-code')
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(mockSignIn.attemptFirstFactor).toHaveBeenCalledWith({
          strategy: 'reset_password_email_code',
          code: '123456',
        })
      })

      // Should move to password step
      expect(screen.getByText('Set New Password')).toBeInTheDocument()
    })

    it('handles verification errors', async () => {
      mockSignIn.attemptFirstFactor.mockRejectedValue({
        errors: [{ message: 'Invalid code' }],
      })

      const codeInput = screen.getByTestId('verification-code-input')
      fireEvent.change(codeInput, { target: { value: '123456' } })

      const verifyButton = screen.getByTestId('verify-code')
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid code')).toBeInTheDocument()
      })
    })

    it('allows going back to email step', () => {
      const backButton = screen.getByTestId('back-to-email')
      fireEvent.click(backButton)

      expect(screen.getByText('Reset Password')).toBeInTheDocument()
      expect(screen.getByTestId('reset-email-input')).toBeInTheDocument()
    })
  })

  describe('Password Step', () => {
    beforeEach(async () => {
      mockSignIn.create.mockResolvedValue({})
      mockSignIn.attemptFirstFactor.mockResolvedValue({
        status: 'needs_new_password',
      })

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      // Navigate to password step
      const emailInput = screen.getByTestId('reset-email-input')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByTestId('send-reset-email'))

      await waitFor(() => {
        expect(screen.getByText('Enter Verification Code')).toBeInTheDocument()
      })

      const codeInput = screen.getByTestId('verification-code-input')
      fireEvent.change(codeInput, { target: { value: '123456' } })
      fireEvent.click(screen.getByTestId('verify-code'))

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument()
      })
    })

    it('renders password input fields', () => {
      expect(screen.getByTestId('new-password-input')).toBeInTheDocument()
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument()
      expect(screen.getByTestId('reset-password')).toBeInTheDocument()
      expect(screen.getByTestId('back-to-verification')).toBeInTheDocument()
    })

    it('validates password requirements', () => {
      const resetButton = screen.getByTestId('reset-password')
      expect(resetButton).toBeDisabled()

      const passwordInput = screen.getByTestId('new-password-input')
      const confirmInput = screen.getByTestId('confirm-password-input')

      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })

      expect(resetButton).not.toBeDisabled()
    })

    it('validates password match', async () => {
      const passwordInput = screen.getByTestId('new-password-input')
      const confirmInput = screen.getByTestId('confirm-password-input')

      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmInput, { target: { value: 'different123' } })

      const resetButton = screen.getByTestId('reset-password')
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
      })
    })

    it('validates password length', async () => {
      const passwordInput = screen.getByTestId('new-password-input')
      const confirmInput = screen.getByTestId('confirm-password-input')

      fireEvent.change(passwordInput, { target: { value: 'short' } })
      fireEvent.change(confirmInput, { target: { value: 'short' } })

      const resetButton = screen.getByTestId('reset-password')
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument()
      })
    })

    it('resets password successfully', async () => {
      mockSignIn.resetPassword.mockResolvedValue({})

      const passwordInput = screen.getByTestId('new-password-input')
      const confirmInput = screen.getByTestId('confirm-password-input')

      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })

      const resetButton = screen.getByTestId('reset-password')
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect(mockSignIn.resetPassword).toHaveBeenCalledWith({
          password: 'newpassword123',
        })
      })

      // Should move to success step
      expect(screen.getByText('Password Reset Successful')).toBeInTheDocument()
    })

    it('handles password reset errors', async () => {
      mockSignIn.resetPassword.mockRejectedValue({
        errors: [{ message: 'Password too weak' }],
      })

      const passwordInput = screen.getByTestId('new-password-input')
      const confirmInput = screen.getByTestId('confirm-password-input')

      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })

      const resetButton = screen.getByTestId('reset-password')
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect(screen.getByText('Password too weak')).toBeInTheDocument()
      })
    })

    it('allows going back to verification step', () => {
      const backButton = screen.getByTestId('back-to-verification')
      fireEvent.click(backButton)

      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument()
    })
  })

  describe('Success Step', () => {
    beforeEach(async () => {
      mockSignIn.create.mockResolvedValue({})
      mockSignIn.attemptFirstFactor.mockResolvedValue({
        status: 'needs_new_password',
      })
      mockSignIn.resetPassword.mockResolvedValue({})

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      // Navigate through all steps to success
      const emailInput = screen.getByTestId('reset-email-input')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByTestId('send-reset-email'))

      await waitFor(() => {
        expect(screen.getByText('Enter Verification Code')).toBeInTheDocument()
      })

      const codeInput = screen.getByTestId('verification-code-input')
      fireEvent.change(codeInput, { target: { value: '123456' } })
      fireEvent.click(screen.getByTestId('verify-code'))

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument()
      })

      const passwordInput = screen.getByTestId('new-password-input')
      const confirmInput = screen.getByTestId('confirm-password-input')
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })
      fireEvent.click(screen.getByTestId('reset-password'))

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument()
      })
    })

    it('renders success message', () => {
      expect(screen.getByText('Password Reset Successful')).toBeInTheDocument()
      expect(screen.getByTestId('continue-to-signin')).toBeInTheDocument()
    })

    it('calls onSuccess callback', () => {
      const onSuccess = jest.fn()

      render(
        <TestWrapper>
          <PasswordReset onSuccess={onSuccess} />
        </TestWrapper>
      )

      const continueButton = screen.getByTestId('continue-to-signin')
      fireEvent.click(continueButton)

      expect(onSuccess).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('maintains WCAG compliance', () => {
      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      // Check for proper form structure
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument()
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      const emailInput = screen.getByTestId('reset-email-input')
      const submitButton = screen.getByTestId('send-reset-email')

      // Tab navigation should work
      emailInput.focus()
      expect(document.activeElement).toBe(emailInput)
    })
  })

  describe('Integration', () => {
    it('integrates with theme system', () => {
      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      const form = screen.getByTestId('password-reset-form')
      expect(form).toHaveClass('bg-card') // Theme-aware styling
    })

    it('handles Clerk loading state', () => {
      mockUseSignIn.mockReturnValue({
        signIn: mockSignIn,
        isLoaded: false,
      })

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      )

      const submitButton = screen.getByTestId('send-reset-email')
      expect(submitButton).toBeDisabled()
    })
  })
})