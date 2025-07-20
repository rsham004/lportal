import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
  {
    variants: {
      variant: {
        default: 'border-input',
        destructive: 'border-destructive focus-visible:ring-destructive',
        success: 'border-success focus-visible:ring-success',
      },
      size: {
        sm: 'min-h-[60px] px-2 py-1 text-xs',
        md: 'min-h-[80px] px-3 py-2 text-sm',
        lg: 'min-h-[120px] px-4 py-3 text-base',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      resize: 'vertical',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCharCount?: boolean;
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size, 
    resize,
    error, 
    helperText, 
    maxLength,
    showCharCount = false,
    autoResize = false,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || '');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    
    // Use provided ref or internal ref
    const resolvedRef = ref || textareaRef;
    
    const currentValue = value !== undefined ? value : internalValue;
    const charCount = String(currentValue).length;
    const textareaVariant = error ? 'destructive' : variant;

    // Auto-resize functionality
    React.useEffect(() => {
      if (autoResize && resolvedRef && 'current' in resolvedRef && resolvedRef.current) {
        const textarea = resolvedRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [currentValue, autoResize, resolvedRef]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      // Enforce max length if specified
      if (maxLength && newValue.length > maxLength) {
        return;
      }
      
      if (value === undefined) {
        setInternalValue(newValue);
      }
      
      onChange?.(e);
    };

    return (
      <div className="w-full">
        <div className="relative">
          <textarea
            className={cn(
              textareaVariants({ 
                variant: textareaVariant, 
                size, 
                resize: autoResize ? 'none' : resize 
              }),
              className
            )}
            ref={resolvedRef}
            value={currentValue}
            onChange={handleChange}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error || helperText || showCharCount
                ? `${props.id || props.name}-description` 
                : undefined
            }
            maxLength={maxLength}
            {...props}
          />
        </div>
        
        <div className="flex justify-between items-start mt-1">
          <div className="flex-1">
            {(error || helperText) && (
              <p 
                id={`${props.id || props.name}-description`}
                className={cn(
                  'text-sm',
                  error ? 'text-destructive' : 'text-muted-foreground'
                )}
                role={error ? 'alert' : undefined}
                aria-live={error ? 'polite' : undefined}
              >
                {error || helperText}
              </p>
            )}
          </div>
          
          {showCharCount && (
            <p 
              className={cn(
                'text-xs text-muted-foreground ml-2 flex-shrink-0',
                maxLength && charCount > maxLength * 0.9 && 'text-warning',
                maxLength && charCount >= maxLength && 'text-destructive'
              )}
              aria-label={`Character count: ${charCount}${maxLength ? ` of ${maxLength}` : ''}`}
            >
              {charCount}{maxLength && `/${maxLength}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };