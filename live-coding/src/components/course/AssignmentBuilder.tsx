'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/components/auth/AuthProvider'
import { AssignmentRubric, AssignmentRubricLevel, AssignmentSubmission } from '@/lib/types/course'
import { 
  createAssignment, 
  updateAssignment, 
  deleteAssignment, 
  submitAssignment, 
  gradeAssignment,
  getAssignmentSubmissions 
} from '@/lib/services/courseService'
import { uploadFile, deleteFile } from '@/lib/services/fileUploadService'
import { 
  PlusIcon, 
  TrashIcon, 
  DocumentIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

interface Assignment {
  id?: string
  title: string
  instructions: string
  submissionType: 'text' | 'file' | 'url' | 'code'
  maxPoints: number
  dueDate?: string
  rubric?: AssignmentRubric[]
  allowLateSubmissions?: boolean
  requireComments?: boolean
  enablePeerReview?: boolean
  fileSettings?: {
    maxFileSize: number
    maxFiles: number
    allowedTypes: string[]
  }
  textSettings?: {
    minWords?: number
    maxWords?: number
  }
  codeSettings?: {
    language?: string
    enableSyntaxHighlighting?: boolean
  }
  submissions?: AssignmentSubmission[]
}

interface AssignmentBuilderProps {
  onSave: (assignment: Assignment) => void
  onCancel: () => void
  lessonId: string
  initialAssignment?: Assignment
}

const SUBMISSION_TYPES = [
  { value: 'text', label: 'Text Entry', description: 'Students can enter text directly' },
  { value: 'file', label: 'File Upload', description: 'Students can upload files' },
  { value: 'url', label: 'URL/Link', description: 'Students can submit URLs or links' },
  { value: 'code', label: 'Code', description: 'Students can submit code directly' },
]

const ALLOWED_FILE_TYPES = [
  'PDF', 'DOC', 'DOCX', 'TXT', 'RTF', 'ODT',
  'XLS', 'XLSX', 'CSV', 'ODS',
  'PPT', 'PPTX', 'ODP',
  'JPG', 'JPEG', 'PNG', 'GIF', 'SVG',
  'ZIP', 'RAR', '7Z',
  'MP3', 'MP4', 'AVI', 'MOV'
]

const PROGRAMMING_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
  'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'html', 'css'
]

