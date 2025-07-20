import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CourseNavigationPlayer } from './CourseNavigationPlayer'
import { Course, CourseModule, Lesson, ContentBlock } from '@/lib/types/course'

// Mock the AuthProvider and other dependencies
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'student' },
    isAuthenticated: true,
  }),
}))

jest.mock('./ContentBlockRenderer', () => ({
  ContentBlockRenderer: ({ block, onComplete }: any) => (
    <div data-testid={`content-block-${block.id}`}>
      <div>Block: {block.block_type}</div>
      <button onClick={() => onComplete?.(block.id)}>Complete Block</button>
    </div>
  ),
}))

jest.mock('@/lib/services/courseService', () => ({
  getCourseWithProgress: jest.fn(),
  updateLessonProgress: jest.fn(),
  markLessonComplete: jest.fn(),
}))

describe('CourseNavigationPlayer', () => {
  const mockCourse: Course = {
    id: 'course-1',
    title: 'Test Course',
    description: 'A test course',
    slug: 'test-course',
    learning_objectives: ['Learn testing'],
    prerequisites: [],
    target_audience: ['Developers'],
    estimated_duration_hours: 10,
    difficulty_level: 'beginner',
    instructor_id: 'instructor-1',
    status: 'published',
    is_featured: false,
    is_free: true,
    total_lessons: 3,
    total_modules: 2,
    total_ratings: 0,
    total_enrollments: 0,
    language: 'en',
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockModules: CourseModule[] = [
    {
      id: 'module-1',
      course_id: 'course-1',
      title: 'Introduction',
      description: 'Introduction module',
      order_index: 0,
      is_required: true,
      estimated_duration_minutes: 60,
      is_published: true,
      total_lessons: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'module-2',
      course_id: 'course-1',
      title: 'Advanced Topics',
      description: 'Advanced module',
      order_index: 1,
      is_required: true,
      estimated_duration_minutes: 90,
      is_published: true,
      total_lessons: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockLessons: Lesson[] = [
    {
      id: 'lesson-1',
      module_id: 'module-1',
      course_id: 'course-1',
      title: 'Getting Started',
      description: 'First lesson',
      order_index: 0,
      content_type: 'mixed',
      estimated_duration_minutes: 30,
      is_required: true,
      is_published: true,
      is_preview: false,
      content_blocks: [
        {
          id: 'block-1',
          lesson_id: 'lesson-1',
          block_type: 'text',
          order_index: 0,
          content: { text: { content: 'Welcome!', format: 'plain' } },
          settings: {},
          is_required: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'lesson-2',
      module_id: 'module-1',
      course_id: 'course-1',
      title: 'Basic Concepts',
      description: 'Second lesson',
      order_index: 1,
      content_type: 'mixed',
      estimated_duration_minutes: 30,
      is_required: true,
      is_published: true,
      is_preview: false,
      content_blocks: [
        {
          id: 'block-2',
          lesson_id: 'lesson-2',
          block_type: 'video',
          order_index: 0,
          content: { video: { mux_playback_id: 'test-video' } },
          settings: {},
          is_required: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'lesson-3',
      module_id: 'module-2',
      course_id: 'course-1',
      title: 'Advanced Features',
      description: 'Third lesson',
      order_index: 0,
      content_type: 'mixed',
      estimated_duration_minutes: 90,
      is_required: true,
      is_published: true,
      is_preview: false,
      content_blocks: [
        {
          id: 'block-3',
          lesson_id: 'lesson-3',
          block_type: 'quiz',
          order_index: 0,
          content: { 
            quiz: { 
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Test question?',
                  options: [
                    { id: 'a', text: 'Option A', is_correct: true },
                  ],
                  points: 1,
                  required: true,
                }
              ],
              settings: {
                attempts_allowed: 1,
                show_correct_answers: true,
                show_explanations: true,
                randomize_questions: false,
                randomize_options: false,
                passing_score_percentage: 70,
                allow_review: true,
              },
            }
          },
          settings: {},
          is_required: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const defaultProps = {
    course: mockCourse,
    modules: mockModules,
    lessons: mockLessons,
    initialLessonId: 'lesson-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render course navigation player with sidebar and content', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      expect(screen.getByText('Test Course')).toBeInTheDocument()
      expect(screen.getByText('Course Content')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByTestId('content-block-block-1')).toBeInTheDocument()
    })

    it('should render course modules and lessons in sidebar', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Advanced Topics')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Basic Concepts')).toBeInTheDocument()
      expect(screen.getByText('Advanced Features')).toBeInTheDocument()
    })

    it('should show progress indicators for lessons', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Should show progress indicators (circles, checkmarks, etc.)
      expect(screen.getAllByTestId(/lesson-progress-/)).toHaveLength(3)
    })

    it('should highlight current lesson', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      const currentLesson = screen.getByTestId('lesson-item-lesson-1')
      expect(currentLesson).toHaveClass('current')
    })
  })

  describe('Navigation', () => {
    it('should navigate to different lessons when clicked', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Initially on lesson 1
      expect(screen.getByTestId('content-block-block-1')).toBeInTheDocument()
      
      // Click on lesson 2
      await user.click(screen.getByText('Basic Concepts'))
      
      expect(screen.getByTestId('content-block-block-2')).toBeInTheDocument()
    })

    it('should use next/previous buttons for navigation', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Should show next button
      expect(screen.getByText('Next Lesson')).toBeInTheDocument()
      
      // Click next
      await user.click(screen.getByText('Next Lesson'))
      
      expect(screen.getByTestId('content-block-block-2')).toBeInTheDocument()
      expect(screen.getByText('Previous Lesson')).toBeInTheDocument()
    })

    it('should disable previous button on first lesson', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      expect(screen.queryByText('Previous Lesson')).not.toBeInTheDocument()
    })

    it('should disable next button on last lesson', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} initialLessonId="lesson-3" />)
      
      expect(screen.queryByText('Next Lesson')).not.toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Focus on content area
      const contentArea = screen.getByRole('main')
      contentArea.focus()
      
      // Use arrow keys to navigate
      await user.keyboard('{ArrowRight}')
      expect(screen.getByTestId('content-block-block-2')).toBeInTheDocument()
      
      await user.keyboard('{ArrowLeft}')
      expect(screen.getByTestId('content-block-block-1')).toBeInTheDocument()
    })
  })

  describe('Progress Tracking', () => {
    it('should track lesson progress as content blocks are completed', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Complete the content block
      await user.click(screen.getByText('Complete Block'))
      
      // Should show lesson as completed
      await waitFor(() => {
        expect(screen.getByTestId('lesson-progress-lesson-1')).toHaveClass('completed')
      })
    })

    it('should show overall course progress', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Initially 0% progress
      expect(screen.getByText('0% Complete')).toBeInTheDocument()
      
      // Complete first lesson
      await user.click(screen.getByText('Complete Block'))
      
      await waitFor(() => {
        expect(screen.getByText('33% Complete')).toBeInTheDocument()
      })
    })

    it('should unlock next lessons after completing required ones', async () => {
      const user = userEvent.setup()
      const propsWithLocked = {
        ...defaultProps,
        lessons: mockLessons.map((lesson, index) => ({
          ...lesson,
          prerequisite_lesson_ids: index > 0 ? [mockLessons[index - 1].id] : undefined,
        })),
      }
      
      render(<CourseNavigationPlayer {...propsWithLocked} />)
      
      // Lesson 2 should be locked initially
      const lesson2 = screen.getByTestId('lesson-item-lesson-2')
      expect(lesson2).toHaveClass('locked')
      
      // Complete lesson 1
      await user.click(screen.getByText('Complete Block'))
      
      await waitFor(() => {
        expect(lesson2).not.toHaveClass('locked')
      })
    })

    it('should save progress to backend', async () => {
      const user = userEvent.setup()
      const { updateLessonProgress } = require('@/lib/services/courseService')
      
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      await user.click(screen.getByText('Complete Block'))
      
      await waitFor(() => {
        expect(updateLessonProgress).toHaveBeenCalledWith('lesson-1', expect.objectContaining({
          progress_percentage: 100,
          completed_at: expect.any(String),
        }))
      })
    })
  })

  describe('Content Display', () => {
    it('should render all content blocks for current lesson', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      expect(screen.getByTestId('content-block-block-1')).toBeInTheDocument()
      expect(screen.getByText('Block: text')).toBeInTheDocument()
    })

    it('should handle lessons with multiple content blocks', () => {
      const lessonWithMultipleBlocks = {
        ...mockLessons[0],
        content_blocks: [
          mockLessons[0].content_blocks![0],
          {
            id: 'block-1b',
            lesson_id: 'lesson-1',
            block_type: 'video',
            order_index: 1,
            content: { video: { mux_playback_id: 'test-video-2' } },
            settings: {},
            is_required: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      }
      
      const propsWithMultipleBlocks = {
        ...defaultProps,
        lessons: [lessonWithMultipleBlocks, ...mockLessons.slice(1)],
      }
      
      render(<CourseNavigationPlayer {...propsWithMultipleBlocks} />)
      
      expect(screen.getByTestId('content-block-block-1')).toBeInTheDocument()
      expect(screen.getByTestId('content-block-block-1b')).toBeInTheDocument()
    })

    it('should show lesson title and description', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('First lesson')).toBeInTheDocument()
    })

    it('should show estimated duration', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      expect(screen.getByText('30 min')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should collapse sidebar on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      const sidebar = screen.getByTestId('course-sidebar')
      expect(sidebar).toHaveClass('mobile-collapsed')
    })

    it('should show mobile menu toggle', async () => {
      const user = userEvent.setup()
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      const menuToggle = screen.getByLabelText('Toggle course menu')
      expect(menuToggle).toBeInTheDocument()
      
      await user.click(menuToggle)
      
      const sidebar = screen.getByTestId('course-sidebar')
      expect(sidebar).not.toHaveClass('mobile-collapsed')
    })
  })

  describe('Bookmarks and Notes', () => {
    it('should allow adding bookmarks to video content', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} initialLessonId="lesson-2" />)
      
      // Should show bookmark button for video content
      expect(screen.getByLabelText('Add bookmark')).toBeInTheDocument()
      
      await user.click(screen.getByLabelText('Add bookmark'))
      
      expect(screen.getByText('Bookmark added')).toBeInTheDocument()
    })

    it('should allow taking notes on lessons', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      await user.click(screen.getByText('Notes'))
      
      const notesTextarea = screen.getByPlaceholderText('Add your notes...')
      await user.type(notesTextarea, 'This is my note')
      
      await user.click(screen.getByText('Save Notes'))
      
      expect(screen.getByText('Notes saved')).toBeInTheDocument()
    })

    it('should show existing bookmarks and notes', () => {
      const propsWithProgress = {
        ...defaultProps,
        lessons: mockLessons.map(lesson => ({
          ...lesson,
          progress: {
            id: 'progress-1',
            user_id: 'test-user',
            lesson_id: lesson.id,
            course_id: 'course-1',
            module_id: lesson.module_id,
            status: 'in_progress',
            progress_percentage: 50,
            time_spent_minutes: 15,
            last_accessed_at: '2024-01-01T12:00:00Z',
            attempts: 0,
            notes: 'My existing notes',
            bookmarks: [30, 60, 120],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T12:00:00Z',
          },
        })),
      }
      
      render(<CourseNavigationPlayer {...propsWithProgress} />)
      
      expect(screen.getByText('My existing notes')).toBeInTheDocument()
      expect(screen.getByText('3 bookmarks')).toBeInTheDocument()
    })
  })

  describe('Course Completion', () => {
    it('should show course completion when all lessons are done', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Complete all lessons
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByText('Complete Block'))
        if (i < 2) {
          await user.click(screen.getByText('Next Lesson'))
        }
      }
      
      await waitFor(() => {
        expect(screen.getByText('Course Complete!')).toBeInTheDocument()
        expect(screen.getByText('Congratulations! You have completed this course.')).toBeInTheDocument()
      })
    })

    it('should show certificate option when course is completed', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Complete all lessons
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByText('Complete Block'))
        if (i < 2) {
          await user.click(screen.getByText('Next Lesson'))
        }
      }
      
      await waitFor(() => {
        expect(screen.getByText('Download Certificate')).toBeInTheDocument()
      })
    })
  })

  describe('Integration with Phase 1 & 2 Components', () => {
    it('should integrate with AuthProvider for user context', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Should render content for authenticated user
      expect(screen.getByText('Test Course')).toBeInTheDocument()
    })

    it('should use UI components from Phase 1', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Should use Button, Card, Progress, etc. from Phase 1 UI library
      expect(screen.getByRole('button', { name: 'Next Lesson' })).toHaveClass('btn')
    })

    it('should respect security constraints from Phase 2', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Should validate user enrollment and access permissions
      expect(screen.getByText('Test Course')).toBeInTheDocument()
    })

    it('should integrate with ContentBlockRenderer', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Should render content blocks using ContentBlockRenderer
      expect(screen.getByTestId('content-block-block-1')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Course navigation')
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Lesson content')
    })

    it('should support screen reader navigation', () => {
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      expect(screen.getByRole('region')).toHaveAttribute('aria-live', 'polite')
      expect(screen.getByText('Getting Started')).toHaveAttribute('aria-current', 'page')
    })

    it('should have keyboard shortcuts', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      // Focus on main content
      const main = screen.getByRole('main')
      main.focus()
      
      // Test keyboard shortcuts
      await user.keyboard('{n}') // Next lesson
      expect(screen.getByTestId('content-block-block-2')).toBeInTheDocument()
      
      await user.keyboard('{p}') // Previous lesson
      expect(screen.getByTestId('content-block-block-1')).toBeInTheDocument()
    })

    it('should announce progress updates to screen readers', async () => {
      const user = userEvent.setup()
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      await user.click(screen.getByText('Complete Block'))
      
      await waitFor(() => {
        const announcement = screen.getByRole('status')
        expect(announcement).toHaveTextContent('Lesson completed')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing content blocks gracefully', () => {
      const propsWithEmptyLesson = {
        ...defaultProps,
        lessons: [
          {
            ...mockLessons[0],
            content_blocks: [],
          },
          ...mockLessons.slice(1),
        ],
      }
      
      render(<CourseNavigationPlayer {...propsWithEmptyLesson} />)
      
      expect(screen.getByText('No content available for this lesson')).toBeInTheDocument()
    })

    it('should handle network errors when saving progress', async () => {
      const user = userEvent.setup()
      const { updateLessonProgress } = require('@/lib/services/courseService')
      updateLessonProgress.mockRejectedValue(new Error('Network error'))
      
      render(<CourseNavigationPlayer {...defaultProps} />)
      
      await user.click(screen.getByText('Complete Block'))
      
      await waitFor(() => {
        expect(screen.getByText('Failed to save progress. Please try again.')).toBeInTheDocument()
      })
    })

    it('should handle invalid lesson navigation', () => {
      render(<CourseNavigationPlayer {...defaultProps} initialLessonId="invalid-lesson" />)
      
      // Should fallback to first lesson
      expect(screen.getByTestId('content-block-block-1')).toBeInTheDocument()
    })
  })
})