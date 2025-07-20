'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface AppHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface AppMainProps {
  children: React.ReactNode;
  className?: string;
  withSidebar?: boolean;
}

interface AppSidebarProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

interface AppContentProps {
  children: React.ReactNode;
  className?: string;
}

interface AppFooterProps {
  children: React.ReactNode;
  className?: string;
}

const AppLayout = React.forwardRef<HTMLDivElement, AppLayoutProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen bg-background flex flex-col',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AppLayout.displayName = 'AppLayout';

const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          className
        )}
        {...props}
      >
        {children}
      </header>
    );
  }
);
AppHeader.displayName = 'AppHeader';

const AppMain = React.forwardRef<HTMLElement, AppMainProps>(
  ({ children, className, withSidebar = false, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          'flex-1 flex',
          withSidebar ? 'relative' : 'flex-col',
          className
        )}
        {...props}
      >
        {children}
      </main>
    );
  }
);
AppMain.displayName = 'AppMain';

const AppSidebar = React.forwardRef<HTMLAsideElement, AppSidebarProps>(
  ({ children, className, isOpen = true, onToggle, ...props }, ref) => {
    return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onToggle}
            aria-hidden="true"
          />
        )}
        
        {/* Sidebar */}
        <aside
          ref={ref}
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            className
          )}
          {...props}
        >
          <div className="flex h-full flex-col overflow-y-auto">
            {children}
          </div>
        </aside>
      </>
    );
  }
);
AppSidebar.displayName = 'AppSidebar';

const AppContent = React.forwardRef<HTMLDivElement, AppContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex-1 flex flex-col min-w-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AppContent.displayName = 'AppContent';

const AppFooter = React.forwardRef<HTMLElement, AppFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn(
          'border-t bg-background',
          className
        )}
        {...props}
      >
        {children}
      </footer>
    );
  }
);
AppFooter.displayName = 'AppFooter';

export {
  AppLayout,
  AppHeader,
  AppMain,
  AppSidebar,
  AppContent,
  AppFooter,
};