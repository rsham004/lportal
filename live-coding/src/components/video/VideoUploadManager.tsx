/**
 * Video Upload Manager Component
 * 
 * Handles video file uploads to Mux with progress tracking,
 * processing status, and integration with lesson management.
 */

'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'

// Phase 1 UI Components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'

// Phase 2 Authorization
import { Can } from '@/components/authorization/Can'

// Services
import { MuxService, type MuxUploadUrl, type VideoUploadProgress } from '@/lib/services/muxService'
import { CourseService } from '@/lib/services/courseService'

// Types
import type { Lesson, ContentType } from '@/lib/types/course'

// ============================================================================
// INTERFACES
// ============================================================================

export interface VideoUploadManagerProps {
  lessonId?: string
  courseId: string
  moduleId: string
  onUploadComplete?: (lesson: Lesson) => void
  onCancel?: () => void
  className?: string
}

interface UploadState {
  isUploading: boolean
  progress: number
  status: 'idle' | 'uploading' | 'processing' | 'ready' | 'error'
  error: string | null
  uploadUrl: MuxUploadUrl | null
  assetId: string | null
  playbackId: string | null
}

interface LessonData {
  title: string
  description: string
  estimated_duration_minutes: number
  is_required: boolean
  is_preview: boolean
  order_index: number
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VideoUploadManager({
  lessonId,
  courseId,
  moduleId,
  onUploadComplete,
  onCancel,
  className = ''
}: VideoUploadManagerProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    status: 'idle',
    error: null,
    uploadUrl: null,
    assetId: null,
    playbackId: null
  })

  const [lessonData, setLessonData] = useState<LessonData>({
    title: '',
    description: '',
    estimated_duration_minutes: 10,
    is_required: true,
    is_preview: false,
    order_index: 0
  })

  const [dragOver, setDragOver] = useState(false)

  // File selection handlers
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a valid video file'
      }))
      return
    }

    // Check file size (limit to 5GB)
    const maxSize = 5 * 1024 * 1024 * 1024 // 5GB
    if (file.size > maxSize) {
      setUploadState(prev => ({
        ...prev,
        error: 'File size must be less than 5GB'
      }))
      return
    }

    setSelectedFile(file)
    setUploadState(prev => ({
      ...prev,
      error: null,
      status: 'idle'
    }))

    // Auto-fill lesson title from filename if empty
    if (!lessonData.title) {
      const filename = file.name.replace(/\.[^/.]+$/, '') // Remove extension
      setLessonData(prev => ({
        ...prev,
        title: filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }, [])

  // Upload process
  const startUpload = async () => {
    if (!selectedFile || !user) return

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      status: 'uploading',
      progress: 0,
      error: null
    }))

    try {
      // Step 1: Create upload URL
      const uploadUrl = await MuxService.createUploadUrl({
        mp4Support: 'standard',
        playbackPolicy: ['public']
      })

      setUploadState(prev => ({
        ...prev,
        uploadUrl
      }))

      // Step 2: Upload file to Mux
      await uploadFileToMux(uploadUrl.url, selectedFile)

      // Step 3: Poll for asset creation
      await pollForAsset(uploadUrl.id)

    } catch (error: any) {
      console.error('Upload failed:', error)
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        status: 'error',
        error: error.message || 'Upload failed'
      }))
    }
  }

  const uploadFileToMux = async (uploadUrl: string, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadState(prev => ({
            ...prev,
            progress
          }))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadState(prev => ({
            ...prev,
            status: 'processing',
            progress: 100
          }))
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.open('PUT', uploadUrl)
      xhr.send(file)
    })
  }

  const pollForAsset = async (uploadId: string): Promise<void> => {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0

    const poll = async (): Promise<void> => {
      try {
        const upload = await MuxService.getUploadStatus(uploadId)
        
        if (upload.status === 'asset_created') {
          // Asset created, now we need to get the asset details
          // This would typically be handled by webhooks in production
          setUploadState(prev => ({
            ...prev,
            status: 'ready',
            isUploading: false
          }))
          
          // Create the lesson with video data
          await createLessonWithVideo()
          return
        }

        if (upload.status === 'errored') {
          throw new Error('Video processing failed')
        }

        attempts++
        if (attempts >= maxAttempts) {
          throw new Error('Upload timeout - please try again')
        }

        // Continue polling
        setTimeout(poll, 5000)
      } catch (error) {
        throw error
      }
    }

    await poll()
  }

  const createLessonWithVideo = async () => {
    if (!user) return

    try {
      const lesson = await CourseService.createLesson({
        title: lessonData.title,
        description: lessonData.description,
        module_id: moduleId,
        course_id: courseId,
        order_index: lessonData.order_index,
        content_type: 'video' as ContentType,
        estimated_duration_minutes: lessonData.estimated_duration_minutes,
        is_required: lessonData.is_required,
        is_preview: lessonData.is_preview,
        // Mux data would be added here when available from webhooks
        mux_asset_id: uploadState.assetId,
        mux_playback_id: uploadState.playbackId
      }, user.id)

      if (onUploadComplete) {
        onUploadComplete(lesson)
      }
    } catch (error: any) {
      setUploadState(prev => ({
        ...prev,
        error: error.message || 'Failed to create lesson'
      }))
    }
  }

  const cancelUpload = async () => {
    if (uploadState.uploadUrl) {
      try {
        await MuxService.cancelUpload(uploadState.uploadUrl.id)
      } catch (error) {
        console.error('Failed to cancel upload:', error)
      }
    }

    setUploadState({
      isUploading: false,
      progress: 0,
      status: 'idle',
      error: null,
      uploadUrl: null,
      assetId: null,
      playbackId: null
    })
    setSelectedFile(null)
    
    if (onCancel) {
      onCancel()
    }
  }

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      status: 'idle',
      error: null,
      uploadUrl: null,
      assetId: null,
      playbackId: null
    })
    setSelectedFile(null)
    setLessonData({
      title: '',
      description: '',
      estimated_duration_minutes: 10,
      is_required: true,
      is_preview: false,
      order_index: 0
    })
  }

  const updateLessonData = (field: keyof LessonData, value: any) => {
    setLessonData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusMessage = (): string => {
    switch (uploadState.status) {
      case 'uploading':
        return `Uploading... ${uploadState.progress}%`
      case 'processing':
        return 'Processing video...'
      case 'ready':
        return 'Video ready!'
      case 'error':
        return uploadState.error || 'Upload failed'
      default:
        return 'Ready to upload'
    }
  }

  const getStatusColor = (): string => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return 'text-blue-600'
      case 'ready':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Can action="create" subject="Course">
      <Card className={`p-6 ${className}`}>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Upload Video Lesson</h3>
            <p className="text-gray-600 text-sm">
              Upload a video file to create a new lesson. Supported formats: MP4, MOV, AVI, WebM
            </p>
          </div>

          {/* File Upload Area */}
          {!selectedFile && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="text-4xl mb-4">🎥</div>
              <div className="text-lg font-medium mb-2">
                Drop your video file here
              </div>
              <div className="text-gray-600 mb-4">
                or click to browse files
              </div>
              <Button onClick={() => fileInputRef.current?.click()}>
                Select Video File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="text-xs text-gray-500 mt-4">
                Maximum file size: 5GB
              </div>
            </div>
          )}

          {/* Selected File Info */}
          {selectedFile && (
            <Card className="p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedFile.name}</div>
                  <div className="text-sm text-gray-600">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </div>
                </div>
                {!uploadState.isUploading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              {/* Upload Progress */}
              {uploadState.isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${getStatusColor()}`}>
                      {getStatusMessage()}
                    </span>
                    {uploadState.status === 'uploading' && (
                      <span className="text-sm text-gray-600">
                        {uploadState.progress}%
                      </span>
                    )}
                  </div>
                  {uploadState.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>
                  )}
                  {uploadState.status === 'processing' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {uploadState.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {uploadState.error}
                </div>
              )}
            </Card>
          )}

          {/* Lesson Details Form */}
          {selectedFile && !uploadState.isUploading && (
            <div className="space-y-4">
              <h4 className="font-semibold">Lesson Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Lesson Title *
                  </label>
                  <Input
                    value={lessonData.title}
                    onChange={(e) => updateLessonData('title', e.target.value)}
                    placeholder="Enter lesson title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estimated Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="480"
                    value={lessonData.estimated_duration_minutes}
                    onChange={(e) => updateLessonData('estimated_duration_minutes', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  value={lessonData.description}
                  onChange={(e) => updateLessonData('description', e.target.value)}
                  placeholder="Describe what students will learn in this lesson"
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={lessonData.is_required}
                    onChange={(e) => updateLessonData('is_required', e.target.checked)}
                    className="mr-2"
                  />
                  Required lesson
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={lessonData.is_preview}
                    onChange={(e) => updateLessonData('is_preview', e.target.checked)}
                    className="mr-2"
                  />
                  Free preview
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={uploadState.isUploading ? cancelUpload : (onCancel || resetUpload)}
            >
              {uploadState.isUploading ? 'Cancel Upload' : 'Cancel'}
            </Button>

            <div className="flex gap-2">
              {uploadState.status === 'ready' && (
                <Button variant="outline" onClick={resetUpload}>
                  Upload Another
                </Button>
              )}
              
              {selectedFile && !uploadState.isUploading && uploadState.status !== 'ready' && (
                <Button
                  onClick={startUpload}
                  disabled={!lessonData.title.trim()}
                >
                  Start Upload
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Can>
  )
}

export default VideoUploadManager