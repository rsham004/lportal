import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorPage } from './ErrorPage';

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

describe('ErrorPage Component', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
  });

  it('renders 404 error page by default', () => {
    render(<ErrorPage />);
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText(/The page you are looking for/)).toBeInTheDocument();
  });

  it('renders different error types correctly', () => {
    const { rerender } = render(<ErrorPage type="404" />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();

    rerender(<ErrorPage type="500" />);
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();

    rerender(<ErrorPage type="403" />);
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByText('Access Forbidden')).toBeInTheDocument();

    rerender(<ErrorPage type="503" />);
    expect(screen.getByText('503')).toBeInTheDocument();
    expect(screen.getByText('Service Unavailable')).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    render(
      <ErrorPage 
        title="Custom Error Title"
        message="This is a custom error message"
      />
    );
    
    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    expect(screen.getByText('This is a custom error message')).toBeInTheDocument();
  });

  it('shows default action buttons', () => {
    render(<ErrorPage />);
    
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('navigates to home when home button is clicked', () => {
    render(<ErrorPage />);
    
    const homeButton = screen.getByRole('button', { name: /go home/i });
    fireEvent.click(homeButton);
    
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates back when back button is clicked', () => {
    render(<ErrorPage />);
    
    const backButton = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(backButton);
    
    expect(mockBack).toHaveBeenCalled();
  });

  it('shows custom actions when provided', () => {
    const customActions = (
      <div>
        <button data-testid="custom-action-1">Custom Action 1</button>
        <button data-testid="custom-action-2">Custom Action 2</button>
      </div>
    );
    
    render(<ErrorPage actions={customActions} />);
    
    expect(screen.getByTestId('custom-action-1')).toBeInTheDocument();
    expect(screen.getByTestId('custom-action-2')).toBeInTheDocument();
    
    // Default actions should not be present
    expect(screen.queryByRole('button', { name: /go home/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /go back/i })).not.toBeInTheDocument();
  });

  it('shows illustration by default', () => {
    render(<ErrorPage />);
    
    const illustration = screen.getByTestId('error-illustration');
    expect(illustration).toBeInTheDocument();
  });

  it('hides illustration when showIllustration is false', () => {
    render(<ErrorPage showIllustration={false} />);
    
    expect(screen.queryByTestId('error-illustration')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-error-page-class';
    render(<ErrorPage className={customClass} />);
    
    const errorPage = screen.getByRole('main');
    expect(errorPage).toHaveClass(customClass);
  });

  it('shows contact support option when showSupport is true', () => {
    render(<ErrorPage showSupport={true} />);
    
    expect(screen.getByText(/need help/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact support/i })).toBeInTheDocument();
  });

  it('hides contact support by default', () => {
    render(<ErrorPage />);
    
    expect(screen.queryByText(/need help/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /contact support/i })).not.toBeInTheDocument();
  });

  it('shows error details when provided', () => {
    const errorDetails = {
      errorId: 'ERR_001',
      timestamp: '2024-01-01T00:00:00Z',
      path: '/courses/react-basics',
    };
    
    render(<ErrorPage details={errorDetails} showDetails={true} />);
    
    expect(screen.getByText('Error Details')).toBeInTheDocument();
    expect(screen.getByText('ERR_001')).toBeInTheDocument();
    expect(screen.getByText('/courses/react-basics')).toBeInTheDocument();
  });

  it('hides error details by default', () => {
    const errorDetails = {
      errorId: 'ERR_001',
      timestamp: '2024-01-01T00:00:00Z',
    };
    
    render(<ErrorPage details={errorDetails} />);
    
    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    expect(screen.queryByText('ERR_001')).not.toBeInTheDocument();
  });

  it('has proper semantic HTML structure', () => {
    render(<ErrorPage />);
    
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ErrorPage />);
    
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-labelledby');
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveAttribute('id');
  });

  it('renders learning platform specific 404 content', () => {
    render(<ErrorPage type="404" />);
    
    expect(screen.getByText(/course or page/i)).toBeInTheDocument();
  });

  it('renders learning platform specific 500 content', () => {
    render(<ErrorPage type="500" />);
    
    expect(screen.getByText(/learning platform/i)).toBeInTheDocument();
  });

  it('supports different layouts', () => {
    const { rerender } = render(<ErrorPage layout="centered" />);
    expect(screen.getByRole('main')).toHaveClass('items-center', 'justify-center');

    rerender(<ErrorPage layout="split" />);
    expect(screen.getByRole('main')).toHaveClass('lg:grid-cols-2');
  });

  it('shows retry button for server errors', () => {
    const onRetry = jest.fn();
    render(<ErrorPage type="500" onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show retry button for client errors by default', () => {
    render(<ErrorPage type="404" />);
    
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('shows loading state on retry button', () => {
    const onRetry = jest.fn();
    render(<ErrorPage type="500" onRetry={onRetry} retryLoading={true} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeDisabled();
  });

  it('renders breadcrumb when provided', () => {
    const breadcrumb = [
      { label: 'Home', href: '/' },
      { label: 'Courses', href: '/courses' },
      { label: 'Error' },
    ];
    
    render(<ErrorPage breadcrumb={breadcrumb} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});