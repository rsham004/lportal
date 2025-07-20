/**
 * Mixed Content Lesson Builder Component
 * 
 * Advanced lesson builder supporting multiple content types within a single lesson.
 * Features drag-and-drop interface, real-time preview, and rich content blocks.
 */

'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

// Phase 1 UI Components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { AppLayout, AppHeader, AppMain, AppContent } from '@/components/ui/AppLayout'

// Phase 2 Authorization
import { Can } from '@/components/authorization/Can'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Video Components
import { VideoUploadManager } from '@/components/video/VideoUploadManager'

// Types
import type { 
  Lesson, 
  ContentBlock, 
  ContentBlockType, 
  ContentBlockData,
  ContentBlockSettings 
} from '@/lib/types/course'

// ============================================================================
// INTERFACES
// ============================================================================

export interface MixedContentLessonBuilderProps {
  lessonId?: string
  courseId: string
  moduleId: string
  onSave?: (lesson: Lesson) => void
  onCancel?: () => void
  className?: string
}

interface LessonBuilderState {
  lesson: Partial<Lesson>
  contentBlocks: ContentBlock[]
  selectedBlockId: string | null
  isPreviewMode: boolean
  isSaving: boolean
  errors: Record<string, string>
}

interface ContentBlockTemplate {
  type: ContentBlockType
  name: string
  description: string
  icon: string
  defaultContent: Partial<ContentBlockData>
  defaultSettings: Partial<ContentBlockSettings>
}

// ============================================================================
// CONTENT BLOCK TEMPLATES
// ============================================================================

