/**
 * Course Data Models
 * 
 * TypeScript interfaces and types for the content management system.
 * Designed for Supabase PostgreSQL with comprehensive course structure support.
 */

import { z } from 'zod'

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export enum CourseStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended'
}

export enum ContentType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  DOCUMENT = 'document',
  INTERACTIVE = 'interactive',
  LIVE_SESSION = 'live_session',
  MIXED = 'mixed' // New: Lessons with multiple content blocks
}

export enum ContentBlockType {
  TEXT = 'text',
  VIDEO = 'video',
  IMAGE = 'image',
  AUDIO = 'audio',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  CODE = 'code',
  EMBED = 'embed',
  DOWNLOAD = 'download',
  DISCUSSION = 'discussion',
  INTERACTIVE = 'interactive',
  DIVIDER = 'divider',
  CALLOUT = 'callout'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  SUSPENDED = 'suspended'
}

export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVISION = 'needs_revision'
}

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface BaseContent extends BaseEntity {
  title: string
  description?: string
  metadata?: Record<string, any>
  tags?: string[]
}

// ============================================================================
// COURSE MODELS
// ============================================================================

export interface Course extends BaseContent {
  // Basic Information
  slug: string
  subtitle?: string
  thumbnail_url?: string
  trailer_video_url?: string
  
  // Content and Structure
  learning_objectives: string[]
  prerequisites: string[]
  target_audience: string[]
  estimated_duration_hours: number
  difficulty_level: DifficultyLevel
  
  // Instructor and Ownership
  instructor_id: string
  co_instructors?: string[]
  
  // Status and Visibility
  status: CourseStatus
  is_featured: boolean
  is_free: boolean
  price?: number
  currency?: string
  
  // Enrollment and Access
  max_enrollments?: number
  enrollment_start_date?: string
  enrollment_end_date?: string
  course_start_date?: string
  course_end_date?: string
  
  // Content Organization
  category_id?: string
  language: string
  certificate_template_id?: string
  
  // Analytics and Metrics
  total_lessons: number
  total_modules: number
  average_rating?: number
  total_ratings: number
  total_enrollments: number
  completion_rate?: number
  
  // Versioning
  version: number
  parent_course_id?: string
  
  // SEO and Marketing
  seo_title?: string
  seo_description?: string
  keywords?: string[]
}

export interface CourseModule extends BaseContent {
  course_id: string
  order_index: number
  is_required: boolean
  estimated_duration_minutes: number
  
  // Prerequisites
  prerequisite_module_ids?: string[]
  
  // Content
  learning_objectives?: string[]
  summary?: string
  
  // Status
  is_published: boolean
  
  // Analytics
  total_lessons: number
  completion_rate?: number
}

export interface Lesson extends BaseContent {
  module_id: string
  course_id: string
  order_index: number
  
  // Content Details
  content_type: ContentType
  content_url?: string
  content_data?: Record<string, any>
  estimated_duration_minutes: number
  
  // Video-specific (for Mux integration - legacy support)
  mux_asset_id?: string
  mux_playback_id?: string
  video_duration_seconds?: number
  
  // Text content (legacy support)
  text_content?: string
  
  // Mixed content blocks (new approach)
  content_blocks?: ContentBlock[]
  
  // Interactive content
  interactive_config?: Record<string, any>
  
  // Requirements
  is_required: boolean
  prerequisite_lesson_ids?: string[]
  
  // Status
  is_published: boolean
  is_preview: boolean // Can be accessed without enrollment
  
  // Resources
  downloadable_resources?: LessonResource[]
  
  // Analytics
  average_completion_time_minutes?: number
  completion_rate?: number
}

// ============================================================================
// CONTENT BLOCK MODELS
// ============================================================================

export interface ContentBlock extends BaseEntity {
  lesson_id: string
  block_type: ContentBlockType
  order_index: number
  
  // Block content
  content: ContentBlockData
  
  // Display settings
  settings: ContentBlockSettings
  
  // Requirements
  is_required: boolean
  estimated_duration_minutes?: number
  
  // Analytics
  completion_rate?: number
  average_time_spent_minutes?: number
}

export interface ContentBlockData {
  // Text content
  text?: {
    content: string // Rich text/markdown content
    format: 'markdown' | 'html' | 'plain'
  }
  
  // Video content
  video?: {
    mux_asset_id?: string
    mux_playback_id?: string
    duration_seconds?: number
    thumbnail_url?: string
    captions_url?: string
    auto_play?: boolean
    controls?: boolean
  }
  
  // Image content
  image?: {
    url: string
    alt_text: string
    caption?: string
    width?: number
    height?: number
  }
  
  // Audio content
  audio?: {
    url: string
    duration_seconds?: number
    transcript?: string
    auto_play?: boolean
  }
  
  // Quiz content
  quiz?: {
    questions: QuizQuestion[]
    settings: QuizSettings
  }
  
  // Assignment content
  assignment?: {
    instructions: string
    submission_type: 'text' | 'file' | 'url' | 'code'
    max_points?: number
    due_date?: string
    rubric?: AssignmentRubric[]
  }
  
