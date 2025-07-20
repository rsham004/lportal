import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CourseNavigationPlayer } from './CourseNavigationPlayer'
import { QuizBuilder } from './QuizBuilder'
import { AssignmentBuilder } from './AssignmentBuilder'
import { ContentBlockRenderer } from './ContentBlockRenderer'
import { Course, CourseModule, Lesson, ContentBlock } from '@/lib/types/course'

// Mock all external dependencies
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'instructor' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/components/video/MuxVideoPlayer', () => ({
  MuxVideoPlayer: ({ onProgress, onComplete }: any) => (
    <div data-testid="mux-video-player">
      <button onClick={() => onProgress?.(50)}>Progress 50%</button>
      <button onClick={() => onComplete?.()}>Complete Video</button>
    </div>
  ),
}))

jest.mock('@/lib/services/courseService', () => ({
  createQuizQuestion: jest.fn().mockResolvedValue({ id: 'new-question' }),
  updateQuizQuestion: jest.fn().mockResolvedValue({}),
  deleteQuizQuestion: jest.fn().mockResolvedValue({}),
  createAssignment: jest.fn().mockResolvedValue({ id: 'new-assignment' }),
  updateAssignment: jest.fn().mockResolvedValue({}),
  submitAssignment: jest.fn().mockResolvedValue({}),
  gradeAssignment: jest.fn().mockResolvedValue({}),
  updateContentBlockProgress: jest.fn().mockResolvedValue({}),
  updateLessonProgress: jest.fn().mockResolvedValue({}),
  markLessonComplete: jest.fn().mockResolvedValue({}),
  submitQuizAttempt: jest.fn().mockResolvedValue({}),
}))

jest.mock('@/lib/services/fileUploadService', () => ({
  uploadFile: jest.fn().mockResolvedValue({ url: 'https://example.com/file.pdf' }),
}))

