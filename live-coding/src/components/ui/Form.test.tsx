import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  FormProvider, 
  useForm, 
  Form, 
  FormField, 
  FormLabel, 
  FormError, 
  FormDescription 
} from './Form';

// Test component that uses the form hook
function TestForm() {
  const { register, handleSubmit, state } = useForm();
  const [submitData, setSubmitData] = React.useState<any>(null);

  const onSubmit = (data: any) => {
    setSubmitData(data);
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <FormField>
        <FormLabel htmlFor="email" required>Email</FormLabel>
        <input
          id="email"
          type="email"
          {...register('email', { 
            required: 'Email is required',
            email: 'Please enter a valid email'
          })}
        />
        <FormError name="email" />
        <FormDescription name="email">
          We'll never share your email with anyone else.
        </FormDescription>
      </FormField>

      <FormField>
        <FormLabel htmlFor="password">Password</FormLabel>
        <input
          id="password"
          type="password"
          {...register('password', { 
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' }
          })}
        />
        <FormError name="password" />
      </FormField>

      <FormField>
        <FormLabel htmlFor="age">Age</FormLabel>
        <input
          id="age"
          type="number"
          {...register('age', { 
            min: { value: 18, message: 'Must be at least 18 years old' },
            max: { value: 120, message: 'Must be less than 120 years old' }
          })}
        />
        <FormError name="age" />
      </FormField>

      <button type="submit" disabled={state.isSubmitting}>
        {state.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>

      {submitData && (
        <div data-testid="submit-data">
          {JSON.stringify(submitData)}
        </div>
      )}
    </Form>
  );
}

describe('Form Components', () => {
  describe('FormProvider and useForm', () => {
    it('provides form context to children', () => {
      render(
        <FormProvider>
          <TestForm />
        </FormProvider>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('validates required fields on submit', async () => {
      const user = userEvent.setup();
      
      render(
        <FormProvider>
          <TestForm />
        </FormProvider>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      
      render(
        <FormProvider>
          <TestForm />
        </FormProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      });
    });

    it('validates password minimum length', async () => {
      const user = userEvent.setup();
      
      render(
        <FormProvider>
          <TestForm />
        </FormProvider>
      );

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, '123');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('validates number range', async () => {
      const user = userEvent.setup();
      
      render(
        <FormProvider>
          <TestForm />
        </FormProvider>
      );

      const ageInput = screen.getByLabelText(/age/i);
      await user.type(ageInput, '15');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Must be at least 18 years old')).toBeInTheDocument();
      });

      await user.clear(ageInput);
      await user.type(ageInput, '150');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Must be less than 120 years old')).toBeInTheDocument();
      });
    });

    it('submits valid form data', async () => {
      const user = userEvent.setup();
      
      render(
        <FormProvider>
          <TestForm />
        </FormProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const ageInput = screen.getByLabelText(/age/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(ageInput, '25');
      await user.click(submitButton);

      await waitFor(() => {
        const submitData = screen.getByTestId('submit-data');
        expect(submitData).toHaveTextContent(
          JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            age: '25'
          })
        );
      });
    });

    it('validates on change when mode is onChange', async () => {
      const user = userEvent.setup();
      
      render(
        <FormProvider mode="onChange">
          <TestForm />
        </FormProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid');

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      });
    });

    it('uses default values', () => {
      render(
        <FormProvider defaultValues={{ email: 'default@example.com' }}>
          <TestForm />
        </FormProvider>
      );

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(emailInput.value).toBe('default@example.com');
    });
  });

  describe('FormLabel', () => {
    it('renders label with required indicator', () => {
      render(
        <FormLabel htmlFor="test" required>
          Test Label
        </FormLabel>
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByLabelText('required')).toBeInTheDocument();
    });

    it('renders label without required indicator', () => {
      render(
        <FormLabel htmlFor="test">
          Test Label
        </FormLabel>
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.queryByLabelText('required')).not.toBeInTheDocument();
    });
  });

  describe('FormError', () => {
    it('displays error when field has error and is touched', () => {
      function TestErrorComponent() {
        const { setError, setValue } = useForm();
        
        React.useEffect(() => {
          setError('test', { type: 'required', message: 'Test error message' });
          setValue('test', 'touched');
        }, [setError, setValue]);

        return <FormError name="test" />;
      }

      render(
        <FormProvider>
          <TestErrorComponent />
        </FormProvider>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not display error when field is not touched', () => {
      function TestErrorComponent() {
        const { setError } = useForm();
        
        React.useEffect(() => {
          setError('test', { type: 'required', message: 'Test error message' });
        }, [setError]);

        return <FormError name="test" />;
      }

      render(
        <FormProvider>
          <TestErrorComponent />
        </FormProvider>
      );

      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });
  });

  describe('FormDescription', () => {
    it('renders description text', () => {
      render(
        <FormProvider>
          <FormDescription name="test">
            This is a description
          </FormDescription>
        </FormProvider>
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('has correct id for aria-describedby', () => {
      render(
        <FormProvider>
          <FormDescription name="test">
            This is a description
          </FormDescription>
        </FormProvider>
      );

      const description = screen.getByText('This is a description');
      expect(description).toHaveAttribute('id', 'test-description');
    });
  });

  describe('Accessibility', () => {
    it('sets proper ARIA attributes on form inputs', () => {
      render(
        <FormProvider>
          <TestForm />
        </FormProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error email-description');
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('updates aria-invalid when field has error', async () => {
      const user = userEvent.setup();
      
      render(
        <FormProvider>
          <TestForm />
        </FormProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Error handling', () => {
    it('throws error when useForm is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestForm />);
      }).toThrow('useForm must be used within a FormProvider');

      consoleSpy.mockRestore();
    });
  });
});