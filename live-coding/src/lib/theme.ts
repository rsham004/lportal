export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  systemTheme: 'light' | 'dark';
  resolvedTheme: 'light' | 'dark';
}

export const THEME_STORAGE_KEY = 'learning-portal-theme';

export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as Theme;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }
  return 'system';
};

export const setStoredTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }
};

export const resolveTheme = (theme: Theme, systemTheme: 'light' | 'dark'): 'light' | 'dark' => {
  return theme === 'system' ? systemTheme : theme;
};

export const applyTheme = (resolvedTheme: 'light' | 'dark'): void => {
  if (typeof window === 'undefined') return;
  
  const root = window.document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  
  // Add new theme class
  root.classList.add(resolvedTheme);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'
    );
  }
};