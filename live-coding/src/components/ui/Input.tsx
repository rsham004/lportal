import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const inputVariants = cva(
  'flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input',
        destructive: 'border-destructive focus-visible:ring-destructive',
        success: 'border-success focus-visible:ring-success',
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

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, error, type, startIcon, endIcon, helperText, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const inputVariant = error ? 'destructive' : variant;
    
    return (
      <div className="w-full">
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              {startIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              startIcon && 'pl-10',
              (endIcon || isPassword) && 'pr-10',
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error || helperText 
                ? `${props.id || props.name}-description` 
                : undefined
            }
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          )}

          {endIcon && !isPassword && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              {endIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p 
            id={`${props.id || props.name}-description`}
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

Input.displayName = 'Input';

export { Input, inputVariants };