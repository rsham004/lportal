import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ErrorAlert } from './ErrorAlert';
import { Button } from './Button';

const meta: Meta<typeof ErrorAlert> = {
  title: 'UI/ErrorAlert',
  component: ErrorAlert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['error', 'warning', 'info', 'success'],
    },
    position: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
    },
    animation: {
      control: { type: 'select' },
      options: ['slide', 'fade', 'none'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'This is a default error alert message.',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Error Occurred',
    message: 'Something went wrong while processing your request.',
  },
};

export const AlertTypes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <ErrorAlert
        type="error"
        title="Error"
        message="This is an error alert with important information."
      />
      <ErrorAlert
        type="warning"
        title="Warning"
        message="This is a warning alert to draw attention."
      />
      <ErrorAlert
        type="info"
        title="Information"
        message="This is an info alert with helpful information."
      />
      <ErrorAlert
        type="success"
        title="Success"
        message="This is a success alert indicating completion."
      />
    </div>
  ),
};

export const Dismissible: Story = {
  render: () => {
    const [visible, setVisible] = useState(true);
    
    return (
      <div className="space-y-4">
        {!visible && (
          <Button onClick={() => setVisible(true)}>
            Show Alert
          </Button>
        )}
        
        <ErrorAlert
          visible={visible}
          title="Dismissible Alert"
          message="Click the X button to dismiss this alert."
          onDismiss={() => setVisible(false)}
        />
      </div>
    );
  },
};

export const AutoClose: Story = {
  render: () => {
    const [visible, setVisible] = useState(true);
    
    return (
      <div className="space-y-4">
        {!visible && (
          <Button onClick={() => setVisible(true)}>
            Show Auto-Close Alert
          </Button>
        )}
        
        <ErrorAlert
          visible={visible}
          title="Auto-Close Alert"
          message="This alert will automatically close in 5 seconds."
          autoClose={5000}
          onDismiss={() => setVisible(false)}
        />
      </div>
    );
  },
};

export const PauseOnHover: Story = {
  render: () => {
    const [visible, setVisible] = useState(true);
    
    return (
      <div className="space-y-4">
        {!visible && (
          <Button onClick={() => setVisible(true)}>
            Show Pausable Alert
          </Button>
        )}
        
        <ErrorAlert
          visible={visible}
          title="Hover to Pause"
          message="This alert pauses auto-close when you hover over it."
          autoClose={3000}
          pauseOnHover={true}
          onDismiss={() => setVisible(false)}
        />
      </div>
    );
  },
};

export const WithoutProgress: Story = {
  render: () => {
    const [visible, setVisible] = useState(true);
    
    return (
      <div className="space-y-4">
        {!visible && (
          <Button onClick={() => setVisible(true)}>
            Show Alert
          </Button>
        )}
        
        <ErrorAlert
          visible={visible}
          title="No Progress Bar"
          message="This auto-close alert has no progress bar."
          autoClose={4000}
          showProgress={false}
          onDismiss={() => setVisible(false)}
        />
      </div>
    );
  },
};

export const WithActions: Story = {
  render: () => (
    <div className="w-96">
      <ErrorAlert
        type="warning"
        title="Unsaved Changes"
        message="You have unsaved changes that will be lost."
        actions={
          <div className="flex space-x-2 mt-2">
            <Button size="sm" variant="outline">
              Save Changes
            </Button>
            <Button size="sm" variant="ghost">
              Discard
            </Button>
          </div>
        }
      />
    </div>
  ),
};

export const WithoutIcon: Story = {
  args: {
    title: 'No Icon Alert',
    message: 'This alert has no icon displayed.',
    showIcon: false,
  },
};

export const PositionedAlerts: Story = {
  render: () => {
    const [alerts, setAlerts] = useState<Record<string, boolean>>({});
    
    const showAlert = (position: string) => {
      setAlerts(prev => ({ ...prev, [position]: true }));
      setTimeout(() => {
        setAlerts(prev => ({ ...prev, [position]: false }));
      }, 3000);
    };
    
    const positions = [
      'top',
      'bottom', 
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right'
    ];
    
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground mb-4">
          Click buttons to show positioned alerts:
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {positions.map((position) => (
            <Button
              key={position}
              size="sm"
              variant="outline"
              onClick={() => showAlert(position)}
            >
              {position}
            </Button>
          ))}
        </div>
        
        {positions.map((position) => (
          <ErrorAlert
            key={position}
            visible={alerts[position]}
            position={position as any}
            title={`${position} Alert`}
            message={`This alert is positioned at ${position}.`}
            autoClose={3000}
            onDismiss={() => setAlerts(prev => ({ ...prev, [position]: false }))}
          />
        ))}
      </div>
    );
  },
};

