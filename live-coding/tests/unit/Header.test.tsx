import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from './Header';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('Header', () => {
  it('renders the logo and brand name', () => {
    render(<Header />);
    
    expect(screen.getByText('Learning Portal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /learning portal/i })).toHaveAttribute('href', '/');
  });

  it('shows sidebar toggle when showSidebarToggle is true', () => {
    const mockToggle = jest.fn();
    render(<Header showSidebarToggle onSidebarToggle={mockToggle} />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('hides sidebar toggle when showSidebarToggle is false', () => {
    render(<Header showSidebarToggle={false} />);
    
    expect(screen.queryByRole('button', { name: /toggle navigation menu/i })).not.toBeInTheDocument();
  });

  it('renders search bar', () => {
    render(<Header />);
    
    expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument();
  });

  it('renders notifications button with badge', () => {
    render(<Header />);
    
    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    expect(notificationButton).toBeInTheDocument();
    
    // Check for notification badge
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders user menu with user information', () => {
    render(<Header />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('opens user menu when clicked', async () => {
    render(<Header />);
    
    const userMenuButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(userMenuButton);
    
    await waitFor(() => {
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('My Courses')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });

  it('closes user menu when clicking outside', async () => {
    render(<Header />);
    
    const userMenuButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(userMenuButton);
    
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
    
    // Click outside the menu
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });
  });

  it('closes user menu when escape key is pressed', async () => {
    render(<Header />);
    
    const userMenuButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(userMenuButton);
    
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<Header showSidebarToggle />);
    
    const sidebarToggle = screen.getByRole('button', { name: /toggle navigation menu/i });
    expect(sidebarToggle).toHaveAttribute('aria-expanded', 'false');
    
    const userMenuButton = screen.getByRole('button', { expanded: false });
    expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
    expect(userMenuButton).toHaveAttribute('aria-haspopup', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(<Header className="custom-header" />);
    
    expect(container.firstChild).toHaveClass('custom-header');
  });
});