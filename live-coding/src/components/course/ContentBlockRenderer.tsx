'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { MuxVideoPlayer } from '@/components/video/MuxVideoPlayer'
import { useAuth } from '@/components/auth/AuthProvider'
import { ContentBlock, QuizQuestion, QuizOption } from '@/lib/types/course'
import { updateContentBlockProgress, submitQuizAttempt, submitAssignment } from '@/lib/services/courseService'
import { uploadFile } from '@/lib/services/fileUploadService'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { 
  PlayIcon,
  PauseIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentIcon,
  SpeakerWaveIcon,
  CodeBracketIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  PuzzlePieceIcon,
  MinusIcon
} from '@heroicons/react/24/outline'

interface ContentBlockRendererProps {
  block: ContentBlock
  onProgress?: (blockId: string, progress: number) => void
  onComplete?: (blockId: string) => void
  lessonId: string
  courseId: string
  previousBlockCompleted?: boolean
}

export function ContentBlockRenderer({ 
  block, 
  onProgress, 
  onComplete, 
  lessonId, 
  courseId,
  previousBlockCompleted = true 
}: ContentBlockRendererProps) {
  const { user } = useAuth()
  const [isCompleted, setIsCompleted] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(block.settings.default_collapsed || false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResults, setQuizResults] = useState<{ score: number; total: number; passed: boolean } | null>(null)
  const [assignmentSubmission, setAssignmentSubmission] = useState('')
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null)
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false)
  const [codeContent, setCodeContent] = useState(block.content.code?.content || '')

  // Check if block should be displayed based on conditional settings
  const shouldDisplay = useCallback(() => {
    if (!block.settings.show_if) return true
    
    switch (block.settings.show_if.condition) {
      case 'if_previous_completed':
        return previousBlockCompleted
      case 'always':
        return true
      default:
        return true
    }
  }, [block.settings.show_if, previousBlockCompleted])

  // Auto-complete text blocks after viewing
  useEffect(() => {
    if (block.block_type === 'text' && shouldDisplay()) {
      const timer = setTimeout(() => {
        handleComplete()
      }, 2000) // Mark as complete after 2 seconds of viewing
      
      return () => clearTimeout(timer)
    }
  }, [block.block_type])

  const handleComplete = useCallback(async () => {
    if (isCompleted) return
    
    setIsCompleted(true)
    onComplete?.(block.id)
    
    try {
      await updateContentBlockProgress(block.id, {
        user_id: user?.id,
        lesson_id: lessonId,
        course_id: courseId,
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }, [isCompleted, block.id, onComplete, user?.id, lessonId, courseId])

  const handleProgress = useCallback((progress: number) => {
    onProgress?.(block.id, progress)
    
    if (progress >= 90 && !isCompleted) {
      handleComplete()
    }
  }, [block.id, onProgress, isCompleted, handleComplete])

  const handleQuizSubmit = async () => {
    if (!block.content.quiz) return
    
    const questions = block.content.quiz.questions
    let score = 0
    let total = 0
    
    questions.forEach(question => {
      total += question.points
      const userAnswer = quizAnswers[question.id]
      
      if (question.type === 'multiple_choice') {
        const correctOption = question.options?.find(opt => opt.is_correct)
        if (userAnswer === correctOption?.id) {
          score += question.points
        }
      } else if (question.type === 'true_false') {
        const correctOption = question.options?.find(opt => opt.is_correct)
        if (userAnswer === correctOption?.id) {
          score += question.points
        }
      }
    })
    
    const percentage = total > 0 ? (score / total) * 100 : 0
    const passed = percentage >= (block.content.quiz.settings.passing_score_percentage || 70)
    
    setQuizResults({ score, total, passed })
    setQuizSubmitted(true)
    
    try {
      await submitQuizAttempt(block.id, {
        user_id: user?.id,
        answers: quizAnswers,
        score,
        max_score: total,
        passed,
      })
      
      if (passed) {
        handleComplete()
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error)
    }
  }

  const handleAssignmentSubmit = async () => {
    if (!block.content.assignment) return
    
    try {
      let fileUrl = null
      let fileName = null
      
      if (assignmentFile) {
        const uploadResult = await uploadFile(assignmentFile, `assignments/${lessonId}/${block.id}`)
        fileUrl = uploadResult.url
        fileName = assignmentFile.name
      }
      
      await submitAssignment(block.id, {
        user_id: user?.id,
        lesson_id: lessonId,
        course_id: courseId,
        submission_type: block.content.assignment.submission_type,
        content: assignmentSubmission,
        file_url: fileUrl,
        file_name: fileName,
      })
      
      setAssignmentSubmitted(true)
      handleComplete()
    } catch (error) {
      console.error('Failed to submit assignment:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const sanitizeHtml = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
    })
  }

  const getBlockIcon = () => {
    switch (block.block_type) {
      case 'video': return <PlayIcon className="h-5 w-5" />
      case 'audio': return <SpeakerWaveIcon className="h-5 w-5" />
      case 'image': return <PhotoIcon className="h-5 w-5" />
      case 'code': return <CodeBracketIcon className="h-5 w-5" />
      case 'download': return <DocumentArrowDownIcon className="h-5 w-5" />
      case 'discussion': return <ChatBubbleLeftRightIcon className="h-5 w-5" />
      case 'interactive': return <PuzzlePieceIcon className="h-5 w-5" />
      case 'divider': return <MinusIcon className="h-5 w-5" />
      default: return <DocumentIcon className="h-5 w-5" />
    }
  }

  const getCalloutIcon = (type: string) => {
    switch (type) {
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'success': return <CheckCircleIcon className="h-5 w-5" />
      case 'error': return <XCircleIcon className="h-5 w-5" />
      case 'tip': return <LightBulbIcon className="h-5 w-5" />
      default: return <InformationCircleIcon className="h-5 w-5" />
    }
  }

  const getCalloutStyles = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'tip': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  if (!shouldDisplay()) {
    return null
  }

  const blockStyles = {
    backgroundColor: block.settings.background_color,
    color: block.settings.text_color,
  }

  const blockClasses = [
    'content-block',
    block.settings.border ? 'border' : '',
    block.settings.shadow ? 'shadow' : '',
    block.settings.rounded ? 'rounded' : '',
    block.settings.full_width ? 'w-full' : '',
    block.settings.alignment === 'center' ? 'text-center' : '',
    block.settings.alignment === 'right' ? 'text-right' : '',
    !block.is_required ? 'optional' : '',
  ].filter(Boolean).join(' ')

  const renderContent = () => {
    switch (block.block_type) {
      case 'text':
        if (!block.content.text) return null
        
        let content = ''
        if (block.content.text.format === 'markdown') {
          content = marked(block.content.text.content)
        } else if (block.content.text.format === 'html') {
          content = sanitizeHtml(block.content.text.content)
        } else {
          content = block.content.text.content
        }
        
        return (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )

      case 'video':
        if (!block.content.video) return null
        
        return (
          <div role="region" aria-label="Video content">
            <MuxVideoPlayer
              playbackId={block.content.video.mux_playback_id!}
              thumbnailUrl={block.content.video.thumbnail_url}
              autoPlay={block.content.video.auto_play}
              controls={block.content.video.controls}
              onProgress={handleProgress}
              onComplete={() => handleComplete()}
            />
          </div>
        )

      case 'image':
        if (!block.content.image) return null
        
        return (
          <div className="text-center">
            {imageError ? (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Failed to load image</p>
              </div>
            ) : (
              <img
                src={block.content.image.url}
                alt={block.content.image.alt_text}
                width={block.content.image.width}
                height={block.content.image.height}
                onError={() => setImageError(true)}
                className="max-w-full h-auto rounded-lg"
              />
            )}
            {block.content.image.caption && (
              <p className="text-sm text-gray-600 mt-2 italic">
                {block.content.image.caption}
              </p>
            )}
          </div>
        )

      case 'audio':
        if (!block.content.audio) return null
        
        return (
          <div>
            <audio
              src={block.content.audio.url}
              controls
              autoPlay={block.content.audio.auto_play}
              className="w-full"
              onTimeUpdate={(e) => {
                const audio = e.target as HTMLAudioElement
                const progress = (audio.currentTime / audio.duration) * 100
                handleProgress(progress)
              }}
            />
            {block.content.audio.transcript && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranscript(!showTranscript)}
                >
                  {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                </Button>
                {showTranscript && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Transcript</h4>
                    <p className="text-sm text-gray-700">{block.content.audio.transcript}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'quiz':
        if (!block.content.quiz) return null
        
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Quiz</h3>
            {!quizSubmitted ? (
              <div className="space-y-6">
                {block.content.quiz.questions.map((question, index) => (
                  <Card key={question.id} className="p-4">
                    <h4 className="font-medium mb-3">
                      {index + 1}. {question.question}
                    </h4>
                    
                    {question.type === 'multiple_choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <label key={option.id} className="flex items-center">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.id}
                              checked={quizAnswers[question.id] === option.id}
                              onChange={(e) => setQuizAnswers(prev => ({
                                ...prev,
                                [question.id]: e.target.value
                              }))}
                              className="mr-2"
                              aria-label={option.text}
                            />
                            {option.text}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'true_false' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <label key={option.id} className="flex items-center">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.id}
                              checked={quizAnswers[question.id] === option.id}
                              onChange={(e) => setQuizAnswers(prev => ({
                                ...prev,
                                [question.id]: e.target.value
                              }))}
                              className="mr-2"
                              aria-label={option.text}
                            />
                            {option.text}
                          </label>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
                
                <Button onClick={handleQuizSubmit} className="btn">
                  Submit Quiz
                </Button>
              </div>
            ) : (
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Quiz Results</h4>
                {quizResults && (
                  <div>
                    <p className="text-xl font-bold mb-2">
                      Score: {quizResults.score}/{quizResults.total} ({Math.round((quizResults.score / quizResults.total) * 100)}%)
                    </p>
                    <Badge variant={quizResults.passed ? 'success' : 'destructive'}>
                      {quizResults.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                )}
              </Card>
            )}
          </div>
        )

      case 'assignment':
        if (!block.content.assignment) return null
        
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Assignment</h3>
            <Card className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-4">{block.content.assignment.instructions}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {block.content.assignment.due_date && (
                    <span>Due: {new Date(block.content.assignment.due_date).toLocaleDateString()}</span>
                  )}
                  {block.content.assignment.max_points && (
                    <span>Points: {block.content.assignment.max_points}</span>
                  )}
                </div>
              </div>
              
              {!assignmentSubmitted ? (
                <div className="space-y-4">
                  {block.content.assignment.submission_type === 'text' && (
                    <Textarea
                      value={assignmentSubmission}
                      onChange={(e) => setAssignmentSubmission(e.target.value)}
                      placeholder="Enter your submission..."
                      rows={6}
                    />
                  )}
                  
                  {block.content.assignment.submission_type === 'file' && (
                    <div>
                      <input
                        type="file"
                        onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                        className="mb-2"
                        aria-label="Choose file"
                      />
                      {assignmentFile && (
                        <p className="text-sm text-gray-600">
                          Selected: {assignmentFile.name}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleAssignmentSubmit}
                    disabled={
                      (block.content.assignment.submission_type === 'text' && !assignmentSubmission.trim()) ||
                      (block.content.assignment.submission_type === 'file' && !assignmentFile)
                    }
                  >
                    Submit Assignment
                  </Button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 inline mr-2" />
                  <span className="text-green-800">Assignment submitted successfully!</span>
                </div>
              )}
            </Card>
          </div>
        )

      case 'code':
        if (!block.content.code) return null
        
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary">
                {block.content.code.language?.charAt(0).toUpperCase() + block.content.code.language?.slice(1)}
              </Badge>
              {block.content.code.run_button && (
                <Button variant="outline" size="sm">
                  Run Code
                </Button>
              )}
            </div>
            
            {block.content.code.editable ? (
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-lg"
                style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
              />
            ) : (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code className={`language-${block.content.code.language}`}>
                  {block.content.code.content}
                </code>
              </pre>
            )}
          </div>
        )

      case 'embed':
        if (!block.content.embed) return null
        
        return (
          <div className="relative">
            <iframe
              src={block.content.embed.url}
              width={block.content.embed.width || '100%'}
              height={block.content.embed.height || 400}
              allowFullScreen={block.content.embed.allow_fullscreen}
              className="border rounded-lg"
              title="Embedded content"
            />
          </div>
        )

      case 'download':
        if (!block.content.download) return null
        
        return (
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <DocumentArrowDownIcon className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <h4 className="font-medium">{block.content.download.file_name}</h4>
                <p className="text-sm text-gray-600">
                  {formatFileSize(block.content.download.file_size_bytes)}
                </p>
                {block.content.download.description && (
                  <p className="text-sm text-gray-700 mt-1">
                    {block.content.download.description}
                  </p>
                )}
              </div>
              <a
                href={block.content.download.file_url}
                download={block.content.download.file_name}
                className="btn btn-primary"
              >
                Download
              </a>
            </div>
          </Card>
        )

      case 'callout':
        if (!block.content.callout) return null
        
        return (
          <div className={`border rounded-lg p-4 ${getCalloutStyles(block.content.callout.type)}`}>
            <div className="flex items-start gap-3">
              {getCalloutIcon(block.content.callout.type)}
              <div>
                {block.content.callout.title && (
                  <h4 className="font-semibold mb-1">{block.content.callout.title}</h4>
                )}
                <p>{block.content.callout.content}</p>
              </div>
            </div>
          </div>
        )

      case 'divider':
        return <hr className="border-gray-300 my-8" />

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Unsupported content type: {block.block_type}</p>
          </div>
        )
    }
  }

  return (
    <div
      data-testid={`content-block-${block.id}`}
      className={blockClasses}
      style={blockStyles}
    >
      {block.settings.collapsible && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getBlockIcon()}
            <span className="font-medium">
              {block.block_type.charAt(0).toUpperCase() + block.block_type.slice(1)} Content
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand content' : 'Collapse content'}
          >
            {isCollapsed ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronUpIcon className="h-4 w-4" />}
          </Button>
        </div>
      )}
      
      {!isCollapsed && renderContent()}
      
      {isCompleted && (
        <div className="mt-4 flex items-center gap-2 text-green-600">
          <CheckCircleIcon className="h-4 w-4" />
          <span className="text-sm">Completed</span>
        </div>
      )}
    </div>
  )
}