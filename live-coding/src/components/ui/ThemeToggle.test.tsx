import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import * as themeUtils from '@/lib/theme';

// Mock the theme utilities
jest.mock('@/lib/theme', () => ({
  getSystemTheme: jest.fn(() => 'light'),
  getStoredTheme: jest.fn(() => 'system'),
  setStoredTheme: jest.fn(),
  resolveTheme: jest.fn((theme, systemTheme) => theme === 'system' ? systemTheme : theme),
  applyTheme: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Button variant', () => {
    it('renders toggle button', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="button" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toBeInTheDocument();
      });
    });

    it('toggles theme when clicked', async () => {
      const mockSetStoredTheme = themeUtils.setStoredTheme as jest.Mock;
      
      render(
        <TestWrapper>
          <ThemeToggle variant="button" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockSetStoredTheme).toHaveBeenCalled();
      });
    });

    it('applies custom className', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="button" className="custom-class" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toHaveClass('custom-class');
      });
    });
  });

  describe('Dropdown variant', () => {
    it('renders dropdown toggle', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="dropdown" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /select theme/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveAttribute('aria-haspopup', 'true');
      });
    });

    it('opens dropdown when clicked', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="dropdown" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /select theme/i });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();
        expect(screen.getByText('System')).toBeInTheDocument();
      });
    });

    it('closes dropdown when option is selected', async () => {
      const mockSetStoredTheme = themeUtils.setStoredTheme as jest.Mock;
      
      render(
        <TestWrapper>
          <ThemeToggle variant="dropdown" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /select theme/i });
        fireEvent.click(button);
      });

      await waitFor(() => {
        const darkOption = screen.getByText('Dark');
        fireEvent.click(darkOption);
      });

      await waitFor(() => {
        expect(mockSetStoredTheme).toHaveBeenCalledWith('dark');
        expect(screen.queryByText('Light')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when clicking outside', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="dropdown" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /select theme/i });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
      });

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Light')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when escape key is pressed', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="dropdown" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /select theme/i });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Light')).not.toBeInTheDocument();
      });
    });

    it('shows current theme as selected', async () => {
      // Mock the theme as dark
      (themeUtils.getStoredTheme as jest.Mock).mockReturnValue('dark');
      (themeUtils.resolveTheme as jest.Mock).mockReturnValue('dark');
      
      render(
        <TestWrapper>
          <ThemeToggle variant="dropdown" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /select theme/i });
        fireEvent.click(button);
      });

      await waitFor(() => {
        const darkOption = screen.getByText('Dark').closest('button');
        expect(darkOption).toHaveClass('bg-accent');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for button variant', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="button" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toHaveAttribute('aria-label', 'Toggle theme');
      });
    });

    it('has proper ARIA attributes for dropdown variant', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="dropdown" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /select theme/i });
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveAttribute('aria-haspopup', 'true');
        expect(button).toHaveAttribute('aria-label', 'Select theme');
      });
    });

    it('updates aria-expanded when dropdown opens', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="dropdown" />
        </TestWrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /select theme/i });
        expect(button).toHaveAttribute('aria-expanded', 'false');
        
        fireEvent.click(button);
      });

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /select theme/i });
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });
});