'use client';

import * as React from 'react';
import { 
  Theme, 
  ThemeConfig, 
  getSystemTheme, 
  getStoredTheme, 
  setStoredTheme, 
  resolveTheme, 
  applyTheme 
} from '@/lib/theme';

interface ThemeContextValue extends ThemeConfig {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = React.useState(false);

  // Initialize theme on mount
  React.useEffect(() => {
    const storedTheme = getStoredTheme();
    const currentSystemTheme = getSystemTheme();
    
    setThemeState(storedTheme);
    setSystemTheme(currentSystemTheme);
    setMounted(true);
  }, []);

  // Listen for system theme changes
  React.useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [enableSystem]);

  // Apply theme changes
  React.useEffect(() => {
    if (!mounted) return;

    const resolvedTheme = resolveTheme(theme, systemTheme);
    
    // Disable transitions during theme change if requested
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
        )
      );
      document.head.appendChild(css);

      // Force reflow
      (() => window.getComputedStyle(document.body))();

      // Re-enable transitions after a brief delay
      setTimeout(() => {
        document.head.removeChild(css);
      }, 1);
    }

    applyTheme(resolvedTheme);
  }, [theme, systemTheme, mounted, disableTransitionOnChange]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const resolvedTheme = resolveTheme(theme, systemTheme);
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, systemTheme, setTheme]);

  const value = React.useMemo<ThemeContextValue>(() => ({
    theme,
    systemTheme,
    resolvedTheme: resolveTheme(theme, systemTheme),
    setTheme,
    toggleTheme,
  }), [theme, systemTheme, setTheme, toggleTheme]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}