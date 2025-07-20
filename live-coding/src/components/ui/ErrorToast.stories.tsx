import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ErrorToast, ToastProvider, useToast } from './ErrorToast';
import { Button } from './Button';

const meta: Meta<typeof ErrorToast> = {
  title: 'UI/ErrorToast',
  component: ErrorToast,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Demo component that uses the toast system
const ToastDemo = () => {
  const { toast, dismissAll } = useToast();
  
  const showErrorToast = () => {
    toast.error('Failed to save your progress', {
      title: 'Save Error',
      actions: [
        { label: 'Retry', onClick: () => alert('Retrying...') },
        { label: 'Cancel', onClick: () => {}, variant: 'ghost' },
      ],
    });
  };
  
  const showSuccessToast = () => {
    toast.success('Your assignment has been submitted successfully!', {
      title: 'Assignment Submitted',
      duration: 3000,
    });
  };
  
  const showWarningToast = () => {
    toast.warning('Your session will expire in 5 minutes', {
      title: 'Session Warning',
      actions: [
        { label: 'Extend Session', onClick: () => alert('Session extended') },
      ],
    });
  };
  
  const showInfoToast = () => {
    toast.info('New course materials are now available', {
      title: 'Course Update',
      actions: [
        { label: 'View Materials', onClick: () => alert('Opening materials...') },
      ],
    });
  };
  
  const showPersistentToast = () => {
    toast.error('Critical system error - please contact support', {
      title: 'System Error',
      duration: 0, // Persistent
      actions: [
        { label: 'Contact Support', onClick: () => alert('Opening support...') },
        { label: 'Report Bug', onClick: () => alert('Opening bug report...'), variant: 'outline' },
      ],
    });
  };
  
  const showMultipleToasts = () => {
    toast.error('Error 1: Network connection failed');
    setTimeout(() => toast.warning('Warning: Retrying connection...'), 500);
    setTimeout(() => toast.info('Info: Attempting to reconnect...'), 1000);
    setTimeout(() => toast.success('Success: Connection restored!'), 2000);
  };
  
  const showPositionedToasts = () => {
    toast.error('Top Left Error', { position: 'top-left' });
    toast.warning('Top Right Warning', { position: 'top-right' });
    toast.info('Bottom Left Info', { position: 'bottom-left' });
    toast.success('Bottom Right Success', { position: 'bottom-right' });
  };
  
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Toast Notification System</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Button onClick={showErrorToast} variant="destructive">
          Show Error Toast
        </Button>
        
        <Button onClick={showSuccessToast} variant="default">
          Show Success Toast
        </Button>
        
        <Button onClick={showWarningToast} variant="outline">
          Show Warning Toast
        </Button>
        
        <Button onClick={showInfoToast} variant="outline">
          Show Info Toast
        </Button>
        
        <Button onClick={showPersistentToast} variant="destructive">
          Show Persistent Toast
        </Button>
        
        <Button onClick={showMultipleToasts} variant="outline">
          Show Multiple Toasts
        </Button>
        
        <Button onClick={showPositionedToasts} variant="outline">
          Show Positioned Toasts
        </Button>
        
        <Button onClick={dismissAll} variant="ghost">
          Dismiss All Toasts
        </Button>
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Click buttons to show different types of toast notifications</li>
          <li>• Hover over toasts to pause auto-dismiss timer</li>
          <li>• Click the X button to manually dismiss toasts</li>
          <li>• Action buttons in toasts are interactive</li>
          <li>• Multiple toasts stack in their respective positions</li>
        </ul>
      </div>
    </div>
  );
};

export const InteractiveDemo: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

