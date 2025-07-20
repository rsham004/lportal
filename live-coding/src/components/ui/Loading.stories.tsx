import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { 
  Spinner, 
  Skeleton, 
  LoadingCard, 
  LoadingButton, 
  LoadingOverlay, 
  LoadingDots, 
  LoadingPulse 
} from './Loading';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Loading',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SpinnerSizes: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <div className="text-center">
        <Spinner size="sm" />
        <p className="text-xs mt-2">Small</p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p className="text-xs mt-2">Medium</p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-xs mt-2">Large</p>
      </div>
      <div className="text-center">
        <Spinner size="xl" />
        <p className="text-xs mt-2">Extra Large</p>
      </div>
    </div>
  ),
};

export const SkeletonVariations: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div>
        <h3 className="text-sm font-medium mb-2">Text Skeletons</h3>
        <div className="space-y-2">
          <Skeleton height="sm" width="full" />
          <Skeleton height="sm" width="lg" />
          <Skeleton height="sm" width="md" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Different Heights</h3>
        <div className="space-y-2">
          <Skeleton height="sm" />
          <Skeleton height="md" />
          <Skeleton height="lg" />
          <Skeleton height="xl" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Circle Skeletons</h3>
        <div className="flex space-x-2">
          <Skeleton circle width="w-8" height="h-8" />
          <Skeleton circle width="w-12" height="h-12" />
          <Skeleton circle width="w-16" height="h-16" />
        </div>
      </div>
    </div>
  ),
};

export const LoadingCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
      <LoadingCard />
      <LoadingCard showHeader />
      <LoadingCard showHeader showFooter />
      <LoadingCard lines={5} />
      <LoadingCard showHeader lines={2} />
      <LoadingCard showFooter lines={4} />
    </div>
  ),
};

export const LoadingButtons: Story = {
  render: () => {
    const [loading1, setLoading1] = useState(false);
    const [loading2, setLoading2] = useState(false);

    const handleClick1 = () => {
      setLoading1(true);
      setTimeout(() => setLoading1(false), 2000);
    };

    const handleClick2 = () => {
      setLoading2(true);
      setTimeout(() => setLoading2(false), 3000);
    };

    return (
      <div className="space-y-4">
        <div className="flex space-x-4">
          <LoadingButton loading={loading1} onClick={handleClick1}>
            Save Changes
          </LoadingButton>
          <LoadingButton 
            loading={loading2} 
            loadingText="Uploading..." 
            onClick={handleClick2}
            variant="outline"
          >
            Upload File
          </LoadingButton>
        </div>
        
        <div className="flex space-x-4">
          <LoadingButton loading size="sm">
            Small Loading
          </LoadingButton>
          <LoadingButton loading size="lg">
            Large Loading
          </LoadingButton>
        </div>

        <div className="flex space-x-4">
          <LoadingButton loading variant="destructive">
            Delete
          </LoadingButton>
          <LoadingButton loading variant="secondary">
            Cancel
          </LoadingButton>
        </div>
      </div>
    );
  },
};

export const LoadingOverlayDemo: Story = {
  render: () => {
    const [showOverlay, setShowOverlay] = useState(false);

    const handleShowOverlay = () => {
      setShowOverlay(true);
      setTimeout(() => setShowOverlay(false), 3000);
    };

    return (
      <div className="relative">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Loading Overlay Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to show a loading overlay for 3 seconds.
            </p>
            <Button onClick={handleShowOverlay}>
              Show Loading Overlay
            </Button>
          </CardContent>
        </Card>
        
        <LoadingOverlay 
          visible={showOverlay} 
          text="Processing your request..." 
        />
      </div>
    );
  },
};

export const LoadingDotsSizes: Story = {
  render: () => (
    <div className="flex items-center space-x-8">
      <div className="text-center">
        <LoadingDots size="sm" />
        <p className="text-xs mt-2">Small</p>
      </div>
      <div className="text-center">
        <LoadingDots size="md" />
        <p className="text-xs mt-2">Medium</p>
      </div>
      <div className="text-center">
        <LoadingDots size="lg" />
        <p className="text-xs mt-2">Large</p>
      </div>
    </div>
  ),
};

export const LoadingPulseSizes: Story = {
  render: () => (
    <div className="flex items-center space-x-8">
      <div className="text-center">
        <LoadingPulse size="sm" />
        <p className="text-xs mt-2">Small</p>
      </div>
      <div className="text-center">
        <LoadingPulse size="md" />
        <p className="text-xs mt-2">Medium</p>
      </div>
      <div className="text-center">
        <LoadingPulse size="lg" />
        <p className="text-xs mt-2">Large</p>
      </div>
    </div>
  ),
};

export const CourseLoadingExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Course Catalog</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingCard showHeader showFooter />
          <LoadingCard showHeader showFooter />
          <LoadingCard showHeader showFooter />
          <LoadingCard showHeader showFooter />
          <LoadingCard showHeader showFooter />
          <LoadingCard showHeader showFooter />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Course Details</h3>
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton circle width="w-16" height="h-16" />
              <div className="space-y-2 flex-1">
                <Skeleton height="lg" width="lg" />
                <Skeleton height="sm" width="full" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton height="sm" width="full" />
              <Skeleton height="sm" width="full" />
              <Skeleton height="sm" width="lg" />
            </div>
            
            <div className="flex space-x-4">
              <LoadingButton loading>Enroll Now</LoadingButton>
              <LoadingButton loading variant="outline">Add to Wishlist</LoadingButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};

export const AllLoadingStates: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Spinners</h3>
        <div className="flex space-x-4">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <Spinner size="xl" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Dots</h3>
        <div className="flex space-x-4">
          <LoadingDots size="sm" />
          <LoadingDots size="md" />
          <LoadingDots size="lg" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Pulse</h3>
        <div className="flex space-x-4">
          <LoadingPulse size="sm" />
          <LoadingPulse size="md" />
          <LoadingPulse size="lg" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Skeletons</h3>
        <div className="space-y-2 w-80">
          <Skeleton height="sm" width="full" />
          <Skeleton height="md" width="lg" />
          <Skeleton height="lg" width="md" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingCard showHeader />
          <LoadingCard showHeader showFooter />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Buttons</h3>
        <div className="flex space-x-4">
          <LoadingButton loading>Primary</LoadingButton>
          <LoadingButton loading variant="outline">Outline</LoadingButton>
          <LoadingButton loading variant="secondary">Secondary</LoadingButton>
        </div>
      </div>
    </div>
  ),
};