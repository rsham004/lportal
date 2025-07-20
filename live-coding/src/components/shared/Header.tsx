'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserButton } from '@/components/auth/UserButton';
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
  className?: string;
}

const AuthSection: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center space-x-2">
        <SignInButton variant="ghost" size="sm">
          Sign In
        </SignInButton>
        <SignInButton size="sm">
          Get Started
        </SignInButton>
      </div>
    );
  }

  return <UserButton afterSignOutUrl="/" showName={false} />;
};

const SearchBar: React.FC = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="flex items-center">
      <div className={cn(
        'relative transition-all duration-200',
        isExpanded ? 'w-64' : 'w-10'
      )}>
        <input
          type="text"
          placeholder="Search courses..."
          className={cn(
            'w-full pl-10 pr-4 py-2 text-sm bg-background border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
            isExpanded ? 'opacity-100' : 'opacity-0 md:opacity-100 md:w-64'
          )}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => setIsExpanded(false)}
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      {/* Mobile search button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden ml-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <MagnifyingGlassIcon className="h-5 w-5" />
      </Button>
    </div>
  );
};

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ onSidebarToggle, showSidebarToggle = false, className, ...props }, ref) => {
    const { isSignedIn } = useAuth();

    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Left section */}
            <div className="flex items-center space-x-4">
              {/* Sidebar toggle */}
              {showSidebarToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSidebarToggle}
                  className="lg:hidden"
                >
                  <Bars3Icon className="h-5 w-5" />
                </Button>
              )}

              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                  <AcademicCapIcon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground hidden sm:block">
                  Learning Portal
                </span>
              </Link>
            </div>

            {/* Center section - Search */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <SearchBar />
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-2">
              {/* Mobile search */}
              <div className="md:hidden">
                <SearchBar />
              </div>

              {/* Theme toggle */}
              <ThemeToggle variant="button" size="sm" />

              {/* Notifications - only show when signed in */}
              {isSignedIn && (
                <Button variant="ghost" size="sm" className="relative">
                  <BellIcon className="h-5 w-5" />
                  {/* Notification badge */}
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </Button>
              )}

              {/* Authentication section */}
              <AuthSection />
            </div>
          </div>
        </div>
      </header>
    );
  }
);
Header.displayName = 'Header';

export { Header };