const CONTENT_BLOCK_TEMPLATES: ContentBlockTemplate[] = [
  {
    type: 'text',
    name: 'Text Block',
    description: 'Rich text content with formatting',
    icon: '📝',
    defaultContent: {
      text: {
        content: 'Enter your text content here...',
        format: 'markdown'
      }
    },
    defaultSettings: {}
  },
  {
    type: 'video',
    name: 'Video Block',
    description: 'Video content with Mux integration',
    icon: '🎥',
    defaultContent: {
      video: {
        controls: true,
        auto_play: false
      }
    },
    defaultSettings: {}
  },
  {
    type: 'image',
    name: 'Image Block',
    description: 'Images with captions and alt text',
    icon: '🖼️',
    defaultContent: {
      image: {
        url: '',
        alt_text: '',
        caption: ''
      }
    },
    defaultSettings: {}
  },
  {
    type: 'quiz',
    name: 'Quiz Block',
    description: 'Interactive quizzes and assessments',
    icon: '❓',
    defaultContent: {
      quiz: {
        questions: [],
        settings: {
          attempts_allowed: 3,
          show_correct_answers: true,
          show_explanations: true,
          randomize_questions: false,
          randomize_options: false,
          passing_score_percentage: 70,
          allow_review: true
        }
      }
    },
    defaultSettings: {}
  },
  {
    type: 'assignment',
    name: 'Assignment Block',
    description: 'Assignments with file submissions',
    icon: '📋',
    defaultContent: {
      assignment: {
        instructions: 'Enter assignment instructions...',
        submission_type: 'text',
        max_points: 100
      }
    },
    defaultSettings: {}
  },
  {
    type: 'code',
    name: 'Code Block',
    description: 'Code snippets with syntax highlighting',
    icon: '💻',
    defaultContent: {
      code: {
        content: '// Enter your code here\nconsole.log("Hello, World!");',
        language: 'javascript',
        theme: 'dark',
        line_numbers: true,
        editable: false
      }
    },
    defaultSettings: {}
  },
  {
    type: 'callout',
    name: 'Callout Block',
    description: 'Highlighted information boxes',
    icon: '💡',
    defaultContent: {
      callout: {
        type: 'info',
        title: 'Important Note',
        content: 'This is an important piece of information...'
      }
    },
    defaultSettings: {}
  },
  {
    type: 'divider',
    name: 'Divider',
    description: 'Visual separator between content',
    icon: '➖',
    defaultContent: {},
    defaultSettings: {}
  }
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MixedContentLessonBuilder({
  lessonId,
  courseId,
  moduleId,
  onSave,
  onCancel,
  className = ''
}: MixedContentLessonBuilderProps) {
  const { user } = useAuth()
  const [builderState, setBuilderState] = useState<LessonBuilderState>({
    lesson: {
      title: '',
      description: '',
      content_type: 'mixed',
      estimated_duration_minutes: 15,
      is_required: true,
      is_preview: false,
      order_index: 0
    },
    contentBlocks: [],
    selectedBlockId: null,
    isPreviewMode: false,
    isSaving: false,
    errors: {}
  })

  const [showBlockLibrary, setShowBlockLibrary] = useState(false)
  const dragEndTimeoutRef = useRef<NodeJS.Timeout>()

  // Load existing lesson if editing
  React.useEffect(() => {
    if (lessonId) {
      loadExistingLesson(lessonId)
    }
  }, [lessonId])

  const loadExistingLesson = async (id: string) => {
    try {
      // Load lesson and content blocks from database
      console.log('Loading lesson:', id)
      // Implementation would fetch from CourseService
    } catch (error) {
      console.error('Failed to load lesson:', error)
    }
  }

  const updateLessonField = (field: string, value: any) => {
    setBuilderState(prev => ({
      ...prev,
      lesson: {
        ...prev.lesson,
        [field]: value
      }
    }))
  }

  const addContentBlock = (template: ContentBlockTemplate) => {
    const newBlock: ContentBlock = {
      id: `block_${Date.now()}`,
      lesson_id: lessonId || '',
      block_type: template.type,
      order_index: builderState.contentBlocks.length,
      content: template.defaultContent,
      settings: template.defaultSettings,
      is_required: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setBuilderState(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock],
      selectedBlockId: newBlock.id
    }))

    setShowBlockLibrary(false)
  }

  const updateContentBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    setBuilderState(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    }))
  }

  const deleteContentBlock = (blockId: string) => {
    setBuilderState(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter(block => block.id !== blockId),
      selectedBlockId: prev.selectedBlockId === blockId ? null : prev.selectedBlockId
    }))
  }

  const duplicateContentBlock = (blockId: string) => {
    const blockToDuplicate = builderState.contentBlocks.find(b => b.id === blockId)
    if (!blockToDuplicate) return

    const duplicatedBlock: ContentBlock = {
      ...blockToDuplicate,
      id: `block_${Date.now()}`,
      order_index: blockToDuplicate.order_index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setBuilderState(prev => ({
      ...prev,
      contentBlocks: [
        ...prev.contentBlocks.slice(0, blockToDuplicate.order_index + 1),
        duplicatedBlock,
        ...prev.contentBlocks.slice(blockToDuplicate.order_index + 1).map(block => ({
          ...block,
          order_index: block.order_index + 1
        }))
      ]
    }))
  }

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const { source, destination } = result
    if (source.index === destination.index) return

    // Clear any existing timeout
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current)
    }

    // Debounce the reorder operation
    dragEndTimeoutRef.current = setTimeout(() => {
      setBuilderState(prev => {
        const newBlocks = Array.from(prev.contentBlocks)
        const [reorderedBlock] = newBlocks.splice(source.index, 1)
        newBlocks.splice(destination.index, 0, reorderedBlock)

        // Update order indices
        const updatedBlocks = newBlocks.map((block, index) => ({
          ...block,
          order_index: index
        }))

        return {
          ...prev,
          contentBlocks: updatedBlocks
        }
      })
    }, 100)
  }, [])

  const saveLesson = async () => {
    if (!user) return

    setBuilderState(prev => ({ ...prev, isSaving: true, errors: {} }))

    try {
      // Validate lesson data
      const errors: Record<string, string> = {}
      
      if (!builderState.lesson.title?.trim()) {
        errors.title = 'Lesson title is required'
      }

      if (builderState.contentBlocks.length === 0) {
        errors.content = 'At least one content block is required'
      }

      if (Object.keys(errors).length > 0) {
        setBuilderState(prev => ({ ...prev, errors, isSaving: false }))
        return
      }

      // Save lesson and content blocks
      console.log('Saving lesson:', builderState.lesson)
      console.log('Content blocks:', builderState.contentBlocks)

      // Implementation would use CourseService to save
      // const savedLesson = await CourseService.createOrUpdateLesson(...)

      if (onSave) {
        onSave(builderState.lesson as Lesson)
      }

    } catch (error: any) {
      setBuilderState(prev => ({
        ...prev,
        errors: { general: error.message || 'Failed to save lesson' },
        isSaving: false
      }))
    }
  }

  const togglePreviewMode = () => {
    setBuilderState(prev => ({
      ...prev,
      isPreviewMode: !prev.isPreviewMode
    }))
  }

  const selectedBlock = builderState.contentBlocks.find(b => b.id === builderState.selectedBlockId)

  return (
    <ProtectedRoute>
      <Can action="create" subject="Course">
        <AppLayout>
          <AppHeader>
            <div className="flex items-center justify-between p-4">
              <div>
                <h1 className="text-xl font-bold">
                  {lessonId ? 'Edit Lesson' : 'Create Mixed Content Lesson'}
                </h1>
                <p className="text-sm text-gray-600">
                  Build engaging lessons with text, video, quizzes, and interactive content
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={togglePreviewMode}
                >
                  {builderState.isPreviewMode ? 'Edit' : 'Preview'}
                </Button>
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={saveLesson}
                  disabled={builderState.isSaving}
                >
                  {builderState.isSaving ? 'Saving...' : 'Save Lesson'}
                </Button>
              </div>
            </div>
          </AppHeader>

          <AppMain>
            <AppContent>
              <div className="container mx-auto px-4 py-6 max-w-6xl">
                {/* Error Display */}
                {builderState.errors.general && (
                  <Card className="p-4 mb-6 bg-red-50 border-red-200">
                    <div className="text-red-800">{builderState.errors.general}</div>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Main Content Area */}
                  <div className="lg:col-span-3">
                    {!builderState.isPreviewMode ? (
                      <EditMode
                        builderState={builderState}
                        onUpdateLesson={updateLessonField}
                        onUpdateBlock={updateContentBlock}
                        onDeleteBlock={deleteContentBlock}
                        onDuplicateBlock={duplicateContentBlock}
                        onSelectBlock={(blockId) => setBuilderState(prev => ({ ...prev, selectedBlockId: blockId }))}
                        onDragEnd={handleDragEnd}
                        onAddBlock={() => setShowBlockLibrary(true)}
                      />
                    ) : (
                      <PreviewMode
                        lesson={builderState.lesson}
                        contentBlocks={builderState.contentBlocks}
                      />
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="lg:col-span-1">
                    {!builderState.isPreviewMode && (
                      <Sidebar
                        selectedBlock={selectedBlock}
                        onUpdateBlock={updateContentBlock}
                        showBlockLibrary={showBlockLibrary}
                        onShowBlockLibrary={setShowBlockLibrary}
                        blockTemplates={CONTENT_BLOCK_TEMPLATES}
                        onAddBlock={addContentBlock}
                      />
                    )}
                  </div>
                </div>
              </div>
            </AppContent>
          </AppMain>
        </AppLayout>
      </Can>
    </ProtectedRoute>
  )
}

// ============================================================================
// EDIT MODE COMPONENT
// ============================================================================

interface EditModeProps {
  builderState: LessonBuilderState
  onUpdateLesson: (field: string, value: any) => void
  onUpdateBlock: (blockId: string, updates: Partial<ContentBlock>) => void
  onDeleteBlock: (blockId: string) => void
  onDuplicateBlock: (blockId: string) => void
  onSelectBlock: (blockId: string | null) => void
  onDragEnd: (result: DropResult) => void
  onAddBlock: () => void
}

function EditMode({
  builderState,
  onUpdateLesson,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onSelectBlock,
  onDragEnd,
  onAddBlock
}: EditModeProps) {
  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Lesson Title *</label>
            <Input
              value={builderState.lesson.title || ''}
              onChange={(e) => onUpdateLesson('title', e.target.value)}
              placeholder="Enter lesson title"
              error={!!builderState.errors.title}
            />
            {builderState.errors.title && (
              <div className="text-red-600 text-sm mt-1">{builderState.errors.title}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={builderState.lesson.description || ''}
              onChange={(e) => onUpdateLesson('description', e.target.value)}
              placeholder="Describe what students will learn"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <Input
                type="number"
                min="1"
                max="480"
                value={builderState.lesson.estimated_duration_minutes || ''}
                onChange={(e) => onUpdateLesson('estimated_duration_minutes', parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={builderState.lesson.is_required || false}
                  onChange={(e) => onUpdateLesson('is_required', e.target.checked)}
                  className="mr-2"
                />
                Required lesson
              </label>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={builderState.lesson.is_preview || false}
                  onChange={(e) => onUpdateLesson('is_preview', e.target.checked)}
                  className="mr-2"
                />
                Free preview
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Content Blocks */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Content Blocks</h3>
          <Button onClick={onAddBlock}>
            ➕ Add Content Block
          </Button>
        </div>

        {builderState.errors.content && (
          <div className="text-red-600 text-sm mb-4">{builderState.errors.content}</div>
        )}

        {builderState.contentBlocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <h4 className="font-semibold mb-2">No content blocks yet</h4>
            <p className="mb-4">Start building your lesson by adding content blocks</p>
            <Button onClick={onAddBlock}>Add Your First Block</Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="content-blocks">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {builderState.contentBlocks.map((block, index) => (
                    <Draggable key={block.id} draggableId={block.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border rounded-lg p-4 ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          } ${
                            builderState.selectedBlockId === block.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => onSelectBlock(block.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab hover:cursor-grabbing text-gray-400"
                              >
                                ⋮⋮
                              </div>
                              <div className="text-lg">
                                {CONTENT_BLOCK_TEMPLATES.find(t => t.type === block.block_type)?.icon}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {CONTENT_BLOCK_TEMPLATES.find(t => t.type === block.block_type)?.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Block {index + 1}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDuplicateBlock(block.id)
                                }}
                              >
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteBlock(block.id)
                                }}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>

                          {/* Block Preview */}
                          <ContentBlockPreview block={block} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Card>
    </div>
  )
}

// ============================================================================
// PREVIEW MODE COMPONENT
// ============================================================================

interface PreviewModeProps {
  lesson: Partial<Lesson>
  contentBlocks: ContentBlock[]
}

function PreviewMode({ lesson, contentBlocks }: PreviewModeProps) {
  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{lesson.description}</p>
        )}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
          <span>📚 {contentBlocks.length} content blocks</span>
          <span>⏱️ {lesson.estimated_duration_minutes} minutes</span>
          {lesson.is_required && <span>✅ Required</span>}
          {lesson.is_preview && <span>👁️ Free preview</span>}
        </div>
      </div>

      {/* Content Blocks */}
      <div className="space-y-8">
        {contentBlocks.map((block, index) => (
          <ContentBlockRenderer key={block.id} block={block} index={index} />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

interface SidebarProps {
  selectedBlock: ContentBlock | undefined
  onUpdateBlock: (blockId: string, updates: Partial<ContentBlock>) => void
  showBlockLibrary: boolean
  onShowBlockLibrary: (show: boolean) => void
  blockTemplates: ContentBlockTemplate[]
  onAddBlock: (template: ContentBlockTemplate) => void
}

function Sidebar({
  selectedBlock,
  onUpdateBlock,
  showBlockLibrary,
  onShowBlockLibrary,
  blockTemplates,
  onAddBlock
}: SidebarProps) {
  if (showBlockLibrary) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Content Library</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShowBlockLibrary(false)}
          >
            ✕
          </Button>
        </div>
        
        <div className="space-y-2">
          {blockTemplates.map((template) => (
            <button
              key={template.type}
              onClick={() => onAddBlock(template)}
              className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{template.icon}</span>
                <div>
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-600">{template.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    )
  }

  if (selectedBlock) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Block Settings</h3>
        <ContentBlockEditor
          block={selectedBlock}
          onUpdate={(updates) => onUpdateBlock(selectedBlock.id, updates)}
        />
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Lesson Builder</h3>
      <div className="space-y-4 text-sm text-gray-600">
        <p>Select a content block to edit its settings, or add new blocks to build your lesson.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onShowBlockLibrary(true)}
          className="w-full"
        >
          ➕ Add Content Block
        </Button>
      </div>
    </Card>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ContentBlockPreview({ block }: { block: ContentBlock }) {
  const template = CONTENT_BLOCK_TEMPLATES.find(t => t.type === block.block_type)
  
  return (
    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
      <div className="flex items-center gap-2 mb-2">
        <span>{template?.icon}</span>
        <span className="font-medium">{template?.name}</span>
      </div>
      
      {/* Block-specific preview content */}
      {block.block_type === 'text' && block.content.text && (
        <div className="truncate">{block.content.text.content}</div>
      )}
      
      {block.block_type === 'video' && (
        <div>Video content block</div>
      )}
      
      {block.block_type === 'quiz' && block.content.quiz && (
        <div>{block.content.quiz.questions.length} questions</div>
      )}
      
      {/* Add more preview types as needed */}
    </div>
  )
}

function ContentBlockRenderer({ block, index }: { block: ContentBlock; index: number }) {
  // This would render the actual content block for preview
  // Implementation would depend on the block type
  return (
    <Card className="p-6">
      <div className="text-sm text-gray-500 mb-2">Block {index + 1}</div>
      <div>Content block rendering for {block.block_type} would go here</div>
    </Card>
  )
}

function ContentBlockEditor({ 
  block, 
  onUpdate 
}: { 
  block: ContentBlock
  onUpdate: (updates: Partial<ContentBlock>) => void 
}) {
  // This would provide editing interface for the selected block
  // Implementation would depend on the block type
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Required</label>
        <input
          type="checkbox"
          checked={block.is_required}
          onChange={(e) => onUpdate({ is_required: e.target.checked })}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
        <Input
          type="number"
          min="0"
          value={block.estimated_duration_minutes || ''}
          onChange={(e) => onUpdate({ estimated_duration_minutes: parseInt(e.target.value) || undefined })}
        />
      </div>
      
      {/* Block-specific editing interface would go here */}
    </div>
  )
}

export default MixedContentLessonBuilder