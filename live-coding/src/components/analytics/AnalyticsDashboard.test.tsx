import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { AnalyticsProvider } from './AnalyticsProvider';

// Mock Chart.js
jest.mock('chart.js/auto', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn(),
    resize: jest.fn(),
  })),
}));

// Mock previous phase components
jest.mock('../notifications/NotificationSystem', () => ({
  NotificationSystem: jest.fn(() => (
    <div data-testid="notification-system">Notifications</div>
  )),
}));

jest.mock('../presence/PresenceIndicator', () => ({
  PresenceIndicator: jest.fn(() => (
    <div data-testid="presence-indicator">Presence</div>
  )),
}));

const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  role: 'instructor',
};

const mockAnalyticsData = {
  overview: {
    totalStudents: 150,
    activeStudents: 120,
    completionRate: 78.5,
    averageScore: 85.2,
    totalAssessments: 25,
    totalLessons: 45,
  },
  engagement: {
    dailyActiveUsers: [
      { date: '2024-01-15', users: 45 },
      { date: '2024-01-16', users: 52 },
      { date: '2024-01-17', users: 48 },
    ],
    sessionDuration: {
      average: 28.5,
      median: 25.0,
      distribution: [
        { range: '0-10 min', count: 15 },
        { range: '10-30 min', count: 65 },
        { range: '30-60 min', count: 45 },
        { range: '60+ min', count: 25 },
      ],
    },
    contentInteraction: {
      videos: { views: 1250, completions: 980 },
      quizzes: { attempts: 850, completions: 720 },
      assignments: { submissions: 320, completions: 280 },
    },
  },
  performance: {
    assessmentScores: [
      { assessmentId: 'quiz-1', title: 'Introduction Quiz', averageScore: 88.5, attempts: 145 },
      { assessmentId: 'quiz-2', title: 'Midterm Exam', averageScore: 82.3, attempts: 140 },
      { assessmentId: 'quiz-3', title: 'Final Project', averageScore: 91.2, attempts: 135 },
    ],
    learningOutcomes: [
      { outcome: 'Problem Solving', mastery: 85.5 },
      { outcome: 'Critical Thinking', mastery: 78.2 },
      { outcome: 'Communication', mastery: 92.1 },
    ],
    progressTracking: {
      onTrack: 85,
      atRisk: 12,
      needsSupport: 8,
    },
  },
  realTime: {
    currentOnline: 45,
    liveStreams: 2,
    activeAssessments: 5,
    recentActivity: [
      { userId: 'user-456', action: 'completed quiz', timestamp: '2024-01-17T10:30:00Z' },
      { userId: 'user-789', action: 'submitted assignment', timestamp: '2024-01-17T10:25:00Z' },
    ],
  },
};

const mockAnalyticsContext = {
  data: mockAnalyticsData,
  isLoading: false,
  error: null,
  refreshData: jest.fn(),
  exportData: jest.fn(),
  getDetailedReport: jest.fn(),
  subscribeToRealTime: jest.fn(),
  unsubscribeFromRealTime: jest.fn(),
};

const renderWithProvider = (component: React.ReactElement, context = mockAnalyticsContext) => {
  return render(
    <AnalyticsProvider value={context}>
      {component}
    </AnalyticsProvider>
  );
};

