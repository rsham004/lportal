import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation, NavigationItem, NavigationMenu, NavigationTrigger, NavigationContent } from './Navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('Navigation Components', () => {
  describe('Navigation', () => {
    it('renders with default props', () => {
      render(
        <Navigation data-testid="navigation">
          <NavigationItem href="/dashboard">Dashboard</NavigationItem>
        </Navigation>
      );
      
      const nav = screen.getByTestId('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveRole('navigation');
    });

    it('applies custom className', () => {
      const customClass = 'custom-nav-class';
      render(
        <Navigation className={customClass} data-testid="navigation">
          <NavigationItem href="/dashboard">Dashboard</NavigationItem>
        </Navigation>
      );
      
      expect(screen.getByTestId('navigation')).toHaveClass(customClass);
    });

    it('has proper accessibility attributes', () => {
      render(
        <Navigation aria-label="Main navigation">
          <NavigationItem href="/dashboard">Dashboard</NavigationItem>
        </Navigation>
      );
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });
  });

  describe('NavigationItem', () => {
    it('renders as a link with correct href', () => {
      render(
        <Navigation>
          <NavigationItem href="/courses">Courses</NavigationItem>
        </Navigation>
      );
      
      const link = screen.getByRole('link', { name: 'Courses' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/courses');
    });

    it('shows active state for current page', () => {
      render(
        <Navigation>
          <NavigationItem href="/dashboard">Dashboard</NavigationItem>
        </Navigation>
      );
      
      const link = screen.getByRole('link', { name: 'Dashboard' });
      expect(link).toHaveClass('bg-accent', 'text-accent-foreground');
    });

    it('shows inactive state for non-current page', () => {
      render(
        <Navigation>
          <NavigationItem href="/courses">Courses</NavigationItem>
        </Navigation>
      );
      
      const link = screen.getByRole('link', { name: 'Courses' });
      expect(link).not.toHaveClass('bg-accent', 'text-accent-foreground');
      expect(link).toHaveClass('text-muted-foreground');
    });

    it('applies custom className', () => {
      const customClass = 'custom-item-class';
      render(
        <Navigation>
          <NavigationItem href="/dashboard" className={customClass}>Dashboard</NavigationItem>
        </Navigation>
      );
      
      expect(screen.getByRole('link')).toHaveClass(customClass);
    });

    it('handles disabled state', () => {
      render(
        <Navigation>
          <NavigationItem href="/disabled" disabled>Disabled</NavigationItem>
        </Navigation>
      );
      
      const link = screen.getByRole('link', { name: 'Disabled' });
      expect(link).toHaveClass('pointer-events-none', 'opacity-50');
    });
  });

  describe('NavigationMenu (Dropdown)', () => {
    it('renders trigger and shows content on click', async () => {
      const user = userEvent.setup();
      
      render(
        <Navigation>
          <NavigationMenu>
            <NavigationTrigger>More</NavigationTrigger>
            <NavigationContent>
              <NavigationItem href="/settings">Settings</NavigationItem>
              <NavigationItem href="/profile">Profile</NavigationItem>
            </NavigationContent>
          </NavigationMenu>
        </Navigation>
      );
      
      const trigger = screen.getByRole('button', { name: 'More' });
      expect(trigger).toBeInTheDocument();
      
      // Content should not be visible initially
      expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
      
      // Click trigger to show content
      await user.click(trigger);
      
      expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Navigation>
            <NavigationMenu>
              <NavigationTrigger>More</NavigationTrigger>
              <NavigationContent>
                <NavigationItem href="/settings">Settings</NavigationItem>
              </NavigationContent>
            </NavigationMenu>
          </Navigation>
          <div data-testid="outside">Outside element</div>
        </div>
      );
      
      const trigger = screen.getByRole('button', { name: 'More' });
      
      // Open dropdown
      await user.click(trigger);
      expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
      
      // Click outside
      await user.click(screen.getByTestId('outside'));
      expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    });

    it('closes dropdown when pressing Escape', async () => {
      const user = userEvent.setup();
      
      render(
        <Navigation>
          <NavigationMenu>
            <NavigationTrigger>More</NavigationTrigger>
            <NavigationContent>
              <NavigationItem href="/settings">Settings</NavigationItem>
            </NavigationContent>
          </NavigationMenu>
        </Navigation>
      );
      
      const trigger = screen.getByRole('button', { name: 'More' });
      
      // Open dropdown
      await user.click(trigger);
      expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
      
      // Press Escape
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    });

    it('has proper ARIA attributes', async () => {
      const user = userEvent.setup();
      
      render(
        <Navigation>
          <NavigationMenu>
            <NavigationTrigger>More</NavigationTrigger>
            <NavigationContent>
              <NavigationItem href="/settings">Settings</NavigationItem>
            </NavigationContent>
          </NavigationMenu>
        </Navigation>
      );
      
      const trigger = screen.getByRole('button', { name: 'More' });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
      
      // Open dropdown
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Responsive Navigation', () => {
    it('renders mobile menu toggle', () => {
      render(
        <Navigation>
          <NavigationItem href="/dashboard">Dashboard</NavigationItem>
        </Navigation>
      );
      
      // Mobile menu toggle should be present but hidden on desktop
      const mobileToggle = screen.getByRole('button', { name: /toggle navigation/i });
      expect(mobileToggle).toBeInTheDocument();
      expect(mobileToggle).toHaveClass('md:hidden');
    });

    it('toggles mobile menu visibility', async () => {
      const user = userEvent.setup();
      
      render(
        <Navigation>
          <NavigationItem href="/dashboard">Dashboard</NavigationItem>
          <NavigationItem href="/courses">Courses</NavigationItem>
        </Navigation>
      );
      
      const mobileToggle = screen.getByRole('button', { name: /toggle navigation/i });
      const navItems = screen.getByTestId('nav-items');
      
      // Initially hidden on mobile
      expect(navItems).toHaveClass('hidden', 'md:flex');
      
      // Click to show
      await user.click(mobileToggle);
      expect(navItems).toHaveClass('flex', 'md:flex');
      
      // Click to hide
      await user.click(mobileToggle);
      expect(navItems).toHaveClass('hidden', 'md:flex');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation between items', async () => {
      const user = userEvent.setup();
      
      render(
        <Navigation>
          <NavigationItem href="/dashboard">Dashboard</NavigationItem>
          <NavigationItem href="/courses">Courses</NavigationItem>
          <NavigationItem href="/profile">Profile</NavigationItem>
        </Navigation>
      );
      
      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      const coursesLink = screen.getByRole('link', { name: 'Courses' });
      
      // Focus first item
      dashboardLink.focus();
      expect(dashboardLink).toHaveFocus();
      
      // Tab to next item
      await user.tab();
      expect(coursesLink).toHaveFocus();
    });
  });
});