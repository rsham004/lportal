/**
 * Supabase Database Service
 * 
 * Service layer for interacting with Supabase PostgreSQL database.
 * Provides type-safe database operations for the content management system.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Server-side client with service role key (for admin operations)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Table types
export type CourseRow = Tables<'courses'>
export type ModuleRow = Tables<'course_modules'>
export type LessonRow = Tables<'lessons'>
export type EnrollmentRow = Tables<'course_enrollments'>
export type ProgressRow = Tables<'lesson_progress'>
export type CategoryRow = Tables<'course_categories'>
export type TagRow = Tables<'course_tags'>

// Enum types
export type CourseStatus = Enums<'course_status'>
export type ContentType = Enums<'content_type'>
export type DifficultyLevel = Enums<'difficulty_level'>
export type EnrollmentStatus = Enums<'enrollment_status'>
export type ProgressStatus = Enums<'progress_status'>

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Handle Supabase errors with proper error messages
 */
export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error)
  
  if (error?.code === 'PGRST116') {
    throw new Error('Resource not found')
  }
  
  if (error?.code === '23505') {
    throw new Error('Resource already exists')
  }
  
  if (error?.code === '23503') {
    throw new Error('Referenced resource not found')
  }
  
  if (error?.code === '42501') {
    throw new Error('Insufficient permissions')
  }
  
  throw new Error(error?.message || 'Database operation failed')
}

/**
 * Execute a database operation with error handling
 */
export async function executeQuery<T>(
  queryPromise: Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await queryPromise
  
  if (error) {
    handleSupabaseError(error)
  }
  
  if (!data) {
    throw new Error('No data returned from query')
  }
  
  return data
}

/**
 * Get current user ID from Supabase auth
 */
export async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('User not authenticated')
  }
  
  return user.id
}

/**
 * Check if user has permission to access resource
 */