export function AssignmentBuilder({ onSave, onCancel, lessonId, initialAssignment }: AssignmentBuilderProps) {
  const { user } = useAuth()
  const [assignment, setAssignment] = useState<Assignment>({
    title: '',
    instructions: '',
    submissionType: 'text',
    maxPoints: 100,
    allowLateSubmissions: false,
    requireComments: false,
    enablePeerReview: false,
    fileSettings: {
      maxFileSize: 10,
      maxFiles: 1,
      allowedTypes: ['PDF', 'DOC', 'DOCX', 'TXT'],
    },
    textSettings: {
      minWords: 0,
      maxWords: 1000,
    },
    codeSettings: {
      language: 'javascript',
      enableSyntaxHighlighting: true,
    },
    rubric: [],
    ...initialAssignment,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showSubmissions, setShowSubmissions] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null)
  const [gradingData, setGradingData] = useState({ score: '', feedback: '' })

  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [assignment])

  const validateAssignment = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {}

    if (!assignment.title.trim()) {
      newErrors.title = 'Assignment title is required'
    }

    if (!assignment.instructions.trim()) {
      newErrors.instructions = 'Assignment instructions are required'
    }

    if (assignment.maxPoints <= 0) {
      newErrors.maxPoints = 'Maximum points must be greater than 0'
    }

    if (assignment.dueDate) {
      const dueDate = new Date(assignment.dueDate)
      const now = new Date()
      if (dueDate <= now) {
        newErrors.dueDate = 'Due date must be in the future'
      }
    }

    if (assignment.submissionType === 'file') {
      if (assignment.fileSettings?.maxFileSize && assignment.fileSettings.maxFileSize <= 0) {
        newErrors.maxFileSize = 'Maximum file size must be greater than 0'
      }
      if (assignment.fileSettings?.maxFiles && assignment.fileSettings.maxFiles <= 0) {
        newErrors.maxFiles = 'Maximum number of files must be greater than 0'
      }
    }

    if (assignment.submissionType === 'text') {
      if (assignment.textSettings?.minWords && assignment.textSettings?.maxWords) {
        if (assignment.textSettings.minWords > assignment.textSettings.maxWords) {
          newErrors.wordCount = 'Minimum word count cannot be greater than maximum'
        }
      }
    }

    return newErrors
  }, [assignment])

  const handleSaveAssignment = async () => {
    const validationErrors = validateAssignment()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Sanitize assignment data
    const sanitizedAssignment = {
      ...assignment,
      title: assignment.title.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
      instructions: assignment.instructions.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
    }

    try {
      if (assignment.id) {
        await updateAssignment(sanitizedAssignment)
      } else {
        await createAssignment({ ...sanitizedAssignment, lesson_id: lessonId })
      }

      onSave(sanitizedAssignment)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to save assignment:', error)
      setErrors({ submit: 'Failed to save assignment. Please try again.' })
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true)
    } else {
      onCancel()
    }
  }

  const confirmCancel = () => {
    setShowCancelConfirm(false)
    onCancel()
  }

  const addRubricCriteria = () => {
    const newCriteria: AssignmentRubric = {
      criteria: '',
      description: '',
      points: 25,
      levels: [
        { name: 'Excellent', description: 'Exceeds expectations', points: 25 },
        { name: 'Good', description: 'Meets expectations', points: 20 },
        { name: 'Fair', description: 'Partially meets expectations', points: 15 },
        { name: 'Poor', description: 'Does not meet expectations', points: 10 },
      ],
    }

    setAssignment(prev => ({
      ...prev,
      rubric: [...(prev.rubric || []), newCriteria]
    }))
  }

  const updateRubricCriteria = (index: number, field: keyof AssignmentRubric, value: any) => {
    setAssignment(prev => ({
      ...prev,
      rubric: prev.rubric?.map((criteria, i) => 
        i === index ? { ...criteria, [field]: value } : criteria
      )
    }))
  }

  const removeRubricCriteria = (index: number) => {
    setAssignment(prev => ({
      ...prev,
      rubric: prev.rubric?.filter((_, i) => i !== index)
    }))
  }

  const addRubricLevel = (criteriaIndex: number) => {
    const newLevel: AssignmentRubricLevel = {
      name: '',
      description: '',
      points: 0,
    }

    setAssignment(prev => ({
      ...prev,
      rubric: prev.rubric?.map((criteria, i) => 
        i === criteriaIndex 
          ? { ...criteria, levels: [...criteria.levels, newLevel] }
          : criteria
      )
    }))
  }

  const updateRubricLevel = (criteriaIndex: number, levelIndex: number, field: keyof AssignmentRubricLevel, value: any) => {
    setAssignment(prev => ({
      ...prev,
      rubric: prev.rubric?.map((criteria, i) => 
        i === criteriaIndex 
          ? {
              ...criteria,
              levels: criteria.levels.map((level, j) => 
                j === levelIndex ? { ...level, [field]: value } : level
              )
            }
          : criteria
      )
    }))
  }

  const removeRubricLevel = (criteriaIndex: number, levelIndex: number) => {
    setAssignment(prev => ({
      ...prev,
      rubric: prev.rubric?.map((criteria, i) => 
        i === criteriaIndex 
          ? { ...criteria, levels: criteria.levels.filter((_, j) => j !== levelIndex) }
          : criteria
      )
    }))
  }

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return

    try {
      await gradeAssignment(selectedSubmission.id, {
        score: parseInt(gradingData.score),
        feedback: gradingData.feedback,
        graded_by: user?.id,
      })

      // Update local state
      setAssignment(prev => ({
        ...prev,
        submissions: prev.submissions?.map(sub => 
          sub.id === selectedSubmission.id 
            ? { ...sub, score: parseInt(gradingData.score), feedback: gradingData.feedback, status: 'graded' }
            : sub
        )
      }))

      setSelectedSubmission(null)
      setGradingData({ score: '', feedback: '' })
      
      // Show success message
      setErrors({ success: 'Grade saved successfully' })
      setTimeout(() => setErrors({}), 3000)
    } catch (error) {
      console.error('Failed to grade submission:', error)
      setErrors({ grading: 'Failed to save grade. Please try again.' })
    }
  }

  const getTotalRubricPoints = () => {
    return assignment.rubric?.reduce((total, criteria) => total + criteria.points, 0) || 0
  }

  const getSubmissionStats = () => {
    const submissions = assignment.submissions || []
    return {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'submitted').length,
      graded: submissions.filter(s => s.status === 'graded').length,
    }
  }

  const renderSubmissionTypeSettings = () => {
    switch (assignment.submissionType) {
      case 'text':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Students can enter text directly</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Minimum word count</label>
                <Input
                  type="number"
                  min="0"
                  value={assignment.textSettings?.minWords || ''}
                  onChange={(e) => setAssignment(prev => ({
                    ...prev,
                    textSettings: {
                      ...prev.textSettings,
                      minWords: parseInt(e.target.value) || 0
                    }
                  }))}
                  aria-label="Minimum word count"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Maximum word count</label>
                <Input
                  type="number"
                  min="0"
                  value={assignment.textSettings?.maxWords || ''}
                  onChange={(e) => setAssignment(prev => ({
                    ...prev,
                    textSettings: {
                      ...prev.textSettings,
                      maxWords: parseInt(e.target.value) || 1000
                    }
                  }))}
                  aria-label="Maximum word count"
                />
              </div>
            </div>
            {errors.wordCount && <p className="text-red-500 text-sm">{errors.wordCount}</p>}
          </div>
        )

      case 'file':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Students can upload files</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Maximum file size (MB)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={assignment.fileSettings?.maxFileSize || ''}
                  onChange={(e) => setAssignment(prev => ({
                    ...prev,
                    fileSettings: {
                      ...prev.fileSettings!,
                      maxFileSize: parseInt(e.target.value) || 10
                    }
                  }))}
                  aria-label="Maximum file size (MB)"
                />
                {errors.maxFileSize && <p className="text-red-500 text-sm mt-1">{errors.maxFileSize}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Maximum number of files</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={assignment.fileSettings?.maxFiles || ''}
                  onChange={(e) => setAssignment(prev => ({
                    ...prev,
                    fileSettings: {
                      ...prev.fileSettings!,
                      maxFiles: parseInt(e.target.value) || 1
                    }
                  }))}
                  aria-label="Maximum number of files"
                />
                {errors.maxFiles && <p className="text-red-500 text-sm mt-1">{errors.maxFiles}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Allowed file types</label>
              <div className="grid grid-cols-4 gap-2">
                {ALLOWED_FILE_TYPES.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={assignment.fileSettings?.allowedTypes.includes(type) || false}
                      onChange={(e) => {
                        const allowedTypes = assignment.fileSettings?.allowedTypes || []
                        const newTypes = e.target.checked
                          ? [...allowedTypes, type]
                          : allowedTypes.filter(t => t !== type)
                        
                        setAssignment(prev => ({
                          ...prev,
                          fileSettings: {
                            ...prev.fileSettings!,
                            allowedTypes: newTypes
                          }
                        }))
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Currently selected: {assignment.fileSettings?.allowedTypes.join(', ') || 'PDF, DOC, DOCX, TXT'}
              </p>
            </div>
          </div>
        )

      case 'url':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Students can submit URLs or links</p>
              <p className="text-xs text-blue-600 mt-1">
                Example: Portfolio website, GitHub repository, etc.
              </p>
            </div>
          </div>
        )

      case 'code':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Students can submit code directly</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Programming language</label>
                <Select
                  value={assignment.codeSettings?.language || 'javascript'}
                  onChange={(value) => setAssignment(prev => ({
                    ...prev,
                    codeSettings: {
                      ...prev.codeSettings,
                      language: value
                    }
                  }))}
                  options={PROGRAMMING_LANGUAGES.map(lang => ({
                    value: lang,
                    label: lang.charAt(0).toUpperCase() + lang.slice(1)
                  }))}
                  aria-label="Programming language"
                />
              </div>
              <div className="flex items-center">
                <Switch
                  checked={assignment.codeSettings?.enableSyntaxHighlighting || false}
                  onChange={(checked) => setAssignment(prev => ({
                    ...prev,
                    codeSettings: {
                      ...prev.codeSettings,
                      enableSyntaxHighlighting: checked
                    }
                  }))}
                  aria-label="Enable syntax highlighting"
                />
                <label className="ml-2 text-sm font-medium">Enable syntax highlighting</label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!user || user.role !== 'instructor') {
    return (
      <Card className="p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Only instructors can create assignments.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Assignment Builder</h1>
        <p className="text-gray-600">Create and manage assignments for your lesson.</p>
      </div>

      {/* Assignment Details */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Assignment Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Assignment Title *</label>
            <Input
              value={assignment.title}
              onChange={(e) => setAssignment(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter assignment title"
              className={errors.title ? 'border-red-500' : ''}
              aria-label="Assignment title"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1" role="alert">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Instructions *</label>
            <Textarea
              value={assignment.instructions}
              onChange={(e) => setAssignment(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Enter assignment instructions"
              rows={4}
              className={errors.instructions ? 'border-red-500' : ''}
              aria-label="Assignment instructions"
            />
            {errors.instructions && <p className="text-red-500 text-sm mt-1" role="alert">{errors.instructions}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <Input
                type="date"
                value={assignment.dueDate?.split('T')[0] || ''}
                onChange={(e) => setAssignment(prev => ({ 
                  ...prev, 
                  dueDate: e.target.value ? `${e.target.value}T23:59:59Z` : undefined 
                }))}
                className={errors.dueDate ? 'border-red-500' : ''}
                aria-label="Due Date"
              />
              {errors.dueDate && <p className="text-red-500 text-sm mt-1" role="alert">{errors.dueDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Due Time</label>
              <Input
                type="time"
                value={assignment.dueDate ? new Date(assignment.dueDate).toTimeString().slice(0, 5) : '23:59'}
                onChange={(e) => {
                  const date = assignment.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0]
                  setAssignment(prev => ({ 
                    ...prev, 
                    dueDate: `${date}T${e.target.value}:00Z`
                  }))
                }}
                aria-label="Due Time"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Maximum Points</label>
              <Input
                type="number"
                min="1"
                value={assignment.maxPoints}
                onChange={(e) => setAssignment(prev => ({ 
                  ...prev, 
                  maxPoints: parseInt(e.target.value) || 100 
                }))}
                className={errors.maxPoints ? 'border-red-500' : ''}
                aria-label="Maximum Points"
              />
              {errors.maxPoints && <p className="text-red-500 text-sm mt-1" role="alert">{errors.maxPoints}</p>}
            </div>
          </div>
        </div>
      </Card>

      {/* Submission Settings */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Submission Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Submission Type</label>
            <Select
              value={assignment.submissionType}
              onChange={(value) => setAssignment(prev => ({ 
                ...prev, 
                submissionType: value as 'text' | 'file' | 'url' | 'code'
              }))}
              options={SUBMISSION_TYPES.map(type => ({
                value: type.value,
                label: type.label,
                description: type.description,
              }))}
              aria-label="Submission Type"
            />
          </div>

          {renderSubmissionTypeSettings()}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Allow late submissions</label>
              <Switch
                checked={assignment.allowLateSubmissions || false}
                onChange={(checked) => setAssignment(prev => ({ ...prev, allowLateSubmissions: checked }))}
                aria-label="Allow late submissions"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Require submission comments</label>
              <Switch
                checked={assignment.requireComments || false}
                onChange={(checked) => setAssignment(prev => ({ ...prev, requireComments: checked }))}
                aria-label="Require submission comments"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable peer review</label>
              <Switch
                checked={assignment.enablePeerReview || false}
                onChange={(checked) => setAssignment(prev => ({ ...prev, enablePeerReview: checked }))}
                aria-label="Enable peer review"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Grading Rubric */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Grading Rubric</h2>
          <Button onClick={addRubricCriteria} variant="outline" size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Criteria
          </Button>
        </div>

        {assignment.rubric && assignment.rubric.length > 0 ? (
          <div className="space-y-4">
            {assignment.rubric.map((criteria, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Criteria Name</label>
                      <Input
                        value={criteria.criteria}
                        onChange={(e) => updateRubricCriteria(index, 'criteria', e.target.value)}
                        placeholder="Enter criteria name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Input
                        value={criteria.description}
                        onChange={(e) => updateRubricCriteria(index, 'description', e.target.value)}
                        placeholder="Describe this criteria"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Points</label>
                      <Input
                        type="number"
                        min="1"
                        value={criteria.points}
                        onChange={(e) => updateRubricCriteria(index, 'points', parseInt(e.target.value) || 0)}
                        aria-label="Points for this criteria"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRubricCriteria(index)}
                    aria-label="Remove criteria"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Performance Levels</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addRubricLevel(index)}
                    >
                      Add Level
                    </Button>
                  </div>
                  {criteria.levels.map((level, levelIndex) => (
                    <div key={levelIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                      <Input
                        value={level.name}
                        onChange={(e) => updateRubricLevel(index, levelIndex, 'name', e.target.value)}
                        placeholder="Level name"
                      />
                      <Input
                        value={level.description}
                        onChange={(e) => updateRubricLevel(index, levelIndex, 'description', e.target.value)}
                        placeholder="Level description"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={level.points}
                        onChange={(e) => updateRubricLevel(index, levelIndex, 'points', parseInt(e.target.value) || 0)}
                        aria-label="Points for this level"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRubricLevel(index, levelIndex)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-right">
              <Badge variant="secondary">Total: {getTotalRubricPoints()} points</Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No rubric criteria</h3>
            <p className="text-gray-600">Add criteria to create a grading rubric</p>
          </div>
        )}
      </Card>

      {/* Submissions Overview (if assignment exists) */}
      {assignment.id && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Submissions Overview</h2>
            <Button onClick={() => setShowSubmissions(true)} variant="outline">
              <EyeIcon className="h-4 w-4 mr-2" />
              View Submissions
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getSubmissionStats().total}</div>
              <div className="text-sm text-gray-600">submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{getSubmissionStats().pending}</div>
              <div className="text-sm text-gray-600">pending review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{getSubmissionStats().graded}</div>
              <div className="text-sm text-gray-600">graded</div>
            </div>
          </div>
        </Card>
      )}

      {/* Error/Success Messages */}
      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{errors.submit}</p>
        </div>
      )}
      {errors.success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{errors.success}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSaveAssignment}>
          Save Assignment
        </Button>
      </div>

      {/* Submissions Modal */}
      <Modal
        isOpen={showSubmissions}
        onClose={() => setShowSubmissions(false)}
        title="Assignment Submissions"
        size="lg"
      >
        <div className="space-y-4">
          {assignment.submissions && assignment.submissions.length > 0 ? (
            assignment.submissions.map((submission) => (
              <div key={submission.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{submission.user_name || `User ${submission.user_id}`}</h4>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                    <Badge 
                      variant={submission.status === 'graded' ? 'success' : 'warning'}
                      className="mt-1"
                    >
                      {submission.status}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    {submission.user_name || `User ${submission.user_id}`}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No submissions yet</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Submission Details Modal */}
      <Modal
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        title="Submission Details"
        size="lg"
      >
        {selectedSubmission && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Student: {selectedSubmission.user_name || `User ${selectedSubmission.user_id}`}</h4>
              <p className="text-sm text-gray-600">
                Submitted: {new Date(selectedSubmission.submitted_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <h5 className="font-medium mb-2">Submission Content</h5>
              <div className="bg-gray-50 rounded-lg p-4">
                {selectedSubmission.content && (
                  <p className="whitespace-pre-wrap">{selectedSubmission.content}</p>
                )}
                {selectedSubmission.file_url && (
                  <div className="flex items-center gap-2">
                    <DocumentIcon className="h-5 w-5" />
                    <a 
                      href={selectedSubmission.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedSubmission.file_name || 'Download File'}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {selectedSubmission.status !== 'graded' && (
              <div className="space-y-4 pt-4 border-t">
                <h5 className="font-medium">Grade Submission</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Score</label>
                    <Input
                      type="number"
                      min="0"
                      max={assignment.maxPoints}
                      value={gradingData.score}
                      onChange={(e) => setGradingData(prev => ({ ...prev, score: e.target.value }))}
                      placeholder={`Out of ${assignment.maxPoints}`}
                      aria-label="Score"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Feedback</label>
                  <Textarea
                    value={gradingData.feedback}
                    onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                    placeholder="Provide feedback to the student"
                    rows={4}
                    aria-label="Feedback"
                  />
                </div>
                <Button onClick={handleGradeSubmission}>
                  Save Grade
                </Button>
              </div>
            )}

            {selectedSubmission.status === 'graded' && (
              <div className="pt-4 border-t">
                <h5 className="font-medium mb-2">Grade</h5>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="font-medium">Score: {selectedSubmission.score}/{assignment.maxPoints}</p>
                  {selectedSubmission.feedback && (
                    <p className="mt-2 text-sm">{selectedSubmission.feedback}</p>
                  )}
                </div>
              </div>
            )}

            {errors.grading && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.grading}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Discard changes?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You have unsaved changes. Are you sure you want to discard them?
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              Keep Editing
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Discard Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}