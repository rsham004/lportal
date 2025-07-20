import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';
import * as themeUtils from '@/lib/theme';

// Mock the theme utilities
jest.mock('@/lib/theme', () => ({
  getSystemTheme: jest.fn(),
  getStoredTheme: jest.fn(),
  setStoredTheme: jest.fn(),
  resolveTheme: jest.fn(),
  applyTheme: jest.fn(),
}));

const mockThemeUtils = themeUtils as jest.Mocked<typeof themeUtils>;

// Mock window.matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Test component that uses the theme hook
function TestComponent() {
  const { theme, systemTheme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="system-theme">{systemTheme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => setTheme('system')} data-testid="set-system">
        Set System
      </button>
      <button onClick={toggleTheme} data-testid="toggle">
        Toggle
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockThemeUtils.getStoredTheme.mockReturnValue('system');
    mockThemeUtils.getSystemTheme.mockReturnValue('light');
    mockThemeUtils.resolveTheme.mockImplementation((theme, systemTheme) => 
      theme === 'system' ? systemTheme : theme
    );
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  });

  it('provides theme context to children', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
      expect(screen.getByTestId('system-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    });
  });

  it('initializes with stored theme', async () => {
    mockThemeUtils.getStoredTheme.mockReturnValue('dark');
    mockThemeUtils.resolveTheme.mockReturnValue('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
  });

  it('allows setting theme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    fireEvent.click(screen.getByTestId('set-dark'));

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(mockThemeUtils.setStoredTheme).toHaveBeenCalledWith('dark');
    });
  });

  it('toggles between light and dark themes', async () => {
    mockThemeUtils.getStoredTheme.mockReturnValue('light');
    mockThemeUtils.resolveTheme.mockImplementation((theme) => theme as 'light' | 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });

    fireEvent.click(screen.getByTestId('toggle'));

    await waitFor(() => {
      expect(mockThemeUtils.setStoredTheme).toHaveBeenCalledWith('dark');
    });
  });

  it('listens for system theme changes', async () => {
    const mockAddEventListener = jest.fn();
    const mockRemoveEventListener = jest.fn();
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('applies theme changes', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockThemeUtils.applyTheme).toHaveBeenCalledWith('light');
    });

    fireEvent.click(screen.getByTestId('set-dark'));

    await waitFor(() => {
      expect(mockThemeUtils.applyTheme).toHaveBeenCalledWith('dark');
    });
  });

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });

  it('disables system theme detection when enableSystem is false', async () => {
    const mockAddEventListener = jest.fn();
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: jest.fn(),
    });

    render(
      <ThemeProvider enableSystem={false}>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockAddEventListener).not.toHaveBeenCalled();
    });
  });

  it('uses default theme when provided', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    // Should still use stored theme over default
    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });
  });
});