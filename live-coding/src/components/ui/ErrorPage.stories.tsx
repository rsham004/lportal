import type { Meta, StoryObj } from '@storybook/react';
import { ErrorPage } from './ErrorPage';
import { Button } from './Button';

const meta: Meta<typeof ErrorPage> = {
  title: 'UI/ErrorPage',
  component: ErrorPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['404', '500', '403', '503', 'custom'],
    },
    layout: {
      control: { type: 'select' },
      options: ['centered', 'split'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NotFound404: Story = {
  args: {
    type: '404',
  },
};

export const ServerError500: Story = {
  args: {
    type: '500',
  },
};

export const Forbidden403: Story = {
  args: {
    type: '403',
  },
};

export const ServiceUnavailable503: Story = {
  args: {
    type: '503',
  },
};

export const CustomError: Story = {
  args: {
    type: 'custom',
    title: 'Course Unavailable',
    message: 'This course is currently under maintenance and will be available soon.',
  },
};

export const WithSupport: Story = {
  args: {
    type: '500',
    showSupport: true,
  },
};

export const WithDetails: Story = {
  args: {
    type: '500',
    showDetails: true,
    details: {
      errorId: 'ERR_INTERNAL_001',
      timestamp: new Date().toISOString(),
      path: '/courses/react-fundamentals/lesson-1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  },
};

export const WithBreadcrumb: Story = {
  args: {
    type: '404',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Courses', href: '/courses' },
      { label: 'React Fundamentals', href: '/courses/react-fundamentals' },
      { label: 'Page Not Found' },
    ],
  },
};

export const SplitLayout: Story = {
  args: {
    type: '404',
    layout: 'split',
  },
};

export const WithoutIllustration: Story = {
  args: {
    type: '404',
    showIllustration: false,
  },
};

export const WithCustomActions: Story = {
  args: {
    type: '404',
    actions: (
      <div className="flex flex-wrap gap-4 justify-center">
        <Button>Browse Courses</Button>
        <Button variant="outline">Search</Button>
        <Button variant="ghost">Contact Us</Button>
      </div>
    ),
  },
};

export const WithRetry: Story = {
  args: {
    type: '500',
    onRetry: () => alert('Retrying...'),
  },
};

export const RetryLoading: Story = {
  args: {
    type: '500',
    onRetry: () => {},
    retryLoading: true,
  },
};

export const LearningPlatformExamples: Story = {
  render: () => (
    <div className="space-y-12">
      {/* Course Not Found */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Course Not Found</h2>
        <ErrorPage
          type="404"
          title="Course Not Found"
          message="The course you're looking for has been moved or is no longer available."
          breadcrumb={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/courses' },
            { label: 'Course Not Found' },
          ]}
          actions={
            <div className="flex flex-wrap gap-4 justify-center">
              <Button>Browse All Courses</Button>
              <Button variant="outline">Search Courses</Button>
              <Button variant="ghost">Go Back</Button>
            </div>
          }
        />
      </div>

      {/* Video Playback Error */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Video Playback Error</h2>
        <ErrorPage
          type="500"
          title="Video Unavailable"
          message="We're having trouble loading this video. Our team has been notified and is working on a fix."
          layout="split"
          showSupport={true}
          onRetry={() => alert('Retrying video load...')}
          details={{
            errorId: 'VID_PLAYBACK_001',
            timestamp: new Date().toISOString(),
            path: '/courses/javascript-basics/videos/intro.mp4',
            videoId: 'js_intro_v2',
            quality: '1080p',
          }}
          showDetails={true}
        />
      </div>

      {/* Course Access Denied */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Course Access Denied</h2>
        <ErrorPage
          type="403"
          title="Premium Course"
          message="This course is only available to premium subscribers. Upgrade your account to access all course content."
          actions={
            <div className="flex flex-wrap gap-4 justify-center">
              <Button>Upgrade to Premium</Button>
              <Button variant="outline">View Free Courses</Button>
              <Button variant="ghost">Learn More</Button>
            </div>
          }
        />
      </div>

      {/* Maintenance Mode */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Maintenance Mode</h2>
        <ErrorPage
          type="503"
          title="Scheduled Maintenance"
          message="We're performing scheduled maintenance to improve your learning experience. We'll be back shortly!"
          showSupport={true}
          onRetry={() => alert('Checking if maintenance is complete...')}
          details={{
            errorId: 'MAINT_001',
            timestamp: new Date().toISOString(),
            estimatedCompletion: '2024-01-01T02:00:00Z',
            maintenanceType: 'Database Optimization',
          }}
        />
      </div>

      {/* Quiz Submission Error */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Quiz Submission Error</h2>
        <ErrorPage
          type="custom"
          title="Submission Failed"
          message="Your quiz answers couldn't be submitted due to a network error. Don't worry, your progress has been saved locally."
          layout="split"
          showIllustration={false}
          actions={
            <div className="flex flex-wrap gap-4 justify-center">
              <Button>Retry Submission</Button>
              <Button variant="outline">Save Draft</Button>
              <Button variant="ghost">Exit Quiz</Button>
            </div>
          }
          details={{
            errorId: 'QUIZ_SUBMIT_001',
            timestamp: new Date().toISOString(),
            quizId: 'react-basics-quiz-1',
            questionsAnswered: 8,
            totalQuestions: 10,
          }}
          showDetails={true}
        />
      </div>
    </div>
  ),
};

export const AllErrorTypes: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">404 - Not Found</h3>
        <div className="border rounded-lg p-4 h-96 overflow-hidden">
          <ErrorPage type="404" className="min-h-0" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">500 - Server Error</h3>
        <div className="border rounded-lg p-4 h-96 overflow-hidden">
          <ErrorPage type="500" className="min-h-0" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">403 - Forbidden</h3>
        <div className="border rounded-lg p-4 h-96 overflow-hidden">
          <ErrorPage type="403" className="min-h-0" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">503 - Service Unavailable</h3>
        <div className="border rounded-lg p-4 h-96 overflow-hidden">
          <ErrorPage type="503" className="min-h-0" />
        </div>
      </div>
    </div>
  ),
};

export const ResponsiveDemo: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Centered Layout (Mobile-friendly)</h3>
        <div className="border rounded-lg">
          <ErrorPage
            type="404"
            layout="centered"
            breadcrumb={[
              { label: 'Home', href: '/' },
              { label: 'Courses', href: '/courses' },
              { label: 'Not Found' },
            ]}
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Split Layout (Desktop-optimized)</h3>
        <div className="border rounded-lg">
          <ErrorPage
            type="500"
            layout="split"
            showSupport={true}
            onRetry={() => alert('Retrying...')}
          />
        </div>
      </div>
    </div>
  ),
};