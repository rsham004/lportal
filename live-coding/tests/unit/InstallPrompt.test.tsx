import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InstallPrompt } from './InstallPrompt';
import { usePWA } from './PWAProvider';

// Mock PWA context
jest.mock('./PWAProvider');
const mockUsePWA = usePWA as jest.MockedFunction<typeof usePWA>;

describe('InstallPrompt', () => {
  const mockInstallApp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockInstallApp.mockClear();
  });

  describe('Not Installable State', () => {
    it('should not render when app is not installable', () => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: false,
        isInstalled: false,
        cacheStatus: null,
        installApp: mockInstallApp,
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });

      const { container } = render(<InstallPrompt />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when app is already installed', () => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: true,
        isInstalled: true,
        cacheStatus: null,
        installApp: mockInstallApp,
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });

      const { container } = render(<InstallPrompt />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Installable State', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: true,
        isInstalled: false,
        cacheStatus: null,
        installApp: mockInstallApp,
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });
    });

    it('should render install prompt when app is installable', () => {
      render(<InstallPrompt />);

      expect(screen.getByText('Install Learning Portal')).toBeInTheDocument();
      expect(screen.getByText(/Get the full app experience/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /install app/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<InstallPrompt />);

      const prompt = screen.getByRole('dialog');
      expect(prompt).toHaveAttribute('aria-labelledby');
      expect(prompt).toHaveAttribute('aria-describedby');
    });

    it('should display app icon', () => {
      render(<InstallPrompt />);

      const icon = screen.getByLabelText('Install App');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-blue-600');
    });

    it('should call installApp when install button is clicked', async () => {
      mockInstallApp.mockResolvedValue();

      render(<InstallPrompt />);

      const installButton = screen.getByRole('button', { name: /install app/i });
      fireEvent.click(installButton);

      await waitFor(() => {
        expect(mockInstallApp).toHaveBeenCalled();
      });
    });

    it('should hide prompt when dismiss button is clicked', () => {
      render(<InstallPrompt />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(screen.queryByText('Install Learning Portal')).not.toBeInTheDocument();
    });

    it('should show loading state during installation', async () => {
      mockInstallApp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<InstallPrompt />);

      const installButton = screen.getByRole('button', { name: /install app/i });
      fireEvent.click(installButton);

      expect(screen.getByText('Installing...')).toBeInTheDocument();
      expect(installButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('Installing...')).not.toBeInTheDocument();
      });
    });

    it('should handle installation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockInstallApp.mockRejectedValue(new Error('Installation failed'));

      render(<InstallPrompt />);

      const installButton = screen.getByRole('button', { name: /install app/i });
      fireEvent.click(installButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to install app:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Custom Props', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: true,
        isInstalled: false,
        cacheStatus: null,
        installApp: mockInstallApp,
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });
    });

    it('should accept custom title', () => {
      const customTitle = 'Custom Install Title';
      render(<InstallPrompt title={customTitle} />);

      expect(screen.getByText(customTitle)).toBeInTheDocument();
      expect(screen.queryByText('Install Learning Portal')).not.toBeInTheDocument();
    });

    it('should accept custom description', () => {
      const customDescription = 'Custom install description';
      render(<InstallPrompt description={customDescription} />);

      expect(screen.getByText(customDescription)).toBeInTheDocument();
      expect(screen.queryByText(/Get the full app experience/)).not.toBeInTheDocument();
    });

    it('should accept custom install button text', () => {
      const customButtonText = 'Download Now';
      render(<InstallPrompt installButtonText={customButtonText} />);

      expect(screen.getByRole('button', { name: customButtonText })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /install app/i })).not.toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(<InstallPrompt className="custom-class" />);

      const prompt = screen.getByRole('dialog');
      expect(prompt).toHaveClass('custom-class');
    });

    it('should hide dismiss button when showDismiss is false', () => {
      render(<InstallPrompt showDismiss={false} />);

      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: true,
        isInstalled: false,
        cacheStatus: null,
        installApp: mockInstallApp,
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });
    });

    it('should have responsive positioning classes', () => {
      render(<InstallPrompt />);

      const prompt = screen.getByRole('dialog');
      expect(prompt).toHaveClass('bottom-4', 'left-4', 'right-4');
    });

    it('should have responsive layout classes', () => {
      render(<InstallPrompt />);

      const prompt = screen.getByRole('dialog');
      expect(prompt).toHaveClass('max-w-sm', 'mx-auto', 'sm:max-w-md');
    });
  });

  describe('Animation and Transitions', () => {
    beforeEach(() => {
      mockUsePWA.mockReturnValue({
        isOnline: true,
        isOffline: false,
        isInstallable: true,
        isInstalled: false,
        cacheStatus: null,
        installApp: mockInstallApp,
        cacheContent: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatus: jest.fn(),
        syncProgress: jest.fn(),
      });
    });

    it('should have transition classes for smooth appearance', () => {
      render(<InstallPrompt />);

      const prompt = screen.getByRole('dialog');
      expect(prompt).toHaveClass('transition-all', 'duration-300');
    });
  });
});