export const LearningPlatformExamples: Story = {
  render: () => {
    const [alerts, setAlerts] = useState<Record<string, boolean>>({});
    
    const showAlert = (key: string) => {
      setAlerts(prev => ({ ...prev, [key]: true }));
    };
    
    const hideAlert = (key: string) => {
      setAlerts(prev => ({ ...prev, [key]: false }));
    };
    
    return (
      <div className="space-y-6 w-96">
        <div className="space-y-2">
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => showAlert('connection')}
          >
            Simulate Connection Error
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => showAlert('deadline')}
          >
            Show Deadline Warning
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => showAlert('progress')}
          >
            Show Progress Update
          </Button>
          <Button 
            size="sm" 
            variant="default"
            onClick={() => showAlert('success')}
          >
            Show Success Message
          </Button>
        </div>
        
        {/* Connection Error */}
        <ErrorAlert
          visible={alerts.connection}
          type="error"
          title="Connection Lost"
          message="Unable to connect to the learning platform. Check your internet connection."
          actions={
            <div className="flex space-x-2 mt-2">
              <Button size="sm" variant="outline">
                Retry Connection
              </Button>
              <Button size="sm" variant="ghost">
                Work Offline
              </Button>
            </div>
          }
          onDismiss={() => hideAlert('connection')}
        />
        
        {/* Assignment Deadline */}
        <ErrorAlert
          visible={alerts.deadline}
          type="warning"
          title="Assignment Due Soon"
          message="Your assignment 'React Components' is due in 2 hours."
          autoClose={10000}
          actions={
            <div className="flex space-x-2 mt-2">
              <Button size="sm" variant="outline">
                Submit Now
              </Button>
              <Button size="sm" variant="ghost">
                Request Extension
              </Button>
            </div>
          }
          onDismiss={() => hideAlert('deadline')}
        />
        
        {/* Progress Update */}
        <ErrorAlert
          visible={alerts.progress}
          type="info"
          title="Course Progress"
          message="You've completed 75% of the JavaScript Fundamentals course!"
          autoClose={5000}
          actions={
            <Button size="sm" variant="outline">
              Continue Learning
            </Button>
          }
          onDismiss={() => hideAlert('progress')}
        />
        
        {/* Success Message */}
        <ErrorAlert
          visible={alerts.success}
          type="success"
          title="Quiz Completed"
          message="Great job! You scored 92% on the React Basics quiz."
          autoClose={4000}
          actions={
            <div className="flex space-x-2 mt-2">
              <Button size="sm" variant="outline">
                View Results
              </Button>
              <Button size="sm" variant="ghost">
                Next Lesson
              </Button>
            </div>
          }
          onDismiss={() => hideAlert('success')}
        />
      </div>
    );
  },
};

export const AnimationVariants: Story = {
  render: () => {
    const [alerts, setAlerts] = useState<Record<string, boolean>>({});
    
    const showAlert = (animation: string) => {
      setAlerts(prev => ({ ...prev, [animation]: true }));
      setTimeout(() => {
        setAlerts(prev => ({ ...prev, [animation]: false }));
      }, 3000);
    };
    
    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => showAlert('slide')}>
            Slide Animation
          </Button>
          <Button size="sm" onClick={() => showAlert('fade')}>
            Fade Animation
          </Button>
          <Button size="sm" onClick={() => showAlert('none')}>
            No Animation
          </Button>
        </div>
        
        <ErrorAlert
          visible={alerts.slide}
          animation="slide"
          title="Slide Animation"
          message="This alert slides in from the top."
          onDismiss={() => setAlerts(prev => ({ ...prev, slide: false }))}
        />
        
        <ErrorAlert
          visible={alerts.fade}
          animation="fade"
          title="Fade Animation"
          message="This alert fades in smoothly."
          onDismiss={() => setAlerts(prev => ({ ...prev, fade: false }))}
        />
        
        <ErrorAlert
          visible={alerts.none}
          animation="none"
          title="No Animation"
          message="This alert appears instantly."
          onDismiss={() => setAlerts(prev => ({ ...prev, none: false }))}
        />
      </div>
    );
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [alertConfig, setAlertConfig] = useState({
      visible: false,
      type: 'error' as const,
      autoClose: 0,
      dismissible: true,
      showIcon: true,
      showProgress: true,
    });
    
    const showAlert = () => {
      setAlertConfig(prev => ({ ...prev, visible: true }));
    };
    
    const hideAlert = () => {
      setAlertConfig(prev => ({ ...prev, visible: false }));
    };
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type:</label>
            <div className="flex space-x-1">
              {(['error', 'warning', 'info', 'success'] as const).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={alertConfig.type === type ? 'default' : 'outline'}
                  onClick={() => setAlertConfig(prev => ({ ...prev, type }))}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Auto Close:</label>
            <div className="flex space-x-1">
              {[0, 3000, 5000].map((time) => (
                <Button
                  key={time}
                  size="sm"
                  variant={alertConfig.autoClose === time ? 'default' : 'outline'}
                  onClick={() => setAlertConfig(prev => ({ ...prev, autoClose: time }))}
                >
                  {time === 0 ? 'Off' : `${time/1000}s`}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Options:</label>
            <div className="space-y-1">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={alertConfig.dismissible}
                  onChange={(e) => setAlertConfig(prev => ({ ...prev, dismissible: e.target.checked }))}
                />
                <span className="text-sm">Dismissible</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={alertConfig.showIcon}
                  onChange={(e) => setAlertConfig(prev => ({ ...prev, showIcon: e.target.checked }))}
                />
                <span className="text-sm">Show Icon</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={alertConfig.showProgress}
                  onChange={(e) => setAlertConfig(prev => ({ ...prev, showProgress: e.target.checked }))}
                />
                <span className="text-sm">Show Progress</span>
              </label>
            </div>
          </div>
        </div>
        
        <Button onClick={showAlert}>
          Show Alert
        </Button>
        
        <div className="w-96">
          <ErrorAlert
            visible={alertConfig.visible}
            type={alertConfig.type}
            title="Interactive Demo"
            message={`This is a ${alertConfig.type} alert with customizable options.`}
            autoClose={alertConfig.autoClose || undefined}
            dismissible={alertConfig.dismissible}
            showIcon={alertConfig.showIcon}
            showProgress={alertConfig.showProgress}
            onDismiss={hideAlert}
          />
        </div>
      </div>
    );
  },
};