/**
 * Course Service
 * 
 * Service layer for course-related database operations and business logic.
 * Provides type-safe methods for CRUD operations and complex queries.
 */

import { 
  supabase, 
  supabaseAdmin,
  executeQuery,
  handleSupabaseError,
  buildCourseQuery,
  buildCourseWithStructureQuery,
  createPaginatedResult,
  calculatePagination
} from '@/lib/database/supabase'

import type {
  Course,
  CourseModule,
  Lesson,
  CourseEnrollment,
  LessonProgress,
  CreateCourseInput,
  CreateModuleInput,
  CreateLessonInput,
  CourseFilters,
  CourseSortOptions,
  PaginationOptions,
  CourseQueryResult,
  CourseWithModules,
  CourseWithProgress,
  LessonWithProgress
} from '@/lib/types/course'

// ============================================================================
// COURSE CRUD OPERATIONS
// ============================================================================

export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(courseData: CreateCourseInput, instructorId: string): Promise<Course> {
    try {
      const slug = this.generateSlug(courseData.title)
      
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...courseData,
          slug,
          instructor_id: instructorId,
          // Set price to null if course is free
          price: courseData.is_free ? null : courseData.price
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Update an existing course
   */
  static async updateCourse(courseId: string, updates: Partial<CreateCourseInput>, userId: string): Promise<Course> {
    try {
      // Check if user has permission to update this course
      await this.checkCoursePermission(courseId, userId, 'write')

      const updateData = {
        ...updates,
        // Generate new slug if title changed
        ...(updates.title && { slug: this.generateSlug(updates.title) }),
        // Set price to null if course is free
        ...(updates.is_free !== undefined && { 
          price: updates.is_free ? null : updates.price 
        })
      }

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', courseId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Get course by ID
   */
  static async getCourseById(courseId: string, userId?: string): Promise<Course> {
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          course_categories(id, title, slug),
          course_enrollments!inner(
            id,
            user_id,
            status,
            progress_percentage,
            enrolled_at
          )
        `)
        .eq('id', courseId)

      // If user is provided, include their enrollment data
      if (userId) {
        query = query.eq('course_enrollments.user_id', userId)
      }

      const { data, error } = await query.single()

      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Get course with full structure (modules and lessons)
   */
  static async getCourseWithStructure(courseId: string, userId?: string): Promise<CourseWithModules> {
    try {
      const { data, error } = await buildCourseWithStructureQuery(courseId)

      if (error) throw error
      if (!data) throw new Error('Course not found')

      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Get courses with filters, sorting, and pagination
   */
  static async getCourses(
    filters?: CourseFilters,
    sortOptions?: CourseSortOptions,
    pagination?: PaginationOptions
  ): Promise<CourseQueryResult> {
    try {
      const { offset, limit } = pagination 
        ? calculatePagination(pagination.page, pagination.limit)
        : { offset: 0, limit: 20 }

      let query = buildCourseQuery(filters)
        .select('*', { count: 'exact' })

      // Apply sorting
      if (sortOptions) {
        query = query.order(sortOptions.field, { ascending: sortOptions.direction === 'asc' })
      } else {
        query = query.order('updated_at', { ascending: false })
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      return createPaginatedResult(
        data || [],
        count || 0,
        pagination?.page || 1,
        pagination?.limit || 20
      )
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Get courses by instructor
   */
  static async getCoursesByInstructor(
    instructorId: string,
    filters?: Omit<CourseFilters, 'instructor_id'>,
    pagination?: PaginationOptions
  ): Promise<CourseQueryResult> {
    return this.getCourses(
      { ...filters, instructor_id: instructorId },
      undefined,
      pagination
    )
  }

  /**
   * Delete a course
   */
  static async deleteCourse(courseId: string, userId: string): Promise<void> {
    try {
      // Check if user has permission to delete this course
      await this.checkCoursePermission(courseId, userId, 'delete')

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Duplicate a course
   */
  static async duplicateCourse(courseId: string, userId: string, newTitle?: string): Promise<Course> {
    try {
      // Get original course
      const originalCourse = await this.getCourseById(courseId, userId)
      
      // Check permission
      await this.checkCoursePermission(courseId, userId, 'read')

      // Create duplicate
      const duplicateData: CreateCourseInput = {
        title: newTitle || `${originalCourse.title} (Copy)`,
        subtitle: originalCourse.subtitle || undefined,
        description: originalCourse.description,
        learning_objectives: originalCourse.learning_objectives,
        prerequisites: originalCourse.prerequisites || [],
        target_audience: originalCourse.target_audience || [],
        estimated_duration_hours: originalCourse.estimated_duration_hours,
        difficulty_level: originalCourse.difficulty_level,
        instructor_id: userId,
        status: 'draft' as const,
        is_featured: false,
        is_free: originalCourse.is_free,
        price: originalCourse.price || undefined,
        currency: originalCourse.currency || undefined,
        category_id: originalCourse.category_id || undefined,
        language: originalCourse.language,
        tags: originalCourse.tags || []
      }

      return this.createCourse(duplicateData, userId)
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  // ============================================================================
  // MODULE OPERATIONS
  // ============================================================================

  /**
   * Create a new module
   */
  static async createModule(moduleData: CreateModuleInput, userId: string): Promise<CourseModule> {
    try {
      // Check if user has permission to modify this course
      await this.checkCoursePermission(moduleData.course_id, userId, 'write')

      const { data, error } = await supabase
        .from('course_modules')
        .insert(moduleData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Update a module
   */
  static async updateModule(moduleId: string, updates: Partial<CreateModuleInput>, userId: string): Promise<CourseModule> {
    try {
      // Get module to check course permission
      const { data: module, error: moduleError } = await supabase
        .from('course_modules')
        .select('course_id')
        .eq('id', moduleId)
        .single()

      if (moduleError) throw moduleError
      
      await this.checkCoursePermission(module.course_id, userId, 'write')

      const { data, error } = await supabase
        .from('course_modules')
        .update(updates)
        .eq('id', moduleId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Delete a module
   */
  static async deleteModule(moduleId: string, userId: string): Promise<void> {
    try {
      // Get module to check course permission
      const { data: module, error: moduleError } = await supabase
        .from('course_modules')
        .select('course_id')
        .eq('id', moduleId)
        .single()

      if (moduleError) throw moduleError
      
      await this.checkCoursePermission(module.course_id, userId, 'write')

      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId)

      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Reorder modules
   */
  static async reorderModules(courseId: string, moduleOrders: { id: string; order_index: number }[], userId: string): Promise<void> {
    try {
      await this.checkCoursePermission(courseId, userId, 'write')

      const updates = moduleOrders.map(({ id, order_index }) =>
        supabase
          .from('course_modules')
          .update({ order_index })
          .eq('id', id)
      )

      await Promise.all(updates)
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  // ============================================================================
  // LESSON OPERATIONS
  // ============================================================================

  /**
   * Create a new lesson
   */
  static async createLesson(lessonData: CreateLessonInput, userId: string): Promise<Lesson> {
    try {
      await this.checkCoursePermission(lessonData.course_id, userId, 'write')

      const { data, error } = await supabase
        .from('lessons')
        .insert(lessonData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Update a lesson
   */
  static async updateLesson(lessonId: string, updates: Partial<CreateLessonInput>, userId: string): Promise<Lesson> {
    try {
      // Get lesson to check course permission
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('course_id')
        .eq('id', lessonId)
        .single()

      if (lessonError) throw lessonError
      
      await this.checkCoursePermission(lesson.course_id, userId, 'write')

      const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', lessonId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Delete a lesson
   */
  static async deleteLesson(lessonId: string, userId: string): Promise<void> {
    try {
      // Get lesson to check course permission
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('course_id')
        .eq('id', lessonId)
        .single()

      if (lessonError) throw lessonError
      
      await this.checkCoursePermission(lesson.course_id, userId, 'write')

      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  // ============================================================================
  // ENROLLMENT OPERATIONS
  // ============================================================================

  /**
   * Enroll user in course
   */
  static async enrollInCourse(courseId: string, userId: string): Promise<CourseEnrollment> {
    try {
      // Check if course exists and is published
      const course = await this.getCourseById(courseId)
      if (course.status !== 'published') {
        throw new Error('Course is not available for enrollment')
      }

      // Check if user is already enrolled
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (existingEnrollment) {
        throw new Error('User is already enrolled in this course')
      }

      // Create enrollment
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          status: 'enrolled',
          total_lessons: course.total_lessons,
          total_modules: course.total_modules
        })
        .select()
        .single()

      if (error) throw error

      // Update course enrollment count
      await supabase
        .from('courses')
        .update({ 
          total_enrollments: course.total_enrollments + 1 
        })
        .eq('id', courseId)

      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Get user's enrollment in course
   */
  static async getUserEnrollment(courseId: string, userId: string): Promise<CourseEnrollment | null> {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Update lesson progress
   */
  static async updateLessonProgress(
    lessonId: string, 
    userId: string, 
    progressData: Partial<LessonProgress>
  ): Promise<LessonProgress> {
    try {
      // Get lesson info
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('course_id, module_id')
        .eq('id', lessonId)
        .single()

      if (lessonError) throw lessonError

      // Check if user is enrolled
      const enrollment = await this.getUserEnrollment(lesson.course_id, userId)
      if (!enrollment) {
        throw new Error('User is not enrolled in this course')
      }

      // Upsert progress
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          course_id: lesson.course_id,
          module_id: lesson.module_id,
          ...progressData,
          last_accessed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Update enrollment progress
      await this.updateEnrollmentProgress(lesson.course_id, userId)

      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate URL-friendly slug from title
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  /**
   * Check if user has permission to access/modify course
   */
  private static async checkCoursePermission(
    courseId: string, 
    userId: string, 
    permission: 'read' | 'write' | 'delete'
  ): Promise<void> {
    const { data: course, error } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single()

    if (error) throw error

    // For now, only course instructor can modify
    // TODO: Add role-based permissions for admins
    if (course.instructor_id !== userId) {
      throw new Error('Insufficient permissions')
    }
  }

  /**
   * Update enrollment progress based on lesson completions
   */
  private static async updateEnrollmentProgress(courseId: string, userId: string): Promise<void> {
    try {
      // Get completed lessons count
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('status')
        .eq('course_id', courseId)
        .eq('user_id', userId)

      if (progressError) throw progressError

      const completedLessons = progressData?.filter(p => p.status === 'completed').length || 0

      // Get total lessons in course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('total_lessons')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      const progressPercentage = course.total_lessons > 0 
        ? Math.round((completedLessons / course.total_lessons) * 100)
        : 0

      // Update enrollment
      const { error: updateError } = await supabase
        .from('course_enrollments')
        .update({
          completed_lessons: completedLessons,
          progress_percentage: progressPercentage,
          ...(progressPercentage === 100 && {
            status: 'completed',
            completed_at: new Date().toISOString()
          })
        })
        .eq('course_id', courseId)
        .eq('user_id', userId)

      if (updateError) throw updateError
    } catch (error) {
      console.error('Failed to update enrollment progress:', error)
      // Don't throw here as this is a background operation
    }
  }
}

export default CourseService