import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedAssessmentBuilder } from './EnhancedAssessmentBuilder';
import { GamificationProvider } from '../gamification/GamificationProvider';

// Mock previous phase components
jest.mock('./QuizBuilder', () => ({
  QuizBuilder: jest.fn(({ onQuizChange }) => (
    <div data-testid="quiz-builder">
      <button onClick={() => onQuizChange({ questions: [], timeLimit: 30 })}>
        Mock Quiz Builder
      </button>
    </div>
  )),
}));

jest.mock('./AssignmentBuilder', () => ({
  AssignmentBuilder: jest.fn(({ onAssignmentChange }) => (
    <div data-testid="assignment-builder">
      <button onClick={() => onAssignmentChange({ title: 'Test Assignment' })}>
        Mock Assignment Builder
      </button>
    </div>
  )),
}));

jest.mock('../notifications/NotificationSystem', () => ({
  NotificationSystem: jest.fn(() => (
    <div data-testid="notification-system">Notifications</div>
  )),
}));

const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  role: 'instructor',
  level: 5,
  xp: 2500,
  achievements: ['first-quiz', 'perfect-score'],
};

const mockGamificationContext = {
  userProgress: {
    level: 5,
    xp: 2500,
    totalXp: 3000,
    achievements: ['first-quiz', 'perfect-score'],
    badges: ['quiz-master', 'early-bird'],
    streak: 7,
    rank: 15,
  },
  leaderboard: [
    { userId: 'user-456', name: 'Jane Smith', xp: 3500, level: 6 },
    { userId: 'user-123', name: 'John Doe', xp: 2500, level: 5 },
  ],
  awardXP: jest.fn(),
  unlockAchievement: jest.fn(),
  updateStreak: jest.fn(),
  getAvailableRewards: jest.fn(),
  claimReward: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <GamificationProvider value={mockGamificationContext}>
      {component}
    </GamificationProvider>
  );
};

