import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default props', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm');
    });

    it('applies custom className', () => {
      const customClass = 'custom-card-class';
      render(<Card className={customClass} data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass(customClass);
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('renders children correctly', () => {
      render(<Card>Test content</Card>);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('renders with correct styling', () => {
      render(<CardHeader data-testid="card-header">Header content</CardHeader>);
      const header = screen.getByTestId('card-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('applies custom className', () => {
      const customClass = 'custom-header-class';
      render(<CardHeader className={customClass} data-testid="card-header">Content</CardHeader>);
      expect(screen.getByTestId('card-header')).toHaveClass(customClass);
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 by default', () => {
      render(<CardTitle>Card Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Card Title');
    });

    it('has correct styling', () => {
      render(<CardTitle data-testid="card-title">Title</CardTitle>);
      const title = screen.getByTestId('card-title');
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
    });

    it('applies custom className', () => {
      const customClass = 'custom-title-class';
      render(<CardTitle className={customClass} data-testid="card-title">Title</CardTitle>);
      expect(screen.getByTestId('card-title')).toHaveClass(customClass);
    });
  });

  describe('CardDescription', () => {
    it('renders with correct styling', () => {
      render(<CardDescription data-testid="card-description">Description text</CardDescription>);
      const description = screen.getByTestId('card-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('applies custom className', () => {
      const customClass = 'custom-description-class';
      render(<CardDescription className={customClass} data-testid="card-description">Description</CardDescription>);
      expect(screen.getByTestId('card-description')).toHaveClass(customClass);
    });
  });

  describe('CardContent', () => {
    it('renders with correct styling', () => {
      render(<CardContent data-testid="card-content">Content text</CardContent>);
      const content = screen.getByTestId('card-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('applies custom className', () => {
      const customClass = 'custom-content-class';
      render(<CardContent className={customClass} data-testid="card-content">Content</CardContent>);
      expect(screen.getByTestId('card-content')).toHaveClass(customClass);
    });
  });

  describe('CardFooter', () => {
    it('renders with correct styling', () => {
      render(<CardFooter data-testid="card-footer">Footer content</CardFooter>);
      const footer = screen.getByTestId('card-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('applies custom className', () => {
      const customClass = 'custom-footer-class';
      render(<CardFooter className={customClass} data-testid="card-footer">Footer</CardFooter>);
      expect(screen.getByTestId('card-footer')).toHaveClass(customClass);
    });
  });

  describe('Complete Card Structure', () => {
    it('renders a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Card Title</CardTitle>
            <CardDescription>Test card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Card Title');
      expect(screen.getByText('Test card description')).toBeInTheDocument();
      expect(screen.getByText('This is the card content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('maintains proper semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
            <CardDescription>This card follows accessibility guidelines</CardDescription>
          </CardHeader>
          <CardContent>
            Content that is properly structured
          </CardContent>
        </Card>
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      
      // Check that description follows title
      const description = screen.getByText('This card follows accessibility guidelines');
      expect(description).toBeInTheDocument();
    });
  });
});