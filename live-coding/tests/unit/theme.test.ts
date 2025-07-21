import { 
  getSystemTheme, 
  getStoredTheme, 
  setStoredTheme, 
  resolveTheme, 
  applyTheme,
  THEME_STORAGE_KEY 
} from '@/lib/theme';

// Mock window.matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock document
const mockDocumentElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
};
Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
});

const mockQuerySelector = jest.fn();
Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
});

describe('Theme utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSystemTheme', () => {
    it('returns dark when system prefers dark mode', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      
      expect(getSystemTheme()).toBe('dark');
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('returns light when system prefers light mode', () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      
      expect(getSystemTheme()).toBe('light');
    });
  });

  describe('getStoredTheme', () => {
    it('returns stored theme when valid', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      expect(getStoredTheme()).toBe('dark');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    });

    it('returns system when no stored theme', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      expect(getStoredTheme()).toBe('system');
    });

    it('returns system when stored theme is invalid', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');
      
      expect(getStoredTheme()).toBe('system');
    });

    it('returns system when localStorage throws error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      expect(getStoredTheme()).toBe('system');
    });
  });

  describe('setStoredTheme', () => {
    it('stores theme in localStorage', () => {
      setStoredTheme('dark');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
    });

    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      expect(() => setStoredTheme('dark')).not.toThrow();
    });
  });

  describe('resolveTheme', () => {
    it('returns system theme when theme is system', () => {
      expect(resolveTheme('system', 'dark')).toBe('dark');
      expect(resolveTheme('system', 'light')).toBe('light');
    });

    it('returns explicit theme when not system', () => {
      expect(resolveTheme('dark', 'light')).toBe('dark');
      expect(resolveTheme('light', 'dark')).toBe('light');
    });
  });

  describe('applyTheme', () => {
    beforeEach(() => {
      mockQuerySelector.mockReturnValue({
        setAttribute: jest.fn(),
      });
    });

    it('applies dark theme classes', () => {
      applyTheme('dark');
      
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('applies light theme classes', () => {
      applyTheme('light');
      
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('light');
    });

    it('updates meta theme-color for dark theme', () => {
      const mockMetaElement = { setAttribute: jest.fn() };
      mockQuerySelector.mockReturnValue(mockMetaElement);
      
      applyTheme('dark');
      
      expect(mockMetaElement.setAttribute).toHaveBeenCalledWith('content', '#0f172a');
    });

    it('updates meta theme-color for light theme', () => {
      const mockMetaElement = { setAttribute: jest.fn() };
      mockQuerySelector.mockReturnValue(mockMetaElement);
      
      applyTheme('light');
      
      expect(mockMetaElement.setAttribute).toHaveBeenCalledWith('content', '#ffffff');
    });

    it('handles missing meta theme-color element', () => {
      mockQuerySelector.mockReturnValue(null);
      
      expect(() => applyTheme('dark')).not.toThrow();
    });
  });
});