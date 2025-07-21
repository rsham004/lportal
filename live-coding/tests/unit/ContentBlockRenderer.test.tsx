import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentBlockRenderer } from './ContentBlockRenderer'
import { ContentBlock, ContentBlockType } from '@/lib/types/course'

// Mock the AuthProvider and other dependencies
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'student' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/components/video/MuxVideoPlayer', () => ({
  MuxVideoPlayer: ({ playbackId, onProgress }: any) => (
    <div data-testid="mux-video-player">
      <div>Video Player: {playbackId}</div>
      <button onClick={() => onProgress?.(50)}>Simulate Progress</button>
    </div>
  ),
}))

jest.mock('@/lib/services/courseService', () => ({
  updateContentBlockProgress: jest.fn(),
  submitQuizAttempt: jest.fn(),
  submitAssignment: jest.fn(),
}))

describe('ContentBlockRenderer', () => {
  const mockOnProgress = jest.fn()
  const mockOnComplete = jest.fn()

  const defaultProps = {
    onProgress: mockOnProgress,
    onComplete: mockOnComplete,
    lessonId: 'test-lesson-id',
    courseId: 'test-course-id',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Text Content Block', () => {
    it('should render text content with markdown', () => {
      const textBlock: ContentBlock = {
        id: 'block-1',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: '# Hello World\n\nThis is **bold** text.',
            format: 'markdown'
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={textBlock} {...defaultProps} />)
      
      expect(screen.getByText('Hello World')).toBeInTheDocument()
      expect(screen.getByText('bold')).toBeInTheDocument()
    })

    it('should render text content with HTML', () => {
      const textBlock: ContentBlock = {
        id: 'block-1',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: '<h1>Hello World</h1><p>This is <strong>bold</strong> text.</p>',
            format: 'html'
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={textBlock} {...defaultProps} />)
      
      expect(screen.getByText('Hello World')).toBeInTheDocument()
      expect(screen.getByText('bold')).toBeInTheDocument()
    })

    it('should render plain text content', () => {
      const textBlock: ContentBlock = {
        id: 'block-1',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: 'This is plain text content.',
            format: 'plain'
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={textBlock} {...defaultProps} />)
      
      expect(screen.getByText('This is plain text content.')).toBeInTheDocument()
    })

    it('should mark text block as complete when viewed', async () => {
      const textBlock: ContentBlock = {
        id: 'block-1',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: 'Short text content.',
            format: 'plain'
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={textBlock} {...defaultProps} />)
      
      // Text blocks should auto-complete after a short delay
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith('block-1')
      }, { timeout: 3000 })
    })
  })

  describe('Video Content Block', () => {
    it('should render video player with Mux integration', () => {
      const videoBlock: ContentBlock = {
        id: 'block-2',
        lesson_id: 'lesson-1',
        block_type: 'video',
        order_index: 1,
        content: {
          video: {
            mux_playback_id: 'test-playback-id',
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
      }

      render(<ContentBlockRenderer block={videoBlock} {...defaultProps} />)
      
      expect(screen.getByTestId('mux-video-player')).toBeInTheDocument()
      expect(screen.getByText('Video Player: test-playback-id')).toBeInTheDocument()
    })

    it('should track video progress', async () => {
      const user = userEvent.setup()
      const videoBlock: ContentBlock = {
        id: 'block-2',
        lesson_id: 'lesson-1',
        block_type: 'video',
        order_index: 1,
        content: {
          video: {
            mux_playback_id: 'test-playback-id',
            duration_seconds: 300,
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={videoBlock} {...defaultProps} />)
      
      await user.click(screen.getByText('Simulate Progress'))
      
      expect(mockOnProgress).toHaveBeenCalledWith('block-2', 50)
    })
  })

  describe('Image Content Block', () => {
    it('should render image with alt text and caption', () => {
      const imageBlock: ContentBlock = {
        id: 'block-3',
        lesson_id: 'lesson-1',
        block_type: 'image',
        order_index: 2,
        content: {
          image: {
            url: 'https://example.com/image.jpg',
            alt_text: 'Example image',
            caption: 'This is an example image',
            width: 800,
            height: 600,
          }
        },
        settings: {},
        is_required: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={imageBlock} {...defaultProps} />)
      
      const image = screen.getByAltText('Example image')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
      expect(screen.getByText('This is an example image')).toBeInTheDocument()
    })

    it('should handle image load errors gracefully', () => {
      const imageBlock: ContentBlock = {
        id: 'block-3',
        lesson_id: 'lesson-1',
        block_type: 'image',
        order_index: 2,
        content: {
          image: {
            url: 'https://example.com/broken-image.jpg',
            alt_text: 'Broken image',
          }
        },
        settings: {},
        is_required: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={imageBlock} {...defaultProps} />)
      
      const image = screen.getByAltText('Broken image')
      fireEvent.error(image)
      
      expect(screen.getByText('Failed to load image')).toBeInTheDocument()
    })
  })

  describe('Audio Content Block', () => {
    it('should render audio player with controls', () => {
      const audioBlock: ContentBlock = {
        id: 'block-4',
        lesson_id: 'lesson-1',
        block_type: 'audio',
        order_index: 3,
        content: {
          audio: {
            url: 'https://example.com/audio.mp3',
            duration_seconds: 180,
            transcript: 'This is the audio transcript.',
            auto_play: false,
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={audioBlock} {...defaultProps} />)
      
      const audio = screen.getByRole('audio')
      expect(audio).toBeInTheDocument()
      expect(audio).toHaveAttribute('src', 'https://example.com/audio.mp3')
      expect(audio).toHaveAttribute('controls')
      expect(screen.getByText('Transcript')).toBeInTheDocument()
    })

    it('should show/hide transcript', async () => {
      const user = userEvent.setup()
      const audioBlock: ContentBlock = {
        id: 'block-4',
        lesson_id: 'lesson-1',
        block_type: 'audio',
        order_index: 3,
        content: {
          audio: {
            url: 'https://example.com/audio.mp3',
            transcript: 'This is the audio transcript.',
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={audioBlock} {...defaultProps} />)
      
      await user.click(screen.getByText('Show Transcript'))
      expect(screen.getByText('This is the audio transcript.')).toBeInTheDocument()
      
      await user.click(screen.getByText('Hide Transcript'))
      expect(screen.queryByText('This is the audio transcript.')).not.toBeInTheDocument()
    })
  })

  describe('Quiz Content Block', () => {
    it('should render quiz with questions', () => {
      const quizBlock: ContentBlock = {
        id: 'block-5',
        lesson_id: 'lesson-1',
        block_type: 'quiz',
        order_index: 4,
        content: {
          quiz: {
            questions: [
              {
                id: 'q1',
                type: 'multiple_choice',
                question: 'What is 2+2?',
                options: [
                  { id: 'a', text: '3', is_correct: false },
                  { id: 'b', text: '4', is_correct: true },
                  { id: 'c', text: '5', is_correct: false },
                ],
                points: 1,
                required: true,
              },
            ],
            settings: {
              attempts_allowed: 3,
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
      }

      render(<ContentBlockRenderer block={quizBlock} {...defaultProps} />)
      
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Submit Quiz')).toBeInTheDocument()
    })

    it('should handle quiz submission', async () => {
      const user = userEvent.setup()
      const quizBlock: ContentBlock = {
        id: 'block-5',
        lesson_id: 'lesson-1',
        block_type: 'quiz',
        order_index: 4,
        content: {
          quiz: {
            questions: [
              {
                id: 'q1',
                type: 'multiple_choice',
                question: 'What is 2+2?',
                options: [
                  { id: 'a', text: '3', is_correct: false },
                  { id: 'b', text: '4', is_correct: true },
                ],
                points: 1,
                required: true,
              },
            ],
            settings: {
              attempts_allowed: 3,
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
      }

      render(<ContentBlockRenderer block={quizBlock} {...defaultProps} />)
      
      // Select an answer
      await user.click(screen.getByLabelText('4'))
      
      // Submit quiz
      await user.click(screen.getByText('Submit Quiz'))
      
      expect(screen.getByText('Quiz Results')).toBeInTheDocument()
      expect(screen.getByText('Score: 1/1 (100%)')).toBeInTheDocument()
    })
  })

  describe('Assignment Content Block', () => {
    it('should render assignment with instructions', () => {
      const assignmentBlock: ContentBlock = {
        id: 'block-6',
        lesson_id: 'lesson-1',
        block_type: 'assignment',
        order_index: 5,
        content: {
          assignment: {
            instructions: 'Complete the following assignment...',
            submission_type: 'text',
            max_points: 100,
            due_date: '2024-12-31T23:59:59Z',
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={assignmentBlock} {...defaultProps} />)
      
      expect(screen.getByText('Assignment')).toBeInTheDocument()
      expect(screen.getByText('Complete the following assignment...')).toBeInTheDocument()
      expect(screen.getByText('Due: December 31, 2024')).toBeInTheDocument()
      expect(screen.getByText('Points: 100')).toBeInTheDocument()
    })

    it('should handle text assignment submission', async () => {
      const user = userEvent.setup()
      const assignmentBlock: ContentBlock = {
        id: 'block-6',
        lesson_id: 'lesson-1',
        block_type: 'assignment',
        order_index: 5,
        content: {
          assignment: {
            instructions: 'Write an essay...',
            submission_type: 'text',
            max_points: 100,
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={assignmentBlock} {...defaultProps} />)
      
      const textArea = screen.getByPlaceholderText('Enter your submission...')
      await user.type(textArea, 'This is my assignment submission.')
      
      await user.click(screen.getByText('Submit Assignment'))
      
      expect(screen.getByText('Assignment submitted successfully!')).toBeInTheDocument()
    })

    it('should handle file assignment submission', async () => {
      const user = userEvent.setup()
      const assignmentBlock: ContentBlock = {
        id: 'block-6',
        lesson_id: 'lesson-1',
        block_type: 'assignment',
        order_index: 5,
        content: {
          assignment: {
            instructions: 'Upload your document...',
            submission_type: 'file',
            max_points: 100,
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={assignmentBlock} {...defaultProps} />)
      
      const fileInput = screen.getByLabelText('Choose file')
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      await user.upload(fileInput, file)
      
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
      expect(screen.getByText('Submit Assignment')).toBeEnabled()
    })
  })

  describe('Code Content Block', () => {
    it('should render code with syntax highlighting', () => {
      const codeBlock: ContentBlock = {
        id: 'block-7',
        lesson_id: 'lesson-1',
        block_type: 'code',
        order_index: 6,
        content: {
          code: {
            content: 'function hello() {\n  console.log("Hello, World!");\n}',
            language: 'javascript',
            theme: 'dark',
            line_numbers: true,
            editable: false,
            run_button: false,
          }
        },
        settings: {},
        is_required: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={codeBlock} {...defaultProps} />)
      
      expect(screen.getByText('function hello() {')).toBeInTheDocument()
      expect(screen.getByText('console.log("Hello, World!");')).toBeInTheDocument()
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
    })

    it('should allow code editing when editable', async () => {
      const user = userEvent.setup()
      const codeBlock: ContentBlock = {
        id: 'block-7',
        lesson_id: 'lesson-1',
        block_type: 'code',
        order_index: 6,
        content: {
          code: {
            content: 'console.log("Hello");',
            language: 'javascript',
            editable: true,
            run_button: true,
          }
        },
        settings: {},
        is_required: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={codeBlock} {...defaultProps} />)
      
      const codeEditor = screen.getByRole('textbox')
      expect(codeEditor).toBeInTheDocument()
      
      await user.clear(codeEditor)
      await user.type(codeEditor, 'console.log("Modified code");')
      
      expect(screen.getByDisplayValue('console.log("Modified code");')).toBeInTheDocument()
      expect(screen.getByText('Run Code')).toBeInTheDocument()
    })
  })

  describe('Embed Content Block', () => {
    it('should render iframe embed', () => {
      const embedBlock: ContentBlock = {
        id: 'block-8',
        lesson_id: 'lesson-1',
        block_type: 'embed',
        order_index: 7,
        content: {
          embed: {
            url: 'https://example.com/embed',
            type: 'iframe',
            width: 800,
            height: 600,
            allow_fullscreen: true,
          }
        },
        settings: {},
        is_required: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={embedBlock} {...defaultProps} />)
      
      const iframe = screen.getByTitle('Embedded content')
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveAttribute('src', 'https://example.com/embed')
      expect(iframe).toHaveAttribute('width', '800')
      expect(iframe).toHaveAttribute('height', '600')
    })
  })

  describe('Download Content Block', () => {
    it('should render download link with file info', () => {
      const downloadBlock: ContentBlock = {
        id: 'block-9',
        lesson_id: 'lesson-1',
        block_type: 'download',
        order_index: 8,
        content: {
          download: {
            file_url: 'https://example.com/document.pdf',
            file_name: 'Course Materials.pdf',
            file_size_bytes: 1024000,
            file_type: 'application/pdf',
            description: 'Additional reading materials',
          }
        },
        settings: {},
        is_required: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={downloadBlock} {...defaultProps} />)
      
      expect(screen.getByText('Course Materials.pdf')).toBeInTheDocument()
      expect(screen.getByText('1.0 MB')).toBeInTheDocument()
      expect(screen.getByText('Additional reading materials')).toBeInTheDocument()
      
      const downloadLink = screen.getByRole('link', { name: /download/i })
      expect(downloadLink).toHaveAttribute('href', 'https://example.com/document.pdf')
      expect(downloadLink).toHaveAttribute('download')
    })
  })

  describe('Callout Content Block', () => {
    it('should render different callout types', () => {
      const calloutTypes = ['info', 'warning', 'success', 'error', 'tip'] as const
      
      calloutTypes.forEach((type, index) => {
        const calloutBlock: ContentBlock = {
          id: `block-${index}`,
          lesson_id: 'lesson-1',
          block_type: 'callout',
          order_index: index,
          content: {
            callout: {
              type,
              title: `${type.charAt(0).toUpperCase() + type.slice(1)} Title`,
              content: `This is a ${type} callout message.`,
            }
          },
          settings: {},
          is_required: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }

        const { unmount } = render(<ContentBlockRenderer block={calloutBlock} {...defaultProps} />)
        
        expect(screen.getByText(`${type.charAt(0).toUpperCase() + type.slice(1)} Title`)).toBeInTheDocument()
        expect(screen.getByText(`This is a ${type} callout message.`)).toBeInTheDocument()
        
        unmount()
      })
    })
  })

  describe('Block Settings and Behavior', () => {
    it('should apply custom styling from settings', () => {
      const styledBlock: ContentBlock = {
        id: 'block-styled',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: 'Styled content',
            format: 'plain'
          }
        },
        settings: {
          background_color: '#f0f0f0',
          text_color: '#333333',
          border: true,
          shadow: true,
          rounded: true,
          full_width: true,
          alignment: 'center',
        },
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={styledBlock} {...defaultProps} />)
      
      const blockElement = screen.getByTestId('content-block-styled')
      expect(blockElement).toHaveStyle({
        backgroundColor: '#f0f0f0',
        color: '#333333',
      })
      expect(blockElement).toHaveClass('border', 'shadow', 'rounded', 'w-full', 'text-center')
    })

    it('should handle collapsible blocks', async () => {
      const user = userEvent.setup()
      const collapsibleBlock: ContentBlock = {
        id: 'block-collapsible',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: 'Collapsible content',
            format: 'plain'
          }
        },
        settings: {
          collapsible: true,
          default_collapsed: false,
        },
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={collapsibleBlock} {...defaultProps} />)
      
      expect(screen.getByText('Collapsible content')).toBeInTheDocument()
      
      const collapseButton = screen.getByLabelText('Collapse content')
      await user.click(collapseButton)
      
      expect(screen.queryByText('Collapsible content')).not.toBeInTheDocument()
      
      const expandButton = screen.getByLabelText('Expand content')
      await user.click(expandButton)
      
      expect(screen.getByText('Collapsible content')).toBeInTheDocument()
    })

    it('should handle conditional display', () => {
      const conditionalBlock: ContentBlock = {
        id: 'block-conditional',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: 'Conditional content',
            format: 'plain'
          }
        },
        settings: {
          show_if: {
            condition: 'if_previous_completed',
          }
        },
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Should not show if previous block not completed
      render(<ContentBlockRenderer block={conditionalBlock} {...defaultProps} previousBlockCompleted={false} />)
      expect(screen.queryByText('Conditional content')).not.toBeInTheDocument()

      // Should show if previous block completed
      render(<ContentBlockRenderer block={conditionalBlock} {...defaultProps} previousBlockCompleted={true} />)
      expect(screen.getByText('Conditional content')).toBeInTheDocument()
    })
  })

  describe('Progress Tracking', () => {
    it('should track completion for required blocks', async () => {
      const requiredBlock: ContentBlock = {
        id: 'block-required',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: 'Required content',
            format: 'plain'
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={requiredBlock} {...defaultProps} />)
      
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith('block-required')
      })
    })

    it('should not require completion for optional blocks', () => {
      const optionalBlock: ContentBlock = {
        id: 'block-optional',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: 'Optional content',
            format: 'plain'
          }
        },
        settings: {},
        is_required: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={optionalBlock} {...defaultProps} />)
      
      // Optional blocks should still call onComplete but not be required for lesson completion
      expect(screen.getByTestId('content-block-optional')).toHaveClass('optional')
    })
  })

  describe('Integration with Phase 1 & 2 Components', () => {
    it('should integrate with AuthProvider for user context', () => {
      const textBlock: ContentBlock = {
        id: 'block-auth',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: 'Content for authenticated users',
            format: 'plain'
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={textBlock} {...defaultProps} />)
      
      expect(screen.getByText('Content for authenticated users')).toBeInTheDocument()
    })

    it('should use UI components from Phase 1', () => {
      const quizBlock: ContentBlock = {
        id: 'block-ui',
        lesson_id: 'lesson-1',
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
              },
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
      }

      render(<ContentBlockRenderer block={quizBlock} {...defaultProps} />)
      
      // Should use Button, Card, etc. from Phase 1 UI library
      expect(screen.getByRole('button', { name: 'Submit Quiz' })).toHaveClass('btn')
    })

    it('should respect security constraints from Phase 2', () => {
      const textBlock: ContentBlock = {
        id: 'block-security',
        lesson_id: 'lesson-1',
        block_type: 'text',
        order_index: 0,
        content: {
          text: {
            content: '<script>alert("xss")</script>Safe content',
            format: 'html'
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={textBlock} {...defaultProps} />)
      
      // Should sanitize HTML and prevent XSS
      expect(screen.getByText('Safe content')).toBeInTheDocument()
      expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const videoBlock: ContentBlock = {
        id: 'block-a11y',
        lesson_id: 'lesson-1',
        block_type: 'video',
        order_index: 0,
        content: {
          video: {
            mux_playback_id: 'test-playback-id',
            duration_seconds: 300,
          }
        },
        settings: {},
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ContentBlockRenderer block={videoBlock} {...defaultProps} />)
      
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Video content')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const quizBlock: ContentBlock = {
        id: 'block-keyboard',
        lesson_id: 'lesson-1',
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
                  { id: 'b', text: 'Option B', is_correct: false },
                ],
                points: 1,
                required: true,
              },
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
      }

      render(<ContentBlockRenderer block={quizBlock} {...defaultProps} />)
      
      // Should be able to navigate with keyboard
      await user.keyboard('{Tab}')
      expect(screen.getByLabelText('Option A')).toHaveFocus()
      
      await user.keyboard('{Tab}')
      expect(screen.getByLabelText('Option B')).toHaveFocus()
      
      await user.keyboard('{Tab}')
      expect(screen.getByRole('button', { name: 'Submit Quiz' })).toHaveFocus()
    })
  })
})