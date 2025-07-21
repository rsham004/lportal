import React from 'react';
import { render, screen } from '@testing-library/react';
import { OfflineIndicator } from './OfflineIndicator';
import { usePWA } from './PWAProvider';

// Mock PWA context
jest.mock('./PWAProvider');
const mockUsePWA = usePWA as jest.MockedFunction<typeof usePWA>;

describe('OfflineIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Online State', () => {
    it('should not render when online', () => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: null,
        installApp: jest.fn(),
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });

      const { container } = render(<OfflineIndicator />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Offline State', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: false,
        isOffline: true,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: null,
        installApp: jest.fn(),
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });
    });

    it('should render offline indicator when offline', () => {
      render(<OfflineIndicator />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('You are currently offline')).toBeInTheDocument();
      expect(screen.getByText(/Some features may be limited/)).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<OfflineIndicator />);

      const indicator = screen.getByRole('alert');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
      expect(indicator).toHaveAttribute('aria-atomic', 'true');
    });

    it('should display offline icon', () => {
      render(<OfflineIndicator />);

      const icon = screen.getByLabelText('Offline');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-red-500');
    });

    it('should have proper styling for offline state', () => {
      render(<OfflineIndicator />);

      const indicator = screen.getByRole('alert');
      expect(indicator).toHaveClass(
        'fixed',
        'top-4',
        'right-4',
        'z-50',
        'bg-red-50',
        'border-red-200',
        'text-red-800'
      );
    });

    it('should display proper message content', () => {
      render(<OfflineIndicator />);

      expect(screen.getByText('You are currently offline')).toHaveClass('font-medium');
      expect(screen.getByText(/Some features may be limited/)).toHaveClass('text-sm');
    });
  });

  describe('Custom Props', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: false,
        isOffline: true,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: null,
        installApp: jest.fn(),
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });
    });

    it('should accept custom className', () => {
      render(<OfflineIndicator className="custom-class" />);

      const indicator = screen.getByRole('alert');
      expect(indicator).toHaveClass('custom-class');
    });

    it('should accept custom message', () => {
      const customMessage = 'Custom offline message';
      render(<OfflineIndicator message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
      expect(screen.queryByText('You are currently offline')).not.toBeInTheDocument();
    });

    it('should accept custom description', () => {
      const customDescription = 'Custom offline description';
      render(<OfflineIndicator description={customDescription} />);

      expect(screen.getByText(customDescription)).toBeInTheDocument();
      expect(screen.queryByText(/Some features may be limited/)).not.toBeInTheDocument();
    });

    it('should hide description when showDescription is false', () => {
      render(<OfflineIndicator showDescription={false} />);

      expect(screen.getByText('You are currently offline')).toBeInTheDocument();
      expect(screen.queryByText(/Some features may be limited/)).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: false,
        isOffline: true,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: null,
        installApp: jest.fn(),
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });
    });

    it('should have responsive positioning classes', () => {
      render(<OfflineIndicator />);

      const indicator = screen.getByRole('alert');
      expect(indicator).toHaveClass('top-4', 'right-4');
    });

    it('should have responsive padding and spacing', () => {
      render(<OfflineIndicator />);

      const indicator = screen.getByRole('alert');
      expect(indicator).toHaveClass('p-4', 'rounded-lg', 'shadow-lg');
    });
  });

  describe('Animation and Transitions', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: false,
        isOffline: true,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: null,
        installApp: jest.fn(),
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });
    });

    it('should have transition classes for smooth appearance', () => {
      render(<OfflineIndicator />);

      const indicator = screen.getByRole('alert');
      expect(indicator).toHaveClass('transition-all', 'duration-300');
    });
  });
});