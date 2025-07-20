import * as React from 'react';
import { cn } from '@/lib/utils';

// Container Component
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  children: React.ReactNode;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto px-4',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Container.displayName = 'Container';

// Grid Component
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  smCols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  mdCols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  lgCols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  xlCols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  children: React.ReactNode;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, smCols, mdCols, lgCols, xlCols, gap = 4, children, ...props }, ref) => {
    const getColsClass = (colCount: number | undefined, prefix = '') => {
      if (!colCount) return '';
      const prefixStr = prefix ? `${prefix}:` : '';
      return `${prefixStr}grid-cols-${colCount}`;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          cols && getColsClass(cols),
          smCols && getColsClass(smCols, 'sm'),
          mdCols && getColsClass(mdCols, 'md'),
          lgCols && getColsClass(lgCols, 'lg'),
          xlCols && getColsClass(xlCols, 'xl'),
          `gap-${gap}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Grid.displayName = 'Grid';

// GridItem Component
interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full';
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full';
  colStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
  rowStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  children: React.ReactNode;
}

const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, colSpan, rowSpan, colStart, rowStart, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          colSpan && `col-span-${colSpan}`,
          rowSpan && `row-span-${rowSpan}`,
          colStart && `col-start-${colStart}`,
          rowStart && `row-start-${rowStart}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GridItem.displayName = 'GridItem';

// Stack Component
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'vertical' | 'horizontal';
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  children: React.ReactNode;
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction = 'vertical', spacing = 4, align, justify, children, ...props }, ref) => {
    const isHorizontal = direction === 'horizontal';
    
    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };

    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          isHorizontal ? 'flex-row' : 'flex-col',
          isHorizontal ? `space-x-${spacing}` : `space-y-${spacing}`,
          align && alignClasses[align],
          justify && justifyClasses[justify],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Stack.displayName = 'Stack';

// Flex Component
interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  children: React.ReactNode;
}

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ className, direction, wrap, align, justify, gap, children, ...props }, ref) => {
    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    };

    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          direction && `flex-${direction}`,
          wrap && `flex-${wrap}`,
          align && alignClasses[align],
          justify && justifyClasses[justify],
          gap !== undefined && `gap-${gap}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Flex.displayName = 'Flex';

// Box Component
interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  // Padding
  p?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  px?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  py?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  pt?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  pr?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  pb?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  pl?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  
  // Margin
  m?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  mx?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  my?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  mt?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  mr?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  mb?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  ml?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  
  // Size
  w?: 'auto' | 'full' | 'screen' | 'min' | 'max' | 'fit' | number;
  h?: 'auto' | 'full' | 'screen' | 'min' | 'max' | 'fit' | number;
  
  children: React.ReactNode;
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ 
    className, 
    p, px, py, pt, pr, pb, pl,
    m, mx, my, mt, mr, mb, ml,
    w, h,
    children, 
    ...props 
  }, ref) => {
    const getSpacingClass = (value: number | undefined, type: string) => {
      return value !== undefined ? `${type}-${value}` : '';
    };

    const getSizeClass = (value: string | number | undefined, type: 'w' | 'h') => {
      if (value === undefined) return '';
      if (typeof value === 'number') return `${type}-${value}`;
      return `${type}-${value}`;
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Padding
          getSpacingClass(p, 'p'),
          getSpacingClass(px, 'px'),
          getSpacingClass(py, 'py'),
          getSpacingClass(pt, 'pt'),
          getSpacingClass(pr, 'pr'),
          getSpacingClass(pb, 'pb'),
          getSpacingClass(pl, 'pl'),
          
          // Margin
          getSpacingClass(m, 'm'),
          getSpacingClass(mx, 'mx'),
          getSpacingClass(my, 'my'),
          getSpacingClass(mt, 'mt'),
          getSpacingClass(mr, 'mr'),
          getSpacingClass(mb, 'mb'),
          getSpacingClass(ml, 'ml'),
          
          // Size
          getSizeClass(w, 'w'),
          getSizeClass(h, 'h'),
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Box.displayName = 'Box';

export { Container, Grid, GridItem, Stack, Flex, Box };