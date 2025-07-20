/**
 * Mux Video Player Component
 * 
 * Advanced video player component with Mux integration, progress tracking,
 * and learning-focused features like bookmarks and note-taking.
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'

// Phase 1 UI Components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

// Types
import type { LessonProgress } from '@/lib/types/course'

// Services
import { CourseService } from '@/lib/services/courseService'
import { MuxService } from '@/lib/services/muxService'

// ============================================================================
// INTERFACES
// ============================================================================

export interface MuxVideoPlayerProps {
  playbackId: string
  lessonId: string
  courseId: string
  title?: string
  description?: string
  duration?: number
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  poster?: string
  onProgress?: (progress: LessonProgress) => void
  onComplete?: () => void
  className?: string
}

interface VideoState {
  isPlaying: boolean
  currentTime: number
  duration: number
  buffered: number
  volume: number
  muted: boolean
  playbackRate: number
  fullscreen: boolean
  loading: boolean
  error: string | null
}

interface Bookmark {
  id: string
  timestamp: number
  title: string
  note?: string
}

interface VideoNote {
  id: string
  timestamp: number
  content: string
  created_at: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MuxVideoPlayer({
  playbackId,
  lessonId,
  courseId,
  title,
  description,
  duration: initialDuration,
  autoplay = false,
  muted = false,
  controls = true,
  poster,
  onProgress,
  onComplete,
  className = ''
}: MuxVideoPlayerProps) {
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: initialDuration || 0,
    buffered: 0,
    volume: 1,
    muted,
    playbackRate: 1,
    fullscreen: false,
    loading: true,
    error: null
  })

  const [showNotes, setShowNotes] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [notes, setNotes] = useState<VideoNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [progress, setProgress] = useState<LessonProgress | null>(null)

  // Load existing progress and bookmarks
  useEffect(() => {
    if (user) {
      loadProgress()
    }
  }, [user, lessonId])

  // Set up progress tracking
  useEffect(() => {
    if (videoState.isPlaying && user) {
      progressIntervalRef.current = setInterval(() => {
        updateProgress()
      }, 5000) // Update every 5 seconds

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      }
    }
  }, [videoState.isPlaying, user])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setVideoState(prev => ({
        ...prev,
        duration: video.duration,
        loading: false
      }))
    }

    const handleTimeUpdate = () => {
      setVideoState(prev => ({
        ...prev,
        currentTime: video.currentTime
      }))
    }

    const handlePlay = () => {
      setVideoState(prev => ({ ...prev, isPlaying: true }))
    }

    const handlePause = () => {
      setVideoState(prev => ({ ...prev, isPlaying: false }))
    }

    const handleEnded = () => {
      setVideoState(prev => ({ ...prev, isPlaying: false }))
      handleVideoComplete()
    }

    const handleError = () => {
      setVideoState(prev => ({
        ...prev,
        error: 'Failed to load video',
        loading: false
      }))
    }

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(video.buffered.length - 1)
        setVideoState(prev => ({ ...prev, buffered }))
      }
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('progress', handleProgress)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      video.removeEventListener('progress', handleProgress)
    }
  }, [])

  const loadProgress = async () => {
    if (!user) return

    try {
      // Load existing progress from database
      // This would be implemented with the actual database query
      console.log('Loading progress for lesson:', lessonId)
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  const updateProgress = async () => {
    if (!user || !videoRef.current) return

    const video = videoRef.current
    const progressPercentage = video.duration > 0 
      ? Math.round((video.currentTime / video.duration) * 100)
      : 0

    const progressData = {
      status: progressPercentage >= 90 ? 'completed' as const : 'in_progress' as const,
      progress_percentage: progressPercentage,
      video_progress_seconds: Math.round(video.currentTime),
      video_watch_percentage: progressPercentage,
      time_spent_minutes: Math.round(video.currentTime / 60),
      last_accessed_at: new Date().toISOString()
    }

    try {
      const updatedProgress = await CourseService.updateLessonProgress(
        lessonId,
        user.id,
        progressData
      )
      
      setProgress(updatedProgress)
      
      if (onProgress) {
        onProgress(updatedProgress)
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const handleVideoComplete = async () => {
    if (!user) return

    try {
      await CourseService.updateLessonProgress(lessonId, user.id, {
        status: 'completed',
        progress_percentage: 100,
        completed_at: new Date().toISOString()
      })

      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Failed to mark lesson complete:', error)
    }
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

  const seekTo = (time: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = time
  }

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setVideoState(prev => ({ ...prev, playbackRate: rate }))
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setVideoState(prev => ({ ...prev, muted: video.muted }))
  }

  const changeVolume = (volume: number) => {
    const video = videoRef.current
    if (!video) return

    video.volume = volume
    setVideoState(prev => ({ ...prev, volume }))
  }

  const addBookmark = () => {
    const timestamp = videoState.currentTime
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      timestamp,
      title: `Bookmark at ${formatTime(timestamp)}`
    }

    setBookmarks(prev => [...prev, newBookmark])
  }

  const removeBookmark = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
  }

  const addNote = () => {
    if (!newNote.trim()) return

    const note: VideoNote = {
      id: Date.now().toString(),
      timestamp: videoState.currentTime,
      content: newNote.trim(),
      created_at: new Date().toISOString()
    }

    setNotes(prev => [...prev, note])
    setNewNote('')
  }

  const removeNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = videoState.duration > 0 
    ? (videoState.currentTime / videoState.duration) * 100 
    : 0

  const streamingUrl = MuxService.getStreamingUrl(playbackId)

  if (videoState.error) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <div className="text-red-600 mb-2">⚠️</div>
        <h3 className="font-semibold mb-2">Video Error</h3>
        <p className="text-gray-600">{videoState.error}</p>
        <Button 
          className="mt-4" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Card>
    )
  }

  return (
    <div className={`video-player ${className}`}>
      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-auto"
          poster={poster || MuxService.getThumbnailUrl(playbackId)}
          autoPlay={autoplay}
          muted={muted}
          controls={controls}
          playsInline
        >
          <source src={streamingUrl} type="application/x-mpegURL" />
          Your browser does not support the video tag.
        </video>

        {/* Loading Overlay */}
        {videoState.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white">Loading video...</div>
          </div>
        )}

        {/* Custom Controls Overlay */}
        {!controls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {videoState.isPlaying ? '⏸️' : '▶️'}
              </Button>
              
              <div className="flex-1">
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              
              <div className="text-white text-sm">
                {formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Info */}
      {(title || description) && (
        <div className="mt-4">
          {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
          {description && <p className="text-gray-600">{description}</p>}
        </div>
      )}

      {/* Progress Info */}
      {progress && (
        <Card className="p-4 mt-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-900">
                Progress: {progress.progress_percentage}%
              </div>
              <div className="text-xs text-blue-700">
                Watch time: {Math.round((progress.time_spent_minutes || 0))} minutes
              </div>
            </div>
            <div className="w-24 bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${progress.progress_percentage}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Video Tools */}
      <div className="flex gap-4 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBookmarks(!showBookmarks)}
        >
          📑 Bookmarks ({bookmarks.length})
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNotes(!showNotes)}
        >
          📝 Notes ({notes.length})
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={addBookmark}
        >
          ➕ Add Bookmark
        </Button>

        {/* Playback Speed */}
        <select
          value={videoState.playbackRate}
          onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
          className="px-3 py-1 border rounded text-sm"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <Card className="p-4 mt-4">
          <h4 className="font-semibold mb-3">Bookmarks</h4>
          {bookmarks.length === 0 ? (
            <p className="text-gray-500 text-sm">No bookmarks yet. Click "Add Bookmark" to save your current position.</p>
          ) : (
            <div className="space-y-2">
              {bookmarks.map(bookmark => (
                <div key={bookmark.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{bookmark.title}</div>
                    <div className="text-xs text-gray-600">{formatTime(bookmark.timestamp)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => seekTo(bookmark.timestamp)}
                    >
                      Go to
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeBookmark(bookmark.id)}
                      className="text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Notes Panel */}
      {showNotes && (
        <Card className="p-4 mt-4">
          <h4 className="font-semibold mb-3">Notes</h4>
          
          {/* Add Note */}
          <div className="mb-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note at the current timestamp..."
              rows={3}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-600">
                Current time: {formatTime(videoState.currentTime)}
              </span>
              <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>
                Add Note
              </Button>
            </div>
          </div>

          {/* Notes List */}
          {notes.length === 0 ? (
            <p className="text-gray-500 text-sm">No notes yet. Add your first note above.</p>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-600 font-medium">
                      {formatTime(note.timestamp)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => seekTo(note.timestamp)}
                      >
                        Go to
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeNote(note.id)}
                        className="text-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default MuxVideoPlayer