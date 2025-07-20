'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

interface NavigationItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}

interface NavigationMenuProps {
  children: React.ReactNode;
}

interface NavigationTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface NavigationContentProps {
  children: React.ReactNode;
}

const NavigationContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, children, ...props }, ref) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
      <nav
        ref={ref}
        className={cn(
          'flex items-center justify-between p-4 bg-background border-b',
          className
        )}
        {...props}
      >
        {/* Logo/Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold text-foreground">
            Learning Portal
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div
          data-testid="nav-items"
          className={cn(
            'items-center space-x-1',
            isMobileMenuOpen ? 'flex' : 'hidden md:flex'
          )}
        >
          {children}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-5 w-5" />
          ) : (
            <Bars3Icon className="h-5 w-5" />
          )}
        </button>
      </nav>
    );
  }
);
Navigation.displayName = 'Navigation';

const NavigationItem = React.forwardRef<HTMLAnchorElement, NavigationItemProps>(
  ({ className, href, disabled, children, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    if (disabled) {
      return (
        <span
          className={cn(
            'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium pointer-events-none opacity-50',
            className
          )}
        >
          {children}
        </span>
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          className
        )}
        {...props}
      >
        {children}
      </Link>
    );
  }
);
NavigationItem.displayName = 'NavigationItem';

const NavigationMenu: React.FC<NavigationMenuProps> = ({ children }) => {
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

  return (
    <NavigationContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={menuRef} className="relative">
        {children}
      </div>
    </NavigationContext.Provider>
  );
};

const NavigationTrigger = React.forwardRef<HTMLButtonElement, NavigationTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, setIsOpen } = React.useContext(NavigationContext);

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isOpen && 'bg-accent text-accent-foreground',
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        {...props}
      >
        {children}
        <ChevronDownIcon
          className={cn(
            'ml-1 h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
    );
  }
);
NavigationTrigger.displayName = 'NavigationTrigger';

const NavigationContent: React.FC<NavigationContentProps> = ({ children }) => {
  const { isOpen } = React.useContext(NavigationContext);

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-1 w-48 bg-popover border rounded-md shadow-lg z-50">
      <div className="p-1 space-y-1">
        {children}
      </div>
    </div>
  );
};

export {
  Navigation,
  NavigationItem,
  NavigationMenu,
  NavigationTrigger,
  NavigationContent,
};