  // Code content
  code?: {
    content: string
    language: string
    theme?: string
    line_numbers?: boolean
    editable?: boolean
    run_button?: boolean
  }
  
  // Embed content
  embed?: {
    url: string
    type: 'iframe' | 'oembed'
    width?: number
    height?: number
    allow_fullscreen?: boolean
  }
  
  // Download content
  download?: {
    file_url: string
    file_name: string
    file_size_bytes: number
    file_type: string
    description?: string
  }
  
  // Discussion content
  discussion?: {
    topic: string
    description?: string
    allow_anonymous?: boolean
    moderated?: boolean
  }
  
  // Interactive content
  interactive?: {
    type: 'simulation' | 'game' | 'exercise' | 'tool'
    config: Record<string, any>
    external_url?: string
  }
  
  // Callout content
  callout?: {
    type: 'info' | 'warning' | 'success' | 'error' | 'tip'
    title?: string
    content: string
  }
}

export interface ContentBlockSettings {
  // Display
  background_color?: string
  text_color?: string
  border?: boolean
  shadow?: boolean
  rounded?: boolean
  
  // Layout
  full_width?: boolean
  alignment?: 'left' | 'center' | 'right'
  margin?: string
  padding?: string
  
  // Behavior
  collapsible?: boolean
  default_collapsed?: boolean
  
  // Conditional display
  show_if?: {
    condition: 'always' | 'if_previous_completed' | 'if_quiz_passed' | 'custom'
    custom_logic?: string
  }
}

// ============================================================================
// QUIZ MODELS
// ============================================================================

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching' | 'ordering' | 'fill_blank'

export interface QuizQuestion {
  id: string
  type: QuestionType
  question: string
  explanation?: string
  points: number
  required: boolean
  
  // Multiple choice / True-false options
  options?: QuizOption[]
  
  // Short answer / Essay
  answer_format?: 'text' | 'number' | 'email' | 'url'
  max_length?: number
  
  // Matching questions
  pairs?: { left: string; right: string }[]
  
  // Ordering questions
  items?: string[]
  correct_order?: number[]
  
  // Fill in the blank
  blanks?: string[] // Correct answers for each blank
}

export interface QuizOption {
  id: string
  text: string
  is_correct: boolean
  explanation?: string
}

export interface QuizSettings {
  time_limit_minutes?: number
  attempts_allowed: number
  show_correct_answers: boolean
  show_explanations: boolean
  randomize_questions: boolean
  randomize_options: boolean
  passing_score_percentage: number
  allow_review: boolean
}

// ============================================================================
// ASSIGNMENT MODELS
// ============================================================================

export interface AssignmentRubric {
  criteria: string
  description: string
  points: number
  levels: AssignmentRubricLevel[]
}

export interface AssignmentRubricLevel {
  name: string
  description: string
  points: number
}

export interface AssignmentSubmission extends BaseEntity {
  assignment_block_id: string
  user_id: string
  lesson_id: string
  course_id: string
  
  // Submission content
  submission_type: 'text' | 'file' | 'url' | 'code'
  content?: string
  file_url?: string
  file_name?: string
  
  // Grading
  status: 'submitted' | 'graded' | 'returned' | 'late'
  score?: number
  max_score: number
  feedback?: string
  graded_by?: string
  graded_at?: string
  
  // Timestamps
  submitted_at: string
  due_date?: string
}

export interface LessonResource {
  id: string
  lesson_id: string
  title: string
  description?: string
  file_url: string
  file_type: string
  file_size_bytes: number
  is_downloadable: boolean
  created_at: string
}

// ============================================================================
// ENROLLMENT AND PROGRESS MODELS
// ============================================================================

export interface CourseEnrollment extends BaseEntity {
  user_id: string
  course_id: string
  status: EnrollmentStatus
  enrolled_at: string
  completed_at?: string
  dropped_at?: string
  
  // Progress tracking
  progress_percentage: number
  current_lesson_id?: string
  last_accessed_at?: string
  
  // Completion tracking
  completed_lessons: number
  total_lessons: number
  completed_modules: number
  total_modules: number
  
  // Time tracking
  total_time_spent_minutes: number
  
  // Certificate
  certificate_issued_at?: string
  certificate_url?: string
  
  // Payment (if applicable)
  payment_id?: string
  amount_paid?: number
}

export interface LessonProgress extends BaseEntity {
  user_id: string
  lesson_id: string
  course_id: string
  module_id: string
  
  status: ProgressStatus
  progress_percentage: number
  
  // Time tracking
  time_spent_minutes: number
  started_at?: string
  completed_at?: string
  last_accessed_at: string
  
  // Video progress (for video lessons)
  video_progress_seconds?: number
  video_watch_percentage?: number
  
  // Quiz/Assignment results
  score?: number
  max_score?: number
  attempts: number
  
  // Notes and bookmarks
  notes?: string
  bookmarks?: number[] // Array of timestamps for video bookmarks
}

// ============================================================================
// CONTENT MANAGEMENT MODELS
// ============================================================================

