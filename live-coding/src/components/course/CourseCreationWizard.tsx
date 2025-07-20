/**
 * Course Creation Wizard Component
 * 
 * Multi-step wizard for creating and editing courses with comprehensive
 * content management features and integration with Phase 1 UI components.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { z } from 'zod'

// Phase 1 UI Components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Form, FormField, FormLabel, FormError, FormProvider, useForm } from '@/components/ui/Form'
import { AppLayout, AppHeader, AppMain, AppContent } from '@/components/ui/AppLayout'

// Phase 2 Authorization
import { Can } from '@/components/authorization/Can'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Course Types
import { 
  CourseSchema, 
  DifficultyLevel, 
  CourseStatus,
  type CreateCourseInput,
  type Course 
} from '@/lib/types/course'

// Database
import { supabase } from '@/lib/database/supabase'

// ============================================================================
// WIZARD STEPS
// ============================================================================

enum WizardStep {
  BASIC_INFO = 'basic_info',
  CONTENT_STRUCTURE = 'content_structure',
  SETTINGS = 'settings',
  REVIEW = 'review'
}

const WIZARD_STEPS = [
  { key: WizardStep.BASIC_INFO, title: 'Basic Information', description: 'Course title, description, and objectives' },
  { key: WizardStep.CONTENT_STRUCTURE, title: 'Content Structure', description: 'Modules and lessons organization' },
  { key: WizardStep.SETTINGS, title: 'Settings', description: 'Pricing, access, and publishing options' },
  { key: WizardStep.REVIEW, title: 'Review', description: 'Review and publish your course' }
]

// ============================================================================
// FORM SCHEMAS
// ============================================================================

const BasicInfoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  subtitle: z.string().max(300, 'Subtitle must be less than 300 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be less than 5000 characters'),
  learning_objectives: z.array(z.string().min(1)).min(1, 'At least one learning objective is required').max(10, 'Maximum 10 learning objectives'),
  prerequisites: z.array(z.string()).max(10, 'Maximum 10 prerequisites'),
  target_audience: z.array(z.string()).max(10, 'Maximum 10 target audience items'),
  difficulty_level: z.nativeEnum(DifficultyLevel),
  estimated_duration_hours: z.number().min(0.5, 'Duration must be at least 30 minutes').max(1000, 'Duration must be less than 1000 hours'),
  language: z.string().length(2, 'Language must be a 2-letter code'),
  category_id: z.string().uuid('Invalid category').optional(),
  tags: z.array(z.string()).max(20, 'Maximum 20 tags')
})

const SettingsSchema = z.object({
  is_free: z.boolean(),
  price: z.number().min(0, 'Price must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 letters').optional(),
  max_enrollments: z.number().min(1, 'Must allow at least 1 enrollment').optional(),
  enrollment_start_date: z.string().optional(),
  enrollment_end_date: z.string().optional(),
  course_start_date: z.string().optional(),
  course_end_date: z.string().optional(),
  is_featured: z.boolean(),
  status: z.nativeEnum(CourseStatus)
})

// ============================================================================
// INTERFACES
// ============================================================================

export interface CourseCreationWizardProps {
  courseId?: string // For editing existing course
  onComplete?: (course: Course) => void
  onCancel?: () => void
}

interface WizardState {
  currentStep: WizardStep
  basicInfo: Partial<z.infer<typeof BasicInfoSchema>>
  settings: Partial<z.infer<typeof SettingsSchema>>
  isSubmitting: boolean
  errors: Record<string, string>
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CourseCreationWizard({ 
  courseId, 
  onComplete, 
  onCancel 
}: CourseCreationWizardProps) {
  const { user } = useAuth()
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: WizardStep.BASIC_INFO,
    basicInfo: {
      difficulty_level: DifficultyLevel.BEGINNER,
      language: 'en',
      learning_objectives: [''],
      prerequisites: [],
      target_audience: [],
      tags: []
    },
    settings: {
      is_free: true,
      currency: 'USD',
      is_featured: false,
      status: CourseStatus.DRAFT
    },
    isSubmitting: false,
    errors: {}
  })

  const [categories, setCategories] = useState<Array<{ id: string; title: string }>>([])
  const [existingCourse, setExistingCourse] = useState<Course | null>(null)

  // Load categories on mount
  useEffect(() => {
    loadCategories()
    if (courseId) {
      loadExistingCourse(courseId)
    }
  }, [courseId])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('course_categories')
        .select('id, title')
        .order('title')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadExistingCourse = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      setExistingCourse(data)
      setWizardState(prev => ({
        ...prev,
        basicInfo: {
          title: data.title,
          subtitle: data.subtitle || '',
          description: data.description,
          learning_objectives: data.learning_objectives,
          prerequisites: data.prerequisites || [],
          target_audience: data.target_audience || [],
          difficulty_level: data.difficulty_level,
          estimated_duration_hours: data.estimated_duration_hours,
          language: data.language,
          category_id: data.category_id || undefined,
          tags: data.tags || []
        },
        settings: {
          is_free: data.is_free,
          price: data.price || undefined,
          currency: data.currency || 'USD',
          max_enrollments: data.max_enrollments || undefined,
          enrollment_start_date: data.enrollment_start_date || undefined,
          enrollment_end_date: data.enrollment_end_date || undefined,
          course_start_date: data.course_start_date || undefined,
          course_end_date: data.course_end_date || undefined,
          is_featured: data.is_featured,
          status: data.status
        }
      }))
    } catch (error) {
      console.error('Failed to load course:', error)
    }
  }

  const updateWizardState = (updates: Partial<WizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }))
  }

  const goToStep = (step: WizardStep) => {
    updateWizardState({ currentStep: step })
  }

  const nextStep = () => {
    const currentIndex = WIZARD_STEPS.findIndex(s => s.key === wizardState.currentStep)
    if (currentIndex < WIZARD_STEPS.length - 1) {
      goToStep(WIZARD_STEPS[currentIndex + 1].key)
    }
  }

  const previousStep = () => {
    const currentIndex = WIZARD_STEPS.findIndex(s => s.key === wizardState.currentStep)
    if (currentIndex > 0) {
      goToStep(WIZARD_STEPS[currentIndex - 1].key)
    }
  }

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const saveCourse = async () => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    updateWizardState({ isSubmitting: true, errors: {} })

    try {
      // Validate all form data
      const basicInfoValidation = BasicInfoSchema.safeParse(wizardState.basicInfo)
      const settingsValidation = SettingsSchema.safeParse(wizardState.settings)

      if (!basicInfoValidation.success || !settingsValidation.success) {
        const errors: Record<string, string> = {}
        
        if (!basicInfoValidation.success) {
          basicInfoValidation.error.errors.forEach(error => {
            errors[error.path.join('.')] = error.message
          })
        }
        
        if (!settingsValidation.success) {
          settingsValidation.error.errors.forEach(error => {
            errors[error.path.join('.')] = error.message
          })
        }
        
        updateWizardState({ errors, isSubmitting: false })
        return
      }

      // Prepare course data
      const courseData = {
        ...basicInfoValidation.data,
        ...settingsValidation.data,
        slug: generateSlug(basicInfoValidation.data.title),
        instructor_id: user.id,
        // Set price to null if course is free
        price: settingsValidation.data.is_free ? null : settingsValidation.data.price
      }

      let savedCourse: Course

      if (courseId && existingCourse) {
        // Update existing course
        const { data, error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId)
          .select()
          .single()

        if (error) throw error
        savedCourse = data
      } else {
        // Create new course
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single()

        if (error) throw error
        savedCourse = data
      }

      // Call completion callback
      if (onComplete) {
        onComplete(savedCourse)
      }

    } catch (error: any) {
      console.error('Failed to save course:', error)
      updateWizardState({ 
        errors: { general: error.message || 'Failed to save course' },
        isSubmitting: false 
      })
    }
  }

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.key === wizardState.currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1

  return (
    <ProtectedRoute>
      <Can action="create" subject="Course">
        <AppLayout>
          <AppHeader>
            <div className="flex items-center justify-between p-4">
              <div>
                <h1 className="text-xl font-bold">
                  {courseId ? 'Edit Course' : 'Create New Course'}
                </h1>
                <p className="text-sm text-gray-600">
                  {WIZARD_STEPS[currentStepIndex].description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </AppHeader>

          <AppMain>
            <AppContent>
              <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Progress Indicator */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    {WIZARD_STEPS.map((step, index) => (
                      <div
                        key={step.key}
                        className={`flex items-center ${
                          index < WIZARD_STEPS.length - 1 ? 'flex-1' : ''
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            index <= currentStepIndex
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 text-gray-400'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <div
                            className={`text-sm font-medium ${
                              index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
                            }`}
                          >
                            {step.title}
                          </div>
                        </div>
                        {index < WIZARD_STEPS.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-4 ${
                              index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Display */}
                {wizardState.errors.general && (
                  <Card className="p-4 mb-6 bg-red-50 border-red-200">
                    <div className="text-red-800">{wizardState.errors.general}</div>
                  </Card>
                )}

                {/* Step Content */}
                <Card className="p-6">
                  {wizardState.currentStep === WizardStep.BASIC_INFO && (
                    <BasicInfoStep
                      data={wizardState.basicInfo}
                      categories={categories}
                      errors={wizardState.errors}
                      onChange={(data) => updateWizardState({ basicInfo: data })}
                    />
                  )}

                  {wizardState.currentStep === WizardStep.CONTENT_STRUCTURE && (
                    <ContentStructureStep
                      courseId={courseId}
                      onChange={() => {}}
                    />
                  )}

                  {wizardState.currentStep === WizardStep.SETTINGS && (
                    <SettingsStep
                      data={wizardState.settings}
                      errors={wizardState.errors}
                      onChange={(data) => updateWizardState({ settings: data })}
                    />
                  )}

                  {wizardState.currentStep === WizardStep.REVIEW && (
                    <ReviewStep
                      basicInfo={wizardState.basicInfo}
                      settings={wizardState.settings}
                      courseId={courseId}
                    />
                  )}
                </Card>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={previousStep}
                    disabled={isFirstStep}
                  >
                    Previous
                  </Button>

                  <div className="flex gap-4">
                    {!isLastStep ? (
                      <Button onClick={nextStep}>
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={saveCourse}
                        disabled={wizardState.isSubmitting}
                      >
                        {wizardState.isSubmitting 
                          ? 'Saving...' 
                          : courseId 
                            ? 'Update Course' 
                            : 'Create Course'
                        }
                      </Button>
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
// STEP COMPONENTS
// ============================================================================

interface BasicInfoStepProps {
  data: Partial<z.infer<typeof BasicInfoSchema>>
  categories: Array<{ id: string; title: string }>
  errors: Record<string, string>
  onChange: (data: Partial<z.infer<typeof BasicInfoSchema>>) => void
}

function BasicInfoStep({ data, categories, errors, onChange }: BasicInfoStepProps) {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: data
  })

  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const addLearningObjective = () => {
    const objectives = data.learning_objectives || []
    onChange({ ...data, learning_objectives: [...objectives, ''] })
  }

  const removeLearningObjective = (index: number) => {
    const objectives = data.learning_objectives || []
    onChange({ 
      ...data, 
      learning_objectives: objectives.filter((_, i) => i !== index) 
    })
  }

  const updateLearningObjective = (index: number, value: string) => {
    const objectives = data.learning_objectives || []
    const updated = [...objectives]
    updated[index] = value
    onChange({ ...data, learning_objectives: updated })
  }

  const difficultyOptions = [
    { value: DifficultyLevel.BEGINNER, label: 'Beginner' },
    { value: DifficultyLevel.INTERMEDIATE, label: 'Intermediate' },
    { value: DifficultyLevel.ADVANCED, label: 'Advanced' },
    { value: DifficultyLevel.EXPERT, label: 'Expert' }
  ]

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.title
  }))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Course Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FormField>
              <FormLabel htmlFor="title" required>Course Title</FormLabel>
              <Input
                id="title"
                value={data.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Enter course title"
                error={!!errors.title}
              />
              {errors.title && <FormError>{errors.title}</FormError>}
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField>
              <FormLabel htmlFor="subtitle">Course Subtitle</FormLabel>
              <Input
                id="subtitle"
                value={data.subtitle || ''}
                onChange={(e) => updateField('subtitle', e.target.value)}
                placeholder="Brief subtitle (optional)"
                error={!!errors.subtitle}
              />
              {errors.subtitle && <FormError>{errors.subtitle}</FormError>}
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField>
              <FormLabel htmlFor="description" required>Course Description</FormLabel>
              <Textarea
                id="description"
                value={data.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Detailed course description"
                rows={4}
                showCharCount
                maxLength={5000}
                error={!!errors.description}
              />
              {errors.description && <FormError>{errors.description}</FormError>}
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="difficulty_level" required>Difficulty Level</FormLabel>
            <Select
              id="difficulty_level"
              options={difficultyOptions}
              value={data.difficulty_level}
              onChange={(value) => updateField('difficulty_level', value)}
              placeholder="Select difficulty"
            />
            {errors.difficulty_level && <FormError>{errors.difficulty_level}</FormError>}
          </FormField>

          <FormField>
            <FormLabel htmlFor="estimated_duration_hours" required>Estimated Duration (hours)</FormLabel>
            <Input
              id="estimated_duration_hours"
              type="number"
              step="0.5"
              min="0.5"
              max="1000"
              value={data.estimated_duration_hours || ''}
              onChange={(e) => updateField('estimated_duration_hours', parseFloat(e.target.value))}
              placeholder="e.g., 10.5"
              error={!!errors.estimated_duration_hours}
            />
            {errors.estimated_duration_hours && <FormError>{errors.estimated_duration_hours}</FormError>}
          </FormField>

          <FormField>
            <FormLabel htmlFor="category_id">Category</FormLabel>
            <Select
              id="category_id"
              options={categoryOptions}
              value={data.category_id}
              onChange={(value) => updateField('category_id', value)}
              placeholder="Select category"
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="language" required>Language</FormLabel>
            <Select
              id="language"
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' },
                { value: 'pt', label: 'Portuguese' }
              ]}
              value={data.language}
              onChange={(value) => updateField('language', value)}
              placeholder="Select language"
            />
            {errors.language && <FormError>{errors.language}</FormError>}
          </FormField>
        </div>

        {/* Learning Objectives */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <FormLabel required>Learning Objectives</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLearningObjective}
            >
              Add Objective
            </Button>
          </div>
          
          <div className="space-y-3">
            {(data.learning_objectives || ['']).map((objective, index) => (
              <div key={index} className="flex gap-3">
                <Input
                  value={objective}
                  onChange={(e) => updateLearningObjective(index, e.target.value)}
                  placeholder={`Learning objective ${index + 1}`}
                  className="flex-1"
                />
                {(data.learning_objectives?.length || 0) > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeLearningObjective(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          {errors.learning_objectives && <FormError>{errors.learning_objectives}</FormError>}
        </div>
      </div>
    </div>
  )
}

interface ContentStructureStepProps {
  courseId?: string
  onChange: () => void
}

function ContentStructureStep({ courseId, onChange }: ContentStructureStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Course Structure</h3>
        <p className="text-gray-600 mb-6">
          Organize your course content into modules and lessons. You can add detailed content after creating the course.
        </p>
        
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="text-center">
            <div className="text-blue-600 mb-2">📚</div>
            <h4 className="font-semibold text-blue-900 mb-2">Content Structure Coming Soon</h4>
            <p className="text-blue-800 text-sm">
              The drag-and-drop course builder will be available in the next step. 
              For now, you can create the course and add modules and lessons later.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

interface SettingsStepProps {
  data: Partial<z.infer<typeof SettingsSchema>>
  errors: Record<string, string>
  onChange: (data: Partial<z.infer<typeof SettingsSchema>>) => void
}

function SettingsStep({ data, errors, onChange }: SettingsStepProps) {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const statusOptions = [
    { value: CourseStatus.DRAFT, label: 'Draft' },
    { value: CourseStatus.UNDER_REVIEW, label: 'Under Review' },
    { value: CourseStatus.PUBLISHED, label: 'Published' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Course Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pricing */}
          <div className="md:col-span-2">
            <FormField>
              <FormLabel>Pricing</FormLabel>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pricing"
                    checked={data.is_free}
                    onChange={() => updateField('is_free', true)}
                    className="mr-2"
                  />
                  Free Course
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pricing"
                    checked={!data.is_free}
                    onChange={() => updateField('is_free', false)}
                    className="mr-2"
                  />
                  Paid Course
                </label>
              </div>
            </FormField>
          </div>

          {!data.is_free && (
            <>
              <FormField>
                <FormLabel htmlFor="price" required>Price</FormLabel>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.price || ''}
                  onChange={(e) => updateField('price', parseFloat(e.target.value))}
                  placeholder="0.00"
                  error={!!errors.price}
                />
                {errors.price && <FormError>{errors.price}</FormError>}
              </FormField>

              <FormField>
                <FormLabel htmlFor="currency">Currency</FormLabel>
                <Select
                  id="currency"
                  options={[
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'GBP', label: 'GBP (£)' }
                  ]}
                  value={data.currency}
                  onChange={(value) => updateField('currency', value)}
                />
              </FormField>
            </>
          )}

          <FormField>
            <FormLabel htmlFor="status" required>Publication Status</FormLabel>
            <Select
              id="status"
              options={statusOptions}
              value={data.status}
              onChange={(value) => updateField('status', value)}
              placeholder="Select status"
            />
            {errors.status && <FormError>{errors.status}</FormError>}
          </FormField>

          <FormField>
            <FormLabel>
              <input
                type="checkbox"
                checked={data.is_featured || false}
                onChange={(e) => updateField('is_featured', e.target.checked)}
                className="mr-2"
              />
              Featured Course
            </FormLabel>
          </FormField>
        </div>
      </div>
    </div>
  )
}

interface ReviewStepProps {
  basicInfo: Partial<z.infer<typeof BasicInfoSchema>>
  settings: Partial<z.infer<typeof SettingsSchema>>
  courseId?: string
}

function ReviewStep({ basicInfo, settings, courseId }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review Course Details</h3>
        
        <div className="space-y-6">
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Basic Information</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Title:</strong> {basicInfo.title}</div>
              {basicInfo.subtitle && <div><strong>Subtitle:</strong> {basicInfo.subtitle}</div>}
              <div><strong>Description:</strong> {basicInfo.description}</div>
              <div><strong>Difficulty:</strong> {basicInfo.difficulty_level}</div>
              <div><strong>Duration:</strong> {basicInfo.estimated_duration_hours} hours</div>
              <div><strong>Language:</strong> {basicInfo.language}</div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-3">Learning Objectives</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {basicInfo.learning_objectives?.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-3">Settings</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Pricing:</strong> {settings.is_free ? 'Free' : `$${settings.price} ${settings.currency}`}</div>
              <div><strong>Status:</strong> {settings.status}</div>
              <div><strong>Featured:</strong> {settings.is_featured ? 'Yes' : 'No'}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CourseCreationWizard