import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'UI/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Test components that can throw errors
const BuggyComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('This is a simulated error for testing purposes');
  }
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Working Component</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This component is working normally without any errors.</p>
      </CardContent>
    </Card>
  );
};

const BuggyCounter = () => {
  const [count, setCount] = useState(0);
  
  if (count >= 3) {
    throw new Error('Counter exceeded maximum value of 3!');
  }
  
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Buggy Counter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Count: {count}</p>
        <p className="text-sm text-muted-foreground">
          This counter will throw an error when it reaches 3.
        </p>
        <Button onClick={() => setCount(count + 1)}>
          Increment
        </Button>
      </CardContent>
    </Card>
  );
};

export const Default: Story = {
  render: () => {
    const [hasError, setHasError] = useState(false);
    
    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            onClick={() => setHasError(false)}
            variant={!hasError ? "default" : "outline"}
          >
            No Error
          </Button>
          <Button 
            onClick={() => setHasError(true)}
            variant={hasError ? "destructive" : "outline"}
          >
            Trigger Error
          </Button>
        </div>
        
        <ErrorBoundary>
          <BuggyComponent shouldThrow={hasError} />
        </ErrorBoundary>
      </div>
    );
  },
};

export const WithDetails: Story = {
  render: () => (
    <ErrorBoundary showDetails={true}>
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

export const WithoutRetry: Story = {
  render: () => (
    <ErrorBoundary showRetry={false}>
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

export const CustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <Card className="w-80 border-destructive">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Custom Error Message
            </h3>
            <p className="text-sm text-muted-foreground">
              This is a custom fallback UI that replaces the default error display.
            </p>
          </CardContent>
        </Card>
      }
    >
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

export const CustomFallbackFunction: Story = {
  render: () => (
    <ErrorBoundary
      fallback={(error, errorInfo) => (
        <Card className="w-96 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Caught!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Error Message:</p>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {error.message}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Component Stack:</p>
              <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    >
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

export const WarningLevel: Story = {
  render: () => (
    <ErrorBoundary level="warning" showDetails={true}>
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

export const InfoLevel: Story = {
  render: () => (
    <ErrorBoundary level="info" showDetails={true}>
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

export const InteractiveError: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click the increment button to trigger an error when the counter reaches 3.
      </p>
      <ErrorBoundary showDetails={true}>
        <BuggyCounter />
      </ErrorBoundary>
    </div>
  ),
};

export const WithErrorCallback: Story = {
  render: () => {
    const [errorLog, setErrorLog] = useState<string[]>([]);
    
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      const timestamp = new Date().toLocaleTimeString();
      setErrorLog(prev => [...prev, `[${timestamp}] ${error.message}`]);
    };
    
    return (
      <div className="space-y-4">
        <ErrorBoundary onError={handleError} showDetails={true}>
          <BuggyComponent shouldThrow={true} />
        </ErrorBoundary>
        
        {errorLog.length > 0 && (
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-sm">Error Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {errorLog.map((log, index) => (
                  <p key={index} className="text-xs font-mono bg-muted p-1 rounded">
                    {log}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  },
};

// Example of using withErrorBoundary HOC
const ComponentWithErrorBoundary = withErrorBoundary(BuggyComponent, {
  showDetails: true,
  level: 'warning',
});

export const WithHOC: Story = {
  render: () => {
    const [hasError, setHasError] = useState(false);
    
    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            onClick={() => setHasError(false)}
            variant={!hasError ? "default" : "outline"}
          >
            No Error
          </Button>
          <Button 
            onClick={() => setHasError(true)}
            variant={hasError ? "destructive" : "outline"}
          >
            Trigger Error
          </Button>
        </div>
        
        <ComponentWithErrorBoundary shouldThrow={hasError} />
      </div>
    );
  },
};

export const MultipleErrorBoundaries: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Error Boundary 1 (Default)</h3>
        <ErrorBoundary>
          <BuggyComponent shouldThrow={true} />
        </ErrorBoundary>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Error Boundary 2 (Warning Level)</h3>
        <ErrorBoundary level="warning" showDetails={true}>
          <BuggyComponent shouldThrow={true} />
        </ErrorBoundary>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Error Boundary 3 (Custom Fallback)</h3>
        <ErrorBoundary
          fallback={
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm">Oops! Something went wrong here.</p>
            </div>
          }
        >
          <BuggyComponent shouldThrow={true} />
        </ErrorBoundary>
      </div>
    </div>
  ),
};