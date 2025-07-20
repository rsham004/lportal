import type { Meta, StoryObj } from '@storybook/react';
import { 
  FormProvider, 
  useForm, 
  Form, 
  FormField, 
  FormLabel, 
  FormError, 
  FormDescription 
} from './Form';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { Button } from './Button';

// Example form component
function ExampleForm() {
  const { register, handleSubmit, state } = useForm();
  const [submitData, setSubmitData] = React.useState<any>(null);

  const onSubmit = (data: any) => {
    setSubmitData(data);
    console.log('Form submitted:', data);
  };

  const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
  ];

  return (
    <div className="max-w-md mx-auto p-6 bg-background border rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Contact Form</h2>
      
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormField>
          <FormLabel htmlFor="firstName" required>First Name</FormLabel>
          <Input
            id="firstName"
            {...register('firstName', { 
              required: 'First name is required',
              minLength: { value: 2, message: 'First name must be at least 2 characters' }
            })}
          />
          <FormError name="firstName" />
        </FormField>

        <FormField>
          <FormLabel htmlFor="lastName" required>Last Name</FormLabel>
          <Input
            id="lastName"
            {...register('lastName', { 
              required: 'Last name is required',
              minLength: { value: 2, message: 'Last name must be at least 2 characters' }
            })}
          />
          <FormError name="lastName" />
        </FormField>

        <FormField>
          <FormLabel htmlFor="email" required>Email</FormLabel>
          <Input
            id="email"
            type="email"
            {...register('email', { 
              required: 'Email is required',
              email: 'Please enter a valid email address'
            })}
          />
          <FormError name="email" />
          <FormDescription name="email">
            We'll never share your email with anyone else.
          </FormDescription>
        </FormField>

        <FormField>
          <FormLabel htmlFor="country">Country</FormLabel>
          <Select
            id="country"
            options={countryOptions}
            placeholder="Select your country"
            {...register('country')}
          />
          <FormError name="country" />
        </FormField>

        <FormField>
          <FormLabel htmlFor="message">Message</FormLabel>
          <Textarea
            id="message"
            placeholder="Tell us about yourself..."
            showCharCount
            maxLength={500}
            {...register('message', {
              maxLength: { value: 500, message: 'Message must be less than 500 characters' }
            })}
          />
          <FormError name="message" />
        </FormField>

        <FormField>
          <FormLabel htmlFor="age" required>Age</FormLabel>
          <Input
            id="age"
            type="number"
            {...register('age', { 
              required: 'Age is required',
              min: { value: 18, message: 'Must be at least 18 years old' },
              max: { value: 120, message: 'Must be less than 120 years old' }
            })}
          />
          <FormError name="age" />
        </FormField>

        <div className="flex gap-4">
          <Button type="submit" disabled={state.isSubmitting} className="flex-1">
            {state.isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
          <Button type="button" variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </Form>

      {submitData && (
        <div className="mt-6 p-4 bg-accent rounded-md">
          <h3 className="font-semibold mb-2">Submitted Data:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(submitData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof FormProvider> = {
  title: 'UI/Form',
  component: FormProvider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <FormProvider>
      <ExampleForm />
    </FormProvider>
  ),
};

export const OnChangeValidation: Story = {
  render: () => (
    <FormProvider mode="onChange">
      <ExampleForm />
    </FormProvider>
  ),
};

export const WithDefaultValues: Story = {
  render: () => (
    <FormProvider 
      defaultValues={{
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        country: 'us',
        age: '30'
      }}
    >
      <ExampleForm />
    </FormProvider>
  ),
};

// Simple validation examples
function ValidationExamples() {
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    console.log('Validation example submitted:', data);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormField>
          <FormLabel htmlFor="required-field" required>Required Field</FormLabel>
          <Input
            id="required-field"
            {...register('requiredField', { required: 'This field is required' })}
          />
          <FormError name="requiredField" />
        </FormField>

        <FormField>
          <FormLabel htmlFor="email-field">Email Validation</FormLabel>
          <Input
            id="email-field"
            type="email"
            {...register('emailField', { email: 'Please enter a valid email' })}
          />
          <FormError name="emailField" />
        </FormField>

        <FormField>
          <FormLabel htmlFor="pattern-field">Pattern Validation (Letters only)</FormLabel>
          <Input
            id="pattern-field"
            {...register('patternField', { 
              pattern: { 
                value: /^[A-Za-z]+$/, 
                message: 'Only letters are allowed' 
              }
            })}
          />
          <FormError name="patternField" />
        </FormField>

        <FormField>
          <FormLabel htmlFor="custom-validation">Custom Validation</FormLabel>
          <Input
            id="custom-validation"
            {...register('customField', { 
              validate: (value) => {
                if (value && value.toLowerCase() === 'admin') {
                  return 'Username "admin" is not allowed';
                }
                return true;
              }
            })}
          />
          <FormError name="customField" />
          <FormDescription name="customField">
            Try typing "admin" to see custom validation.
          </FormDescription>
        </FormField>

        <Button type="submit">Validate</Button>
      </Form>
    </div>
  );
}

export const ValidationExamples: Story = {
  render: () => (
    <FormProvider mode="onBlur">
      <ValidationExamples />
    </FormProvider>
  ),
};