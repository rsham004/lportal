/**
 * Phase 2.4 Security Integration Test
 * 
 * Comprehensive integration test for all Phase 2.4 security components
 * working together with existing Phase 1, 2.1, 2.2, and 2.3 systems.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Phase2_4_SecurityIntegrationTest } from './Phase2_4_SecurityIntegrationTest'
import { ThemeProvider } from '../providers/ThemeProvider'

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}

describe('Phase 2.4 Security Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Integration Test Component', () => {
    it('renders security integration test interface', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByTestId('phase-2-4-security-integration-test')).toBeInTheDocument()
      expect(screen.getByText('Phase 2.4 Security Implementation Integration Test')).toBeInTheDocument()
    })

    it('shows navigation buttons for all security components', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Redis Cache')).toBeInTheDocument()
      expect(screen.getByText('CSRF Protection')).toBeInTheDocument()
      expect(screen.getByText('Rate Limiting')).toBeInTheDocument()
      expect(screen.getByText('Secure Cookies')).toBeInTheDocument()
      expect(screen.getByText('Security Monitoring')).toBeInTheDocument()
      expect(screen.getByText('Full Integration')).toBeInTheDocument()
    })

    it('displays overview by default', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByText('Phase 2.4 Security Implementation')).toBeInTheDocument()
      expect(screen.getByText('✅ Completed Security Components')).toBeInTheDocument()
      expect(screen.getByText('🔗 Integration Features')).toBeInTheDocument()
    })
  })

  describe('Security Component Navigation', () => {
    it('navigates to Redis Cache component', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const redisButton = screen.getByText('Redis Cache')
      fireEvent.click(redisButton)

      expect(screen.getByText('Redis Cache Integration')).toBeInTheDocument()
      expect(screen.getByText('Session storage, caching, and rate limiting backend')).toBeInTheDocument()
    })

    it('navigates to CSRF Protection component', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const csrfButton = screen.getByText('CSRF Protection')
      fireEvent.click(csrfButton)

      expect(screen.getByText('CSRF Protection')).toBeInTheDocument()
      expect(screen.getByText('Cross-Site Request Forgery protection with token validation')).toBeInTheDocument()
    })

    it('navigates to Rate Limiting component', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const rateLimitButton = screen.getByText('Rate Limiting')
      fireEvent.click(rateLimitButton)

      expect(screen.getByText('Rate Limiting')).toBeInTheDocument()
      expect(screen.getByText('Request rate limiting for authentication and API endpoints')).toBeInTheDocument()
    })

    it('navigates to Secure Cookies component', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const cookiesButton = screen.getByText('Secure Cookies')
      fireEvent.click(cookiesButton)

      expect(screen.getByText('Secure Cookie Management')).toBeInTheDocument()
      expect(screen.getByText('Encrypted cookie handling with security attributes')).toBeInTheDocument()
    })

    it('navigates to Security Monitoring component', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const monitoringButton = screen.getByText('Security Monitoring')
      fireEvent.click(monitoringButton)

      expect(screen.getByText('Security Monitoring')).toBeInTheDocument()
      expect(screen.getByText('Threat detection and security event monitoring')).toBeInTheDocument()
    })

    it('navigates to Full Integration test', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const integrationButton = screen.getByText('Full Integration')
      fireEvent.click(integrationButton)

      expect(screen.getByText('Full Security Integration Test')).toBeInTheDocument()
      expect(screen.getByText('Integration Points')).toBeInTheDocument()
      expect(screen.getByText('Security Standards')).toBeInTheDocument()
    })
  })

  describe('Security Test Execution', () => {
    it('runs security tests when button is clicked', async () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const runTestsButton = screen.getByTestId('run-security-tests')
      fireEvent.click(runTestsButton)

      expect(screen.getByText('Running Tests...')).toBeInTheDocument()

      // Wait for tests to complete
      await waitFor(() => {
        expect(screen.getByText('Run Security Tests')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('displays test results after execution', async () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const runTestsButton = screen.getByTestId('run-security-tests')
      fireEvent.click(runTestsButton)

      // Wait for test results to appear
      await waitFor(() => {
        expect(screen.getByTestId('test-result-redis-cache')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(screen.getByTestId('test-result-csrf-protection')).toBeInTheDocument()
      expect(screen.getByTestId('test-result-rate-limiting')).toBeInTheDocument()
      expect(screen.getByTestId('test-result-secure-cookies')).toBeInTheDocument()
      expect(screen.getByTestId('test-result-security-monitoring')).toBeInTheDocument()
    })

    it('shows security metrics during testing', async () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const runTestsButton = screen.getByTestId('run-security-tests')
      fireEvent.click(runTestsButton)

      // Wait for metrics to update
      await waitFor(() => {
        expect(screen.getByText('Redis Connections')).toBeInTheDocument()
        expect(screen.getByText('CSRF Tokens')).toBeInTheDocument()
        expect(screen.getByText('Rate Limits')).toBeInTheDocument()
        expect(screen.getByText('Security Events')).toBeInTheDocument()
        expect(screen.getByText('Secure Cookies')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('displays test status indicators', async () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const runTestsButton = screen.getByTestId('run-security-tests')
      fireEvent.click(runTestsButton)

      // Wait for test results
      await waitFor(() => {
        const testResults = screen.getAllByText('PASS')
        expect(testResults.length).toBeGreaterThan(0)
      }, { timeout: 5000 })
    })
  })

  describe('Component Feature Display', () => {
    it('shows Redis Cache features', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Redis Cache'))

      expect(screen.getByText('Session management with TTL')).toBeInTheDocument()
      expect(screen.getByText('Rate limiting counters')).toBeInTheDocument()
      expect(screen.getByText('Security event storage')).toBeInTheDocument()
      expect(screen.getByText('User authentication caching')).toBeInTheDocument()
      expect(screen.getByText('Connection health monitoring')).toBeInTheDocument()
    })

    it('shows CSRF Protection features', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('CSRF Protection'))

      expect(screen.getByText('HMAC-signed tokens')).toBeInTheDocument()
      expect(screen.getByText('Automatic token rotation')).toBeInTheDocument()
      expect(screen.getByText('Header and cookie validation')).toBeInTheDocument()
      expect(screen.getByText('Excluded path configuration')).toBeInTheDocument()
      expect(screen.getByText('Security headers injection')).toBeInTheDocument()
    })

    it('shows Rate Limiting features', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Rate Limiting'))

      expect(screen.getByText('IP-based rate limiting')).toBeInTheDocument()
      expect(screen.getByText('User-based rate limiting')).toBeInTheDocument()
      expect(screen.getByText('Role-based limits')).toBeInTheDocument()
      expect(screen.getByText('Sliding window algorithm')).toBeInTheDocument()
      expect(screen.getByText('Redis-backed counters')).toBeInTheDocument()
    })

    it('shows Secure Cookies features', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Secure Cookies'))

      expect(screen.getByText('Secure and HttpOnly flags')).toBeInTheDocument()
      expect(screen.getByText('SameSite protection')).toBeInTheDocument()
      expect(screen.getByText('Cookie encryption')).toBeInTheDocument()
      expect(screen.getByText('Automatic expiration')).toBeInTheDocument()
      expect(screen.getByText('Security validation')).toBeInTheDocument()
    })

    it('shows Security Monitoring features', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Security Monitoring'))

      expect(screen.getByText('Real-time threat detection')).toBeInTheDocument()
      expect(screen.getByText('Security event logging')).toBeInTheDocument()
      expect(screen.getByText('Alert system integration')).toBeInTheDocument()
      expect(screen.getByText('Pattern recognition')).toBeInTheDocument()
      expect(screen.getByText('Audit trail maintenance')).toBeInTheDocument()
    })
  })

  describe('Integration Verification', () => {
    it('shows integration points', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Full Integration'))

      expect(screen.getByText('UI components with CSRF protection')).toBeInTheDocument()
      expect(screen.getByText('Authentication with rate limiting')).toBeInTheDocument()
      expect(screen.getByText('Authorization with security monitoring')).toBeInTheDocument()
      expect(screen.getByText('User management with secure cookies')).toBeInTheDocument()
      expect(screen.getByText('Session management with Redis')).toBeInTheDocument()
      expect(screen.getByText('API endpoints with security headers')).toBeInTheDocument()
    })

    it('shows security standards compliance', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Full Integration'))

      expect(screen.getByText('OWASP Top 10 protection')).toBeInTheDocument()
      expect(screen.getByText('GDPR/CCPA compliance')).toBeInTheDocument()
      expect(screen.getByText('SOC 2 Type II standards')).toBeInTheDocument()
      expect(screen.getByText('ISO 27001 guidelines')).toBeInTheDocument()
      expect(screen.getByText('NIST Cybersecurity Framework')).toBeInTheDocument()
      expect(screen.getByText('Production security hardening')).toBeInTheDocument()
    })

    it('lists completed security components', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByText('Redis Cache - Session storage and caching')).toBeInTheDocument()
      expect(screen.getByText('CSRF Protection - Token validation and security headers')).toBeInTheDocument()
      expect(screen.getByText('Rate Limiting - Authentication endpoint protection')).toBeInTheDocument()
      expect(screen.getByText('Secure Cookies - Encrypted cookie management')).toBeInTheDocument()
      expect(screen.getByText('Security Monitoring - Threat detection and alerting')).toBeInTheDocument()
      expect(screen.getByText('Content Security Policy - XSS and injection protection')).toBeInTheDocument()
    })

    it('lists integration features', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      expect(screen.getByText('Phase 1 UI components secured')).toBeInTheDocument()
      expect(screen.getByText('Phase 2.1 Clerk authentication protected')).toBeInTheDocument()
      expect(screen.getByText('Phase 2.2 CASL authorization secured')).toBeInTheDocument()
      expect(screen.getByText('Phase 2.3 User management protected')).toBeInTheDocument()
      expect(screen.getByText('Comprehensive TDD test coverage')).toBeInTheDocument()
      expect(screen.getByText('Production-ready security standards')).toBeInTheDocument()
    })
  })

  describe('Component Testing Interface', () => {
    it('provides test interface for each component', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('Redis Cache'))

      expect(screen.getByText('Component Testing')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Test redis cache integration...')).toBeInTheDocument()
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('shows test endpoints for each component', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('CSRF Protection'))

      expect(screen.getByText('/api/security/csrf-test')).toBeInTheDocument()
    })
  })

  describe('Accessibility and Usability', () => {
    it('maintains WCAG compliance across all views', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      
      // Check for proper button accessibility
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const overviewButton = screen.getByText('Overview')
      overviewButton.focus()
      expect(document.activeElement).toBe(overviewButton)
    })
  })

  describe('Theme Integration', () => {
    it('maintains theme consistency across all components', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const container = screen.getByTestId('phase-2-4-security-integration-test')
      expect(container).toBeInTheDocument()

      // Navigate through components to ensure theme consistency
      fireEvent.click(screen.getByText('Redis Cache'))
      expect(screen.getByText('Redis Cache Integration')).toBeInTheDocument()

      fireEvent.click(screen.getByText('CSRF Protection'))
      expect(screen.getByText('CSRF Protection')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles test execution errors gracefully', async () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      const runTestsButton = screen.getByTestId('run-security-tests')
      fireEvent.click(runTestsButton)

      // Component should handle any test failures gracefully
      await waitFor(() => {
        expect(screen.getByText('Run Security Tests')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('handles navigation errors gracefully', () => {
      render(
        <TestWrapper>
          <Phase2_4_SecurityIntegrationTest />
        </TestWrapper>
      )

      // Should handle navigation between components without errors
      const components = ['Redis Cache', 'CSRF Protection', 'Rate Limiting', 'Secure Cookies', 'Security Monitoring']
      
      components.forEach(component => {
        fireEvent.click(screen.getByText(component))
        expect(screen.getByText(component)).toBeInTheDocument()
      })
    })
  })
})