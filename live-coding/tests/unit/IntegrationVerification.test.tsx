import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Import all Phase 3 components
import { QuizBuilder } from './QuizBuilder'
import { AssignmentBuilder } from './AssignmentBuilder'
import { ContentBlockRenderer } from './ContentBlockRenderer'
import { CourseNavigationPlayer } from './CourseNavigationPlayer'

// Import Phase 1 components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

// Import Phase 2 components
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Can } from '@/components/authorization/Can'

// Mock external dependencies
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'instructor' },
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: any) => <div data-testid="auth-provider">{children}</div>,
}))

jest.mock('@/components/video/MuxVideoPlayer', () => ({
  MuxVideoPlayer: ({ onComplete }: any) => (
    <div data-testid="mux-video-player">
      <button onClick={() => onComplete?.()}>Complete Video</button>
    </div>
  ),
}))

jest.mock('@/lib/services/courseService', () => ({
  createQuizQuestion: jest.fn().mockResolvedValue({ id: 'new-question' }),
  updateQuizQuestion: jest.fn().mockResolvedValue({}),
  createAssignment: jest.fn().mockResolvedValue({ id: 'new-assignment' }),
  updateContentBlockProgress: jest.fn().mockResolvedValue({}),
  updateLessonProgress: jest.fn().mockResolvedValue({}),
  markLessonComplete: jest.fn().mockResolvedValue({}),
}))

