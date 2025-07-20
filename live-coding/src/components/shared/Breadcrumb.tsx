'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbProps {
  className?: string;
  separator?: React.ReactNode;
  homeIcon?: boolean;
  maxItems?: number;
}

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbItemProps {
  item: BreadcrumbItem;
  isLast: boolean;
  separator?: React.ReactNode;
}

// Custom breadcrumb items for specific routes
const customBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { label: 'Dashboard', href: '/dashboard', current: true }
  ],
  '/courses': [
    { label: 'Courses', href: '/courses', current: true }
  ],
  '/courses/[id]': [
    { label: 'Courses', href: '/courses' },
    { label: 'Course Details', href: '', current: true }
  ],
  '/profile': [
    { label: 'Profile', href: '/profile', current: true }
  ],
  '/settings': [
    { label: 'Settings', href: '/settings', current: true }
  ],
  '/help': [
    { label: 'Help Center', href: '/help', current: true }
  ],
};

const formatPathSegment = (segment: string): string => {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const generateBreadcrumbsFromPath = (pathname: string): BreadcrumbItem[] => {
  // Check for custom breadcrumbs first
  if (customBreadcrumbs[pathname]) {
    return customBreadcrumbs[pathname];
  }

  // Generate breadcrumbs from path segments
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  segments.forEach((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label: formatPathSegment(segment),
      href,
      current: isLast
    });
  });

  return breadcrumbs;
};

const BreadcrumbItemComponent: React.FC<BreadcrumbItemProps> = ({ 
  item, 
  isLast, 
  separator 
}) => {
  if (isLast || item.current) {
    return (
      <span 
        className="text-sm font-medium text-foreground"
        aria-current="page"
      >
        {item.label}
      </span>
    );
  }

  return (
    <>
      <Link
        href={item.href}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {item.label}
      </Link>
      {separator}
    </>
  );
};

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ 
    className, 
    separator = <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />,
    homeIcon = true,
    maxItems = 5,
    ...props 
  }, ref) => {
    const pathname = usePathname();
    
    // Don't show breadcrumbs on home page
    if (pathname === '/') {
      return null;
    }

    const breadcrumbs = generateBreadcrumbsFromPath(pathname);
    
    // Truncate breadcrumbs if they exceed maxItems
    let displayBreadcrumbs = breadcrumbs;
    let showEllipsis = false;
    
    if (breadcrumbs.length > maxItems) {
      showEllipsis = true;
      displayBreadcrumbs = [
        ...breadcrumbs.slice(0, 1), // First item
        ...breadcrumbs.slice(-(maxItems - 2)) // Last items
      ];
    }

    return (
      <nav
        ref={ref}
        className={cn(
          'flex items-center space-x-1 text-sm',
          className
        )}
        aria-label="Breadcrumb"
        {...props}
      >
        <ol className="flex items-center space-x-1">
          {/* Home link */}
          {homeIcon && (
            <li className="flex items-center">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Home"
              >
                <HomeIcon className="h-4 w-4" />
              </Link>
              {breadcrumbs.length > 0 && (
                <span className="mx-2">
                  {separator}
                </span>
              )}
            </li>
          )}

          {/* Breadcrumb items */}
          {displayBreadcrumbs.map((item, index) => {
            const isLast = index === displayBreadcrumbs.length - 1;
            
            return (
              <li key={item.href || item.label} className="flex items-center">
                {/* Show ellipsis if items were truncated */}
                {showEllipsis && index === 1 && breadcrumbs.length > maxItems && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <span className="mx-2">
                      {separator}
                    </span>
                  </>
                )}
                
                <BreadcrumbItemComponent
                  item={item}
                  isLast={isLast}
                  separator={
                    !isLast ? (
                      <span className="mx-2">
                        {separator}
                      </span>
                    ) : null
                  }
                />
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);
Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb };