import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LiveQA } from './LiveQA';
import { QAProvider } from './QAProvider';

// Mock the GraphQL subscription manager
jest.mock('../../lib/graphql/subscriptions');

const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  role: 'student',
};

const mockInstructor = {
  id: 'instructor-456',
  name: 'Jane Smith',
  role: 'instructor',
};

const mockQAContext = {
  questions: [
    {
      id: 'qa-1',
      question: 'How does React hooks work?',
      answer: 'React hooks allow you to use state and other React features...',
      status: 'answered' as const,
      votes: 5,
      author: mockUser,
      sessionId: 'session-123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'qa-2',
      question: 'What is the difference between props and state?',
      status: 'pending' as const,
      votes: 2,
      author: {
        id: 'user-789',
        name: 'Bob Johnson',
        role: 'student',
      },
      sessionId: 'session-123',
      createdAt: '2024-01-15T10:15:00Z',
      updatedAt: '2024-01-15T10:15:00Z',
    },
  ],
  submitQuestion: jest.fn(),
  answerQuestion: jest.fn(),
  voteQuestion: jest.fn(),
  isConnected: true,
  currentUser: mockUser,
};

const renderWithProvider = (component: React.ReactElement, context = mockQAContext) => {
  return render(
    <QAProvider value={context}>
      {component}
    </QAProvider>
  );
};