export async function checkUserPermission(
  userId: string,
  resourceType: 'course' | 'module' | 'lesson',
  resourceId: string,
  permission: 'read' | 'write' | 'delete'
): Promise<boolean> {
  // Implementation would check user roles and permissions
  // For now, return true for authenticated users
  return true
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function calculatePagination(page: number, limit: number) {
  const offset = (page - 1) * limit
  return { offset, limit }
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

// ============================================================================
// QUERY BUILDERS
// ============================================================================

/**
 * Build course query with filters and sorting
 */
export function buildCourseQuery(filters?: {
  categoryId?: string
  instructorId?: string
  difficultyLevel?: DifficultyLevel
  isFree?: boolean
  status?: CourseStatus
  isFeatured?: boolean
  language?: string
  search?: string
  minRating?: number
  maxPrice?: number
}) {
  let query = supabase
    .from('courses')
    .select(`
      *,
      course_categories(title, slug),
      course_enrollments(count)
    `)
  
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  
  if (filters?.instructorId) {
    query = query.eq('instructor_id', filters.instructorId)
  }
  
  if (filters?.difficultyLevel) {
    query = query.eq('difficulty_level', filters.difficultyLevel)
  }
  
  if (filters?.isFree !== undefined) {
    query = query.eq('is_free', filters.isFree)
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.isFeatured !== undefined) {
    query = query.eq('is_featured', filters.isFeatured)
  }
  
  if (filters?.language) {
    query = query.eq('language', filters.language)
  }
  
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  
  if (filters?.minRating) {
    query = query.gte('average_rating', filters.minRating)
  }
  
  if (filters?.maxPrice) {
    query = query.lte('price', filters.maxPrice)
  }
  
  return query
}

/**
 * Build course with full structure query
 */
export function buildCourseWithStructureQuery(courseId: string) {
  return supabase
    .from('courses')
    .select(`
      *,
      course_categories(title, slug),
      course_modules(
        *,
        lessons(
          *,
          lesson_resources(*)
        )
      )
    `)
    .eq('id', courseId)
    .order('order_index', { foreignTable: 'course_modules' })
    .order('order_index', { foreignTable: 'course_modules.lessons' })
}

/**
 * Build user progress query
 */
export function buildUserProgressQuery(userId: string, courseId?: string) {
  let query = supabase
    .from('lesson_progress')
    .select(`
      *,
      lessons(
        *,
        course_modules(
          *,
          courses(*)
        )
      )
    `)
    .eq('user_id', userId)
  
  if (courseId) {
    query = query.eq('course_id', courseId)
  }
  
  return query
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to course updates
 */
export function subscribeToCourseUpdates(
  courseId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`course-${courseId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'courses',
        filter: `id=eq.${courseId}`
      },
      callback
    )
    .subscribe()
}

/**
 * Subscribe to user progress updates
 */
export function subscribeToProgressUpdates(
  userId: string,
  courseId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`progress-${userId}-${courseId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lesson_progress',
        filter: `user_id=eq.${userId}.and.course_id=eq.${courseId}`
      },
      callback
    )
    .subscribe()
}

/**
 * Subscribe to enrollment updates
 */
export function subscribeToEnrollmentUpdates(
  userId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`enrollments-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'course_enrollments',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch insert lessons for a module
 */
export async function batchInsertLessons(
  moduleId: string,
  courseId: string,
  lessons: Partial<LessonRow>[]
) {
  const lessonsWithIds = lessons.map((lesson, index) => ({
    ...lesson,
    module_id: moduleId,
    course_id: courseId,
    order_index: index
  }))
  
  return executeQuery(
    supabase
      .from('lessons')
      .insert(lessonsWithIds)
      .select()
  )
}

/**
 * Batch update lesson order
 */
export async function batchUpdateLessonOrder(
  lessonUpdates: { id: string; order_index: number }[]
) {
  const updates = lessonUpdates.map(update =>
    supabase
      .from('lessons')
      .update({ order_index: update.order_index })
      .eq('id', update.id)
  )
  
  return Promise.all(updates)
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Get course analytics for date range
 */
export async function getCourseAnalytics(
  courseId: string,
  startDate: string,
  endDate: string
) {
  return executeQuery(
    supabase
      .from('course_analytics')
      .select('*')
      .eq('course_id', courseId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
  )
}

/**
 * Get lesson analytics for date range
 */
export async function getLessonAnalytics(
  lessonId: string,
  startDate: string,
  endDate: string
) {
  return executeQuery(
    supabase
      .from('lesson_analytics')
      .select('*')
      .eq('lesson_id', lessonId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
  )
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

/**
 * Full-text search across courses
 */
export async function searchCourses(
  query: string,
  filters?: {
    categoryId?: string
    difficultyLevel?: DifficultyLevel
    language?: string
  },
  pagination?: PaginationParams
) {
  const { offset, limit } = pagination 
    ? calculatePagination(pagination.page, pagination.limit)
    : { offset: 0, limit: 20 }
  
  let searchQuery = supabase
    .from('courses')
    .select(`
      *,
      course_categories(title, slug)
    `, { count: 'exact' })
    .textSearch('title', query)
    .eq('status', 'published')
    .range(offset, offset + limit - 1)
  
  if (filters?.categoryId) {
    searchQuery = searchQuery.eq('category_id', filters.categoryId)
  }
  
  if (filters?.difficultyLevel) {
    searchQuery = searchQuery.eq('difficulty_level', filters.difficultyLevel)
  }
  
  if (filters?.language) {
    searchQuery = searchQuery.eq('language', filters.language)
  }
  
  const { data, error, count } = await searchQuery
  
  if (error) {
    handleSupabaseError(error)
  }
  
  return createPaginatedResult(
    data || [],
    count || 0,
    pagination?.page || 1,
    pagination?.limit || 20
  )
}

// ============================================================================
// EXPORT DEFAULT CLIENT
// ============================================================================

export default supabase