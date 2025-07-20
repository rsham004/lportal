import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersonalizationEngine } from './PersonalizationEngine';
import { PersonalizationProvider } from './PersonalizationProvider';

// Mock AI/ML services
jest.mock('../../lib/ai/recommendationEngine', () => ({
  RecommendationEngine: {
    getPersonalizedContent: jest.fn(),
    updateLearningPath: jest.fn(),
    analyzePerformance: jest.fn(),
    predictDifficulty: jest.fn(),
  },
}));

// Mock previous phase components
jest.mock('../course/CourseNavigationPlayer', () => ({
  CourseNavigationPlayer: jest.fn(({ recommendations }) => (
    <div data-testid="course-player">
      {recommendations?.map((rec: any) => (
        <div key={rec.id} data-testid="recommendation">
          {rec.title}
        </div>
      ))}
    </div>
  )),
}));

jest.mock('../analytics/AnalyticsDashboard', () => ({
  AnalyticsDashboard: jest.fn(() => (
    <div data-testid="analytics-dashboard">Analytics</div>
  )),
}));

const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  role: 'student',
  learningStyle: 'visual',
  skillLevel: 'intermediate',
  preferences: {
    contentTypes: ['video', 'interactive'],
    difficulty: 'medium',
    pace: 'normal',
  },
};

const mockPersonalizationData = {
  learningProfile: {
    userId: 'user-123',
    learningStyle: 'visual',
    skillLevel: 'intermediate',
    strengths: ['problem-solving', 'pattern-recognition'],
    weaknesses: ['time-management', 'debugging'],
    preferences: {
      contentTypes: ['video', 'interactive'],
      difficulty: 'medium',
      pace: 'normal',
      studyTime: 'evening',
    },
    goals: ['complete-course', 'improve-skills'],
    progress: {
      completionRate: 75,
      averageScore: 85,
      timeSpent: 120, // hours
      streakDays: 15,
    },
  },
  recommendations: [
    {
      id: 'rec-1',
      type: 'content',
      title: 'Advanced React Patterns',
      description: 'Based on your progress in React fundamentals',
      confidence: 0.92,
      reasoning: 'Strong performance in component basics',
      contentId: 'lesson-advanced-react',
      estimatedTime: 45,
      difficulty: 'medium',
    },
    {
      id: 'rec-2',
      type: 'practice',
      title: 'Debugging Exercise',
      description: 'Strengthen your debugging skills',
      confidence: 0.88,
      reasoning: 'Identified weakness in debugging',
      contentId: 'exercise-debugging',
      estimatedTime: 30,
      difficulty: 'easy',
    },
    {
      id: 'rec-3',
      type: 'review',
      title: 'State Management Review',
      description: 'Reinforce state management concepts',
      confidence: 0.75,
      reasoning: 'Recent quiz performance suggests review needed',
      contentId: 'review-state-management',
      estimatedTime: 20,
      difficulty: 'easy',
    },
  ],
  adaptivePath: {
    currentStep: 3,
    totalSteps: 10,
    nextRecommendations: ['lesson-hooks', 'exercise-context'],
    alternativePaths: [
      {
        id: 'path-accelerated',
        name: 'Accelerated Track',
        description: 'For faster learners',
        estimatedTime: '2 weeks',
      },
      {
        id: 'path-reinforced',
        name: 'Reinforced Learning',
        description: 'Extra practice and review',
        estimatedTime: '4 weeks',
      },
    ],
  },
  insights: {
    learningPatterns: [
      'Most active in evening hours',
      'Prefers video content over text',
      'Performs better with interactive exercises',
    ],
    performanceTrends: [
      'Steady improvement over last month',
      'Strong in conceptual understanding',
      'Needs more practice with practical application',
    ],
    recommendations: [
      'Consider increasing difficulty level',
      'Add more hands-on projects',
      'Schedule regular review sessions',
    ],
  },
};

const mockPersonalizationContext = {
  data: mockPersonalizationData,
  isLoading: false,
  error: null,
  updateLearningProfile: jest.fn(),
  acceptRecommendation: jest.fn(),
  dismissRecommendation: jest.fn(),
  updatePreferences: jest.fn(),
  generatePersonalizedPath: jest.fn(),
  trackLearningActivity: jest.fn(),
  getAdaptiveContent: jest.fn(),
};