export const LearningPlatformExamples: Story = {
  render: () => {
    const LearningToastDemo = () => {
      const { toast } = useToast();
      
      const scenarios = [
        {
          label: 'Course Enrollment Error',
          action: () => toast.error('Failed to enroll in course. Please try again.', {
            title: 'Enrollment Failed',
            actions: [
              { label: 'Retry Enrollment', onClick: () => alert('Retrying enrollment...') },
              { label: 'Contact Support', onClick: () => alert('Opening support...'), variant: 'outline' },
            ],
          }),
        },
        {
          label: 'Assignment Submitted',
          action: () => toast.success('Your assignment has been submitted and is being graded.', {
            title: 'Assignment Submitted',
            actions: [
              { label: 'View Submission', onClick: () => alert('Opening submission...') },
            ],
          }),
        },
        {
          label: 'Quiz Auto-Save',
          action: () => toast.info('Your quiz progress has been automatically saved.', {
            title: 'Progress Saved',
            duration: 2000,
          }),
        },
        {
          label: 'Session Expiring',
          action: () => toast.warning('Your session will expire in 5 minutes due to inactivity.', {
            title: 'Session Warning',
            actions: [
              { label: 'Stay Logged In', onClick: () => alert('Session extended') },
              { label: 'Save & Logout', onClick: () => alert('Saving and logging out...'), variant: 'outline' },
            ],
          }),
        },
        {
          label: 'Video Upload Progress',
          action: () => {
            toast.info('Uploading video assignment...', {
              title: 'Upload in Progress',
              duration: 0,
              showProgress: false,
              id: 'upload-progress',
            });
            
            // Simulate upload completion
            setTimeout(() => {
              toast.success('Video assignment uploaded successfully!', {
                title: 'Upload Complete',
                actions: [
                  { label: 'View Assignment', onClick: () => alert('Opening assignment...') },
                ],
              });
            }, 3000);
          },
        },
        {
          label: 'Course Material Update',
          action: () => toast.info('New lecture slides are now available for download.', {
            title: 'Course Materials Updated',
            position: 'bottom-right',
            actions: [
              { label: 'Download Now', onClick: () => alert('Downloading slides...') },
              { label: 'View Later', onClick: () => {}, variant: 'ghost' },
            ],
          }),
        },
        {
          label: 'Grade Released',
          action: () => toast.success('Your grade for "React Fundamentals Quiz" is now available.', {
            title: 'Grade Released',
            actions: [
              { label: 'View Grade', onClick: () => alert('Opening gradebook...') },
            ],
          }),
        },
        {
          label: 'Network Connection Lost',
          action: () => toast.error('Connection lost. Your work is saved locally and will sync when reconnected.', {
            title: 'Connection Error',
            duration: 0,
            actions: [
              { label: 'Retry Connection', onClick: () => alert('Retrying connection...') },
              { label: 'Work Offline', onClick: () => alert('Switching to offline mode...'), variant: 'outline' },
            ],
          }),
        },
      ];
      
      return (
        <div className="p-8 space-y-6">
          <h2 className="text-2xl font-bold mb-6">Learning Platform Toast Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario, index) => (
              <Button
                key={index}
                onClick={scenario.action}
                variant="outline"
                className="h-auto p-4 text-left justify-start"
              >
                {scenario.label}
              </Button>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Learning Platform Toast Scenarios:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>Course Enrollment Error:</strong> Error with retry and support options</li>
              <li>• <strong>Assignment Submitted:</strong> Success confirmation with view option</li>
              <li>• <strong>Quiz Auto-Save:</strong> Quick info notification</li>
              <li>• <strong>Session Expiring:</strong> Warning with session extension</li>
              <li>• <strong>Video Upload:</strong> Progress indication and completion</li>
              <li>• <strong>Course Material Update:</strong> Info with download action</li>
              <li>• <strong>Grade Released:</strong> Success with grade viewing</li>
              <li>• <strong>Network Connection Lost:</strong> Persistent error with offline mode</li>
            </ul>
          </div>
        </div>
      );
    };
    
    return (
      <ToastProvider maxToasts={4}>
        <LearningToastDemo />
      </ToastProvider>
    );
  },
};

export const ToastPositions: Story = {
  render: () => {
    const PositionDemo = () => {
      const { toast } = useToast();
      
      const positions = [
        { label: 'Top Left', value: 'top-left' as const },
        { label: 'Top Right', value: 'top-right' as const },
        { label: 'Top Center', value: 'top-center' as const },
        { label: 'Bottom Left', value: 'bottom-left' as const },
        { label: 'Bottom Right', value: 'bottom-right' as const },
        { label: 'Bottom Center', value: 'bottom-center' as const },
      ];
      
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">Toast Positions</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {positions.map((position) => (
              <Button
                key={position.value}
                onClick={() => toast.info(`Toast at ${position.label}`, {
                  position: position.value,
                  title: position.label,
                })}
                variant="outline"
              >
                {position.label}
              </Button>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Click the buttons above to see toasts appear in different positions on the screen.
            </p>
          </div>
        </div>
      );
    };
    
    return (
      <ToastProvider>
        <PositionDemo />
      </ToastProvider>
    );
  },
};

export const ToastConfiguration: Story = {
  render: () => {
    const ConfigDemo = () => {
      const { toast } = useToast();
      const [config, setConfig] = useState({
        type: 'error' as const,
        duration: 5000,
        dismissible: true,
        showProgress: true,
        pauseOnHover: true,
        hasActions: false,
      });
      
      const showConfiguredToast = () => {
        const actions = config.hasActions ? [
          { label: 'Action 1', onClick: () => alert('Action 1 clicked') },
          { label: 'Action 2', onClick: () => alert('Action 2 clicked'), variant: 'outline' as const },
        ] : undefined;
        
        toast[config.type]('This is a configurable toast message', {
          title: 'Configurable Toast',
          duration: config.duration || undefined,
          dismissible: config.dismissible,
          showProgress: config.showProgress,
          pauseOnHover: config.pauseOnHover,
          actions,
        });
      };
      
      return (
        <div className="p-8 space-y-6">
          <h2 className="text-2xl font-bold mb-6">Toast Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type:</label>
                <div className="flex space-x-2">
                  {(['error', 'warning', 'info', 'success'] as const).map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={config.type === type ? 'default' : 'outline'}
                      onClick={() => setConfig(prev => ({ ...prev, type }))}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Duration:</label>
                <div className="flex space-x-2">
                  {[2000, 5000, 10000, 0].map((duration) => (
                    <Button
                      key={duration}
                      size="sm"
                      variant={config.duration === duration ? 'default' : 'outline'}
                      onClick={() => setConfig(prev => ({ ...prev, duration }))}
                    >
                      {duration === 0 ? 'Persistent' : `${duration/1000}s`}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Options:</label>
                <div className="space-y-2">
                  {[
                    { key: 'dismissible', label: 'Dismissible' },
                    { key: 'showProgress', label: 'Show Progress' },
                    { key: 'pauseOnHover', label: 'Pause on Hover' },
                    { key: 'hasActions', label: 'Include Actions' },
                  ].map((option) => (
                    <label key={option.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config[option.key as keyof typeof config] as boolean}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          [option.key]: e.target.checked 
                        }))}
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <Button onClick={showConfiguredToast} className="w-full">
            Show Configured Toast
          </Button>
        </div>
      );
    };
    
    return (
      <ToastProvider>
        <ConfigDemo />
      </ToastProvider>
    );
  },
};