describe('LiveQA', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Question Display', () => {
    it('should render questions correctly', () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      expect(screen.getByText('How does React hooks work?')).toBeInTheDocument();
      expect(screen.getByText('What is the difference between props and state?')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should show question status correctly', () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      expect(screen.getByText('Answered')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display vote counts', () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      expect(screen.getByText('5')).toBeInTheDocument(); // votes for first question
      expect(screen.getByText('2')).toBeInTheDocument(); // votes for second question
    });

    it('should show answers for answered questions', () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      expect(screen.getByText('React hooks allow you to use state and other React features...')).toBeInTheDocument();
    });

    it('should sort questions by votes and status', () => {
      const contextWithMixedQuestions = {
        ...mockQAContext,
        questions: [
          {
            id: 'qa-high-votes',
            question: 'High voted question',
            status: 'pending' as const,
            votes: 10,
            author: mockUser,
            sessionId: 'session-123',
            createdAt: '2024-01-15T09:00:00Z',
            updatedAt: '2024-01-15T09:00:00Z',
          },
          ...mockQAContext.questions,
        ],
      };

      renderWithProvider(<LiveQA sessionId="session-123" />, contextWithMixedQuestions);

      const questions = screen.getAllByTestId('qa-question');
      expect(questions[0]).toHaveTextContent('High voted question'); // Should be first due to high votes
    });
  });

  describe('Question Submission', () => {
    it('should render question input form', () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit question/i })).toBeInTheDocument();
    });

    it('should submit new question', async () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const input = screen.getByPlaceholderText('Ask a question...');
      const submitButton = screen.getByRole('button', { name: /submit question/i });

      await user.type(input, 'What is TypeScript?');
      await user.click(submitButton);

      expect(mockQAContext.submitQuestion).toHaveBeenCalledWith({
        question: 'What is TypeScript?',
        sessionId: 'session-123',
      });
    });

    it('should not submit empty questions', async () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const submitButton = screen.getByRole('button', { name: /submit question/i });
      await user.click(submitButton);

      expect(mockQAContext.submitQuestion).not.toHaveBeenCalled();
    });

    it('should clear input after submission', async () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const input = screen.getByPlaceholderText('Ask a question...') as HTMLTextAreaElement;
      await user.type(input, 'Test question');
      await user.click(screen.getByRole('button', { name: /submit question/i }));

      expect(input.value).toBe('');
    });

    it('should show character count', async () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await user.type(input, 'Short question');

      expect(screen.getByText('14/500')).toBeInTheDocument();
    });

    it('should prevent submission when character limit exceeded', async () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const input = screen.getByPlaceholderText('Ask a question...');
      const longQuestion = 'a'.repeat(501);
      
      await user.type(input, longQuestion);

      const submitButton = screen.getByRole('button', { name: /submit question/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Voting System', () => {
    it('should allow voting on questions', async () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const voteButtons = screen.getAllByRole('button', { name: /vote/i });
      await user.click(voteButtons[0]);

      expect(mockQAContext.voteQuestion).toHaveBeenCalledWith('qa-1');
    });

    it('should show current vote count', () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const voteButtons = screen.getAllByRole('button', { name: /vote/i });
      expect(voteButtons[0]).toHaveTextContent('5');
      expect(voteButtons[1]).toHaveTextContent('2');
    });

    it('should disable voting for own questions', () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      // First question is from current user (mockUser)
      const voteButtons = screen.getAllByRole('button', { name: /vote/i });
      expect(voteButtons[0]).toBeDisabled();
    });

    it('should show visual feedback for voted questions', async () => {
      const contextWithVotedQuestion = {
        ...mockQAContext,
        questions: [
          {
            ...mockQAContext.questions[0],
            hasVoted: true,
          },
          ...mockQAContext.questions.slice(1),
        ],
      };

      renderWithProvider(<LiveQA sessionId="session-123" />, contextWithVotedQuestion);

      const voteButton = screen.getAllByRole('button', { name: /vote/i })[0];
      expect(voteButton).toHaveClass('text-blue-600'); // Voted state styling
    });
  });

  describe('Answer Management', () => {
    it('should show answer form for instructors', () => {
      const instructorContext = {
        ...mockQAContext,
        currentUser: mockInstructor,
      };

      renderWithProvider(<LiveQA sessionId="session-123" />, instructorContext);

      // Should show answer button for pending questions
      expect(screen.getByRole('button', { name: /answer/i })).toBeInTheDocument();
    });

    it('should not show answer form for students', () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      // Students should not see answer buttons
      expect(screen.queryByRole('button', { name: /answer/i })).not.toBeInTheDocument();
    });

    it('should allow instructors to answer questions', async () => {
      const instructorContext = {
        ...mockQAContext,
        currentUser: mockInstructor,
      };

      renderWithProvider(<LiveQA sessionId="session-123" />, instructorContext);

      const answerButton = screen.getByRole('button', { name: /answer/i });
      await user.click(answerButton);

      const answerInput = screen.getByPlaceholderText('Type your answer...');
      await user.type(answerInput, 'This is the answer to the question.');

      const submitAnswerButton = screen.getByRole('button', { name: /submit answer/i });
      await user.click(submitAnswerButton);

      expect(mockQAContext.answerQuestion).toHaveBeenCalledWith('qa-2', 'This is the answer to the question.');
    });

    it('should cancel answer input', async () => {
      const instructorContext = {
        ...mockQAContext,
        currentUser: mockInstructor,
      };

      renderWithProvider(<LiveQA sessionId="session-123" />, instructorContext);

      const answerButton = screen.getByRole('button', { name: /answer/i });
      await user.click(answerButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByPlaceholderText('Type your answer...')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should show connection status', () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should show disconnected status', () => {
      const disconnectedContext = {
        ...mockQAContext,
        isConnected: false,
      };

      renderWithProvider(<LiveQA sessionId="session-123" />, disconnectedContext);

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should disable interactions when disconnected', () => {
      const disconnectedContext = {
        ...mockQAContext,
        isConnected: false,
      };

      renderWithProvider(<LiveQA sessionId="session-123" />, disconnectedContext);

      const submitButton = screen.getByRole('button', { name: /submit question/i });
      const voteButtons = screen.getAllByRole('button', { name: /vote/i });

      expect(submitButton).toBeDisabled();
      voteButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Filtering and Search', () => {
    it('should filter questions by status', async () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const filterSelect = screen.getByRole('combobox', { name: /filter by status/i });
      await user.selectOptions(filterSelect, 'answered');

      // Should only show answered questions
      expect(screen.getByText('How does React hooks work?')).toBeInTheDocument();
      expect(screen.queryByText('What is the difference between props and state?')).not.toBeInTheDocument();
    });

    it('should search questions by content', async () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const searchInput = screen.getByPlaceholderText('Search questions...');
      await user.type(searchInput, 'React hooks');

      // Should only show questions containing "React hooks"
      expect(screen.getByText('How does React hooks work?')).toBeInTheDocument();
      expect(screen.queryByText('What is the difference between props and state?')).not.toBeInTheDocument();
    });

    it('should clear search when input is empty', async () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const searchInput = screen.getByPlaceholderText('Search questions...');
      await user.type(searchInput, 'React hooks');
      await user.clear(searchInput);

      // Should show all questions again
      expect(screen.getByText('How does React hooks work?')).toBeInTheDocument();
      expect(screen.getByText('What is the difference between props and state?')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      expect(screen.getByRole('region', { name: /q&a session/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /questions/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /question input/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      renderWithProvider(<LiveQA sessionId="session-123" />);

      const questionInput = screen.getByPlaceholderText('Ask a question...');
      const submitButton = screen.getByRole('button', { name: /submit question/i });

      await user.tab();
      expect(questionInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should announce new questions to screen readers', async () => {
      const { rerender } = renderWithProvider(<LiveQA sessionId="session-123" />);

      const newContext = {
        ...mockQAContext,
        questions: [
          ...mockQAContext.questions,
          {
            id: 'qa-new',
            question: 'New question arrived',
            status: 'pending' as const,
            votes: 0,
            author: { id: 'user-new', name: 'New User', role: 'student' },
            sessionId: 'session-123',
            createdAt: '2024-01-15T11:00:00Z',
            updatedAt: '2024-01-15T11:00:00Z',
          },
        ],
      };

      render(
        <QAProvider value={newContext}>
          <LiveQA sessionId="session-123" />
        </QAProvider>
      );

      expect(screen.getByRole('status')).toHaveTextContent('New question from New User');
    });
  });

  describe('Performance', () => {
    it('should virtualize long question lists', () => {
      const manyQuestions = Array.from({ length: 1000 }, (_, i) => ({
        id: `qa-${i}`,
        question: `Question ${i}`,
        status: 'pending' as const,
        votes: i,
        author: mockUser,
        sessionId: 'session-123',
        createdAt: new Date(Date.now() - i * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 1000).toISOString(),
      }));

      const contextWithManyQuestions = {
        ...mockQAContext,
        questions: manyQuestions,
      };

      renderWithProvider(<LiveQA sessionId="session-123" />, contextWithManyQuestions);

      // Should only render visible questions (virtualization)
      const renderedQuestions = screen.getAllByTestId('qa-question');
      expect(renderedQuestions.length).toBeLessThan(100); // Should be much less than 1000
    });

    it('should debounce search input', async () => {
      const mockSearch = jest.fn();
      const contextWithSearch = {
        ...mockQAContext,
        searchQuestions: mockSearch,
      };

      renderWithProvider(<LiveQA sessionId="session-123" />, contextWithSearch);

      const searchInput = screen.getByPlaceholderText('Search questions...');
      
      // Type multiple characters quickly
      await user.type(searchInput, 'react');

      // Should debounce and only call search once
      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1);
      });
    });
  });
});