import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

const selectVariants = cva(
  'flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input',
        destructive: 'border-destructive focus:ring-destructive',
        success: 'border-success focus:ring-success',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'>,
    VariantProps<typeof selectVariants> {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ 
    className, 
    variant, 
    size, 
    options,
    value,
    onChange,
    placeholder = 'Select an option...',
    error,
    helperText,
    searchable = false,
    clearable = false,
    multiple = false,
    disabled,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    
    const selectRef = React.useRef<HTMLButtonElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);
    
    const resolvedRef = ref || selectRef;
    const selectVariant = error ? 'destructive' : variant;

    // Filter options based on search term
    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchTerm) return options;
      return options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm, searchable]);

    // Get selected option(s)
    const selectedOption = options.find(option => option.value === value);
    const displayValue = selectedOption?.label || '';

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          resolvedRef && 
          'current' in resolvedRef && 
          resolvedRef.current &&
          !resolvedRef.current.contains(event.target as Node) &&
          listRef.current &&
          !listRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [resolvedRef]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            if (searchable) {
              setTimeout(() => searchRef.current?.focus(), 0);
            }
          } else if (focusedIndex >= 0) {
            const option = filteredOptions[focusedIndex];
            if (option && !option.disabled) {
              onChange?.(option.value);
              setIsOpen(false);
              setSearchTerm('');
              setFocusedIndex(-1);
            }
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex(prev => {
              const nextIndex = prev < filteredOptions.length - 1 ? prev + 1 : 0;
              return filteredOptions[nextIndex]?.disabled ? 
                (nextIndex < filteredOptions.length - 1 ? nextIndex + 1 : 0) : 
                nextIndex;
            });
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex(prev => {
              const nextIndex = prev > 0 ? prev - 1 : filteredOptions.length - 1;
              return filteredOptions[nextIndex]?.disabled ? 
                (nextIndex > 0 ? nextIndex - 1 : filteredOptions.length - 1) : 
                nextIndex;
            });
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
          break;
        case 'Tab':
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
          break;
      }
    };

    const handleOptionClick = (option: SelectOption) => {
      if (option.disabled) return;
      
      onChange?.(option.value);
      setIsOpen(false);
      setSearchTerm('');
      setFocusedIndex(-1);
      
      // Return focus to trigger button
      if (resolvedRef && 'current' in resolvedRef && resolvedRef.current) {
        resolvedRef.current.focus();
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
    };

    return (
      <div className="relative w-full">
        <button
          ref={resolvedRef}
          type="button"
          className={cn(selectVariants({ variant: selectVariant, size }), className)}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={props['aria-labelledby']}
          aria-describedby={
            error || helperText 
              ? `${props.id || 'select'}-description` 
              : undefined
          }
          disabled={disabled}
          {...props}
        >
          <span className={cn(
            'block truncate',
            !displayValue && 'text-muted-foreground'
          )}>
            {displayValue || placeholder}
          </span>
          
          <div className="flex items-center space-x-1">
            {clearable && value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label="Clear selection"
                tabIndex={-1}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <ChevronDownIcon 
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )} 
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
            {searchable && (
              <div className="p-2 border-b">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
            )}
            
            <ul
              ref={listRef}
              role="listbox"
              aria-labelledby={props['aria-labelledby']}
              className="max-h-60 overflow-auto py-1"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  No options found
                </li>
              ) : (
                filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    aria-disabled={option.disabled}
                    className={cn(
                      'relative cursor-pointer select-none py-2 pl-3 pr-9 text-sm',
                      option.disabled 
                        ? 'text-muted-foreground cursor-not-allowed opacity-50'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                      index === focusedIndex && 'bg-accent text-accent-foreground',
                      option.value === value && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => handleOptionClick(option)}
                  >
                    <span className="block truncate">
                      {option.label}
                    </span>
                    
                    {option.value === value && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <CheckIcon className="h-4 w-4" />
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {(error || helperText) && (
          <p 
            id={`${props.id || 'select'}-description`}
            className={cn(
              'mt-1 text-sm',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
            role={error ? 'alert' : undefined}
            aria-live={error ? 'polite' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select, selectVariants };