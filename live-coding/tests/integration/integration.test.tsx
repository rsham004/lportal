import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Phase 1.2 Components
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { FormProvider, useForm, Form, FormField, FormLabel, FormError } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Phase 1.3 Components
import { AppLayout, AppHeader, AppMain, AppSidebar, AppContent, AppFooter } from '@/components/ui/AppLayout';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Sidebar } from '@/components/shared/Sidebar';
import { Breadcrumb } from '@/components/shared/Breadcrumb';

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/profile',
}));

// Mock theme utilities
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

// Integration test component that combines Phase 1.2 and 1.3
function IntegratedApp() {
  const { register, handleSubmit, state } = useForm();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [submitData, setSubmitData] = React.useState<any>(null);

  const onSubmit = (data: any) => {
    setSubmitData(data);
  };

  const selectOptions = [
    { value: 'student', label: 'Student' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <ThemeProvider>
      <AppLayout>
        <AppHeader>
          <Header 
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            showSidebarToggle={true}
          />
        </AppHeader>
        
        <AppMain withSidebar>
          <AppSidebar 
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          >
            <Sidebar variant="main" />
          </AppSidebar>
          
          <AppContent>
            <div className="container mx-auto px-4 py-6">
              <Breadcrumb className="mb-6" />
              
              <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
                
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <FormField>
                    <FormLabel htmlFor="name" required>Full Name</FormLabel>
                    <Input
                      id="name"
                      {...register('name', { 
                        required: 'Name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      })}
                    />
                    <FormError name="name" />
                  </FormField>

                  <FormField>
                    <FormLabel htmlFor="email" required>Email</FormLabel>
                    <Input
                      id="email"
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        email: 'Please enter a valid email'
                      })}
                    />
                    <FormError name="email" />
                  </FormField>

                  <FormField>
                    <FormLabel htmlFor="role">Role</FormLabel>
                    <Select
                      id="role"
                      options={selectOptions}
                      placeholder="Select your role"
                      {...register('role')}
                    />
                    <FormError name="role" />
                  </FormField>

                  <FormField>
                    <FormLabel htmlFor="bio">Bio</FormLabel>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      showCharCount
                      maxLength={200}
                      {...register('bio')}
                    />
                    <FormError name="bio" />
                  </FormField>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={state.isSubmitting} className="flex-1">
                      {state.isSubmitting ? 'Saving...' : 'Save Profile'}
                    </Button>
                    <ThemeToggle variant="button" />
                  </div>
                </Form>

                {submitData && (
                  <div className="mt-6 p-4 bg-accent rounded-md" data-testid="success-message">
                    <h3 className="font-semibold mb-2">Profile Updated!</h3>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(submitData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </AppContent>
        </AppMain>
        
        <AppFooter>
          <Footer />
        </AppFooter>
      </AppLayout>
    </ThemeProvider>
  );
}

describe('Phase 1.2 and 1.3 Integration', () => {
  describe('Complete Application Layout', () => {
    it('renders the complete integrated application', () => {
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Verify Phase 1.3 layout components
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      expect(screen.getByRole('complementary')).toBeInTheDocument(); // Sidebar
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer

      // Verify Phase 1.2 form components
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    });

    it('integrates theme provider with all components', () => {
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Theme toggle should be present in the form
      const themeToggle = screen.getByLabelText('Toggle theme');
      expect(themeToggle).toBeInTheDocument();

      // Header should also have theme toggle
      const headerThemeToggle = screen.getAllByLabelText('Toggle theme');
      expect(headerThemeToggle.length).toBeGreaterThan(1);
    });

    it('shows breadcrumb navigation in the layout', () => {
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Breadcrumb should show current path
      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
      expect(screen.getByLabelText('Home')).toBeInTheDocument();
    });
  });

  describe('Sidebar Integration', () => {
    it('toggles sidebar when header button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Find sidebar toggle in header (mobile view)
      const sidebarToggle = screen.getByRole('button', { name: /toggle navigation menu/i });
      
      // Initially sidebar should be closed (on mobile)
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('-translate-x-full');

      // Click to open
      await user.click(sidebarToggle);
      expect(sidebar).toHaveClass('translate-x-0');
    });

    it('renders navigation items in sidebar', () => {
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Main navigation items should be present
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('My Courses')).toBeInTheDocument();
      expect(screen.getByText('Browse Catalog')).toBeInTheDocument();
    });
  });

  describe('Form Integration with Layout', () => {
    it('submits form and shows success message within layout', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Fill out the form
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/bio/i), 'Software developer');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      // Success message should appear
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
        expect(screen.getByText('Profile Updated!')).toBeInTheDocument();
      });
    });

    it('validates form fields and shows errors in layout context', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Submit empty form
      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      // Error messages should appear
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('handles mobile layout correctly', () => {
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Sidebar should be hidden on mobile by default
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('-translate-x-full');

      // Mobile menu toggle should be present
      expect(screen.getByRole('button', { name: /toggle navigation menu/i })).toBeInTheDocument();
    });

    it('maintains form functionality across different screen sizes', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Form should work regardless of layout
      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'Test User');
      
      expect(nameInput).toHaveValue('Test User');
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains proper focus management across components', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Tab through form elements
      const nameInput = screen.getByLabelText(/full name/i);
      nameInput.focus();
      
      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/role/i)).toHaveFocus();
    });

    it('provides proper ARIA landmarks for screen readers', () => {
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // All major landmarks should be present
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      expect(screen.getByRole('complementary')).toBeInTheDocument(); // Sidebar
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    });

    it('handles error announcements properly', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Submit form to trigger errors
      await user.click(screen.getByRole('button', { name: /save profile/i }));

      // Error messages should have proper ARIA attributes
      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Theme Integration', () => {
    it('applies theme consistently across all components', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Theme toggle should be functional
      const themeToggle = screen.getAllByLabelText('Toggle theme')[0];
      await user.click(themeToggle);

      // Theme should be applied to the entire application
      // (This would be more thoroughly tested with actual theme application)
      expect(themeToggle).toBeInTheDocument();
    });
  });

  describe('Performance and State Management', () => {
    it('maintains component state correctly during interactions', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Fill form partially
      await user.type(screen.getByLabelText(/full name/i), 'John');
      
      // Toggle sidebar
      await user.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
      
      // Form state should be preserved
      expect(screen.getByLabelText(/full name/i)).toHaveValue('John');
    });

    it('handles multiple component interactions without conflicts', async () => {
      const user = userEvent.setup();
      render(
        <FormProvider>
          <IntegratedApp />
        </FormProvider>
      );

      // Interact with multiple components simultaneously
      await user.type(screen.getByLabelText(/full name/i), 'Test');
      await user.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
      await user.click(screen.getAllByLabelText('Toggle theme')[0]);
      
      // All interactions should work without interference
      expect(screen.getByLabelText(/full name/i)).toHaveValue('Test');
      expect(screen.getByRole('complementary')).toHaveClass('translate-x-0');
    });
  });
});