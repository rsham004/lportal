'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Form validation types
export interface ValidationRule {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: (value: any) => boolean | string;
  email?: boolean | string;
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
}

export interface FieldError {
  type: string;
  message: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, FieldError>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Form context
interface FormContextValue {
  state: FormState;
  register: (name: string, rules?: ValidationRule) => {
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    'aria-invalid': boolean;
    'aria-describedby': string;
  };
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: FieldError) => void;
  clearError: (name: string) => void;
  validateField: (name: string, value: any, rules?: ValidationRule) => FieldError | null;
  handleSubmit: (onSubmit: (data: Record<string, any>) => void | Promise<void>) => (e: React.FormEvent) => Promise<void>;
}

const FormContext = React.createContext<FormContextValue | undefined>(undefined);

// Form provider component
interface FormProviderProps {
  children: React.ReactNode;
  defaultValues?: Record<string, any>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
}

export function FormProvider({ 
  children, 
  defaultValues = {},
  mode = 'onBlur'
}: FormProviderProps) {
  const [state, setState] = React.useState<FormState>({
    values: defaultValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  });

  const rulesRef = React.useRef<Record<string, ValidationRule>>({});

  const validateField = React.useCallback((name: string, value: any, rules?: ValidationRule): FieldError | null => {
    const fieldRules = rules || rulesRef.current[name];
    if (!fieldRules) return null;

    // Required validation
    if (fieldRules.required) {
      const isEmpty = value === undefined || value === null || value === '' || 
                     (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        const message = typeof fieldRules.required === 'string' 
          ? fieldRules.required 
          : `${name} is required`;
        return { type: 'required', message };
      }
    }

    // Skip other validations if value is empty and not required
    if (!value && !fieldRules.required) return null;

    // Email validation
    if (fieldRules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        const message = typeof fieldRules.email === 'string' 
          ? fieldRules.email 
          : 'Please enter a valid email address';
        return { type: 'email', message };
      }
    }

    // Pattern validation
    if (fieldRules.pattern && value) {
      const pattern = typeof fieldRules.pattern === 'object' && 'value' in fieldRules.pattern
        ? fieldRules.pattern.value
        : fieldRules.pattern as RegExp;
      
      if (!pattern.test(value)) {
        const message = typeof fieldRules.pattern === 'object' && 'message' in fieldRules.pattern
          ? fieldRules.pattern.message
          : `${name} format is invalid`;
        return { type: 'pattern', message };
      }
    }

    // Min length validation
    if (fieldRules.minLength && value) {
      const minLength = typeof fieldRules.minLength === 'object' 
        ? fieldRules.minLength.value 
        : fieldRules.minLength;
      
      if (value.length < minLength) {
        const message = typeof fieldRules.minLength === 'object' 
          ? fieldRules.minLength.message 
          : `${name} must be at least ${minLength} characters`;
        return { type: 'minLength', message };
      }
    }

    // Max length validation
    if (fieldRules.maxLength && value) {
      const maxLength = typeof fieldRules.maxLength === 'object' 
        ? fieldRules.maxLength.value 
        : fieldRules.maxLength;
      
      if (value.length > maxLength) {
        const message = typeof fieldRules.maxLength === 'object' 
          ? fieldRules.maxLength.message 
          : `${name} must be no more than ${maxLength} characters`;
        return { type: 'maxLength', message };
      }
    }

    // Min value validation
    if (fieldRules.min !== undefined && value !== undefined) {
      const min = typeof fieldRules.min === 'object' 
        ? fieldRules.min.value 
        : fieldRules.min;
      
      if (Number(value) < min) {
        const message = typeof fieldRules.min === 'object' 
          ? fieldRules.min.message 
          : `${name} must be at least ${min}`;
        return { type: 'min', message };
      }
    }

    // Max value validation
    if (fieldRules.max !== undefined && value !== undefined) {
      const max = typeof fieldRules.max === 'object' 
        ? fieldRules.max.value 
        : fieldRules.max;
      
      if (Number(value) > max) {
        const message = typeof fieldRules.max === 'object' 
          ? fieldRules.max.message 
          : `${name} must be no more than ${max}`;
        return { type: 'max', message };
      }
    }

    // Custom validation
    if (fieldRules.validate && value !== undefined) {
      const result = fieldRules.validate(value);
      if (result !== true) {
        const message = typeof result === 'string' ? result : `${name} is invalid`;
        return { type: 'validate', message };
      }
    }

    return null;
  }, []);

  const register = React.useCallback((name: string, rules?: ValidationRule) => {
    if (rules) {
      rulesRef.current[name] = rules;
    }

    return {
      name,
      value: state.values[name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked
          : e.target.value;

        setState(prev => ({
          ...prev,
          values: { ...prev.values, [name]: value },
        }));

        if (mode === 'onChange') {
          const error = validateField(name, value, rules);
          setState(prev => ({
            ...prev,
            errors: error 
              ? { ...prev.errors, [name]: error }
              : { ...prev.errors, [name]: undefined },
          }));
        }
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setState(prev => ({
          ...prev,
          touched: { ...prev.touched, [name]: true },
        }));

        if (mode === 'onBlur' || mode === 'onChange') {
          const value = e.target.type === 'checkbox' 
            ? (e.target as HTMLInputElement).checked
            : e.target.value;
          const error = validateField(name, value, rules);
          setState(prev => ({
            ...prev,
            errors: error 
              ? { ...prev.errors, [name]: error }
              : { ...prev.errors, [name]: undefined },
          }));
        }
      },
      'aria-invalid': !!state.errors[name],
      'aria-describedby': `${name}-error ${name}-description`,
    };
  }, [state.values, state.errors, mode, validateField]);

  const setValue = React.useCallback((name: string, value: any) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [name]: value },
    }));
  }, []);

  const setError = React.useCallback((name: string, error: FieldError) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
    }));
  }, []);

  const clearError = React.useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: undefined },
    }));
  }, []);

  const handleSubmit = React.useCallback((onSubmit: (data: Record<string, any>) => void | Promise<void>) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      
      setState(prev => ({ ...prev, isSubmitting: true }));

      // Validate all fields
      const errors: Record<string, FieldError> = {};
      let isValid = true;

      Object.keys(rulesRef.current).forEach(name => {
        const error = validateField(name, state.values[name], rulesRef.current[name]);
        if (error) {
          errors[name] = error;
          isValid = false;
        }
      });

      setState(prev => ({
        ...prev,
        errors,
        isValid,
        touched: Object.keys(rulesRef.current).reduce((acc, name) => ({
          ...acc,
          [name]: true,
        }), {}),
      }));

      if (isValid) {
        try {
          await onSubmit(state.values);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }

      setState(prev => ({ ...prev, isSubmitting: false }));
    };
  }, [state.values, validateField]);

  const value = React.useMemo<FormContextValue>(() => ({
    state,
    register,
    setValue,
    setError,
    clearError,
    validateField,
    handleSubmit,
  }), [state, register, setValue, setError, clearError, validateField, handleSubmit]);

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}

// Hook to use form context
export function useForm(): FormContextValue {
  const context = React.useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
}

// Form component
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn('space-y-6', className)}
        noValidate
        {...props}
      >
        {children}
      </form>
    );
  }
);
Form.displayName = 'Form';

// Form field wrapper
interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
}

// Form label
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  }
);
FormLabel.displayName = 'FormLabel';

// Form error message
interface FormErrorProps {
  name: string;
  className?: string;
}

export function FormError({ name, className }: FormErrorProps) {
  const { state } = useForm();
  const error = state.errors[name];
  const touched = state.touched[name];

  if (!error || !touched) return null;

  return (
    <p
      id={`${name}-error`}
      className={cn('text-sm text-destructive', className)}
      role="alert"
      aria-live="polite"
    >
      {error.message}
    </p>
  );
}

// Form description
interface FormDescriptionProps {
  name: string;
  children: React.ReactNode;
  className?: string;
}

export function FormDescription({ name, children, className }: FormDescriptionProps) {
  return (
    <p
      id={`${name}-description`}
      className={cn('text-sm text-muted-foreground', className)}
    >
      {children}
    </p>
  );
}