'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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

interface UserMenuProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on Escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Sign In</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        className={cn(
          'flex items-center space-x-2 p-2 rounded-md hover:bg-accent transition-colors',
          isOpen && 'bg-accent'
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <UserCircleIcon className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-foreground">{user.name}</div>
          {user.role && (
            <div className="text-xs text-muted-foreground">{user.role}</div>
          )}
        </div>
        <ChevronDownIcon
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-popover border rounded-md shadow-lg z-50">
          <div className="p-2">
            {/* User Info */}
            <div className="px-2 py-3 border-b">
              <div className="text-sm font-medium text-foreground">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>

            {/* Menu Items */}
            <div className="py-2 space-y-1">
              <Link
                href="/profile"
                className="flex items-center px-2 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <UserIcon className="h-4 w-4 mr-3" />
                Profile
              </Link>
              
              <Link
                href="/dashboard"
                className="flex items-center px-2 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <AcademicCapIcon className="h-4 w-4 mr-3" />
                My Courses
              </Link>
              
              <Link
                href="/settings"
                className="flex items-center px-2 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Cog6ToothIcon className="h-4 w-4 mr-3" />
                Settings
              </Link>
              
              <div className="border-t my-2" />
              
              <button
                className="flex items-center w-full px-2 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  // Handle logout
                }}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
    // Mock user data - in real app this would come from auth context
    const user = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Student',
      avatar: undefined
    };

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

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <BellIcon className="h-5 w-5" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User menu */}
              <UserMenu user={user} />
            </div>
          </div>
        </div>
      </header>
    );
  }
);
Header.displayName = 'Header';

export { Header };