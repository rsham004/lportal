/**
 * Course Management Dashboard Component
 * 
 * Comprehensive dashboard for instructors and admins to manage courses,
 * view analytics, and handle content approval workflows.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

// Phase 1 UI Components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { AppLayout, AppHeader, AppMain, AppContent } from '@/components/ui/AppLayout'

// Phase 2 Authorization
import { Can } from '@/components/authorization/Can'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Course Types
import { 
  Course, 
  CourseStatus, 
  DifficultyLevel,
  CourseFilters,
  CourseSortOptions,
  PaginationOptions 
} from '@/lib/types/course'

// Database
import { supabase, buildCourseQuery, createPaginatedResult } from '@/lib/database/supabase'

// ============================================================================
// INTERFACES
// ============================================================================

export interface CourseManagementDashboardProps {
  userRole?: 'instructor' | 'admin' | 'super_admin'
}

interface DashboardStats {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  totalEnrollments: number
  averageRating: number
  totalRevenue: number
}

interface CourseListItem extends Course {
  enrollment_count: number
  recent_activity: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CourseManagementDashboard({ userRole = 'instructor' }: CourseManagementDashboardProps) {
  const { user } = useAuth()
  const [courses, setCourses] = useState<CourseListItem[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalEnrollments: 0,
    averageRating: 0,
    totalRevenue: 0
  })
  
  const [filters, setFilters] = useState<CourseFilters>({
    status: undefined,
    difficulty_level: undefined,
    search: ''
  })
  
  const [sortOptions, setSortOptions] = useState<CourseSortOptions>({
    field: 'updated_at',
    direction: 'desc'
  })
  
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    limit: 10
  })
  
  const [loading, setLoading] = useState(true)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  // Load data on mount and when filters change
  useEffect(() => {
    loadDashboardData()
  }, [user, filters, sortOptions, pagination])

  const loadDashboardData = async () => {
    if (!user) return

    setLoading(true)
    try {
      await Promise.all([
        loadCourses(),
        loadStats()
      ])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    if (!user) return

    const courseFilters: CourseFilters = {
      ...filters,
      // Instructors only see their own courses, admins see all
      ...(userRole === 'instructor' && { instructor_id: user.id })
    }

    let query = buildCourseQuery(courseFilters)
      .select(`
        *,
        course_categories(title),
        course_enrollments(count)
      `, { count: 'exact' })

    // Apply sorting
    query = query.order(sortOptions.field, { ascending: sortOptions.direction === 'asc' })

    // Apply pagination
    const { offset, limit } = calculatePagination(pagination.page, pagination.limit)
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    // Transform data to include enrollment count
    const coursesWithStats = (data || []).map(course => ({
      ...course,
      enrollment_count: course.course_enrollments?.length || 0,
      recent_activity: new Date(course.updated_at).toLocaleDateString()
    }))

    setCourses(coursesWithStats)
  }

  const loadStats = async () => {
    if (!user) return

    // Build stats query based on user role
    let statsQuery = supabase
      .from('courses')
      .select('status, total_enrollments, average_rating, price, is_free')

    if (userRole === 'instructor') {
      statsQuery = statsQuery.eq('instructor_id', user.id)
    }

    const { data, error } = await statsQuery

    if (error) throw error

    if (data) {
      const totalCourses = data.length
      const publishedCourses = data.filter(c => c.status === 'published').length
      const draftCourses = data.filter(c => c.status === 'draft').length
      const totalEnrollments = data.reduce((sum, c) => sum + (c.total_enrollments || 0), 0)
      const ratingsSum = data.reduce((sum, c) => sum + (c.average_rating || 0), 0)
      const averageRating = totalCourses > 0 ? ratingsSum / totalCourses : 0
      const totalRevenue = data
        .filter(c => !c.is_free && c.price)
        .reduce((sum, c) => sum + (c.price || 0) * (c.total_enrollments || 0), 0)

      setStats({
        totalCourses,
        publishedCourses,
        draftCourses,
        totalEnrollments,
        averageRating,
        totalRevenue
      })
    }
  }

  const calculatePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit
    return { offset, limit }
  }

  const updateFilters = (newFilters: Partial<CourseFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const updateSort = (field: CourseSortOptions['field']) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const selectAllCourses = () => {
    setSelectedCourses(courses.map(c => c.id))
  }

  const clearSelection = () => {
    setSelectedCourses([])
  }

  const bulkUpdateStatus = async (status: CourseStatus) => {
    if (selectedCourses.length === 0) return

    try {
      const { error } = await supabase
        .from('courses')
        .update({ status })
        .in('id', selectedCourses)

      if (error) throw error

      await loadCourses()
      clearSelection()
    } catch (error) {
      console.error('Failed to update course status:', error)
    }
  }

  const deleteCourses = async () => {
    if (selectedCourses.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedCourses.length} course(s)?`)) return

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .in('id', selectedCourses)

      if (error) throw error

      await loadCourses()
      clearSelection()
    } catch (error) {
      console.error('Failed to delete courses:', error)
    }
  }

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: CourseStatus.DRAFT, label: 'Draft' },
    { value: CourseStatus.UNDER_REVIEW, label: 'Under Review' },
    { value: CourseStatus.PUBLISHED, label: 'Published' },
    { value: CourseStatus.ARCHIVED, label: 'Archived' }
  ]

  const difficultyOptions = [
    { value: '', label: 'All Levels' },
    { value: DifficultyLevel.BEGINNER, label: 'Beginner' },
    { value: DifficultyLevel.INTERMEDIATE, label: 'Intermediate' },
    { value: DifficultyLevel.ADVANCED, label: 'Advanced' },
    { value: DifficultyLevel.EXPERT, label: 'Expert' }
  ]

  return (
    <ProtectedRoute>
      <Can action="create" subject="Course">
        <AppLayout>
          <AppHeader>
            <div className="flex items-center justify-between p-4">
              <div>
                <h1 className="text-xl font-bold">Course Management</h1>
                <p className="text-sm text-gray-600">
                  Manage your courses, track performance, and analyze engagement
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/courses/create">
                  <Button>Create New Course</Button>
                </Link>
              </div>
            </div>
          </AppHeader>

          <AppMain>
            <AppContent>
              <div className="container mx-auto px-4 py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalCourses}</div>
                    <div className="text-sm text-gray-600">Total Courses</div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.publishedCourses}</div>
                    <div className="text-sm text-gray-600">Published</div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{stats.draftCourses}</div>
                    <div className="text-sm text-gray-600">Drafts</div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalEnrollments}</div>
                    <div className="text-sm text-gray-600">Total Enrollments</div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-orange-600">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-red-600">${stats.totalRevenue.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">Revenue</div>
                  </Card>
                </div>

                {/* Filters and Search */}
                <Card className="p-6 mb-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-64">
                      <Input
                        placeholder="Search courses..."
                        value={filters.search || ''}
                        onChange={(e) => updateFilters({ search: e.target.value })}
                      />
                    </div>
                    
                    <Select
                      options={statusOptions}
                      value={filters.status || ''}
                      onChange={(value) => updateFilters({ status: value as CourseStatus })}
                      placeholder="Filter by status"
                    />
                    
                    <Select
                      options={difficultyOptions}
                      value={filters.difficulty_level || ''}
                      onChange={(value) => updateFilters({ difficulty_level: value as DifficultyLevel })}
                      placeholder="Filter by difficulty"
                    />
                  </div>
                </Card>

                {/* Bulk Actions */}
                {selectedCourses.length > 0 && (
                  <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="text-blue-800">
                        {selectedCourses.length} course(s) selected
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bulkUpdateStatus(CourseStatus.PUBLISHED)}
                        >
                          Publish
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bulkUpdateStatus(CourseStatus.DRAFT)}
                        >
                          Draft
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bulkUpdateStatus(CourseStatus.ARCHIVED)}
                        >
                          Archive
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deleteCourses}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearSelection}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Course List */}
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-4 text-left">
                            <input
                              type="checkbox"
                              checked={selectedCourses.length === courses.length && courses.length > 0}
                              onChange={selectedCourses.length === courses.length ? clearSelection : selectAllCourses}
                            />
                          </th>
                          <th 
                            className="p-4 text-left cursor-pointer hover:bg-gray-100"
                            onClick={() => updateSort('title')}
                          >
                            Course Title
                            {sortOptions.field === 'title' && (
                              <span className="ml-1">{sortOptions.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                          <th 
                            className="p-4 text-left cursor-pointer hover:bg-gray-100"
                            onClick={() => updateSort('status')}
                          >
                            Status
                            {sortOptions.field === 'status' && (
                              <span className="ml-1">{sortOptions.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                          <th className="p-4 text-left">Enrollments</th>
                          <th className="p-4 text-left">Rating</th>
                          <th 
                            className="p-4 text-left cursor-pointer hover:bg-gray-100"
                            onClick={() => updateSort('updated_at')}
                          >
                            Last Updated
                            {sortOptions.field === 'updated_at' && (
                              <span className="ml-1">{sortOptions.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                          <th className="p-4 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-gray-500">
                              Loading courses...
                            </td>
                          </tr>
                        ) : courses.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-gray-500">
                              No courses found. <Link href="/courses/create" className="text-blue-600 hover:underline">Create your first course</Link>
                            </td>
                          </tr>
                        ) : (
                          courses.map((course) => (
                            <tr key={course.id} className="border-t hover:bg-gray-50">
                              <td className="p-4">
                                <input
                                  type="checkbox"
                                  checked={selectedCourses.includes(course.id)}
                                  onChange={() => toggleCourseSelection(course.id)}
                                />
                              </td>
                              <td className="p-4">
                                <div>
                                  <div className="font-medium">{course.title}</div>
                                  <div className="text-sm text-gray-600">{course.difficulty_level}</div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  course.status === 'published' ? 'bg-green-100 text-green-800' :
                                  course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                  course.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {course.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-4">{course.enrollment_count}</td>
                              <td className="p-4">
                                {course.average_rating ? (
                                  <div className="flex items-center">
                                    <span className="text-yellow-500">★</span>
                                    <span className="ml-1">{course.average_rating.toFixed(1)}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">No ratings</span>
                                )}
                              </td>
                              <td className="p-4 text-sm text-gray-600">
                                {course.recent_activity}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Link href={`/courses/${course.id}/edit`}>
                                    <Button variant="outline" size="sm">Edit</Button>
                                  </Link>
                                  <Link href={`/courses/${course.id}/analytics`}>
                                    <Button variant="outline" size="sm">Analytics</Button>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {courses.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t">
                      <div className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, courses.length)} of {courses.length} courses
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1}
                        >
                          Previous
                        </Button>
                        <span className="px-3 py-1 text-sm">
                          Page {pagination.page}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={courses.length < pagination.limit}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </AppContent>
          </AppMain>
        </AppLayout>
      </Can>
    </ProtectedRoute>
  )
}

export default CourseManagementDashboard