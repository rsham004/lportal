import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ErrorDisplay } from './ErrorDisplay';
import { Button } from './Button';

const meta: Meta<typeof ErrorDisplay> = {
  title: 'UI/ErrorDisplay',
  component: ErrorDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['error', 'warning', 'info', 'success'],
    },
    variant: {
      control: { type: 'select' },
      options: ['filled', 'outlined', 'subtle'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'An error occurred while processing your request.',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Connection Failed',
    message: 'Unable to connect to the server. Please check your internet connection.',
  },
};

export const WithDescription: Story = {
  args: {
    message: 'Failed to save changes',
    description: 'The server returned an error while trying to save your changes. Please try again or contact support if the problem persists.',
  },
};

export const ErrorTypes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <ErrorDisplay
        type="error"
        message="This is an error message"
        description="Something went wrong and needs immediate attention."
      />
      <ErrorDisplay
        type="warning"
        message="This is a warning message"
        description="Please be aware of this potential issue."
      />
      <ErrorDisplay
        type="info"
        message="This is an info message"
        description="Here's some helpful information for you."
      />
      <ErrorDisplay
        type="success"
        message="This is a success message"
        description="Your action was completed successfully."
      />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <ErrorDisplay
        variant="filled"
        message="Filled variant"
        description="This uses a filled background style."
      />
      <ErrorDisplay
        variant="outlined"
        message="Outlined variant"
        description="This uses an outlined border style."
      />
      <ErrorDisplay
        variant="subtle"
        message="Subtle variant"
        description="This uses a subtle background style."
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <ErrorDisplay
        size="sm"
        message="Small size error message"
        description="This is a compact error display."
      />
      <ErrorDisplay
        size="md"
        message="Medium size error message"
        description="This is the default size error display."
      />
      <ErrorDisplay
        size="lg"
        message="Large size error message"
        description="This is a larger error display for important messages."
      />
    </div>
  ),
};

export const WithActions: Story = {
  render: () => {
    const [retryLoading, setRetryLoading] = useState(false);
    
    const handleRetry = () => {
      setRetryLoading(true);
      setTimeout(() => setRetryLoading(false), 2000);
    };
    
    const handleDismiss = () => {
      alert('Error dismissed');
    };
    
    return (
      <div className="w-96">
        <ErrorDisplay
          title="Upload Failed"
          message="Failed to upload your file"
          description="The file upload was interrupted. You can try again or dismiss this error."
          onRetry={handleRetry}
          onDismiss={handleDismiss}
          retryLoading={retryLoading}
          retryText="Retry Upload"
          dismissText="Cancel"
        />
      </div>
    );
  },
};

export const WithCustomActions: Story = {
  render: () => (
    <div className="w-96">
      <ErrorDisplay
        title="Payment Failed"
        message="Your payment could not be processed"
        description="There was an issue with your payment method."
        actions={
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">
              Update Payment
            </Button>
            <Button size="sm" variant="ghost">
              Contact Support
            </Button>
          </div>
        }
      />
    </div>
  ),
};

export const WithDetails: Story = {
  render: () => (
    <div className="w-96">
      <ErrorDisplay
        title="API Error"
        message="Request failed with status 500"
        description="The server encountered an internal error."
        details={{
          code: 'ERR_INTERNAL_SERVER',
          timestamp: new Date().toISOString(),
          endpoint: '/api/users/create',
          method: 'POST',
          stack: 'Error: Internal server error\n    at UserController.create (/app/controllers/user.js:45:12)\n    at Router.handle (/app/routes/index.js:23:5)',
        }}
        onRetry={() => alert('Retrying...')}
      />
    </div>
  ),
};

export const WithoutIcon: Story = {
  args: {
    message: 'Error message without icon',
    description: 'This error display has the icon hidden.',
    showIcon: false,
  },
};

export const LearningPlatformExamples: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <div>
        <h3 className="text-lg font-semibold mb-4">Course Loading Error</h3>
        <ErrorDisplay
          type="error"
          title="Failed to Load Course"
          message="Unable to load course content"
          description="There was a problem loading the course materials. Please check your connection and try again."
          onRetry={() => alert('Retrying course load...')}
          retryText="Reload Course"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Assignment Submission Warning</h3>
        <ErrorDisplay
          type="warning"
          variant="subtle"
          title="Submission Deadline Approaching"
          message="Assignment due in 2 hours"
          description="Don't forget to submit your assignment before the deadline."
          actions={
            <Button size="sm" variant="outline">
              Submit Now
            </Button>
          }
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Video Playback Issue</h3>
        <ErrorDisplay
          type="error"
          variant="outlined"
          title="Video Unavailable"
          message="Unable to play video content"
          description="The video file may be corrupted or temporarily unavailable."
          details={{
            code: 'VID_001',
            videoId: 'course-intro-v1.mp4',
            timestamp: new Date().toISOString(),
            quality: '1080p',
          }}
          onRetry={() => alert('Retrying video load...')}
          onDismiss={() => alert('Dismissed')}
          retryText="Reload Video"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Quiz Submission Success</h3>
        <ErrorDisplay
          type="success"
          variant="filled"
          title="Quiz Submitted Successfully"
          message="Your answers have been saved"
          description="You scored 85% on this quiz. Great job!"
          actions={
            <div className="flex space-x-2">
              <Button size="sm" variant="secondary">
                View Results
              </Button>
              <Button size="sm" variant="ghost">
                Next Lesson
              </Button>
            </div>
          }
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Network Connection Info</h3>
        <ErrorDisplay
          type="info"
          variant="subtle"
          size="sm"
          title="Offline Mode"
          message="You're currently offline"
          description="Some features may be limited. Content will sync when connection is restored."
          actions={
            <Button size="sm" variant="outline">
              Retry Connection
            </Button>
          }
        />
      </div>
    </div>
  ),
};

export const InteractiveDemo: Story = {
  render: () => {
    const [errorType, setErrorType] = useState<'error' | 'warning' | 'info' | 'success'>('error');
    const [variant, setVariant] = useState<'filled' | 'outlined' | 'subtle'>('outlined');
    const [showActions, setShowActions] = useState(true);
    
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type:</label>
            <div className="flex space-x-2">
              {(['error', 'warning', 'info', 'success'] as const).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={errorType === type ? 'default' : 'outline'}
                  onClick={() => setErrorType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Variant:</label>
            <div className="flex space-x-2">
              {(['filled', 'outlined', 'subtle'] as const).map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant={variant === v ? 'default' : 'outline'}
                  onClick={() => setVariant(v)}
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Actions:</label>
            <Button
              size="sm"
              variant={showActions ? 'default' : 'outline'}
              onClick={() => setShowActions(!showActions)}
            >
              {showActions ? 'Hide' : 'Show'} Actions
            </Button>
          </div>
        </div>
        
        <div className="w-96">
          <ErrorDisplay
            type={errorType}
            variant={variant}
            title="Interactive Demo"
            message={`This is a ${errorType} message`}
            description="Use the controls above to customize this error display."
            onRetry={showActions ? () => alert('Retry clicked') : undefined}
            onDismiss={showActions ? () => alert('Dismiss clicked') : undefined}
            details={{
              code: `${errorType.toUpperCase()}_001`,
              timestamp: new Date().toISOString(),
              component: 'ErrorDisplay',
            }}
          />
        </div>
      </div>
    );
  },
};