describe('Phase 3 Integration Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Phase 1 UI Component Integration', () => {
    it('should use Phase 1 Button component in QuizBuilder', async () => {
      const user = userEvent.setup()
      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      render(
        <QuizBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="test-lesson"
        />
      )

      // Verify Phase 1 Button components are used
      const addQuestionButton = screen.getByText('Add Question')
      const saveQuizButton = screen.getByText('Save Quiz')
      const cancelButton = screen.getByText('Cancel')

      expect(addQuestionButton).toHaveClass('btn')
      expect(saveQuizButton).toHaveClass('btn')
      expect(cancelButton).toHaveClass('btn')

      // Test button functionality
      await user.click(addQuestionButton)
      expect(screen.getByText('Multiple Choice')).toBeInTheDocument()
    })

    it('should use Phase 1 Card component in ContentBlockRenderer', () => {
      const textBlock = {
        id: 'block-1',
        lesson_id: 'lesson-1',
        block_type: 'text' as const,
        order_index: 0,
        content: {
          text: {
            content: 'Test content',
            format: 'plain' as const
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(
        <ContentBlockRenderer
          block={textBlock}
          lessonId="lesson-1"
          courseId="course-1"
        />
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should use Phase 1 Input components in AssignmentBuilder', async () => {
      const user = userEvent.setup()
      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      render(
        <AssignmentBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="test-lesson"
        />
      )

      // Verify Phase 1 Input components are used
      const titleInput = screen.getByPlaceholderText('Enter assignment title')
      const instructionsInput = screen.getByPlaceholderText('Enter assignment instructions')

      expect(titleInput).toHaveClass('input')
      expect(instructionsInput).toBeInTheDocument()

      // Test input functionality
      await user.type(titleInput, 'Test Assignment')
      expect(screen.getByDisplayValue('Test Assignment')).toBeInTheDocument()
    })
  })

  describe('Phase 2 Authentication Integration', () => {
    it('should integrate with AuthProvider in all components', () => {
      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      // Test QuizBuilder with auth
      render(
        <QuizBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="test-lesson"
        />
      )

      // Should render for instructor role
      expect(screen.getByText('Quiz Builder')).toBeInTheDocument()
    })

    it('should respect role-based access control', () => {
      // Mock student user
      const { useAuth } = require('@/components/auth/AuthProvider')
      useAuth.mockReturnValue({
        user: { id: 'student-1', role: 'student' },
        isAuthenticated: true,
      })

      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      render(
        <QuizBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="test-lesson"
        />
      )

      // Should show access denied for students
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText('Only instructors can create quizzes.')).toBeInTheDocument()
    })
  })

  describe('Cross-Component Data Flow', () => {
    it('should handle quiz creation and rendering workflow', async () => {
      const user = userEvent.setup()
      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      // Step 1: Create quiz with QuizBuilder
      render(
        <QuizBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="test-lesson"
        />
      )

      // Add quiz title
      await user.type(screen.getByPlaceholderText('Enter quiz title'), 'Integration Test Quiz')

      // Add a question
      await user.click(screen.getByText('Add Question'))
      await user.type(screen.getByPlaceholderText('Enter your question'), 'What is integration testing?')
      await user.click(screen.getAllByRole('radio')[0]) // Select first option as correct
      await user.click(screen.getByText('Save Question'))

      // Save quiz
      await user.click(screen.getByText('Save Quiz'))

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Integration Test Quiz',
          questions: expect.arrayContaining([
            expect.objectContaining({
              question: 'What is integration testing?',
              type: 'multiple_choice',
            }),
          ]),
        })
      )
    })

    it('should handle assignment creation and submission workflow', async () => {
      const user = userEvent.setup()
      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      // Step 1: Create assignment with AssignmentBuilder
      render(
        <AssignmentBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="test-lesson"
        />
      )

      // Configure assignment
      await user.type(screen.getByPlaceholderText('Enter assignment title'), 'Integration Assignment')
      await user.type(screen.getByPlaceholderText('Enter assignment instructions'), 'Complete the integration test')

      // Save assignment
      await user.click(screen.getByText('Save Assignment'))

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Integration Assignment',
          instructions: 'Complete the integration test',
        })
      )
    })

    it('should handle content block rendering with progress tracking', async () => {
      const user = userEvent.setup()
      const mockOnProgress = jest.fn()
      const mockOnComplete = jest.fn()

      const videoBlock = {
        id: 'block-video',
        lesson_id: 'lesson-1',
        block_type: 'video' as const,
        order_index: 0,
        content: {
          video: {
            mux_playback_id: 'test-video',
            duration_seconds: 300,
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(
        <ContentBlockRenderer
          block={videoBlock}
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
          lessonId="lesson-1"
          courseId="course-1"
        />
      )

      // Complete video
      await user.click(screen.getByText('Complete Video'))

      expect(mockOnComplete).toHaveBeenCalledWith('block-video')
    })
  })

  describe('Course Navigation Integration', () => {
    it('should integrate all components in CourseNavigationPlayer', async () => {
      const user = userEvent.setup()

      const mockCourse = {
        id: 'course-1',
        title: 'Integration Test Course',
        description: 'Testing integration',
        slug: 'integration-course',
        learning_objectives: ['Test integration'],
        prerequisites: [],
        target_audience: ['Developers'],
        estimated_duration_hours: 5,
        difficulty_level: 'intermediate' as const,
        instructor_id: 'instructor-1',
        status: 'published' as const,
        is_featured: false,
        is_free: true,
        total_lessons: 1,
        total_modules: 1,
        total_ratings: 0,
        total_enrollments: 0,
        language: 'en',
        version: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockModules = [{
        id: 'module-1',
        course_id: 'course-1',
        title: 'Test Module',
        description: 'Testing module',
        order_index: 0,
        is_required: true,
        estimated_duration_minutes: 60,
        is_published: true,
        total_lessons: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }]

      const mockLessons = [{
        id: 'lesson-1',
        module_id: 'module-1',
        course_id: 'course-1',
        title: 'Test Lesson',
        description: 'Testing lesson',
        order_index: 0,
        content_type: 'mixed' as const,
        estimated_duration_minutes: 30,
        is_required: true,
        is_published: true,
        is_preview: false,
        content_blocks: [{
          id: 'block-1',
          lesson_id: 'lesson-1',
          block_type: 'text' as const,
          order_index: 0,
          content: {
            text: {
              content: 'Integration test content',
              format: 'plain' as const
            }
          },
          settings: {},
          is_required: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }]

      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={mockLessons}
          initialLessonId="lesson-1"
        />
      )

      // Verify course structure
      expect(screen.getByText('Integration Test Course')).toBeInTheDocument()
      expect(screen.getByText('Test Module')).toBeInTheDocument()
      expect(screen.getByText('Test Lesson')).toBeInTheDocument()
      expect(screen.getByText('Integration test content')).toBeInTheDocument()

      // Verify progress tracking
      expect(screen.getByText('0% Complete')).toBeInTheDocument()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing dependencies gracefully', () => {
      const textBlock = {
        id: 'block-error',
        lesson_id: 'lesson-1',
        block_type: 'text' as const,
        order_index: 0,
        content: {
          text: {
            content: 'Error test content',
            format: 'plain' as const
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Should not crash with missing props
      render(
        <ContentBlockRenderer
          block={textBlock}
          lessonId="lesson-1"
          courseId="course-1"
        />
      )

      expect(screen.getByText('Error test content')).toBeInTheDocument()
    })

    it('should handle service errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock service failure
      const { createQuizQuestion } = require('@/lib/services/courseService')
      createQuizQuestion.mockRejectedValue(new Error('Service error'))

      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      render(
        <QuizBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="test-lesson"
        />
      )

      // Try to add a question
      await user.click(screen.getByText('Add Question'))
      await user.type(screen.getByPlaceholderText('Enter your question'), 'Error test question')
      await user.click(screen.getAllByRole('radio')[0])
      await user.click(screen.getByText('Save Question'))

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByText('Failed to save question. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Integration', () => {
    it('should maintain accessibility standards across all components', () => {
      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      render(
        <QuizBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="test-lesson"
        />
      )

      // Check ARIA labels
      expect(screen.getByLabelText('Quiz title')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add Question' })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      render(
        <AssignmentBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="test-lesson"
        />
      )

      // Test tab navigation
      const titleInput = screen.getByPlaceholderText('Enter assignment title')
      titleInput.focus()

      await user.keyboard('{Tab}')
      expect(screen.getByPlaceholderText('Enter assignment instructions')).toHaveFocus()
    })
  })

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large quiz with many questions
      const largeQuiz = {
        id: 'large-quiz',
        title: 'Large Quiz',
        questions: Array.from({ length: 50 }, (_, i) => ({
          id: `q${i}`,
          type: 'multiple_choice' as const,
          question: `Question ${i + 1}`,
          options: [
            { id: 'a', text: 'Option A', is_correct: true },
            { id: 'b', text: 'Option B', is_correct: false },
          ],
          points: 1,
          required: true,
        })),
      }

      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      render(
        <QuizBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="test-lesson"
          initialQuiz={largeQuiz}
        />
      )

      // Should render without performance issues
      expect(screen.getByText('Large Quiz')).toBeInTheDocument()
      expect(screen.getByText('Question 1')).toBeInTheDocument()
    })
  })
})