export interface ContentVersion extends BaseEntity {
  content_id: string
  content_type: 'course' | 'module' | 'lesson'
  version_number: number
  
  // Content data
  content_data: Record<string, any>
  
  // Version metadata
  change_summary: string
  created_by: string
  
  // Approval workflow
  approval_status: ApprovalStatus
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  
  // Publishing
  is_published: boolean
  published_at?: string
}

export interface ContentApproval extends BaseEntity {
  content_id: string
  content_type: 'course' | 'module' | 'lesson'
  version_id: string
  
  // Approval details
  status: ApprovalStatus
  reviewer_id: string
  reviewed_at?: string
  
  // Feedback
  feedback?: string
  required_changes?: string[]
  
  // Workflow
  approval_level: number
  is_final_approval: boolean
}

// ============================================================================
// CATEGORY AND ORGANIZATION MODELS
// ============================================================================

export interface CourseCategory extends BaseContent {
  parent_category_id?: string
  slug: string
  icon?: string
  color?: string
  order_index: number
  is_featured: boolean
  
  // Hierarchy
  level: number
  path: string // e.g., "technology/web-development/react"
  
  // Analytics
  course_count: number
}

export interface CourseTag extends BaseEntity {
  name: string
  slug: string
  description?: string
  color?: string
  usage_count: number
}

// ============================================================================
// ANALYTICS AND REPORTING MODELS
// ============================================================================

export interface CourseAnalytics extends BaseEntity {
  course_id: string
  date: string // YYYY-MM-DD format
  
  // Enrollment metrics
  new_enrollments: number
  total_enrollments: number
  active_learners: number
  
  // Engagement metrics
  total_lesson_views: number
  total_time_spent_minutes: number
  average_session_duration_minutes: number
  
  // Completion metrics
  lesson_completions: number
  module_completions: number
  course_completions: number
  
  // Performance metrics
  average_quiz_score?: number
  average_completion_time_days?: number
  
  // Retention metrics
  day_1_retention: number
  day_7_retention: number
  day_30_retention: number
}

export interface LessonAnalytics extends BaseEntity {
  lesson_id: string
  course_id: string
  date: string
  
  // View metrics
  unique_views: number
  total_views: number
  
  // Engagement metrics
  average_watch_time_seconds?: number
  completion_rate: number
  drop_off_points?: number[] // For video content
  
  // Performance metrics
  average_score?: number
  average_attempts?: number
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const CourseSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().min(10).max(5000),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  learning_objectives: z.array(z.string()).min(1).max(10),
  prerequisites: z.array(z.string()).max(10),
  target_audience: z.array(z.string()).max(10),
  estimated_duration_hours: z.number().min(0.5).max(1000),
  difficulty_level: z.nativeEnum(DifficultyLevel),
  instructor_id: z.string().uuid(),
  status: z.nativeEnum(CourseStatus),
  is_featured: z.boolean(),
  is_free: z.boolean(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  category_id: z.string().uuid().optional(),
  language: z.string().length(2),
  tags: z.array(z.string()).max(20).optional(),
})

export const ModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  course_id: z.string().uuid(),
  order_index: z.number().min(0),
  is_required: z.boolean(),
  estimated_duration_minutes: z.number().min(1).max(10080), // Max 1 week
  learning_objectives: z.array(z.string()).max(10).optional(),
  summary: z.string().max(1000).optional(),
})

export const LessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  module_id: z.string().uuid(),
  course_id: z.string().uuid(),
  order_index: z.number().min(0),
  content_type: z.nativeEnum(ContentType),
  content_url: z.string().url().optional(),
  estimated_duration_minutes: z.number().min(1).max(480), // Max 8 hours
  is_required: z.boolean(),
  is_preview: z.boolean(),
  text_content: z.string().max(50000).optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateCourseInput = z.infer<typeof CourseSchema>
export type CreateModuleInput = z.infer<typeof ModuleSchema>
export type CreateLessonInput = z.infer<typeof LessonSchema>

export type CourseWithModules = Course & {
  modules: (CourseModule & {
    lessons: Lesson[]
  })[]
}

export type CourseWithProgress = Course & {
  enrollment?: CourseEnrollment
  progress_percentage: number
  current_lesson?: Lesson
}

export type LessonWithProgress = Lesson & {
  progress?: LessonProgress
  is_completed: boolean
  is_current: boolean
}

// ============================================================================
// DATABASE QUERY TYPES
// ============================================================================

export interface CourseFilters {
  category_id?: string
  instructor_id?: string
  difficulty_level?: DifficultyLevel
  is_free?: boolean
  status?: CourseStatus
  is_featured?: boolean
  language?: string
  tags?: string[]
  search?: string
  min_rating?: number
  max_price?: number
}

export interface CourseSortOptions {
  field: 'created_at' | 'updated_at' | 'title' | 'average_rating' | 'total_enrollments' | 'price'
  direction: 'asc' | 'desc'
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface CourseQueryResult {
  courses: Course[]
  total: number
  page: number
  limit: number
  total_pages: number
}