import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuizBuilder } from './QuizBuilder'
import { QuizQuestion, QuestionType } from '@/lib/types/course'

// Mock the AuthProvider and other dependencies
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'instructor' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/services/courseService', () => ({
  createQuizQuestion: jest.fn(),
  updateQuizQuestion: jest.fn(),
  deleteQuizQuestion: jest.fn(),
}))

describe('QuizBuilder', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    lessonId: 'test-lesson-id',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render quiz builder with initial state', () => {
      render(<QuizBuilder {...defaultProps} />)
      
      expect(screen.getByText('Quiz Builder')).toBeInTheDocument()
      expect(screen.getByText('Add Question')).toBeInTheDocument()
      expect(screen.getByText('Save Quiz')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should render empty state when no questions exist', () => {
      render(<QuizBuilder {...defaultProps} />)
      
      expect(screen.getByText('No questions added yet')).toBeInTheDocument()
      expect(screen.getByText('Click "Add Question" to get started')).toBeInTheDocument()
    })

    it('should render with existing quiz data', () => {
      const existingQuiz = {
        id: 'quiz-1',
        title: 'Test Quiz',
        description: 'A test quiz',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice' as QuestionType,
            question: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4',
            points: 1,
            explanation: 'Basic math',
          },
        ],
        timeLimit: 30,
        passingScore: 70,
      }

      render(<QuizBuilder {...defaultProps} initialQuiz={existingQuiz} />)
      
      expect(screen.getByDisplayValue('Test Quiz')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A test quiz')).toBeInTheDocument()
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument()
    })
  })

  describe('Question Type Support', () => {
    it('should support multiple choice questions', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('Multiple Choice'))
      
      expect(screen.getByPlaceholderText('Enter your question')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Add Option')).toBeInTheDocument()
    })

    it('should support true/false questions', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('True/False'))
      
      expect(screen.getByPlaceholderText('Enter your question')).toBeInTheDocument()
      expect(screen.getByText('True')).toBeInTheDocument()
      expect(screen.getByText('False')).toBeInTheDocument()
    })

    it('should support short answer questions', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('Short Answer'))
      
      expect(screen.getByPlaceholderText('Enter your question')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter the correct answer')).toBeInTheDocument()
    })

    it('should support essay questions', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('Essay'))
      
      expect(screen.getByPlaceholderText('Enter your question')).toBeInTheDocument()
      expect(screen.getByText('Manual grading required')).toBeInTheDocument()
    })

    it('should support fill-in-the-blank questions', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('Fill in the Blank'))
      
      expect(screen.getByPlaceholderText('Enter question with [blank] placeholders')).toBeInTheDocument()
      expect(screen.getByText('Use [blank] to indicate where answers should go')).toBeInTheDocument()
    })

    it('should support matching questions', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('Matching'))
      
      expect(screen.getByText('Left Column')).toBeInTheDocument()
      expect(screen.getByText('Right Column')).toBeInTheDocument()
      expect(screen.getByText('Add Pair')).toBeInTheDocument()
    })
  })

  describe('Question Management', () => {
    it('should add a new multiple choice question', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('Multiple Choice'))
      
      const questionInput = screen.getByPlaceholderText('Enter your question')
      await user.type(questionInput, 'What is the capital of France?')
      
      const option1 = screen.getByDisplayValue('Option 1')
      await user.clear(option1)
      await user.type(option1, 'London')
      
      const option2 = screen.getByDisplayValue('Option 2')
      await user.clear(option2)
      await user.type(option2, 'Paris')
      
      await user.click(screen.getByText('Add Option'))
      const option3 = screen.getByDisplayValue('Option 3')
      await user.type(option3, 'Berlin')
      
      // Set correct answer
      const correctAnswerRadio = screen.getAllByRole('radio')[1] // Paris option
      await user.click(correctAnswerRadio)
      
      await user.click(screen.getByText('Save Question'))
      
      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    })

    it('should edit an existing question', async () => {
      const user = userEvent.setup()
      const existingQuiz = {
        id: 'quiz-1',
        title: 'Test Quiz',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice' as QuestionType,
            question: 'Original question',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'B',
            points: 1,
          },
        ],
      }

      render(<QuizBuilder {...defaultProps} initialQuiz={existingQuiz} />)
      
      await user.click(screen.getByLabelText('Edit question'))
      
      const questionInput = screen.getByDisplayValue('Original question')
      await user.clear(questionInput)
      await user.type(questionInput, 'Updated question')
      
      await user.click(screen.getByText('Save Question'))
      
      expect(screen.getByText('Updated question')).toBeInTheDocument()
    })

    it('should delete a question', async () => {
      const user = userEvent.setup()
      const existingQuiz = {
        id: 'quiz-1',
        title: 'Test Quiz',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice' as QuestionType,
            question: 'Question to delete',
            options: ['A', 'B'],
            correctAnswer: 'A',
            points: 1,
          },
        ],
      }

      render(<QuizBuilder {...defaultProps} initialQuiz={existingQuiz} />)
      
      await user.click(screen.getByLabelText('Delete question'))
      await user.click(screen.getByText('Confirm Delete'))
      
      expect(screen.queryByText('Question to delete')).not.toBeInTheDocument()
      expect(screen.getByText('No questions added yet')).toBeInTheDocument()
    })

    it('should reorder questions via drag and drop', async () => {
      const user = userEvent.setup()
      const existingQuiz = {
        id: 'quiz-1',
        title: 'Test Quiz',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice' as QuestionType,
            question: 'First question',
            options: ['A', 'B'],
            correctAnswer: 'A',
            points: 1,
          },
          {
            id: 'q2',
            type: 'multiple_choice' as QuestionType,
            question: 'Second question',
            options: ['C', 'D'],
            correctAnswer: 'C',
            points: 1,
          },
        ],
      }

      render(<QuizBuilder {...defaultProps} initialQuiz={existingQuiz} />)
      
      const dragHandle = screen.getAllByLabelText('Drag to reorder')[0]
      
      // Simulate drag and drop (simplified)
      fireEvent.dragStart(dragHandle)
      fireEvent.dragOver(screen.getAllByLabelText('Drag to reorder')[1])
      fireEvent.drop(screen.getAllByLabelText('Drag to reorder')[1])
      
      // Verify order changed
      const questions = screen.getAllByTestId('question-item')
      expect(questions[0]).toHaveTextContent('Second question')
      expect(questions[1]).toHaveTextContent('First question')
    })
  })

  describe('Quiz Settings', () => {
    it('should configure quiz title and description', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      const titleInput = screen.getByPlaceholderText('Enter quiz title')
      await user.type(titleInput, 'My Test Quiz')
      
      const descriptionInput = screen.getByPlaceholderText('Enter quiz description')
      await user.type(descriptionInput, 'This is a test quiz')
      
      expect(screen.getByDisplayValue('My Test Quiz')).toBeInTheDocument()
      expect(screen.getByDisplayValue('This is a test quiz')).toBeInTheDocument()
    })

    it('should configure time limit', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      const timeLimitInput = screen.getByLabelText('Time Limit (minutes)')
      await user.clear(timeLimitInput)
      await user.type(timeLimitInput, '45')
      
      expect(screen.getByDisplayValue('45')).toBeInTheDocument()
    })

    it('should configure passing score', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      const passingScoreInput = screen.getByLabelText('Passing Score (%)')
      await user.clear(passingScoreInput)
      await user.type(passingScoreInput, '80')
      
      expect(screen.getByDisplayValue('80')).toBeInTheDocument()
    })

    it('should configure quiz settings', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByLabelText('Shuffle questions'))
      await user.click(screen.getByLabelText('Show results immediately'))
      await user.click(screen.getByLabelText('Allow retakes'))
      
      expect(screen.getByLabelText('Shuffle questions')).toBeChecked()
      expect(screen.getByLabelText('Show results immediately')).toBeChecked()
      expect(screen.getByLabelText('Allow retakes')).toBeChecked()
    })
  })

  describe('Validation', () => {
    it('should validate quiz title is required', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Save Quiz'))
      
      expect(screen.getByText('Quiz title is required')).toBeInTheDocument()
    })

    it('should validate at least one question is required', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      const titleInput = screen.getByPlaceholderText('Enter quiz title')
      await user.type(titleInput, 'Valid Title')
      
      await user.click(screen.getByText('Save Quiz'))
      
      expect(screen.getByText('At least one question is required')).toBeInTheDocument()
    })

    it('should validate question text is required', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('Multiple Choice'))
      await user.click(screen.getByText('Save Question'))
      
      expect(screen.getByText('Question text is required')).toBeInTheDocument()
    })

    it('should validate multiple choice questions have at least 2 options', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('Multiple Choice'))
      
      const questionInput = screen.getByPlaceholderText('Enter your question')
      await user.type(questionInput, 'Valid question')
      
      // Remove one option
      const removeButtons = screen.getAllByLabelText('Remove option')
      await user.click(removeButtons[0])
      
      await user.click(screen.getByText('Save Question'))
      
      expect(screen.getByText('At least 2 options are required')).toBeInTheDocument()
    })

    it('should validate correct answer is selected', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('Multiple Choice'))
      
      const questionInput = screen.getByPlaceholderText('Enter your question')
      await user.type(questionInput, 'Valid question')
      
      await user.click(screen.getByText('Save Question'))
      
      expect(screen.getByText('Please select the correct answer')).toBeInTheDocument()
    })
  })

  describe('Save and Cancel', () => {
    it('should call onSave with quiz data when saving', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      // Add title
      const titleInput = screen.getByPlaceholderText('Enter quiz title')
      await user.type(titleInput, 'Test Quiz')
      
      // Add a question
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('Multiple Choice'))
      
      const questionInput = screen.getByPlaceholderText('Enter your question')
      await user.type(questionInput, 'Test question')
      
      const correctAnswerRadio = screen.getAllByRole('radio')[0]
      await user.click(correctAnswerRadio)
      
      await user.click(screen.getByText('Save Question'))
      await user.click(screen.getByText('Save Quiz'))
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Quiz',
          questions: expect.arrayContaining([
            expect.objectContaining({
              question: 'Test question',
              type: 'multiple_choice',
            }),
          ]),
        })
      )
    })

    it('should call onCancel when canceling', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Cancel'))
      
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should show confirmation dialog when canceling with unsaved changes', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      // Make changes
      const titleInput = screen.getByPlaceholderText('Enter quiz title')
      await user.type(titleInput, 'Unsaved changes')
      
      await user.click(screen.getByText('Cancel'))
      
      expect(screen.getByText('Discard changes?')).toBeInTheDocument()
      expect(screen.getByText('You have unsaved changes. Are you sure you want to discard them?')).toBeInTheDocument()
    })
  })

  describe('Integration with Phase 1 & 2 Components', () => {
    it('should integrate with AuthProvider for user permissions', () => {
      render(<QuizBuilder {...defaultProps} />)
      
      // Should render for instructor role
      expect(screen.getByText('Quiz Builder')).toBeInTheDocument()
    })

    it('should use UI components from Phase 1', () => {
      render(<QuizBuilder {...defaultProps} />)
      
      // Should use Button, Input, Card, etc. from Phase 1 UI library
      expect(screen.getByRole('button', { name: 'Add Question' })).toHaveClass('btn')
      expect(screen.getByPlaceholderText('Enter quiz title')).toHaveClass('input')
    })

    it('should respect security constraints from Phase 2', async () => {
      const user = userEvent.setup()
      render(<QuizBuilder {...defaultProps} />)
      
      // Should validate CSRF tokens and sanitize inputs
      const titleInput = screen.getByPlaceholderText('Enter quiz title')
      await user.type(titleInput, '<script>alert("xss")</script>')
      
      // Input should be sanitized
      expect(titleInput).not.toHaveValue('<script>alert("xss")</script>')
    })
  })
})