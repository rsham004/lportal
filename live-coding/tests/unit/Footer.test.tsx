import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('Footer', () => {
  it('renders footer with brand information', () => {
    render(<Footer />);
    
    expect(screen.getByText('Learning Portal')).toBeInTheDocument();
    expect(screen.getByText(/Empowering learners worldwide/)).toBeInTheDocument();
  });

  it('renders all navigation sections', () => {
    render(<Footer />);
    
    // Check section headers
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
  });

  it('renders platform links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute('href', '/courses');
    expect(screen.getByRole('link', { name: 'Instructors' })).toHaveAttribute('href', '/instructors');
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
    expect(screen.getByRole('link', { name: 'Enterprise' })).toHaveAttribute('href', '/enterprise');
  });

  it('renders support links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: 'Help Center' })).toHaveAttribute('href', '/help');
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Community' })).toHaveAttribute('href', '/community');
  });

  it('renders company links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'Careers' })).toHaveAttribute('href', '/careers');
    expect(screen.getByRole('link', { name: 'Press' })).toHaveAttribute('href', '/press');
  });

  it('renders legal links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Cookie Policy' })).toHaveAttribute('href', '/cookies');
    expect(screen.getByRole('link', { name: 'Accessibility' })).toHaveAttribute('href', '/accessibility');
  });

  it('renders social media links', () => {
    render(<Footer />);
    
    const twitterLink = screen.getByLabelText('Follow us on Twitter');
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/learningportal');
    expect(twitterLink).toHaveAttribute('target', '_blank');
    expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');

    const linkedinLink = screen.getByLabelText('Follow us on LinkedIn');
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/company/learningportal');
    expect(linkedinLink).toHaveAttribute('target', '_blank');

    const youtubeLink = screen.getByLabelText('Follow us on YouTube');
    expect(youtubeLink).toHaveAttribute('href', 'https://youtube.com/learningportal');
    expect(youtubeLink).toHaveAttribute('target', '_blank');

    const githubLink = screen.getByLabelText('Follow us on GitHub');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/learningportal');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('renders external links with proper attributes', () => {
    render(<Footer />);
    
    const statusLink = screen.getByRole('link', { name: 'System Status' });
    expect(statusLink).toHaveAttribute('target', '_blank');
    expect(statusLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders copyright information with current year', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} Learning Portal. All rights reserved.`)).toBeInTheDocument();
  });

  it('renders bottom navigation links', () => {
    render(<Footer />);
    
    // Check for bottom section links
    const bottomLinks = screen.getAllByRole('link', { name: 'Privacy' });
    expect(bottomLinks.length).toBeGreaterThan(0);
    
    expect(screen.getByRole('link', { name: 'Terms' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cookies' })).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Footer className="custom-footer" />);
    
    expect(container.firstChild).toHaveClass('custom-footer');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLElement>();
    render(<Footer ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  describe('Responsive design', () => {
    it('has responsive grid classes', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      const gridContainer = footer.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-6');
    });

    it('has responsive bottom section layout', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      const bottomSection = footer.querySelector('.flex.flex-col.md\\:flex-row');
      expect(bottomSection).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<Footer />);
      
      // Section headings should be h3
      const platformHeading = screen.getByRole('heading', { name: 'Platform' });
      expect(platformHeading.tagName).toBe('H3');
    });

    it('has proper link accessibility', () => {
      render(<Footer />);
      
      // All links should be accessible
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href');
      });
    });

    it('social links have proper aria-labels', () => {
      render(<Footer />);
      
      expect(screen.getByLabelText('Follow us on Twitter')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow us on LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow us on YouTube')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow us on GitHub')).toBeInTheDocument();
    });
  });
});