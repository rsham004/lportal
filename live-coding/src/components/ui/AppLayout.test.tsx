import { render, screen, fireEvent } from '@testing-library/react';
import { AppLayout, AppHeader, AppMain, AppSidebar, AppContent, AppFooter } from './AppLayout';

describe('AppLayout Components', () => {
  describe('AppLayout', () => {
    it('renders children correctly', () => {
      render(
        <AppLayout>
          <div data-testid="child">Test content</div>
        </AppLayout>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <AppLayout className="custom-class">
          <div>Content</div>
        </AppLayout>
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('AppHeader', () => {
    it('renders as header element', () => {
      render(
        <AppHeader>
          <div data-testid="header-content">Header</div>
        </AppHeader>
      );
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(screen.getByTestId('header-content')).toBeInTheDocument();
    });

    it('has sticky positioning classes', () => {
      render(
        <AppHeader>
          <div>Header</div>
        </AppHeader>
      );
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0', 'z-50');
    });
  });

  describe('AppMain', () => {
    it('renders as main element', () => {
      render(
        <AppMain>
          <div data-testid="main-content">Main</div>
        </AppMain>
      );
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('applies sidebar layout when withSidebar is true', () => {
      render(
        <AppMain withSidebar>
          <div>Content</div>
        </AppMain>
      );
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('relative');
    });

    it('applies column layout when withSidebar is false', () => {
      render(
        <AppMain withSidebar={false}>
          <div>Content</div>
        </AppMain>
      );
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-col');
    });
  });

  describe('AppSidebar', () => {
    it('renders as aside element', () => {
      render(
        <AppSidebar>
          <div data-testid="sidebar-content">Sidebar</div>
        </AppSidebar>
      );
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    });

    it('shows sidebar when isOpen is true', () => {
      render(
        <AppSidebar isOpen={true}>
          <div>Sidebar</div>
        </AppSidebar>
      );
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('translate-x-0');
    });

    it('hides sidebar when isOpen is false', () => {
      render(
        <AppSidebar isOpen={false}>
          <div>Sidebar</div>
        </AppSidebar>
      );
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('calls onToggle when overlay is clicked', () => {
      const mockToggle = jest.fn();
      render(
        <AppSidebar isOpen={true} onToggle={mockToggle}>
          <div>Sidebar</div>
        </AppSidebar>
      );
      
      // The overlay should be present when sidebar is open
      const overlay = document.querySelector('.fixed.inset-0.z-40');
      expect(overlay).toBeInTheDocument();
      
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockToggle).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('AppContent', () => {
    it('renders children correctly', () => {
      render(
        <AppContent>
          <div data-testid="content">Content</div>
        </AppContent>
      );
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('has flex layout classes', () => {
      const { container } = render(
        <AppContent>
          <div>Content</div>
        </AppContent>
      );
      
      expect(container.firstChild).toHaveClass('flex-1', 'flex', 'flex-col');
    });
  });

  describe('AppFooter', () => {
    it('renders as footer element', () => {
      render(
        <AppFooter>
          <div data-testid="footer-content">Footer</div>
        </AppFooter>
      );
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      expect(screen.getByTestId('footer-content')).toBeInTheDocument();
    });

    it('has border and background classes', () => {
      render(
        <AppFooter>
          <div>Footer</div>
        </AppFooter>
      );
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('border-t', 'bg-background');
    });
  });

  describe('Integration', () => {
    it('renders complete layout structure', () => {
      render(
        <AppLayout>
          <AppHeader>
            <div data-testid="header">Header</div>
          </AppHeader>
          <AppMain withSidebar>
            <AppSidebar>
              <div data-testid="sidebar">Sidebar</div>
            </AppSidebar>
            <AppContent>
              <div data-testid="content">Content</div>
            </AppContent>
          </AppMain>
          <AppFooter>
            <div data-testid="footer">Footer</div>
          </AppFooter>
        </AppLayout>
      );
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });
});