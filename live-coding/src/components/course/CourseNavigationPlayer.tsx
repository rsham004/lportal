'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { ContentBlockRenderer } from './ContentBlockRenderer'
import { useAuth } from '@/components/auth/AuthProvider'
import { Course, CourseModule, Lesson, LessonProgress, ContentBlock } from '@/lib/types/course'
import { updateLessonProgress, markLessonComplete } from '@/lib/services/courseService'
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  BookmarkIcon,
  PencilIcon,
  TrophyIcon,
  DocumentArrowDownIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline'

interface CourseNavigationPlayerProps {
  course: Course
  modules: CourseModule[]
  lessons: (Lesson & { progress?: LessonProgress })[]
  initialLessonId?: string
}

export function CourseNavigationPlayer({ 
  course, 
  modules, 
  lessons, 
  initialLessonId 
}: CourseNavigationPlayerProps) {
  const { user } = useAuth()
  const [currentLessonId, setCurrentLessonId] = useState(initialLessonId || lessons[0]?.id)
  const [completedBlocks, setCompletedBlocks] = useState<Set<string>>(new Set())
  const [lessonProgress, setLessonProgress] = useState<Record<string, number>>({})
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [showCourseComplete, setShowCourseComplete] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const mainContentRef = useRef<HTMLDivElement>(null)

  const currentLesson = lessons.find(lesson => lesson.id === currentLessonId) || lessons[0]
  const currentLessonIndex = lessons.findIndex(lesson => lesson.id === currentLessonId)
  const previousLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex < lessons.length - 1 ? lessons[currentLessonIndex + 1] : null

  // Check if lesson is locked based on prerequisites
  const isLessonLocked = useCallback((lesson: Lesson) => {
    if (!lesson.prerequisite_lesson_ids?.length) return false
    
    return lesson.prerequisite_lesson_ids.some(prereqId => {
      const prereqLesson = lessons.find(l => l.id === prereqId)
      return !prereqLesson?.progress || prereqLesson.progress.progress_percentage < 100
    })
  }, [lessons])

  // Calculate overall course progress
  const courseProgress = useCallback(() => {
    const completedLessons = lessons.filter(lesson => 
      lesson.progress?.progress_percentage === 100
    ).length
    return Math.round((completedLessons / lessons.length) * 100)
  }, [lessons])

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load lesson data when current lesson changes
  useEffect(() => {
    if (currentLesson?.progress) {
      setNotes(currentLesson.progress.notes || '')
      setBookmarks(currentLesson.progress.bookmarks || [])
    }
  }, [currentLesson])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          if (nextLesson && !isLessonLocked(nextLesson)) {
            handleLessonChange(nextLesson.id)
          }
          break
        case 'p':
          if (previousLesson) {
            handleLessonChange(previousLesson.id)
          }
          break
        case 'arrowright':
          if (nextLesson && !isLessonLocked(nextLesson)) {
            handleLessonChange(nextLesson.id)
          }
          break
        case 'arrowleft':
          if (previousLesson) {
            handleLessonChange(previousLesson.id)
          }
          break
        case 'm':
          setIsSidebarOpen(!isSidebarOpen)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [nextLesson, previousLesson, isSidebarOpen])

  // Check for course completion
  useEffect(() => {
    const allLessonsCompleted = lessons.every(lesson => 
      lesson.progress?.progress_percentage === 100
    )
    if (allLessonsCompleted && lessons.length > 0) {
      setShowCourseComplete(true)
    }
  }, [lessons])

  const handleLessonChange = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson || isLessonLocked(lesson)) return

    setCurrentLessonId(lessonId)
    setCompletedBlocks(new Set())
    setErrorMessage('')
    
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setIsSidebarOpen(false)
    }

    // Scroll to top of content
    mainContentRef.current?.scrollTo(0, 0)
  }

  const handleBlockProgress = useCallback(async (blockId: string, progress: number) => {
    try {
      await updateLessonProgress(currentLessonId, {
        user_id: user?.id,
        progress_percentage: progress,
        last_accessed_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to update progress:', error)
      setErrorMessage('Failed to save progress. Please try again.')
    }
  }, [currentLessonId, user?.id])

  const handleBlockComplete = useCallback(async (blockId: string) => {
    setCompletedBlocks(prev => new Set([...prev, blockId]))
    
    const totalBlocks = currentLesson?.content_blocks?.length || 0
    const completedCount = completedBlocks.size + 1
    const progress = Math.round((completedCount / totalBlocks) * 100)
    
    setLessonProgress(prev => ({
      ...prev,
      [currentLessonId]: progress
    }))

    // Mark lesson as complete if all blocks are done
    if (completedCount === totalBlocks) {
      try {
        await markLessonComplete(currentLessonId, {
          user_id: user?.id,
          completed_at: new Date().toISOString(),
          progress_percentage: 100,
        })

        // Announce completion to screen readers
        const announcement = document.createElement('div')
        announcement.setAttribute('role', 'status')
        announcement.setAttribute('aria-live', 'polite')
        announcement.textContent = 'Lesson completed'
        document.body.appendChild(announcement)
        setTimeout(() => document.body.removeChild(announcement), 1000)

      } catch (error) {
        console.error('Failed to mark lesson complete:', error)
        setErrorMessage('Failed to save progress. Please try again.')
      }
    }
  }, [completedBlocks, currentLesson, currentLessonId, user?.id])

  const handleSaveNotes = async () => {
    try {
      await updateLessonProgress(currentLessonId, {
        user_id: user?.id,
        notes: notes,
        last_accessed_at: new Date().toISOString(),
      })
      
      // Show success message
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.textContent = 'Notes saved'
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 3000)
      
    } catch (error) {
      console.error('Failed to save notes:', error)
      setErrorMessage('Failed to save notes. Please try again.')
    }
  }

  const handleAddBookmark = async (timestamp: number) => {
    const newBookmarks = [...bookmarks, timestamp].sort((a, b) => a - b)
    setBookmarks(newBookmarks)
    
    try {
      await updateLessonProgress(currentLessonId, {
        user_id: user?.id,
        bookmarks: newBookmarks,
        last_accessed_at: new Date().toISOString(),
      })
      
      // Show success message
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.textContent = 'Bookmark added'
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 3000)
      
    } catch (error) {
      console.error('Failed to save bookmark:', error)
      setErrorMessage('Failed to save bookmark. Please try again.')
    }
  }

  const getLessonIcon = (lesson: Lesson) => {
    if (isLessonLocked(lesson)) {
      return <LockClosedIcon className="h-4 w-4 text-gray-400" />
    }
    
    const progress = lesson.progress?.progress_percentage || 0
    if (progress === 100) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />
    }
    
    if (progress > 0) {
      return <ClockIcon className="h-4 w-4 text-blue-500" />
    }
    
    return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        data-testid="course-sidebar"
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'} 
          ${isSidebarOpen ? 'w-80' : 'w-0'} 
          ${isMobile && !isSidebarOpen ? 'mobile-collapsed' : ''}
          transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden
        `}
      >
        <div className="flex flex-col h-full">
          {/* Course Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900 truncate">{course.title}</h1>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Close course menu"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{courseProgress()}% Complete</span>
              </div>
              <Progress value={courseProgress()} className="h-2" />
            </div>
          </div>

          {/* Course Content Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Course Content</h2>
              
              {modules.map((module) => (
                <div key={module.id} className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{module.title}</h3>
                  
                  <div className="space-y-2">
                    {lessons
                      .filter(lesson => lesson.module_id === module.id)
                      .map((lesson) => (
                        <button
                          key={lesson.id}
                          data-testid={`lesson-item-${lesson.id}`}
                          onClick={() => handleLessonChange(lesson.id)}
                          disabled={isLessonLocked(lesson)}
                          className={`
                            w-full text-left p-3 rounded-lg transition-colors
                            ${lesson.id === currentLessonId 
                              ? 'bg-blue-50 border border-blue-200 current' 
                              : 'hover:bg-gray-50'
                            }
                            ${isLessonLocked(lesson) ? 'opacity-50 cursor-not-allowed locked' : ''}
                          `}
                          aria-current={lesson.id === currentLessonId ? 'page' : undefined}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              data-testid={`lesson-progress-${lesson.id}`}
                              className={`mt-0.5 ${lesson.progress?.progress_percentage === 100 ? 'completed' : ''}`}
                            >
                              {getLessonIcon(lesson)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {lesson.title}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {formatDuration(lesson.estimated_duration_minutes)}
                              </p>
                              {lesson.progress && lesson.progress.progress_percentage > 0 && lesson.progress.progress_percentage < 100 && (
                                <div className="mt-2">
                                  <Progress 
                                    value={lesson.progress.progress_percentage} 
                                    className="h-1" 
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(isMobile || !isSidebarOpen) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Toggle course menu"
                >
                  <Bars3Icon className="h-5 w-5" />
                </Button>
              )}
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentLesson?.title}</h1>
                <p className="text-sm text-gray-600">{currentLesson?.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotes(true)}
                aria-label="Open notes"
              >
                <PencilIcon className="h-4 w-4" />
                Notes
              </Button>
              
              {bookmarks.length > 0 && (
                <Badge variant="secondary">
                  {bookmarks.length} bookmarks
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                aria-label={isAudioEnabled ? 'Mute audio' : 'Enable audio'}
              >
                {isAudioEnabled ? (
                  <SpeakerWaveIcon className="h-4 w-4" />
                ) : (
                  <SpeakerXMarkIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div 
          ref={mainContentRef}
          className="flex-1 overflow-y-auto"
          role="main"
          aria-label="Lesson content"
          tabIndex={0}
        >
          <div className="max-w-4xl mx-auto p-6">
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold">{currentLesson?.title}</h2>
                  <Badge variant="outline">
                    {formatDuration(currentLesson?.estimated_duration_minutes || 0)}
                  </Badge>
                </div>
                
                {currentLesson?.content_blocks?.some(block => block.block_type === 'video') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBookmark(Date.now())}
                    aria-label="Add bookmark"
                  >
                    <BookmarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Content Blocks */}
            {currentLesson?.content_blocks && currentLesson.content_blocks.length > 0 ? (
              <div className="space-y-8">
                {currentLesson.content_blocks
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((block, index) => (
                    <ContentBlockRenderer
                      key={block.id}
                      block={block}
                      onProgress={handleBlockProgress}
                      onComplete={handleBlockComplete}
                      lessonId={currentLessonId}
                      courseId={course.id}
                      previousBlockCompleted={index === 0 || completedBlocks.has(currentLesson.content_blocks![index - 1].id)}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content available for this lesson</h3>
                <p className="text-gray-600">This lesson is still being prepared.</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {previousLesson && (
                <Button
                  variant="outline"
                  onClick={() => handleLessonChange(previousLesson.id)}
                  className="btn"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-2" />
                  Previous Lesson
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              Lesson {currentLessonIndex + 1} of {lessons.length}
            </div>
            
            <div>
              {nextLesson && !isLessonLocked(nextLesson) && (
                <Button
                  onClick={() => handleLessonChange(nextLesson.id)}
                  className="btn"
                >
                  Next Lesson
                  <ChevronRightIcon className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      <Modal
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        title="Lesson Notes"
        size="lg"
      >
        <div className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes..."
            rows={8}
          />
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setShowNotes(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Course Completion Modal */}
      <Modal
        isOpen={showCourseComplete}
        onClose={() => setShowCourseComplete(false)}
        title="Course Complete!"
        size="md"
      >
        <div className="text-center space-y-6">
          <TrophyIcon className="h-16 w-16 text-yellow-500 mx-auto" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Congratulations!</h3>
            <p className="text-gray-600">You have completed this course.</p>
          </div>
          <div className="space-y-3">
            <Button className="w-full">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
            <Button variant="outline" className="w-full">
              Rate This Course
            </Button>
          </div>
        </div>
      </Modal>

      {/* Screen Reader Announcements */}
      <div role="region" aria-live="polite" className="sr-only">
        {/* Progress announcements will be inserted here */}
      </div>
    </div>
  )
}