describe('EnhancedAssessmentBuilder', () => {
  const user = userEvent.setup();
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Integration with Previous Phase Components', () => {
    it('should integrate with Phase 1 UI components', () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should use Phase 1 design system components
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByText('Assessment Details')).toBeInTheDocument();
      expect(screen.getByText('Gamification')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should integrate with Phase 2 authorization system', () => {
      const studentUser = { ...mockUser, role: 'student' };
      
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={studentUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Students should not see instructor-only features
      expect(screen.queryByText('Advanced Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Grading Rubric')).not.toBeInTheDocument();
    });

    it('should integrate with Phase 3 content management', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should integrate with existing QuizBuilder and AssignmentBuilder
      expect(screen.getByTestId('quiz-builder')).toBeInTheDocument();
      
      const quizTab = screen.getByRole('tab', { name: /quiz/i });
      await user.click(quizTab);
      
      expect(screen.getByTestId('quiz-builder')).toBeInTheDocument();
    });

    it('should integrate with Phase 4 real-time features', () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should show real-time collaboration features
      expect(screen.getByTestId('notification-system')).toBeInTheDocument();
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });
  });

  describe('Gamification Features', () => {
    it('should display XP reward settings', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const gamificationTab = screen.getByRole('tab', { name: /gamification/i });
      await user.click(gamificationTab);

      expect(screen.getByText('XP Rewards')).toBeInTheDocument();
      expect(screen.getByLabelText('Base XP')).toBeInTheDocument();
      expect(screen.getByLabelText('Perfect Score Bonus')).toBeInTheDocument();
      expect(screen.getByLabelText('Speed Bonus')).toBeInTheDocument();
    });

    it('should configure achievement triggers', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const gamificationTab = screen.getByRole('tab', { name: /gamification/i });
      await user.click(gamificationTab);

      expect(screen.getByText('Achievement Triggers')).toBeInTheDocument();
      expect(screen.getByLabelText('First Attempt')).toBeInTheDocument();
      expect(screen.getByLabelText('Perfect Score')).toBeInTheDocument();
      expect(screen.getByLabelText('Speed Demon')).toBeInTheDocument();
    });

    it('should set difficulty multipliers', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const gamificationTab = screen.getByRole('tab', { name: /gamification/i });
      await user.click(gamificationTab);

      const difficultySelect = screen.getByLabelText('Difficulty Level');
      await user.selectOptions(difficultySelect, 'hard');

      expect(screen.getByText('XP Multiplier: 1.5x')).toBeInTheDocument();
    });

    it('should configure leaderboard settings', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const gamificationTab = screen.getByRole('tab', { name: /gamification/i });
      await user.click(gamificationTab);

      expect(screen.getByText('Leaderboard Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Show on Leaderboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Anonymous Submissions')).toBeInTheDocument();
    });

    it('should preview gamification elements', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      await user.click(previewTab);

      expect(screen.getByText('Gamification Preview')).toBeInTheDocument();
      expect(screen.getByText('Potential XP: 100')).toBeInTheDocument();
      expect(screen.getByText('Available Achievements')).toBeInTheDocument();
    });
  });

  describe('Advanced Assessment Types', () => {
    it('should support adaptive assessments', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const typeSelect = screen.getByLabelText('Assessment Type');
      await user.selectOptions(typeSelect, 'adaptive');

      expect(screen.getByText('Adaptive Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Starting Difficulty')).toBeInTheDocument();
      expect(screen.getByLabelText('Adaptation Algorithm')).toBeInTheDocument();
    });

    it('should support timed challenges', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const typeSelect = screen.getByLabelText('Assessment Type');
      await user.selectOptions(typeSelect, 'timed-challenge');

      expect(screen.getByText('Time Challenge Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Time Limit')).toBeInTheDocument();
      expect(screen.getByLabelText('Show Timer')).toBeInTheDocument();
      expect(screen.getByLabelText('Auto Submit')).toBeInTheDocument();
    });

    it('should support peer assessments', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const typeSelect = screen.getByLabelText('Assessment Type');
      await user.selectOptions(typeSelect, 'peer-assessment');

      expect(screen.getByText('Peer Assessment Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Number of Peer Reviews')).toBeInTheDocument();
      expect(screen.getByLabelText('Review Criteria')).toBeInTheDocument();
    });

    it('should support collaborative assessments', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const typeSelect = screen.getByLabelText('Assessment Type');
      await user.selectOptions(typeSelect, 'collaborative');

      expect(screen.getByText('Collaboration Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Team Size')).toBeInTheDocument();
      expect(screen.getByLabelText('Individual Grading')).toBeInTheDocument();
    });
  });

  describe('Progress Tracking Integration', () => {
    it('should show learning analytics integration', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
      await user.click(analyticsTab);

      expect(screen.getByText('Learning Analytics')).toBeInTheDocument();
      expect(screen.getByText('Track Attempt Patterns')).toBeInTheDocument();
      expect(screen.getByText('Measure Learning Outcomes')).toBeInTheDocument();
    });

    it('should configure competency mapping', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
      await user.click(analyticsTab);

      expect(screen.getByText('Competency Mapping')).toBeInTheDocument();
      expect(screen.getByLabelText('Learning Objectives')).toBeInTheDocument();
      expect(screen.getByLabelText('Skill Categories')).toBeInTheDocument();
    });

    it('should set up prerequisite checking', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
      await user.click(analyticsTab);

      expect(screen.getByText('Prerequisites')).toBeInTheDocument();
      expect(screen.getByLabelText('Required Assessments')).toBeInTheDocument();
      expect(screen.getByLabelText('Minimum Score')).toBeInTheDocument();
    });
  });

  describe('Real-time Collaboration', () => {
    it('should support live assessment creation', () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isLiveSession={true}
        />
      );

      expect(screen.getByText('Live Collaboration')).toBeInTheDocument();
      expect(screen.getByText('2 collaborators online')).toBeInTheDocument();
    });

    it('should show real-time changes', async () => {
      const { rerender } = renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isLiveSession={true}
        />
      );

      // Simulate real-time update
      rerender(
        <GamificationProvider value={mockGamificationContext}>
          <EnhancedAssessmentBuilder
            currentUser={mockUser}
            onSave={mockOnSave}
            onCancel={mockOnCancel}
            isLiveSession={true}
            liveChanges={[
              { userId: 'user-456', userName: 'Jane Smith', change: 'Added question 1' }
            ]}
          />
        </GamificationProvider>
      );

      expect(screen.getByText('Jane Smith added question 1')).toBeInTheDocument();
    });

    it('should handle concurrent editing conflicts', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isLiveSession={true}
          hasConflicts={true}
        />
      );

      expect(screen.getByText('Merge Conflicts Detected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resolve conflicts/i })).toBeInTheDocument();
    });
  });

  describe('Assessment Validation', () => {
    it('should validate assessment configuration', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save assessment/i });
      await user.click(saveButton);

      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('At least one question is required')).toBeInTheDocument();
    });

    it('should validate gamification settings', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const gamificationTab = screen.getByRole('tab', { name: /gamification/i });
      await user.click(gamificationTab);

      const xpInput = screen.getByLabelText('Base XP');
      await user.clear(xpInput);
      await user.type(xpInput, '-10');

      expect(screen.getByText('XP must be positive')).toBeInTheDocument();
    });

    it('should validate time limits', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const typeSelect = screen.getByLabelText('Assessment Type');
      await user.selectOptions(typeSelect, 'timed-challenge');

      const timeInput = screen.getByLabelText('Time Limit');
      await user.clear(timeInput);
      await user.type(timeInput, '0');

      expect(screen.getByText('Time limit must be at least 1 minute')).toBeInTheDocument();
    });
  });

  describe('Accessibility and Performance', () => {
    it('should be fully accessible', () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label');
      expect(screen.getByLabelText('Assessment Title')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save assessment/i })).toBeInTheDocument();
    });

    it('should handle large assessment configurations', async () => {
      const largeAssessment = {
        questions: Array.from({ length: 100 }, (_, i) => ({
          id: `q-${i}`,
          type: 'multiple-choice',
          question: `Question ${i}`,
          options: ['A', 'B', 'C', 'D'],
        })),
      };

      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          initialData={largeAssessment}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should handle large datasets efficiently
      expect(screen.getByText('100 questions')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const firstTab = screen.getByRole('tab', { name: /assessment details/i });
      const secondTab = screen.getByRole('tab', { name: /gamification/i });

      await user.tab();
      expect(firstTab).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(secondTab).toHaveFocus();
    });
  });

  describe('Integration Testing with All Phases', () => {
    it('should work with Phase 1 design system', () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should use consistent styling from Phase 1
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('px-4', 'py-2'); // Phase 1 button styles
      });
    });

    it('should respect Phase 2 authorization rules', () => {
      const restrictedUser = { ...mockUser, role: 'student' };
      
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={restrictedUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Students should have limited access
      expect(screen.queryByText('Advanced Settings')).not.toBeInTheDocument();
    });

    it('should integrate with Phase 3 content blocks', async () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should support mixed content from Phase 3
      const addContentButton = screen.getByRole('button', { name: /add content block/i });
      await user.click(addContentButton);

      expect(screen.getByText('Text Block')).toBeInTheDocument();
      expect(screen.getByText('Video Block')).toBeInTheDocument();
      expect(screen.getByText('Interactive Block')).toBeInTheDocument();
    });

    it('should use Phase 4 real-time features', () => {
      renderWithProviders(
        <EnhancedAssessmentBuilder
          currentUser={mockUser}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isLiveSession={true}
        />
      );

      // Should show real-time collaboration indicators
      expect(screen.getByTestId('notification-system')).toBeInTheDocument();
      expect(screen.getByText('Live Collaboration')).toBeInTheDocument();
    });
  });
});