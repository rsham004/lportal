import { render, screen } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

// Mock Next.js usePathname hook
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('Breadcrumb', () => {
  beforeEach(() => {
    mockUsePathname.mockClear();
  });

  it('returns null for home page', () => {
    mockUsePathname.mockReturnValue('/');
    const { container } = render(<Breadcrumb />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders breadcrumbs for dashboard page', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Breadcrumb />);
    
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders breadcrumbs for nested paths', () => {
    mockUsePathname.mockReturnValue('/courses/javascript-fundamentals');
    render(<Breadcrumb />);
    
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Javascript Fundamentals')).toBeInTheDocument();
  });

  it('renders without home icon when homeIcon is false', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Breadcrumb homeIcon={false} />);
    
    expect(screen.queryByLabelText('Home')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('uses custom separator', () => {
    mockUsePathname.mockReturnValue('/courses/javascript');
    render(<Breadcrumb separator={<span>/</span>} />);
    
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('truncates breadcrumbs when exceeding maxItems', () => {
    mockUsePathname.mockReturnValue('/courses/javascript/lessons/variables/exercises');
    render(<Breadcrumb maxItems={3} />);
    
    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Exercises')).toBeInTheDocument();
  });

  it('formats path segments correctly', () => {
    mockUsePathname.mockReturnValue('/my-courses/web-development');
    render(<Breadcrumb />);
    
    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
  });

  it('marks current page with aria-current', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Breadcrumb />);
    
    const currentPage = screen.getByText('Dashboard');
    expect(currentPage).toHaveAttribute('aria-current', 'page');
  });

  it('creates proper links for non-current items', () => {
    mockUsePathname.mockReturnValue('/courses/javascript/lessons');
    render(<Breadcrumb />);
    
    const coursesLink = screen.getByRole('link', { name: 'Courses' });
    expect(coursesLink).toHaveAttribute('href', '/courses');
    
    const javascriptLink = screen.getByRole('link', { name: 'Javascript' });
    expect(javascriptLink).toHaveAttribute('href', '/courses/javascript');
  });

  it('applies custom className', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    const { container } = render(<Breadcrumb className="custom-breadcrumb" />);
    
    expect(container.firstChild).toHaveClass('custom-breadcrumb');
  });

  it('handles deep nesting correctly', () => {
    mockUsePathname.mockReturnValue('/courses/javascript/modules/basics/lessons/variables/exercises/practice');
    render(<Breadcrumb />);
    
    // Should show home icon and breadcrumb items
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
  });
});