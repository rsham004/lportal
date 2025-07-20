import React from 'react';
import { render, screen } from '@testing-library/react';
import { Spinner, Skeleton, LoadingCard, LoadingButton } from './Loading';

describe('Loading Components', () => {
  describe('Spinner', () => {
    it('renders with default props', () => {
      render(<Spinner data-testid="spinner" />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('applies different sizes correctly', () => {
      const { rerender } = render(<Spinner size="sm" data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('h-4', 'w-4');

      rerender(<Spinner size="md" data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('h-6', 'w-6');

      rerender(<Spinner size="lg" data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('h-8', 'w-8');

      rerender(<Spinner size="xl" data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('h-12', 'w-12');
    });

    it('applies custom className', () => {
      const customClass = 'custom-spinner-class';
      render(<Spinner className={customClass} data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass(customClass);
    });

    it('has proper accessibility attributes', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('Skeleton', () => {
    it('renders with default props', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse', 'bg-muted', 'rounded-md');
    });

    it('applies different heights correctly', () => {
      const { rerender } = render(<Skeleton height="sm" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('h-4');

      rerender(<Skeleton height="md" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('h-6');

      rerender(<Skeleton height="lg" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('h-8');

      rerender(<Skeleton height="xl" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('h-12');
    });

    it('applies different widths correctly', () => {
      const { rerender } = render(<Skeleton width="sm" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('w-16');

      rerender(<Skeleton width="md" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('w-32');

      rerender(<Skeleton width="lg" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('w-48');

      rerender(<Skeleton width="full" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('w-full');
    });

    it('applies custom className', () => {
      const customClass = 'custom-skeleton-class';
      render(<Skeleton className={customClass} data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass(customClass);
    });

    it('renders as circle when specified', () => {
      render(<Skeleton circle data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('rounded-full');
    });
  });

  describe('LoadingCard', () => {
    it('renders with default props', () => {
      render(<LoadingCard data-testid="loading-card" />);
      const card = screen.getByTestId('loading-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
    });

    it('shows header skeleton when showHeader is true', () => {
      render(<LoadingCard showHeader data-testid="loading-card" />);
      const card = screen.getByTestId('loading-card');
      
      // Should have header section with title and description skeletons
      const skeletons = card.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(1);
    });

    it('shows footer skeleton when showFooter is true', () => {
      render(<LoadingCard showFooter data-testid="loading-card" />);
      const card = screen.getByTestId('loading-card');
      
      // Should have footer section
      const skeletons = card.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('applies custom className', () => {
      const customClass = 'custom-loading-card-class';
      render(<LoadingCard className={customClass} data-testid="loading-card" />);
      expect(screen.getByTestId('loading-card')).toHaveClass(customClass);
    });

    it('renders multiple content lines', () => {
      render(<LoadingCard lines={3} data-testid="loading-card" />);
      const card = screen.getByTestId('loading-card');
      
      // Should have 3 content line skeletons
      const skeletons = card.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(3);
    });
  });

  describe('LoadingButton', () => {
    it('renders with loading state', () => {
      render(<LoadingButton loading data-testid="loading-button">Save</LoadingButton>);
      const button = screen.getByTestId('loading-button');
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
      
      // Should contain spinner
      expect(button.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it('renders normally when not loading', () => {
      render(<LoadingButton loading={false} data-testid="loading-button">Save</LoadingButton>);
      const button = screen.getByTestId('loading-button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent('Save');
      
      // Should not contain spinner
      expect(button.querySelector('[role="status"]')).not.toBeInTheDocument();
    });

    it('shows loading text when provided', () => {
      render(
        <LoadingButton loading loadingText="Saving..." data-testid="loading-button">
          Save
        </LoadingButton>
      );
      const button = screen.getByTestId('loading-button');
      expect(button).toHaveTextContent('Saving...');
    });

    it('applies custom className', () => {
      const customClass = 'custom-loading-button-class';
      render(
        <LoadingButton className={customClass} data-testid="loading-button">
          Save
        </LoadingButton>
      );
      expect(screen.getByTestId('loading-button')).toHaveClass(customClass);
    });

    it('forwards button props correctly', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton onClick={handleClick} type="submit" data-testid="loading-button">
          Save
        </LoadingButton>
      );
      const button = screen.getByTestId('loading-button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('prevents click when loading', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton loading onClick={handleClick} data-testid="loading-button">
          Save
        </LoadingButton>
      );
      const button = screen.getByTestId('loading-button');
      button.click();
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('spinner has proper ARIA attributes', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('skeleton has proper ARIA attributes', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('loading button has proper ARIA attributes', () => {
      render(<LoadingButton loading>Save</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });
});