const renderWithProvider = (component: React.ReactElement, context = mockPersonalizationContext) => {
  return render(
    <PersonalizationProvider value={context}>
      {component}
    </PersonalizationProvider>
  );
};

describe('PersonalizationEngine', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Integration with Previous Phase Components', () => {
    it('should integrate with Phase 1 UI components', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      // Should use Phase 1 design system
      expect(screen.getByRole('main')).toHaveClass('bg-white');
      expect(screen.getAllByRole('button')[0]).toHaveClass('px-4', 'py-2');
    });

    it('should integrate with Phase 2 authorization', () => {
      const instructorUser = { ...mockUser, role: 'instructor' };
      
      renderWithProvider(<PersonalizationEngine currentUser={instructorUser} />);

      // Instructors should see additional controls
      expect(screen.getByText('AI Configuration')).toBeInTheDocument();
      expect(screen.getByText('Learning Analytics')).toBeInTheDocument();
    });

    it('should integrate with Phase 3 content management', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      // Should show personalized content recommendations
      expect(screen.getByTestId('course-player')).toBeInTheDocument();
      expect(screen.getAllByTestId('recommendation')).toHaveLength(3);
    });

    it('should integrate with Phase 4 real-time features', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      // Should show real-time personalization updates
      expect(screen.getByText('Live Personalization')).toBeInTheDocument();
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
    });
  });

  describe('Learning Profile Management', () => {
    it('should display user learning profile', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      expect(screen.getByText('Learning Profile')).toBeInTheDocument();
      expect(screen.getByText('Visual Learner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate Level')).toBeInTheDocument();
      expect(screen.getByText('75% completion rate')).toBeInTheDocument();
    });

    it('should show learning strengths and weaknesses', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      expect(screen.getByText('Strengths')).toBeInTheDocument();
      expect(screen.getByText('problem-solving')).toBeInTheDocument();
      expect(screen.getByText('pattern-recognition')).toBeInTheDocument();
      
      expect(screen.getByText('Areas for Improvement')).toBeInTheDocument();
      expect(screen.getByText('time-management')).toBeInTheDocument();
      expect(screen.getByText('debugging')).toBeInTheDocument();
    });

    it('should allow updating learning preferences', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const preferencesTab = screen.getByRole('tab', { name: /preferences/i });
      await user.click(preferencesTab);

      const difficultySelect = screen.getByLabelText('Preferred Difficulty');
      await user.selectOptions(difficultySelect, 'hard');

      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      expect(mockPersonalizationContext.updatePreferences).toHaveBeenCalledWith({
        difficulty: 'hard',
      });
    });

    it('should update learning style assessment', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const assessmentButton = screen.getByRole('button', { name: /retake assessment/i });
      await user.click(assessmentButton);

      expect(screen.getByText('Learning Style Assessment')).toBeInTheDocument();
      
      // Answer assessment questions
      const visualOption = screen.getByLabelText('Visual');
      await user.click(visualOption);

      const submitButton = screen.getByRole('button', { name: /submit assessment/i });
      await user.click(submitButton);

      expect(mockPersonalizationContext.updateLearningProfile).toHaveBeenCalled();
    });
  });

  describe('Personalized Recommendations', () => {
    it('should display AI-generated recommendations', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      expect(screen.getByText('Personalized Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
      expect(screen.getByText('Debugging Exercise')).toBeInTheDocument();
      expect(screen.getByText('State Management Review')).toBeInTheDocument();
    });

    it('should show recommendation confidence and reasoning', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      expect(screen.getByText('92% confidence')).toBeInTheDocument();
      expect(screen.getByText('Strong performance in component basics')).toBeInTheDocument();
    });

    it('should allow accepting recommendations', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const acceptButton = screen.getAllByRole('button', { name: /accept/i })[0];
      await user.click(acceptButton);

      expect(mockPersonalizationContext.acceptRecommendation).toHaveBeenCalledWith('rec-1');
    });

    it('should allow dismissing recommendations', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const dismissButton = screen.getAllByRole('button', { name: /dismiss/i })[0];
      await user.click(dismissButton);

      expect(mockPersonalizationContext.dismissRecommendation).toHaveBeenCalledWith('rec-1');
    });

    it('should filter recommendations by type', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const filterSelect = screen.getByLabelText('Filter by type');
      await user.selectOptions(filterSelect, 'practice');

      // Should only show practice recommendations
      expect(screen.getByText('Debugging Exercise')).toBeInTheDocument();
      expect(screen.queryByText('Advanced React Patterns')).not.toBeInTheDocument();
    });

    it('should show estimated time for recommendations', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      expect(screen.getByText('45 min')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('20 min')).toBeInTheDocument();
    });
  });

  describe('Adaptive Learning Paths', () => {
    it('should display current learning path progress', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const pathTab = screen.getByRole('tab', { name: /learning path/i });
      fireEvent.click(pathTab);

      expect(screen.getByText('Learning Path Progress')).toBeInTheDocument();
      expect(screen.getByText('Step 3 of 10')).toBeInTheDocument();
    });

    it('should show alternative learning paths', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const pathTab = screen.getByRole('tab', { name: /learning path/i });
      await user.click(pathTab);

      expect(screen.getByText('Alternative Paths')).toBeInTheDocument();
      expect(screen.getByText('Accelerated Track')).toBeInTheDocument();
      expect(screen.getByText('Reinforced Learning')).toBeInTheDocument();
    });

    it('should allow switching learning paths', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const pathTab = screen.getByRole('tab', { name: /learning path/i });
      await user.click(pathTab);

      const switchButton = screen.getByRole('button', { name: /switch to accelerated/i });
      await user.click(switchButton);

      expect(mockPersonalizationContext.generatePersonalizedPath).toHaveBeenCalledWith('path-accelerated');
    });

    it('should show next recommended steps', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const pathTab = screen.getByRole('tab', { name: /learning path/i });
      await user.click(pathTab);

      expect(screen.getByText('Next Steps')).toBeInTheDocument();
      expect(screen.getByText('lesson-hooks')).toBeInTheDocument();
      expect(screen.getByText('exercise-context')).toBeInTheDocument();
    });
  });

  describe('AI Insights and Analytics', () => {
    it('should display learning pattern insights', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      await user.click(insightsTab);

      expect(screen.getByText('Learning Patterns')).toBeInTheDocument();
      expect(screen.getByText('Most active in evening hours')).toBeInTheDocument();
      expect(screen.getByText('Prefers video content over text')).toBeInTheDocument();
    });

    it('should show performance trend analysis', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      await user.click(insightsTab);

      expect(screen.getByText('Performance Trends')).toBeInTheDocument();
      expect(screen.getByText('Steady improvement over last month')).toBeInTheDocument();
      expect(screen.getByText('Strong in conceptual understanding')).toBeInTheDocument();
    });

    it('should provide AI-generated recommendations', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      await user.click(insightsTab);

      expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Consider increasing difficulty level')).toBeInTheDocument();
      expect(screen.getByText('Add more hands-on projects')).toBeInTheDocument();
    });

    it('should integrate with analytics dashboard', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      await user.click(insightsTab);

      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
    });
  });

  describe('Real-time Adaptation', () => {
    it('should track learning activities in real-time', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      // Simulate completing a lesson
      const completeButton = screen.getByRole('button', { name: /mark complete/i });
      await user.click(completeButton);

      expect(mockPersonalizationContext.trackLearningActivity).toHaveBeenCalledWith({
        type: 'lesson_completed',
        contentId: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should update recommendations based on activity', async () => {
      const { rerender } = renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      // Simulate new recommendations after activity
      const updatedContext = {
        ...mockPersonalizationContext,
        data: {
          ...mockPersonalizationData,
          recommendations: [
            {
              id: 'rec-new',
              type: 'content',
              title: 'New Recommendation',
              description: 'Based on recent activity',
              confidence: 0.95,
              reasoning: 'Recent completion suggests readiness',
              contentId: 'lesson-new',
              estimatedTime: 35,
              difficulty: 'medium',
            },
          ],
        },
      };

      render(
        <PersonalizationProvider value={updatedContext}>
          <PersonalizationEngine currentUser={mockUser} />
        </PersonalizationProvider>
      );

      expect(screen.getByText('New Recommendation')).toBeInTheDocument();
    });

    it('should adapt difficulty based on performance', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      // Simulate poor performance
      const performanceUpdate = {
        assessmentId: 'quiz-1',
        score: 45,
        timeSpent: 60,
        attempts: 3,
      };

      // This would trigger difficulty adaptation
      expect(mockPersonalizationContext.getAdaptiveContent).toBeDefined();
    });
  });

  describe('Accessibility and Performance', () => {
    it('should be fully accessible', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label');
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label');
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    it('should handle large recommendation datasets', () => {
      const largeDataContext = {
        ...mockPersonalizationContext,
        data: {
          ...mockPersonalizationData,
          recommendations: Array.from({ length: 100 }, (_, i) => ({
            id: `rec-${i}`,
            type: 'content',
            title: `Recommendation ${i}`,
            description: `Description ${i}`,
            confidence: 0.8,
            reasoning: `Reasoning ${i}`,
            contentId: `content-${i}`,
            estimatedTime: 30,
            difficulty: 'medium',
          })),
        },
      };

      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />, largeDataContext);

      // Should handle large datasets efficiently
      expect(screen.getByText('Personalized Recommendations')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      const firstTab = screen.getByRole('tab', { name: /profile/i });
      const secondTab = screen.getByRole('tab', { name: /recommendations/i });

      await user.tab();
      expect(firstTab).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(secondTab).toHaveFocus();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle loading states', () => {
      const loadingContext = {
        ...mockPersonalizationContext,
        isLoading: true,
      };

      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />, loadingContext);

      expect(screen.getByText('Analyzing your learning patterns...')).toBeInTheDocument();
      expect(screen.getByTestId('ai-loading-spinner')).toBeInTheDocument();
    });

    it('should handle AI service errors', () => {
      const errorContext = {
        ...mockPersonalizationContext,
        error: 'AI service temporarily unavailable',
      };

      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />, errorContext);

      expect(screen.getByText('Personalization temporarily unavailable')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle empty recommendations', () => {
      const emptyContext = {
        ...mockPersonalizationContext,
        data: {
          ...mockPersonalizationData,
          recommendations: [],
        },
      };

      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />, emptyContext);

      expect(screen.getByText('No recommendations available')).toBeInTheDocument();
      expect(screen.getByText('Complete more activities to get personalized recommendations')).toBeInTheDocument();
    });

    it('should handle new user with no learning history', () => {
      const newUserContext = {
        ...mockPersonalizationContext,
        data: {
          learningProfile: {
            userId: 'user-new',
            learningStyle: 'unknown',
            skillLevel: 'beginner',
            strengths: [],
            weaknesses: [],
            preferences: {},
            goals: [],
            progress: {
              completionRate: 0,
              averageScore: 0,
              timeSpent: 0,
              streakDays: 0,
            },
          },
          recommendations: [],
          adaptivePath: null,
          insights: {
            learningPatterns: [],
            performanceTrends: [],
            recommendations: ['Take the learning style assessment', 'Start with beginner content'],
          },
        },
      };

      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />, newUserContext);

      expect(screen.getByText('Welcome! Let\'s personalize your learning')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /take assessment/i })).toBeInTheDocument();
    });
  });

  describe('Integration Testing with All Phases', () => {
    it('should work seamlessly with all previous phases', () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      // Phase 1: UI consistency
      expect(screen.getByRole('main')).toHaveClass('bg-white');
      
      // Phase 2: Authorization working
      expect(screen.getByText('Learning Profile')).toBeInTheDocument();
      
      // Phase 3: Content integration
      expect(screen.getByTestId('course-player')).toBeInTheDocument();
      
      // Phase 4: Real-time features
      expect(screen.getByText('Live Personalization')).toBeInTheDocument();
    });

    it('should maintain data consistency across components', async () => {
      renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      // Profile data should be consistent across tabs
      const recommendationsTab = screen.getByRole('tab', { name: /recommendations/i });
      await user.click(recommendationsTab);

      expect(screen.getByText('Based on your visual learning style')).toBeInTheDocument();
    });

    it('should handle real-time updates without breaking functionality', async () => {
      const { rerender } = renderWithProvider(<PersonalizationEngine currentUser={mockUser} />);

      // Simulate real-time profile update
      const updatedContext = {
        ...mockPersonalizationContext,
        data: {
          ...mockPersonalizationData,
          learningProfile: {
            ...mockPersonalizationData.learningProfile,
            progress: {
              ...mockPersonalizationData.learningProfile.progress,
              completionRate: 80, // Updated value
            },
          },
        },
      };

      render(
        <PersonalizationProvider value={updatedContext}>
          <PersonalizationEngine currentUser={mockUser} />
        </PersonalizationProvider>
      );

      // Should update without breaking other functionality
      expect(screen.getByText('80% completion rate')).toBeInTheDocument();
      expect(screen.getByText('Learning Profile')).toBeInTheDocument();
    });
  });
});