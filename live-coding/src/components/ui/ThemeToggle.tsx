'use client';

import * as React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
}

const themeOptions = [
  {
    value: 'light' as const,
    label: 'Light',
    icon: SunIcon,
  },
  {
    value: 'dark' as const,
    label: 'Dark',
    icon: MoonIcon,
  },
  {
    value: 'system' as const,
    label: 'System',
    icon: ComputerDesktopIcon,
  },
];

export function ThemeToggle({ 
  className, 
  variant = 'button',
  size = 'md' 
}: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (variant !== 'dropdown') return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant]);

  // Close dropdown on Escape key
  React.useEffect(() => {
    if (variant !== 'dropdown') return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [variant]);

  const currentThemeOption = themeOptions.find(option => option.value === theme);
  const CurrentIcon = currentThemeOption?.icon || SunIcon;

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={toggleTheme}
        className={cn('h-9 w-9 p-0', className)}
        aria-label="Toggle theme"
      >
        <CurrentIcon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select theme"
      >
        <CurrentIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{currentThemeOption?.label}</span>
        <ChevronDownIcon
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-popover border rounded-md shadow-lg z-50">
          <div className="p-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center w-full px-2 py-2 text-sm rounded-md transition-colors',
                    theme === option.value
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}