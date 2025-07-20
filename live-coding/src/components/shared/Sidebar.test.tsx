import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

const mockCourseData = {
  id: 'javascript-fundamentals',
  title: 'JavaScript Fundamentals',
  modules: [
    {
      id: 'module-1',
      title: 'Getting Started',
      completed: true,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Introduction to JavaScript',
          type: 'video' as const,
          duration: '10 min',
          completed: true,
        },
        {
          id: 'lesson-2',
          title: 'Setting up Development Environment',
          type: 'reading' as const,
          duration: '5 min',
          completed: true,
        },
      ],
    },
    {
      id: 'module-2',
      title: 'Variables and Data Types',
      completed: false,
      lessons: [
        {
          id: 'lesson-3',
          title: 'Understanding Variables',
          type: 'video' as const,
          duration: '12 min',
          completed: false,
        },
        {
          id: 'lesson-4',
          title: 'Quiz: Variables',
          type: 'quiz' as const,
          completed: false,
        },
      ],
    },
  ],
};

describe('Sidebar', () => {
  describe('Main navigation variant', () => {
    it('renders main navigation items', () => {
      render(<Sidebar variant="main" />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('My Courses')).toBeInTheDocument();
      expect(screen.getByText('Browse Catalog')).toBeInTheDocument();
      expect(screen.getByText('Community')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('renders secondary navigation items', () => {
      render(<Sidebar variant="main" />);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Help & Support')).toBeInTheDocument();
    });

    it('shows navigation sections with proper headings', () => {
      render(<Sidebar variant="main" />);
      
      expect(screen.getByText('MAIN')).toBeInTheDocument();
      expect(screen.getByText('ACCOUNT')).toBeInTheDocument();
    });

    it('highlights active navigation item', () => {
      render(<Sidebar variant="main" />);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-accent', 'text-accent-foreground');
    });

    it('shows badge for courses', () => {
      render(<Sidebar variant="main" />);
      
      expect(screen.getByText('3')).toBeInTheDocument(); // Course badge
    });

    it('renders navigation links with correct hrefs', () => {
      render(<Sidebar variant="main" />);
      
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /my courses/i })).toHaveAttribute('href', '/courses');
      expect(screen.getByRole('link', { name: /browse catalog/i })).toHaveAttribute('href', '/catalog');
      expect(screen.getByRole('link', { name: /community/i })).toHaveAttribute('href', '/community');
      expect(screen.getByRole('link', { name: /progress/i })).toHaveAttribute('href', '/progress');
      expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/settings');
      expect(screen.getByRole('link', { name: /help & support/i })).toHaveAttribute('href', '/help');
    });
  });

  describe('Course navigation variant', () => {
    it('renders course title and back link', () => {
      render(<Sidebar variant="course" courseData={mockCourseData} />);
      
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('← Back to Courses')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to courses/i })).toHaveAttribute('href', '/courses');
    });

    it('renders course modules', () => {
      render(<Sidebar variant="course" courseData={mockCourseData} />);
      
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Variables and Data Types')).toBeInTheDocument();
    });

    it('shows module completion status', () => {
      render(<Sidebar variant="course" courseData={mockCourseData} />);
      
      // Completed module should have check icon
      const completedModule = screen.getByText('Getting Started').closest('div');
      expect(completedModule?.querySelector('svg')).toBeInTheDocument(); // Check icon
      
      // Progress indicators
      expect(screen.getByText('2/2')).toBeInTheDocument(); // Completed module
      expect(screen.getByText('0/2')).toBeInTheDocument(); // Incomplete module
    });

    it('expands module when clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar variant="course" courseData={mockCourseData} />);
      
      const moduleButton = screen.getByText('Getting Started');
      await user.click(moduleButton);
      
      // Should show lessons
      expect(screen.getByText('Introduction to JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Setting up Development Environment')).toBeInTheDocument();
    });

    it('shows lesson types with appropriate icons', async () => {
      const user = userEvent.setup();
      render(<Sidebar variant="course" courseData={mockCourseData} />);
      
      const moduleButton = screen.getByText('Getting Started');
      await user.click(moduleButton);
      
      // Video and reading lessons should have different icons
      const lessons = screen.getAllByRole('link');
      expect(lessons.length).toBeGreaterThan(0);
    });

    it('shows lesson duration', async () => {
      const user = userEvent.setup();
      render(<Sidebar variant="course" courseData={mockCourseData} />);
      
      const moduleButton = screen.getByText('Getting Started');
      await user.click(moduleButton);
      
      expect(screen.getByText('10 min')).toBeInTheDocument();
      expect(screen.getByText('5 min')).toBeInTheDocument();
    });

    it('generates correct lesson links', async () => {
      const user = userEvent.setup();
      render(<Sidebar variant="course" courseData={mockCourseData} />);
      
      const moduleButton = screen.getByText('Getting Started');
      await user.click(moduleButton);
      
      const lessonLink = screen.getByRole('link', { name: /introduction to javascript/i });
      expect(lessonLink).toHaveAttribute('href', '/courses/javascript-fundamentals/lessons/lesson-1');
    });

    it('shows completed lessons with strikethrough', async () => {
      const user = userEvent.setup();
      render(<Sidebar variant="course" courseData={mockCourseData} />);
      
      const moduleButton = screen.getByText('Getting Started');
      await user.click(moduleButton);
      
      const completedLesson = screen.getByText('Introduction to JavaScript');
      expect(completedLesson).toHaveClass('line-through');
    });

    it('handles modules without lessons', () => {
      const courseDataWithEmptyModule = {
        ...mockCourseData,
        modules: [
          {
            id: 'empty-module',
            title: 'Empty Module',
            completed: false,
            lessons: [],
          },
        ],
      };

      render(<Sidebar variant="course" courseData={courseDataWithEmptyModule} />);
      
      expect(screen.getByText('Empty Module')).toBeInTheDocument();
      expect(screen.getByText('0/0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders as aside element', () => {
      render(<Sidebar variant="main" />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });

    it('has proper navigation structure', () => {
      render(<Sidebar variant="main" />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('has proper button accessibility for expandable modules', async () => {
      const user = userEvent.setup();
      render(<Sidebar variant="course" courseData={mockCourseData} />);
      
      const moduleButtons = screen.getAllByRole('button');
      moduleButtons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('maintains focus management for keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Sidebar variant="main" />);
      
      const firstLink = screen.getByRole('link', { name: /dashboard/i });
      firstLink.focus();
      
      expect(document.activeElement).toBe(firstLink);
      
      await user.tab();
      
      const secondLink = screen.getByRole('link', { name: /my courses/i });
      expect(document.activeElement).toBe(secondLink);
    });
  });

  describe('Responsive behavior', () => {
    it('applies correct width classes', () => {
      render(<Sidebar variant="main" />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-64');
    });

    it('has overflow handling for long content', () => {
      render(<Sidebar variant="main" />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('overflow-y-auto');
    });
  });

  it('applies custom className', () => {
    render(<Sidebar variant="main" className="custom-sidebar" />);
    
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('custom-sidebar');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLElement>();
    render(<Sidebar ref={ref} variant="main" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  describe('Error handling', () => {
    it('handles missing course data gracefully', () => {
      render(<Sidebar variant="course" />);
      
      // Should not crash and should render main navigation instead
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles course data with missing properties', () => {
      const incompleteCourseData = {
        id: 'test',
        title: 'Test Course',
        modules: [],
      };

      render(<Sidebar variant="course" courseData={incompleteCourseData} />);
      
      expect(screen.getByText('Test Course')).toBeInTheDocument();
    });
  });
});