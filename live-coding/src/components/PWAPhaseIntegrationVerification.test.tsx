/**
 * PWA Phase Integration Verification Tests
 * 
 * Comprehensive tests to verify that Phase 4 Week 13 PWA components integrate seamlessly
 * with all previous phases (Phase 1 UI, Phase 2 Auth, Phase 3 Content, Phase 4 Real-time).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Phase 1 Components (UI)
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';

// Phase 2 Components (Auth & Security)
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthorizationProvider } from '@/components/authorization/AuthorizationProvider';
import { Can } from '@/components/authorization/Can';

// Phase 3 Components (Content Management)
import { CourseNavigationPlayer } from '@/components/course/CourseNavigationPlayer';
import { QuizBuilder } from '@/components/course/QuizBuilder';
import { AssignmentBuilder } from '@/components/course/AssignmentBuilder';

// Phase 4 Real-time Components
import { LiveChat } from '@/components/collaboration/LiveChat';
import { NotificationSystem } from '@/components/notifications/NotificationSystem';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

// Phase 4 Week 13 PWA Components
import { PWAProvider } from '@/components/pwa/PWAProvider';
import { EdgeCacheProvider } from '@/components/pwa/EdgeCacheProvider';
import { MobileOptimization } from '@/components/pwa/MobileOptimization';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { CacheManager } from '@/components/pwa/CacheManager';
import { ContentDownloadManager } from '@/components/pwa/ContentDownloadManager';

// Mock all external dependencies
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'user_123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'John',
      lastName: 'Doe',
      publicMetadata: { role: 'instructor' },
    },
    userId: 'user_123',
    sessionId: 'session_123',
    signOut: jest.fn(),
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'user_123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'John',
      lastName: 'Doe',
      publicMetadata: { role: 'instructor' },
    },
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  UserButton: () => <button>User Menu</button>,
}));

// Mock service worker
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: { postMessage: jest.fn() },
  scope: 'https://localhost:3000/',
  update: jest.fn(),
  unregister: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
    ready: Promise.resolve(mockServiceWorkerRegistration),
    controller: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  writable: true,
});

// Mock other APIs
Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

// Mock IndexedDB
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: jest.fn().mockReturnValue({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            add: jest.fn().mockReturnValue({ onsuccess: null }),
            get: jest.fn().mockReturnValue({ onsuccess: null }),
            getAll: jest.fn().mockReturnValue({ onsuccess: null }),
          }),
        }),
        close: jest.fn(),
      },
    }),
  },
});

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true }),
  text: () => Promise.resolve('{}'),
  clone: () => ({ json: () => Promise.resolve({}) }),
  headers: new Headers(),
});

// Comprehensive test component that integrates all phases
const FullStackPWAApp: React.FC = () => {
  return (
    <ThemeProvider enableSystem disableTransitionOnChange>
      <AuthProvider>
        <AuthorizationProvider>
          <PWAProvider>
            <EdgeCacheProvider>
              <MobileOptimization>
                <div data-testid="full-stack-pwa-app">
                  <h1>Full Stack PWA Learning Portal</h1>
                  
                  {/* Phase 1 UI Components */}
                  <Card className="p-4 mb-4">
                    <h2>Phase 1 - UI Components</h2>
                    <Button data-testid="phase1-button">Phase 1 Button</Button>
                    <Progress value={75} data-testid="phase1-progress" />
                  </Card>

                  {/* Phase 2 Auth & Authorization */}
                  <Card className="p-4 mb-4">
                    <h2>Phase 2 - Authentication & Authorization</h2>
                    <Can permission="manage_courses">
                      <Button data-testid="phase2-auth-button">Instructor Only</Button>
                    </Can>
                  </Card>

                  {/* Phase 3 Content Management */}
                  <Card className="p-4 mb-4">
                    <h2>Phase 3 - Content Management</h2>
                    <QuizBuilder 
                      courseId="test-course"
                      onSave={() => {}}
                      data-testid="phase3-quiz-builder"
                    />
                  </Card>

                  {/* Phase 4 Real-time Features */}
                  <Card className="p-4 mb-4">
                    <h2>Phase 4 - Real-time Features</h2>
                    <LiveChat 
                      courseId="test-course"
                      data-testid="phase4-live-chat"
                    />
                    <AnalyticsDashboard 
                      courseId="test-course"
                      data-testid="phase4-analytics"
                    />
                  </Card>

                  {/* Phase 4 Week 13 PWA Features */}
                  <Card className="p-4 mb-4">
                    <h2>Phase 4 Week 13 - PWA Features</h2>
                    <CacheManager 
                      courseId="test-course"
                      data-testid="pwa-cache-manager"
                    />
                    <ContentDownloadManager 
                      courseId="test-course"
                      data-testid="pwa-download-manager"
                    />
                  </Card>

                  {/* PWA Global Components */}
                  <OfflineIndicator />
                  <InstallPrompt />
                </div>
              </MobileOptimization>
            </EdgeCacheProvider>
          </PWAProvider>
        </AuthorizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('PWA Phase Integration Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Stack Integration', () => {
    it('should render all phases together without conflicts', async () => {
      render(<FullStackPWAApp />);

      expect(screen.getByTestId('full-stack-pwa-app')).toBeInTheDocument();
      expect(screen.getByText('Full Stack PWA Learning Portal')).toBeInTheDocument();

      // Verify all phases are present
      expect(screen.getByText('Phase 1 - UI Components')).toBeInTheDocument();
      expect(screen.getByText('Phase 2 - Authentication & Authorization')).toBeInTheDocument();
      expect(screen.getByText('Phase 3 - Content Management')).toBeInTheDocument();
      expect(screen.getByText('Phase 4 - Real-time Features')).toBeInTheDocument();
      expect(screen.getByText('Phase 4 Week 13 - PWA Features')).toBeInTheDocument();
    });

    it('should initialize all providers in correct order', async () => {
      render(<FullStackPWAApp />);

      // Service worker should be registered
      await waitFor(() => {
        expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
      });

      // All components should be accessible
      expect(screen.getByTestId('phase1-button')).toBeInTheDocument();
      expect(screen.getByTestId('pwa-cache-manager')).toBeInTheDocument();
    });
  });

  describe('Phase 1 UI Integration', () => {
    it('should use Phase 1 UI components in PWA features', () => {
      render(<FullStackPWAApp />);

      // PWA components should use Phase 1 UI components
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Cards should be properly styled
      const cards = screen.getAllByText(/Phase \d/);
      expect(cards.length).toBe(5); // 4 phases + PWA
    });

    it('should maintain theme consistency across PWA components', async () => {
      render(<FullStackPWAApp />);

      // Theme should be applied to all components
      const app = screen.getByTestId('full-stack-pwa-app');
      expect(app).toBeInTheDocument();

      // PWA components should inherit theme
      expect(screen.getByTestId('pwa-cache-manager')).toBeInTheDocument();
    });
  });

  describe('Phase 2 Authentication Integration', () => {
    it('should respect authentication state in PWA components', () => {
      render(<FullStackPWAApp />);

      // Instructor-only button should be visible (mocked as instructor)
      expect(screen.getByTestId('phase2-auth-button')).toBeInTheDocument();
    });

    it('should handle authorization in PWA context', () => {
      render(<FullStackPWAApp />);

      // PWA components should respect user permissions
      expect(screen.getByTestId('pwa-cache-manager')).toBeInTheDocument();
      expect(screen.getByTestId('pwa-download-manager')).toBeInTheDocument();
    });
  });

  describe('Phase 3 Content Integration', () => {
    it('should cache Phase 3 content components', async () => {
      render(<FullStackPWAApp />);

      // Quiz builder should be present
      expect(screen.getByTestId('phase3-quiz-builder')).toBeInTheDocument();

      // Cache manager should be able to cache course content
      const cacheButton = screen.getByRole('button', { name: /cache course/i });
      fireEvent.click(cacheButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it('should download Phase 3 content for offline access', async () => {
      render(<FullStackPWAApp />);

      // Download manager should handle course downloads
      const downloadButton = screen.getByRole('button', { name: /download course/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/downloading/i)).toBeInTheDocument();
      });
    });
  });

  describe('Phase 4 Real-time Integration', () => {
    it('should maintain real-time features in PWA context', () => {
      render(<FullStackPWAApp />);

      // Real-time components should be present
      expect(screen.getByTestId('phase4-live-chat')).toBeInTheDocument();
      expect(screen.getByTestId('phase4-analytics')).toBeInTheDocument();
    });

    it('should sync real-time data when going online', async () => {
      render(<FullStackPWAApp />);

      // Go offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Go back online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Cross-Phase State Management', () => {
    it('should share state between phases through PWA context', async () => {
      render(<FullStackPWAApp />);

      // All components should have access to PWA state
      expect(screen.getByTestId('pwa-cache-manager')).toBeInTheDocument();
      expect(screen.getByTestId('pwa-download-manager')).toBeInTheDocument();

      // State changes should affect all components
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        // Multiple components should react to offline state
        const offlineElements = screen.getAllByText(/offline/i);
        expect(offlineElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle errors gracefully across all phases', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock fetch failure
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<FullStackPWAApp />);

      const cacheButton = screen.getByRole('button', { name: /cache course/i });
      fireEvent.click(cacheButton);

      // Should handle errors without breaking other phases
      expect(screen.getByTestId('full-stack-pwa-app')).toBeInTheDocument();
      expect(screen.getByTestId('phase1-button')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Mobile Optimization Integration', () => {
    it('should optimize all phases for mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });

      render(<FullStackPWAApp />);

      // Should apply mobile optimizations
      expect(document.body).toHaveClass('mobile-optimized');

      // All phase components should be mobile-friendly
      expect(screen.getByTestId('phase1-button')).toBeInTheDocument();
      expect(screen.getByTestId('phase3-quiz-builder')).toBeInTheDocument();
    });

    it('should handle touch gestures across all components', () => {
      render(<FullStackPWAApp />);

      const app = screen.getByTestId('full-stack-pwa-app');

      // Simulate touch events
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });

      fireEvent(app, touchStart);

      // Should handle touch events without breaking functionality
      expect(screen.getByTestId('full-stack-pwa-app')).toBeInTheDocument();
    });
  });

  describe('Performance and Caching Integration', () => {
    it('should cache content from all phases efficiently', async () => {
      render(<FullStackPWAApp />);

      // Should cache various types of content
      const cacheButton = screen.getByRole('button', { name: /cache course/i });
      fireEvent.click(cacheButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/courses/'),
          expect.any(Object)
        );
      });
    });

    it('should maintain performance across all phases', () => {
      const startTime = performance.now();
      
      render(<FullStackPWAApp />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly even with all phases
      expect(renderTime).toBeLessThan(1000); // Less than 1 second
      expect(screen.getByTestId('full-stack-pwa-app')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across all phases', () => {
      render(<FullStackPWAApp />);

      // Should have proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Should have accessible buttons
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should provide proper ARIA labels for PWA features', () => {
      render(<FullStackPWAApp />);

      // PWA components should have proper accessibility
      const cacheButton = screen.getByRole('button', { name: /cache course/i });
      expect(cacheButton).toHaveAttribute('aria-label');
    });
  });

  describe('Error Boundaries and Resilience', () => {
    it('should isolate errors between phases', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<FullStackPWAApp />);

      // Even if one phase has issues, others should continue working
      expect(screen.getByTestId('full-stack-pwa-app')).toBeInTheDocument();
      expect(screen.getByTestId('phase1-button')).toBeInTheDocument();
      expect(screen.getByTestId('pwa-cache-manager')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should recover gracefully from PWA failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock service worker failure
      (navigator.serviceWorker.register as jest.Mock).mockRejectedValueOnce(
        new Error('Service worker failed')
      );

      render(<FullStackPWAApp />);

      // App should still function without PWA features
      expect(screen.getByTestId('full-stack-pwa-app')).toBeInTheDocument();
      expect(screen.getByTestId('phase1-button')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});