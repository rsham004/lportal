import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssignmentBuilder } from './AssignmentBuilder'
import { AssignmentSubmission } from '@/lib/types/course'

// Mock the AuthProvider and other dependencies
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'instructor' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/services/courseService', () => ({
  createAssignment: jest.fn(),
  updateAssignment: jest.fn(),
  deleteAssignment: jest.fn(),
  submitAssignment: jest.fn(),
  gradeAssignment: jest.fn(),
  getAssignmentSubmissions: jest.fn(),
}))

jest.mock('@/lib/services/fileUploadService', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
}))

describe('AssignmentBuilder', () => {
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
    it('should render assignment builder with initial state', () => {
      render(<AssignmentBuilder {...defaultProps} />)
      
      expect(screen.getByText('Assignment Builder')).toBeInTheDocument()
      expect(screen.getByText('Assignment Details')).toBeInTheDocument()
      expect(screen.getByText('Submission Settings')).toBeInTheDocument()
      expect(screen.getByText('Grading Rubric')).toBeInTheDocument()
      expect(screen.getByText('Save Assignment')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should render with existing assignment data', () => {
      const existingAssignment = {
        id: 'assignment-1',
        title: 'Test Assignment',
        instructions: 'Complete this assignment',
        submissionType: 'file' as const,
        maxPoints: 100,
        dueDate: '2024-12-31T23:59:59Z',
        rubric: [
          {
            criteria: 'Quality',
            description: 'Overall quality of work',
            points: 50,
            levels: [
              { name: 'Excellent', description: 'Outstanding work', points: 50 },
              { name: 'Good', description: 'Good work', points: 40 },
              { name: 'Fair', description: 'Acceptable work', points: 30 },
              { name: 'Poor', description: 'Needs improvement', points: 20 },
            ],
          },
        ],
      }

      render(<AssignmentBuilder {...defaultProps} initialAssignment={existingAssignment} />)
      
      expect(screen.getByDisplayValue('Test Assignment')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Complete this assignment')).toBeInTheDocument()
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    })
  })

  describe('Assignment Configuration', () => {
    it('should configure assignment title and instructions', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const titleInput = screen.getByPlaceholderText('Enter assignment title')
      await user.type(titleInput, 'My Test Assignment')
      
      const instructionsInput = screen.getByPlaceholderText('Enter assignment instructions')
      await user.type(instructionsInput, 'Complete the following tasks...')
      
      expect(screen.getByDisplayValue('My Test Assignment')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Complete the following tasks...')).toBeInTheDocument()
    })

    it('should configure submission type', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const submissionTypeSelect = screen.getByLabelText('Submission Type')
      await user.click(submissionTypeSelect)
      await user.click(screen.getByText('File Upload'))
      
      expect(screen.getByText('Students can upload files')).toBeInTheDocument()
      expect(screen.getByText('Allowed file types')).toBeInTheDocument()
    })

    it('should configure due date and time', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const dueDateInput = screen.getByLabelText('Due Date')
      await user.type(dueDateInput, '2024-12-31')
      
      const dueTimeInput = screen.getByLabelText('Due Time')
      await user.type(dueTimeInput, '23:59')
      
      expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument()
      expect(screen.getByDisplayValue('23:59')).toBeInTheDocument()
    })

    it('should configure maximum points', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const maxPointsInput = screen.getByLabelText('Maximum Points')
      await user.clear(maxPointsInput)
      await user.type(maxPointsInput, '150')
      
      expect(screen.getByDisplayValue('150')).toBeInTheDocument()
    })

    it('should configure assignment settings', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      await user.click(screen.getByLabelText('Allow late submissions'))
      await user.click(screen.getByLabelText('Require submission comments'))
      await user.click(screen.getByLabelText('Enable peer review'))
      
      expect(screen.getByLabelText('Allow late submissions')).toBeChecked()
      expect(screen.getByLabelText('Require submission comments')).toBeChecked()
      expect(screen.getByLabelText('Enable peer review')).toBeChecked()
    })
  })

  describe('Submission Types', () => {
    it('should support text submission type', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const submissionTypeSelect = screen.getByLabelText('Submission Type')
      await user.click(submissionTypeSelect)
      await user.click(screen.getByText('Text Entry'))
      
      expect(screen.getByText('Students can enter text directly')).toBeInTheDocument()
      expect(screen.getByLabelText('Minimum word count')).toBeInTheDocument()
      expect(screen.getByLabelText('Maximum word count')).toBeInTheDocument()
    })

    it('should support file upload submission type', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const submissionTypeSelect = screen.getByLabelText('Submission Type')
      await user.click(submissionTypeSelect)
      await user.click(screen.getByText('File Upload'))
      
      expect(screen.getByText('Students can upload files')).toBeInTheDocument()
      expect(screen.getByLabelText('Maximum file size (MB)')).toBeInTheDocument()
      expect(screen.getByLabelText('Maximum number of files')).toBeInTheDocument()
    })

    it('should support URL submission type', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const submissionTypeSelect = screen.getByLabelText('Submission Type')
      await user.click(submissionTypeSelect)
      await user.click(screen.getByText('URL/Link'))
      
      expect(screen.getByText('Students can submit URLs or links')).toBeInTheDocument()
      expect(screen.getByText('Example: Portfolio website, GitHub repository, etc.')).toBeInTheDocument()
    })

    it('should support code submission type', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const submissionTypeSelect = screen.getByLabelText('Submission Type')
      await user.click(submissionTypeSelect)
      await user.click(screen.getByText('Code'))
      
      expect(screen.getByText('Students can submit code directly')).toBeInTheDocument()
      expect(screen.getByLabelText('Programming language')).toBeInTheDocument()
      expect(screen.getByLabelText('Enable syntax highlighting')).toBeInTheDocument()
    })
  })

  describe('Grading Rubric', () => {
    it('should add rubric criteria', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Criteria'))
      
      const criteriaInput = screen.getByPlaceholderText('Enter criteria name')
      await user.type(criteriaInput, 'Code Quality')
      
      const descriptionInput = screen.getByPlaceholderText('Describe this criteria')
      await user.type(descriptionInput, 'Quality of code structure and style')
      
      const pointsInput = screen.getByLabelText('Points for this criteria')
      await user.clear(pointsInput)
      await user.type(pointsInput, '25')
      
      expect(screen.getByDisplayValue('Code Quality')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Quality of code structure and style')).toBeInTheDocument()
      expect(screen.getByDisplayValue('25')).toBeInTheDocument()
    })

    it('should add performance levels to criteria', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Criteria'))
      await user.click(screen.getByText('Add Level'))
      
      const levelNameInput = screen.getByPlaceholderText('Level name')
      await user.type(levelNameInput, 'Excellent')
      
      const levelDescriptionInput = screen.getByPlaceholderText('Level description')
      await user.type(levelDescriptionInput, 'Exceeds expectations')
      
      const levelPointsInput = screen.getByLabelText('Points for this level')
      await user.type(levelPointsInput, '25')
      
      expect(screen.getByDisplayValue('Excellent')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Exceeds expectations')).toBeInTheDocument()
    })

    it('should remove rubric criteria', async () => {
      const user = userEvent.setup()
      const existingAssignment = {
        id: 'assignment-1',
        title: 'Test Assignment',
        rubric: [
          {
            criteria: 'Quality',
            description: 'Overall quality',
            points: 50,
            levels: [],
          },
        ],
      }

      render(<AssignmentBuilder {...defaultProps} initialAssignment={existingAssignment} />)
      
      await user.click(screen.getByLabelText('Remove criteria'))
      
      expect(screen.queryByDisplayValue('Quality')).not.toBeInTheDocument()
    })

    it('should calculate total rubric points', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Add Criteria'))
      const pointsInput = screen.getByLabelText('Points for this criteria')
      await user.clear(pointsInput)
      await user.type(pointsInput, '30')
      
      await user.click(screen.getByText('Add Criteria'))
      const pointsInputs = screen.getAllByLabelText('Points for this criteria')
      await user.clear(pointsInputs[1])
      await user.type(pointsInputs[1], '20')
      
      expect(screen.getByText('Total: 50 points')).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should validate assignment title is required', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Save Assignment'))
      
      expect(screen.getByText('Assignment title is required')).toBeInTheDocument()
    })

    it('should validate assignment instructions are required', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const titleInput = screen.getByPlaceholderText('Enter assignment title')
      await user.type(titleInput, 'Valid Title')
      
      await user.click(screen.getByText('Save Assignment'))
      
      expect(screen.getByText('Assignment instructions are required')).toBeInTheDocument()
    })

    it('should validate due date is in the future', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const titleInput = screen.getByPlaceholderText('Enter assignment title')
      await user.type(titleInput, 'Valid Title')
      
      const instructionsInput = screen.getByPlaceholderText('Enter assignment instructions')
      await user.type(instructionsInput, 'Valid instructions')
      
      const dueDateInput = screen.getByLabelText('Due Date')
      await user.type(dueDateInput, '2020-01-01')
      
      await user.click(screen.getByText('Save Assignment'))
      
      expect(screen.getByText('Due date must be in the future')).toBeInTheDocument()
    })

    it('should validate maximum points is positive', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const maxPointsInput = screen.getByLabelText('Maximum Points')
      await user.clear(maxPointsInput)
      await user.type(maxPointsInput, '0')
      
      await user.click(screen.getByText('Save Assignment'))
      
      expect(screen.getByText('Maximum points must be greater than 0')).toBeInTheDocument()
    })

    it('should validate file upload settings', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const submissionTypeSelect = screen.getByLabelText('Submission Type')
      await user.click(submissionTypeSelect)
      await user.click(screen.getByText('File Upload'))
      
      const maxFileSizeInput = screen.getByLabelText('Maximum file size (MB)')
      await user.clear(maxFileSizeInput)
      await user.type(maxFileSizeInput, '0')
      
      await user.click(screen.getByText('Save Assignment'))
      
      expect(screen.getByText('Maximum file size must be greater than 0')).toBeInTheDocument()
    })
  })

  describe('Assignment Submission Management', () => {
    it('should display submission overview for instructors', () => {
      const existingAssignment = {
        id: 'assignment-1',
        title: 'Test Assignment',
        submissions: [
          {
            id: 'sub-1',
            user_id: 'student-1',
            status: 'submitted',
            submitted_at: '2024-01-15T10:00:00Z',
          },
          {
            id: 'sub-2',
            user_id: 'student-2',
            status: 'graded',
            score: 85,
            submitted_at: '2024-01-14T15:30:00Z',
          },
        ],
      }

      render(<AssignmentBuilder {...defaultProps} initialAssignment={existingAssignment} />)
      
      expect(screen.getByText('Submissions Overview')).toBeInTheDocument()
      expect(screen.getByText('2 submissions')).toBeInTheDocument()
      expect(screen.getByText('1 pending review')).toBeInTheDocument()
      expect(screen.getByText('1 graded')).toBeInTheDocument()
    })

    it('should allow viewing individual submissions', async () => {
      const user = userEvent.setup()
      const existingAssignment = {
        id: 'assignment-1',
        title: 'Test Assignment',
        submissions: [
          {
            id: 'sub-1',
            user_id: 'student-1',
            user_name: 'John Doe',
            status: 'submitted',
            content: 'My assignment submission',
            submitted_at: '2024-01-15T10:00:00Z',
          },
        ],
      }

      render(<AssignmentBuilder {...defaultProps} initialAssignment={existingAssignment} />)
      
      await user.click(screen.getByText('View Submissions'))
      await user.click(screen.getByText('John Doe'))
      
      expect(screen.getByText('Submission Details')).toBeInTheDocument()
      expect(screen.getByText('My assignment submission')).toBeInTheDocument()
      expect(screen.getByText('Grade Submission')).toBeInTheDocument()
    })

    it('should allow grading submissions', async () => {
      const user = userEvent.setup()
      const existingAssignment = {
        id: 'assignment-1',
        title: 'Test Assignment',
        maxPoints: 100,
        submissions: [
          {
            id: 'sub-1',
            user_id: 'student-1',
            user_name: 'John Doe',
            status: 'submitted',
            content: 'My assignment submission',
          },
        ],
      }

      render(<AssignmentBuilder {...defaultProps} initialAssignment={existingAssignment} />)
      
      await user.click(screen.getByText('View Submissions'))
      await user.click(screen.getByText('John Doe'))
      
      const scoreInput = screen.getByLabelText('Score')
      await user.type(scoreInput, '85')
      
      const feedbackInput = screen.getByLabelText('Feedback')
      await user.type(feedbackInput, 'Good work! Consider improving...')
      
      await user.click(screen.getByText('Save Grade'))
      
      expect(screen.getByText('Grade saved successfully')).toBeInTheDocument()
    })
  })

  describe('Save and Cancel', () => {
    it('should call onSave with assignment data when saving', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const titleInput = screen.getByPlaceholderText('Enter assignment title')
      await user.type(titleInput, 'Test Assignment')
      
      const instructionsInput = screen.getByPlaceholderText('Enter assignment instructions')
      await user.type(instructionsInput, 'Complete this assignment')
      
      const dueDateInput = screen.getByLabelText('Due Date')
      await user.type(dueDateInput, '2025-12-31')
      
      await user.click(screen.getByText('Save Assignment'))
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Assignment',
          instructions: 'Complete this assignment',
          dueDate: expect.stringContaining('2025-12-31'),
        })
      )
    })

    it('should call onCancel when canceling', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Cancel'))
      
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should show confirmation dialog when canceling with unsaved changes', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const titleInput = screen.getByPlaceholderText('Enter assignment title')
      await user.type(titleInput, 'Unsaved changes')
      
      await user.click(screen.getByText('Cancel'))
      
      expect(screen.getByText('Discard changes?')).toBeInTheDocument()
      expect(screen.getByText('You have unsaved changes. Are you sure you want to discard them?')).toBeInTheDocument()
    })
  })

  describe('Integration with Phase 1 & 2 Components', () => {
    it('should integrate with AuthProvider for user permissions', () => {
      render(<AssignmentBuilder {...defaultProps} />)
      
      expect(screen.getByText('Assignment Builder')).toBeInTheDocument()
    })

    it('should use UI components from Phase 1', () => {
      render(<AssignmentBuilder {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: 'Save Assignment' })).toHaveClass('btn')
      expect(screen.getByPlaceholderText('Enter assignment title')).toHaveClass('input')
    })

    it('should respect security constraints from Phase 2', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const titleInput = screen.getByPlaceholderText('Enter assignment title')
      await user.type(titleInput, '<script>alert("xss")</script>')
      
      expect(titleInput).not.toHaveValue('<script>alert("xss")</script>')
    })

    it('should integrate with file upload service', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const submissionTypeSelect = screen.getByLabelText('Submission Type')
      await user.click(submissionTypeSelect)
      await user.click(screen.getByText('File Upload'))
      
      expect(screen.getByText('Allowed file types')).toBeInTheDocument()
      expect(screen.getByText('PDF, DOC, DOCX, TXT')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AssignmentBuilder {...defaultProps} />)
      
      expect(screen.getByLabelText('Assignment title')).toBeInTheDocument()
      expect(screen.getByLabelText('Assignment instructions')).toBeInTheDocument()
      expect(screen.getByLabelText('Due Date')).toBeInTheDocument()
      expect(screen.getByLabelText('Maximum Points')).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      const titleInput = screen.getByPlaceholderText('Enter assignment title')
      titleInput.focus()
      
      await user.keyboard('{Tab}')
      expect(screen.getByPlaceholderText('Enter assignment instructions')).toHaveFocus()
      
      await user.keyboard('{Tab}')
      expect(screen.getByLabelText('Submission Type')).toHaveFocus()
    })

    it('should announce form validation errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<AssignmentBuilder {...defaultProps} />)
      
      await user.click(screen.getByText('Save Assignment'))
      
      const errorMessage = screen.getByText('Assignment title is required')
      expect(errorMessage).toHaveAttribute('role', 'alert')
    })
  })
})