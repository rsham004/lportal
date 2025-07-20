import React from 'react';
import { render, screen } from '@testing-library/react';
import { Container, Grid, GridItem, Stack, Flex, Box } from './Layout';

describe('Layout Components', () => {
  describe('Container', () => {
    it('renders with default props', () => {
      render(<Container data-testid="container">Content</Container>);
      const container = screen.getByTestId('container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('mx-auto', 'px-4');
    });

    it('applies different sizes correctly', () => {
      const { rerender } = render(<Container size="sm" data-testid="container">Content</Container>);
      expect(screen.getByTestId('container')).toHaveClass('max-w-screen-sm');

      rerender(<Container size="md" data-testid="container">Content</Container>);
      expect(screen.getByTestId('container')).toHaveClass('max-w-screen-md');

      rerender(<Container size="lg" data-testid="container">Content</Container>);
      expect(screen.getByTestId('container')).toHaveClass('max-w-screen-lg');

      rerender(<Container size="xl" data-testid="container">Content</Container>);
      expect(screen.getByTestId('container')).toHaveClass('max-w-screen-xl');

      rerender(<Container size="2xl" data-testid="container">Content</Container>);
      expect(screen.getByTestId('container')).toHaveClass('max-w-screen-2xl');

      rerender(<Container size="full" data-testid="container">Content</Container>);
      expect(screen.getByTestId('container')).toHaveClass('max-w-full');
    });

    it('applies custom className', () => {
      const customClass = 'custom-container-class';
      render(<Container className={customClass} data-testid="container">Content</Container>);
      expect(screen.getByTestId('container')).toHaveClass(customClass);
    });
  });

  describe('Grid', () => {
    it('renders with default props', () => {
      render(<Grid data-testid="grid">Grid content</Grid>);
      const grid = screen.getByTestId('grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid');
    });

    it('applies different column counts', () => {
      const { rerender } = render(<Grid cols={1} data-testid="grid">Content</Grid>);
      expect(screen.getByTestId('grid')).toHaveClass('grid-cols-1');

      rerender(<Grid cols={2} data-testid="grid">Content</Grid>);
      expect(screen.getByTestId('grid')).toHaveClass('grid-cols-2');

      rerender(<Grid cols={3} data-testid="grid">Content</Grid>);
      expect(screen.getByTestId('grid')).toHaveClass('grid-cols-3');

      rerender(<Grid cols={4} data-testid="grid">Content</Grid>);
      expect(screen.getByTestId('grid')).toHaveClass('grid-cols-4');

      rerender(<Grid cols={6} data-testid="grid">Content</Grid>);
      expect(screen.getByTestId('grid')).toHaveClass('grid-cols-6');

      rerender(<Grid cols={12} data-testid="grid">Content</Grid>);
      expect(screen.getByTestId('grid')).toHaveClass('grid-cols-12');
    });

    it('applies responsive column counts', () => {
      render(
        <Grid 
          cols={1} 
          mdCols={2} 
          lgCols={3} 
          xlCols={4} 
          data-testid="grid"
        >
          Content
        </Grid>
      );
      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });

    it('applies different gap sizes', () => {
      const { rerender } = render(<Grid gap={2} data-testid="grid">Content</Grid>);
      expect(screen.getByTestId('grid')).toHaveClass('gap-2');

      rerender(<Grid gap={4} data-testid="grid">Content</Grid>);
      expect(screen.getByTestId('grid')).toHaveClass('gap-4');

      rerender(<Grid gap={6} data-testid="grid">Content</Grid>);
      expect(screen.getByTestId('grid')).toHaveClass('gap-6');

      rerender(<Grid gap={8} data-testid="grid">Content</Grid>);
      expect(screen.getByTestId('grid')).toHaveClass('gap-8');
    });
  });

  describe('GridItem', () => {
    it('renders with default props', () => {
      render(<GridItem data-testid="grid-item">Item content</GridItem>);
      const item = screen.getByTestId('grid-item');
      expect(item).toBeInTheDocument();
    });

    it('applies column span correctly', () => {
      const { rerender } = render(<GridItem colSpan={1} data-testid="grid-item">Content</GridItem>);
      expect(screen.getByTestId('grid-item')).toHaveClass('col-span-1');

      rerender(<GridItem colSpan={2} data-testid="grid-item">Content</GridItem>);
      expect(screen.getByTestId('grid-item')).toHaveClass('col-span-2');

      rerender(<GridItem colSpan={3} data-testid="grid-item">Content</GridItem>);
      expect(screen.getByTestId('grid-item')).toHaveClass('col-span-3');

      rerender(<GridItem colSpan="full" data-testid="grid-item">Content</GridItem>);
      expect(screen.getByTestId('grid-item')).toHaveClass('col-span-full');
    });

    it('applies row span correctly', () => {
      const { rerender } = render(<GridItem rowSpan={1} data-testid="grid-item">Content</GridItem>);
      expect(screen.getByTestId('grid-item')).toHaveClass('row-span-1');

      rerender(<GridItem rowSpan={2} data-testid="grid-item">Content</GridItem>);
      expect(screen.getByTestId('grid-item')).toHaveClass('row-span-2');

      rerender(<GridItem rowSpan="full" data-testid="grid-item">Content</GridItem>);
      expect(screen.getByTestId('grid-item')).toHaveClass('row-span-full');
    });
  });

  describe('Stack', () => {
    it('renders with default vertical direction', () => {
      render(<Stack data-testid="stack">Stack content</Stack>);
      const stack = screen.getByTestId('stack');
      expect(stack).toBeInTheDocument();
      expect(stack).toHaveClass('flex', 'flex-col');
    });

    it('applies horizontal direction', () => {
      render(<Stack direction="horizontal" data-testid="stack">Content</Stack>);
      expect(screen.getByTestId('stack')).toHaveClass('flex-row');
    });

    it('applies different spacing', () => {
      const { rerender } = render(<Stack spacing={2} data-testid="stack">Content</Stack>);
      expect(screen.getByTestId('stack')).toHaveClass('space-y-2');

      rerender(<Stack spacing={4} data-testid="stack">Content</Stack>);
      expect(screen.getByTestId('stack')).toHaveClass('space-y-4');

      rerender(<Stack direction="horizontal" spacing={4} data-testid="stack">Content</Stack>);
      expect(screen.getByTestId('stack')).toHaveClass('space-x-4');
    });

    it('applies alignment correctly', () => {
      const { rerender } = render(<Stack align="start" data-testid="stack">Content</Stack>);
      expect(screen.getByTestId('stack')).toHaveClass('items-start');

      rerender(<Stack align="center" data-testid="stack">Content</Stack>);
      expect(screen.getByTestId('stack')).toHaveClass('items-center');

      rerender(<Stack align="end" data-testid="stack">Content</Stack>);
      expect(screen.getByTestId('stack')).toHaveClass('items-end');
    });

    it('applies justification correctly', () => {
      const { rerender } = render(<Stack justify="start" data-testid="stack">Content</Stack>);
      expect(screen.getByTestId('stack')).toHaveClass('justify-start');

      rerender(<Stack justify="center" data-testid="stack">Content</Stack>);
      expect(screen.getByTestId('stack')).toHaveClass('justify-center');

      rerender(<Stack justify="between" data-testid="stack">Content</Stack>);
      expect(screen.getByTestId('stack')).toHaveClass('justify-between');
    });
  });

  describe('Flex', () => {
    it('renders with default props', () => {
      render(<Flex data-testid="flex">Flex content</Flex>);
      const flex = screen.getByTestId('flex');
      expect(flex).toBeInTheDocument();
      expect(flex).toHaveClass('flex');
    });

    it('applies direction correctly', () => {
      const { rerender } = render(<Flex direction="row" data-testid="flex">Content</Flex>);
      expect(screen.getByTestId('flex')).toHaveClass('flex-row');

      rerender(<Flex direction="col" data-testid="flex">Content</Flex>);
      expect(screen.getByTestId('flex')).toHaveClass('flex-col');

      rerender(<Flex direction="row-reverse" data-testid="flex">Content</Flex>);
      expect(screen.getByTestId('flex')).toHaveClass('flex-row-reverse');

      rerender(<Flex direction="col-reverse" data-testid="flex">Content</Flex>);
      expect(screen.getByTestId('flex')).toHaveClass('flex-col-reverse');
    });

    it('applies wrap correctly', () => {
      const { rerender } = render(<Flex wrap="wrap" data-testid="flex">Content</Flex>);
      expect(screen.getByTestId('flex')).toHaveClass('flex-wrap');

      rerender(<Flex wrap="nowrap" data-testid="flex">Content</Flex>);
      expect(screen.getByTestId('flex')).toHaveClass('flex-nowrap');

      rerender(<Flex wrap="wrap-reverse" data-testid="flex">Content</Flex>);
      expect(screen.getByTestId('flex')).toHaveClass('flex-wrap-reverse');
    });
  });

  describe('Box', () => {
    it('renders with default props', () => {
      render(<Box data-testid="box">Box content</Box>);
      const box = screen.getByTestId('box');
      expect(box).toBeInTheDocument();
    });

    it('applies padding correctly', () => {
      const { rerender } = render(<Box p={4} data-testid="box">Content</Box>);
      expect(screen.getByTestId('box')).toHaveClass('p-4');

      rerender(<Box px={6} py={2} data-testid="box">Content</Box>);
      expect(screen.getByTestId('box')).toHaveClass('px-6', 'py-2');
    });

    it('applies margin correctly', () => {
      const { rerender } = render(<Box m={4} data-testid="box">Content</Box>);
      expect(screen.getByTestId('box')).toHaveClass('m-4');

      rerender(<Box mx={6} my={2} data-testid="box">Content</Box>);
      expect(screen.getByTestId('box')).toHaveClass('mx-6', 'my-2');
    });

    it('applies width and height correctly', () => {
      render(<Box w="full" h={64} data-testid="box">Content</Box>);
      const box = screen.getByTestId('box');
      expect(box).toHaveClass('w-full', 'h-64');
    });
  });
});