describe('Phase 3 Integration Tests', () => {
  const mockCourse: Course = {
    id: 'course-1',
    title: 'Complete Learning Course',
    description: 'A comprehensive course with all content types',
    slug: 'complete-course',
    learning_objectives: ['Master all content types', 'Complete assessments'],
    prerequisites: [],
    target_audience: ['Students', 'Professionals'],
    estimated_duration_hours: 20,
    difficulty_level: 'intermediate',
    instructor_id: 'instructor-1',
    status: 'published',
    is_featured: true,
    is_free: false,
    price: 99.99,
    currency: 'USD',
    total_lessons: 4,
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
      title: 'Content Fundamentals',
      description: 'Learn about different content types',
      order_index: 0,
      is_required: true,
      estimated_duration_minutes: 120,
      is_published: true,
      total_lessons: 3,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'module-2',
      course_id: 'course-1',
      title: 'Assessments',
      description: 'Quizzes and assignments',
      order_index: 1,
      is_required: true,
      estimated_duration_minutes: 180,
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
      title: 'Text and Media Content',
      description: 'Learn about text, images, and videos',
      order_index: 0,
      content_type: 'mixed',
      estimated_duration_minutes: 45,
      is_required: true,
      is_published: true,
      is_preview: false,
      content_blocks: [
        {
          id: 'block-text-1',
          lesson_id: 'lesson-1',
          block_type: 'text',
          order_index: 0,
          content: {
            text: {
              content: '# Welcome to the Course\n\nThis is **markdown** content.',
              format: 'markdown'
            }
          },
          settings: {},
          is_required: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'block-video-1',
          lesson_id: 'lesson-1',
          block_type: 'video',
          order_index: 1,
          content: {
            video: {
              mux_playback_id: 'test-video-1',
              duration_seconds: 300,
              thumbnail_url: 'https://example.com/thumb.jpg',
              auto_play: false,
              controls: true,
            }
          },
          settings: {},
          is_required: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'block-image-1',
          lesson_id: 'lesson-1',
          block_type: 'image',
          order_index: 2,
          content: {
            image: {
              url: 'https://example.com/diagram.png',
              alt_text: 'Course diagram',
              caption: 'Overview of course structure',
              width: 800,
              height: 600,
            }
          },
          settings: {},
          is_required: false,
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
      title: 'Interactive Content',
      description: 'Code examples and downloads',
      order_index: 1,
      content_type: 'mixed',
      estimated_duration_minutes: 30,
      is_required: true,
      is_published: true,
      is_preview: false,
      content_blocks: [
        {
          id: 'block-code-1',
          lesson_id: 'lesson-2',
          block_type: 'code',
          order_index: 0,
          content: {
            code: {
              content: 'function hello() {\n  console.log("Hello, World!");\n}',
              language: 'javascript',
              theme: 'dark',
              line_numbers: true,
              editable: true,
              run_button: true,
            }
          },
          settings: {},
          is_required: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'block-download-1',
          lesson_id: 'lesson-2',
          block_type: 'download',
          order_index: 1,
          content: {
            download: {
              file_url: 'https://example.com/resources.zip',
              file_name: 'Course Resources.zip',
              file_size_bytes: 2048000,
              file_type: 'application/zip',
              description: 'Additional course materials and examples',
            }
          },
          settings: {},
          is_required: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'lesson-3',
      module_id: 'module-1',
      course_id: 'course-1',
      title: 'Special Content Types',
      description: 'Callouts, embeds, and audio',
      order_index: 2,
      content_type: 'mixed',
      estimated_duration_minutes: 45,
      is_required: true,
      is_published: true,
      is_preview: false,
      content_blocks: [
        {
          id: 'block-callout-1',
          lesson_id: 'lesson-3',
          block_type: 'callout',
          order_index: 0,
          content: {
            callout: {
              type: 'tip',
              title: 'Pro Tip',
              content: 'This is an important tip for success in this course.',
            }
          },
          settings: {},
          is_required: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'block-audio-1',
          lesson_id: 'lesson-3',
          block_type: 'audio',
          order_index: 1,
          content: {
            audio: {
              url: 'https://example.com/lecture.mp3',
              duration_seconds: 600,
              transcript: 'This is the audio transcript for accessibility.',
              auto_play: false,
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
    {
      id: 'lesson-4',
      module_id: 'module-2',
      course_id: 'course-1',
      title: 'Final Assessment',
      description: 'Quiz and assignment to test your knowledge',
      order_index: 0,
      content_type: 'mixed',
      estimated_duration_minutes: 180,
      is_required: true,
      is_published: true,
      is_preview: false,
      content_blocks: [
        {
          id: 'block-quiz-1',
          lesson_id: 'lesson-4',
          block_type: 'quiz',
          order_index: 0,
          content: {
            quiz: {
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'What is the primary purpose of this course?',
                  options: [
                    { id: 'a', text: 'Learn content types', is_correct: true },
                    { id: 'b', text: 'Learn programming', is_correct: false },
                    { id: 'c', text: 'Learn design', is_correct: false },
                  ],
                  points: 2,
                  required: true,
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'This course includes video content.',
                  options: [
                    { id: 'true', text: 'True', is_correct: true },
                    { id: 'false', text: 'False', is_correct: false },
                  ],
                  points: 1,
                  required: true,
                },
              ],
              settings: {
                time_limit_minutes: 30,
                attempts_allowed: 2,
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
        {
          id: 'block-assignment-1',
          lesson_id: 'lesson-4',
          block_type: 'assignment',
          order_index: 1,
          content: {
            assignment: {
              instructions: 'Write a reflection essay about what you learned in this course. Minimum 500 words.',
              submission_type: 'text',
              max_points: 50,
              due_date: '2024-12-31T23:59:59Z',
              rubric: [
                {
                  criteria: 'Content Quality',
                  description: 'Depth and accuracy of reflection',
                  points: 25,
                  levels: [
                    { name: 'Excellent', description: 'Comprehensive and insightful', points: 25 },
                    { name: 'Good', description: 'Good understanding shown', points: 20 },
                    { name: 'Fair', description: 'Basic understanding', points: 15 },
                    { name: 'Poor', description: 'Limited understanding', points: 10 },
                  ],
                },
                {
                  criteria: 'Writing Quality',
                  description: 'Grammar, structure, and clarity',
                  points: 25,
                  levels: [
                    { name: 'Excellent', description: 'Clear and well-structured', points: 25 },
                    { name: 'Good', description: 'Generally clear', points: 20 },
                    { name: 'Fair', description: 'Some clarity issues', points: 15 },
                    { name: 'Poor', description: 'Difficult to understand', points: 10 },
                  ],
                },
              ],
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Full Course Learning Experience', () => {
    it('should provide complete learning journey from start to finish', async () => {
      const user = userEvent.setup()
      
      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={mockLessons}
          initialLessonId="lesson-1"
        />
      )

      // Verify course structure is displayed
      expect(screen.getByText('Complete Learning Course')).toBeInTheDocument()
      expect(screen.getByText('Content Fundamentals')).toBeInTheDocument()
      expect(screen.getByText('Assessments')).toBeInTheDocument()
      expect(screen.getByText('0% Complete')).toBeInTheDocument()

      // Start with first lesson
      expect(screen.getByText('Text and Media Content')).toBeInTheDocument()
      expect(screen.getByText('Welcome to the Course')).toBeInTheDocument()
      expect(screen.getByTestId('mux-video-player')).toBeInTheDocument()

      // Progress through content blocks
      await user.click(screen.getByText('Progress 50%'))
      await user.click(screen.getByText('Complete Video'))

      // Navigate to next lesson
      await user.click(screen.getByText('Next Lesson'))
      expect(screen.getByText('Interactive Content')).toBeInTheDocument()
      expect(screen.getByText('function hello() {')).toBeInTheDocument()

      // Continue to special content types
      await user.click(screen.getByText('Next Lesson'))
      expect(screen.getByText('Special Content Types')).toBeInTheDocument()
      expect(screen.getByText('Pro Tip')).toBeInTheDocument()

      // Reach final assessment
      await user.click(screen.getByText('Next Lesson'))
      expect(screen.getByText('Final Assessment')).toBeInTheDocument()
      expect(screen.getByText('What is the primary purpose of this course?')).toBeInTheDocument()
    })

    it('should handle quiz completion and assignment submission', async () => {
      const user = userEvent.setup()
      
      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={mockLessons}
          initialLessonId="lesson-4"
        />
      )

      // Take the quiz
      await user.click(screen.getByLabelText('Learn content types'))
      await user.click(screen.getByLabelText('True'))
      await user.click(screen.getByText('Submit Quiz'))

      // Verify quiz results
      await waitFor(() => {
        expect(screen.getByText('Quiz Results')).toBeInTheDocument()
        expect(screen.getByText('Score: 3/3 (100%)')).toBeInTheDocument()
      })

      // Submit assignment
      const assignmentTextarea = screen.getByPlaceholderText('Enter your submission...')
      await user.type(assignmentTextarea, 'This course taught me about various content types including text, video, images, code examples, and interactive elements. The mixed content approach provides a comprehensive learning experience.')

      await user.click(screen.getByText('Submit Assignment'))

      await waitFor(() => {
        expect(screen.getByText('Assignment submitted successfully!')).toBeInTheDocument()
      })
    })

    it('should track progress across all content types', async () => {
      const user = userEvent.setup()
      
      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={mockLessons}
          initialLessonId="lesson-1"
        />
      )

      // Complete text content (auto-completes after viewing)
      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Complete video content
      await user.click(screen.getByText('Complete Video'))

      // Navigate through all lessons and complete content
      for (let i = 2; i <= 4; i++) {
        await user.click(screen.getByText('Next Lesson'))
        
        if (i === 4) {
          // Complete quiz and assignment in final lesson
          await user.click(screen.getByLabelText('Learn content types'))
          await user.click(screen.getByLabelText('True'))
          await user.click(screen.getByText('Submit Quiz'))
          
          await waitFor(() => {
            expect(screen.getByText('Quiz Results')).toBeInTheDocument()
          })
        }
      }

      // Verify progress tracking
      expect(screen.getByText(/% Complete/)).toBeInTheDocument()
    })
  })

  describe('Content Creation Workflow', () => {
    it('should allow instructors to create comprehensive courses', async () => {
      const user = userEvent.setup()
      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      // Test Quiz Builder
      render(
        <QuizBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="lesson-test"
        />
      )

      // Create a comprehensive quiz
      await user.type(screen.getByPlaceholderText('Enter quiz title'), 'Comprehensive Assessment')
      await user.type(screen.getByPlaceholderText('Enter quiz description'), 'Test all learning objectives')

      // Add multiple choice question
      await user.click(screen.getByText('Add Question'))
      await user.type(screen.getByPlaceholderText('Enter your question'), 'What did you learn?')
      await user.click(screen.getAllByRole('radio')[0]) // Select first option as correct
      await user.click(screen.getByText('Save Question'))

      // Add true/false question
      await user.click(screen.getByText('Add Question'))
      await user.click(screen.getByText('True/False'))
      await user.type(screen.getByPlaceholderText('Enter your question'), 'This course was helpful.')
      await user.click(screen.getByDisplayValue('true'))
      await user.click(screen.getByText('Save Question'))

      // Save quiz
      await user.click(screen.getByText('Save Quiz'))

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Comprehensive Assessment',
          questions: expect.arrayContaining([
            expect.objectContaining({
              question: 'What did you learn?',
              type: 'multiple_choice',
            }),
            expect.objectContaining({
              question: 'This course was helpful.',
              type: 'true_false',
            }),
          ]),
        })
      )
    })

    it('should allow instructors to create detailed assignments', async () => {
      const user = userEvent.setup()
      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      render(
        <AssignmentBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="lesson-test"
        />
      )

      // Create comprehensive assignment
      await user.type(screen.getByPlaceholderText('Enter assignment title'), 'Final Project')
      await user.type(screen.getByPlaceholderText('Enter assignment instructions'), 'Create a comprehensive project demonstrating all course concepts.')

      // Set submission type to file upload
      await user.click(screen.getByLabelText('Submission Type'))
      await user.click(screen.getByText('File Upload'))

      // Configure file settings
      await user.clear(screen.getByLabelText('Maximum file size (MB)'))
      await user.type(screen.getByLabelText('Maximum file size (MB)'), '25')

      // Add grading rubric
      await user.click(screen.getByText('Add Criteria'))
      await user.type(screen.getByPlaceholderText('Enter criteria name'), 'Technical Implementation')
      await user.type(screen.getByPlaceholderText('Describe this criteria'), 'Quality of technical execution')
      await user.clear(screen.getByLabelText('Points for this criteria'))
      await user.type(screen.getByLabelText('Points for this criteria'), '40')

      // Save assignment
      await user.click(screen.getByText('Save Assignment'))

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Final Project',
          submissionType: 'file',
          fileSettings: expect.objectContaining({
            maxFileSize: 25,
          }),
          rubric: expect.arrayContaining([
            expect.objectContaining({
              criteria: 'Technical Implementation',
              points: 40,
            }),
          ]),
        })
      )
    })
  })

  describe('Cross-Component Integration', () => {
    it('should integrate Phase 1 UI components seamlessly', async () => {
      const user = userEvent.setup()
      
      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={mockLessons}
          initialLessonId="lesson-1"
        />
      )

      // Verify Phase 1 UI components are used
      expect(screen.getByRole('button', { name: 'Next Lesson' })).toHaveClass('btn')
      expect(screen.getByText('0% Complete')).toBeInTheDocument()

      // Test interactive elements
      await user.click(screen.getByText('Notes'))
      expect(screen.getByPlaceholderText('Add your notes...')).toBeInTheDocument()
      
      await user.type(screen.getByPlaceholderText('Add your notes...'), 'This is my note')
      await user.click(screen.getByText('Save Notes'))
    })

    it('should respect Phase 2 security constraints', async () => {
      const user = userEvent.setup()
      
      // Test with malicious content
      const maliciousLesson = {
        ...mockLessons[0],
        content_blocks: [
          {
            id: 'block-malicious',
            lesson_id: 'lesson-1',
            block_type: 'text',
            order_index: 0,
            content: {
              text: {
                content: '<script>alert("XSS")</script>Safe content here',
                format: 'html'
              }
            },
            settings: {},
            is_required: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      }

      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={[maliciousLesson, ...mockLessons.slice(1)]}
          initialLessonId="lesson-1"
        />
      )

      // Should display safe content but not execute script
      expect(screen.getByText('Safe content here')).toBeInTheDocument()
      expect(screen.queryByText('alert("XSS")')).not.toBeInTheDocument()
    })

    it('should handle authentication and authorization properly', () => {
      // Test with different user roles
      const { useAuth } = require('@/components/auth/AuthProvider')
      
      // Test student access
      useAuth.mockReturnValue({
        user: { id: 'student-1', role: 'student' },
        isAuthenticated: true,
      })

      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={mockLessons}
          initialLessonId="lesson-1"
        />
      )

      // Students should see course content
      expect(screen.getByText('Complete Learning Course')).toBeInTheDocument()
      expect(screen.getByText('Text and Media Content')).toBeInTheDocument()

      // Test instructor access to builders
      useAuth.mockReturnValue({
        user: { id: 'instructor-1', role: 'instructor' },
        isAuthenticated: true,
      })

      const mockOnSave = jest.fn()
      const mockOnCancel = jest.fn()

      render(
        <QuizBuilder
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          lessonId="lesson-test"
        />
      )

      // Instructors should see quiz builder
      expect(screen.getByText('Quiz Builder')).toBeInTheDocument()
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should provide comprehensive accessibility features', async () => {
      const user = userEvent.setup()
      
      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={mockLessons}
          initialLessonId="lesson-1"
        />
      )

      // Test ARIA labels and roles
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Course navigation')
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Lesson content')

      // Test keyboard navigation
      const main = screen.getByRole('main')
      main.focus()

      await user.keyboard('{ArrowRight}')
      expect(screen.getByText('Interactive Content')).toBeInTheDocument()

      await user.keyboard('{ArrowLeft}')
      expect(screen.getByText('Text and Media Content')).toBeInTheDocument()

      // Test screen reader announcements
      expect(screen.getByRole('region')).toHaveAttribute('aria-live', 'polite')
    })

    it('should provide responsive design across devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={mockLessons}
          initialLessonId="lesson-1"
        />
      )

      // Should show mobile-optimized layout
      const sidebar = screen.getByTestId('course-sidebar')
      expect(sidebar).toHaveClass('mobile-collapsed')
      expect(screen.getByLabelText('Toggle course menu')).toBeInTheDocument()
    })

    it('should handle error states gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock service failure
      const { updateLessonProgress } = require('@/lib/services/courseService')
      updateLessonProgress.mockRejectedValue(new Error('Network error'))

      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={mockLessons}
          initialLessonId="lesson-1"
        />
      )

      // Trigger progress update that will fail
      await user.click(screen.getByText('Complete Video'))

      await waitFor(() => {
        expect(screen.getByText('Failed to save progress. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large courses efficiently', () => {
      // Create a large course with many lessons
      const largeCourse = {
        ...mockCourse,
        total_lessons: 100,
      }

      const largeLessons = Array.from({ length: 100 }, (_, i) => ({
        ...mockLessons[0],
        id: `lesson-${i + 1}`,
        title: `Lesson ${i + 1}`,
        order_index: i,
      }))

      render(
        <CourseNavigationPlayer
          course={largeCourse}
          modules={mockModules}
          lessons={largeLessons}
          initialLessonId="lesson-1"
        />
      )

      // Should render without performance issues
      expect(screen.getByText('Complete Learning Course')).toBeInTheDocument()
      expect(screen.getByText('Lesson 1')).toBeInTheDocument()
    })

    it('should optimize content loading', () => {
      // Test lazy loading and content optimization
      render(
        <CourseNavigationPlayer
          course={mockCourse}
          modules={mockModules}
          lessons={mockLessons}
          initialLessonId="lesson-1"
        />
      )

      // Only current lesson content should be rendered
      expect(screen.getByText('Welcome to the Course')).toBeInTheDocument()
      expect(screen.queryByText('function hello() {')).not.toBeInTheDocument()
    })
  })
})