describe('AnalyticsDashboard', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Integration with Previous Phase Components', () => {
    it('should integrate with Phase 1 UI components', () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      // Should use Phase 1 design system
      expect(screen.getByRole('main')).toHaveClass('bg-white');
      expect(screen.getAllByRole('button')[0]).toHaveClass('px-4', 'py-2');
    });

    it('should integrate with Phase 2 authorization', () => {
      const studentUser = { ...mockUser, role: 'student' };
      
      renderWithProvider(<AnalyticsDashboard currentUser={studentUser} />);

      // Students should see limited analytics
      expect(screen.getByText('My Progress')).toBeInTheDocument();
      expect(screen.queryByText('Class Analytics')).not.toBeInTheDocument();
    });

    it('should integrate with Phase 3 content data', () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      // Should show content-related metrics
      expect(screen.getByText('25')).toBeInTheDocument(); // Total assessments
      expect(screen.getByText('45')).toBeInTheDocument(); // Total lessons
    });

    it('should integrate with Phase 4 real-time features', () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      // Should show real-time components
      expect(screen.getByTestId('notification-system')).toBeInTheDocument();
      expect(screen.getByTestId('presence-indicator')).toBeInTheDocument();
      expect(screen.getByText('45 online now')).toBeInTheDocument();
    });
  });

  describe('Overview Dashboard', () => {
    it('should display key metrics cards', () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      expect(screen.getByText('Total Students')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Active Students')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('78.5%')).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('85.2')).toBeInTheDocument();
    });

    it('should show engagement trends', () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      expect(screen.getByText('Daily Active Users')).toBeInTheDocument();
      expect(screen.getByTestId('engagement-chart')).toBeInTheDocument();
    });

    it('should display session duration analytics', () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      expect(screen.getByText('Session Duration')).toBeInTheDocument();
      expect(screen.getByText('28.5 min avg')).toBeInTheDocument();
      expect(screen.getByText('25.0 min median')).toBeInTheDocument();
    });

    it('should show content interaction metrics', () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      expect(screen.getByText('Video Views')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('Quiz Attempts')).toBeInTheDocument();
      expect(screen.getByText('850')).toBeInTheDocument();
    });
  });

  describe('Performance Analytics', () => {
    it('should display assessment performance', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);

      expect(screen.getByText('Assessment Performance')).toBeInTheDocument();
      expect(screen.getByText('Introduction Quiz')).toBeInTheDocument();
      expect(screen.getByText('88.5')).toBeInTheDocument(); // Average score
    });

    it('should show learning outcomes mastery', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);

      expect(screen.getByText('Learning Outcomes')).toBeInTheDocument();
      expect(screen.getByText('Problem Solving')).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });

    it('should display progress tracking', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);

      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
      expect(screen.getByText('85 on track')).toBeInTheDocument();
      expect(screen.getByText('12 at risk')).toBeInTheDocument();
      expect(screen.getByText('8 need support')).toBeInTheDocument();
    });

    it('should allow drilling down into specific assessments', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);

      const assessmentLink = screen.getByText('Introduction Quiz');
      await user.click(assessmentLink);

      expect(mockAnalyticsContext.getDetailedReport).toHaveBeenCalledWith('assessment', 'quiz-1');
    });
  });

  describe('Real-time Analytics', () => {
    it('should show current online users', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const realtimeTab = screen.getByRole('tab', { name: /real-time/i });
      await user.click(realtimeTab);

      expect(screen.getByText('Currently Online')).toBeInTheDocument();
      expect(screen.getByText('45 users')).toBeInTheDocument();
    });

    it('should display active live streams', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const realtimeTab = screen.getByRole('tab', { name: /real-time/i });
      await user.click(realtimeTab);

      expect(screen.getByText('Live Streams')).toBeInTheDocument();
      expect(screen.getByText('2 active')).toBeInTheDocument();
    });

    it('should show recent activity feed', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const realtimeTab = screen.getByRole('tab', { name: /real-time/i });
      await user.click(realtimeTab);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('completed quiz')).toBeInTheDocument();
      expect(screen.getByText('submitted assignment')).toBeInTheDocument();
    });

    it('should update real-time data automatically', async () => {
      const { rerender } = renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const realtimeTab = screen.getByRole('tab', { name: /real-time/i });
      await user.click(realtimeTab);

      // Simulate real-time update
      const updatedContext = {
        ...mockAnalyticsContext,
        data: {
          ...mockAnalyticsData,
          realTime: {
            ...mockAnalyticsData.realTime,
            currentOnline: 52,
          },
        },
      };

      render(
        <AnalyticsProvider value={updatedContext}>
          <AnalyticsDashboard currentUser={mockUser} />
        </AnalyticsProvider>
      );

      expect(screen.getByText('52 users')).toBeInTheDocument();
    });
  });

  describe('Data Export and Reporting', () => {
    it('should provide export functionality', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const exportButton = screen.getByRole('button', { name: /export data/i });
      await user.click(exportButton);

      expect(mockAnalyticsContext.exportData).toHaveBeenCalledWith('overview');
    });

    it('should allow selecting export format', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const exportButton = screen.getByRole('button', { name: /export data/i });
      await user.click(exportButton);

      expect(screen.getByText('Export Format')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('PDF Report')).toBeInTheDocument();
    });

    it('should generate detailed reports', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const reportButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(reportButton);

      expect(screen.getByText('Report Options')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Include Sections')).toBeInTheDocument();
    });
  });

  describe('Filtering and Time Ranges', () => {
    it('should allow filtering by date range', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const dateFilter = screen.getByLabelText('Date Range');
      await user.selectOptions(dateFilter, 'last-30-days');

      expect(mockAnalyticsContext.refreshData).toHaveBeenCalledWith({
        dateRange: 'last-30-days',
      });
    });

    it('should support custom date ranges', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const customRangeButton = screen.getByRole('button', { name: /custom range/i });
      await user.click(customRangeButton);

      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('should filter by course or student groups', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const courseFilter = screen.getByLabelText('Course Filter');
      await user.selectOptions(courseFilter, 'react-fundamentals');

      expect(mockAnalyticsContext.refreshData).toHaveBeenCalledWith({
        courseId: 'react-fundamentals',
      });
    });
  });

  describe('Gamification Analytics Integration', () => {
    it('should show XP and achievement analytics', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const gamificationTab = screen.getByRole('tab', { name: /gamification/i });
      await user.click(gamificationTab);

      expect(screen.getByText('XP Distribution')).toBeInTheDocument();
      expect(screen.getByText('Achievement Unlocks')).toBeInTheDocument();
      expect(screen.getByText('Leaderboard Activity')).toBeInTheDocument();
    });

    it('should display engagement through gamification', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const gamificationTab = screen.getByRole('tab', { name: /gamification/i });
      await user.click(gamificationTab);

      expect(screen.getByText('Streak Analytics')).toBeInTheDocument();
      expect(screen.getByText('Badge Distribution')).toBeInTheDocument();
    });
  });

  describe('Accessibility and Performance', () => {
    it('should be fully accessible', () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label');
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label');
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    it('should handle large datasets efficiently', () => {
      const largeDataContext = {
        ...mockAnalyticsContext,
        data: {
          ...mockAnalyticsData,
          engagement: {
            ...mockAnalyticsData.engagement,
            dailyActiveUsers: Array.from({ length: 365 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              users: Math.floor(Math.random() * 100) + 20,
            })),
          },
        },
      };

      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />, largeDataContext);

      // Should render without performance issues
      expect(screen.getByTestId('engagement-chart')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      const firstTab = screen.getByRole('tab', { name: /overview/i });
      const secondTab = screen.getByRole('tab', { name: /performance/i });

      await user.tab();
      expect(firstTab).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(secondTab).toHaveFocus();
    });
  });

  describe('Error Handling and Loading States', () => {
    it('should show loading state', () => {
      const loadingContext = {
        ...mockAnalyticsContext,
        isLoading: true,
      };

      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />, loadingContext);

      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle error states', () => {
      const errorContext = {
        ...mockAnalyticsContext,
        error: 'Failed to load analytics data',
      };

      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />, errorContext);

      expect(screen.getByText('Error loading analytics')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle empty data states', () => {
      const emptyContext = {
        ...mockAnalyticsContext,
        data: {
          overview: { totalStudents: 0, activeStudents: 0, completionRate: 0, averageScore: 0 },
          engagement: { dailyActiveUsers: [], sessionDuration: { average: 0 } },
          performance: { assessmentScores: [], learningOutcomes: [] },
          realTime: { currentOnline: 0, recentActivity: [] },
        },
      };

      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />, emptyContext);

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Integration Testing with All Phases', () => {
    it('should work seamlessly with Phase 1-4 components', () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      // Phase 1: UI consistency
      expect(screen.getByRole('main')).toHaveClass('bg-white');
      
      // Phase 2: Authorization working
      expect(screen.getByText('Class Analytics')).toBeInTheDocument();
      
      // Phase 3: Content metrics displayed
      expect(screen.getByText('25')).toBeInTheDocument(); // assessments
      
      // Phase 4: Real-time features active
      expect(screen.getByTestId('notification-system')).toBeInTheDocument();
    });

    it('should maintain data consistency across components', async () => {
      renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      // Data should be consistent between overview and detailed views
      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);

      // Same completion rate should appear in both views
      expect(screen.getByText('78.5%')).toBeInTheDocument();
    });

    it('should handle real-time updates without breaking other features', async () => {
      const { rerender } = renderWithProvider(<AnalyticsDashboard currentUser={mockUser} />);

      // Simulate real-time update
      const updatedContext = {
        ...mockAnalyticsContext,
        data: {
          ...mockAnalyticsData,
          overview: {
            ...mockAnalyticsData.overview,
            activeStudents: 125, // Updated value
          },
        },
      };

      render(
        <AnalyticsProvider value={updatedContext}>
          <AnalyticsDashboard currentUser={mockUser} />
        </AnalyticsProvider>
      );

      // Should update without breaking other functionality
      expect(screen.getByText('125')).toBeInTheDocument();
      expect(screen.getByTestId('notification-system')).toBeInTheDocument();
    });
  });
});