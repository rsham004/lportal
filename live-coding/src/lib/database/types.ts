/**
 * Supabase Database Types
 * 
 * Auto-generated TypeScript types for Supabase database schema.
 * These types ensure type safety when interacting with the database.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      course_analytics: {
        Row: {
          id: string
          course_id: string
          date: string
          new_enrollments: number
          total_enrollments: number
          active_learners: number
          total_lesson_views: number
          total_time_spent_minutes: number
          average_session_duration_minutes: number | null
          lesson_completions: number
          module_completions: number
          course_completions: number
          average_quiz_score: number | null
          average_completion_time_days: number | null
          day_1_retention: number | null
          day_7_retention: number | null
          day_30_retention: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          date: string
          new_enrollments?: number
          total_enrollments?: number
          active_learners?: number
          total_lesson_views?: number
          total_time_spent_minutes?: number
          average_session_duration_minutes?: number | null
          lesson_completions?: number
          module_completions?: number
          course_completions?: number
          average_quiz_score?: number | null
          average_completion_time_days?: number | null
          day_1_retention?: number | null
          day_7_retention?: number | null
          day_30_retention?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          date?: string
          new_enrollments?: number
          total_enrollments?: number
          active_learners?: number
          total_lesson_views?: number
          total_time_spent_minutes?: number
          average_session_duration_minutes?: number | null
          lesson_completions?: number
          module_completions?: number
          course_completions?: number
          average_quiz_score?: number | null
          average_completion_time_days?: number | null
          day_1_retention?: number | null
          day_7_retention?: number | null
          day_30_retention?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_analytics_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      course_categories: {
        Row: {
          id: string
          title: string
          description: string | null
          slug: string
          parent_category_id: string | null
          icon: string | null
          color: string | null
          order_index: number
          is_featured: boolean
          level: number
          path: string
          course_count: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          slug: string
          parent_category_id?: string | null
          icon?: string | null
          color?: string | null
          order_index?: number
          is_featured?: boolean
          level?: number
          path: string
          course_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          slug?: string
          parent_category_id?: string | null
          icon?: string | null
          color?: string | null
          order_index?: number
          is_featured?: boolean
          level?: number
          path?: string
          course_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      course_enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          enrolled_at: string
          completed_at: string | null
          dropped_at: string | null
          progress_percentage: number
          current_lesson_id: string | null
          last_accessed_at: string
          completed_lessons: number
          total_lessons: number
          completed_modules: number
          total_modules: number
          total_time_spent_minutes: number
          certificate_issued_at: string | null
          certificate_url: string | null
          payment_id: string | null
          amount_paid: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          enrolled_at?: string
          completed_at?: string | null
          dropped_at?: string | null
          progress_percentage?: number
          current_lesson_id?: string | null
          last_accessed_at?: string
          completed_lessons?: number
          total_lessons?: number
          completed_modules?: number
          total_modules?: number
          total_time_spent_minutes?: number
          certificate_issued_at?: string | null
          certificate_url?: string | null
          payment_id?: string | null
          amount_paid?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          enrolled_at?: string
          completed_at?: string | null
          dropped_at?: string | null
          progress_percentage?: number
          current_lesson_id?: string | null
          last_accessed_at?: string
          completed_lessons?: number
          total_lessons?: number
          completed_modules?: number
          total_modules?: number
          total_time_spent_minutes?: number
          certificate_issued_at?: string | null
          certificate_url?: string | null
          payment_id?: string | null
          amount_paid?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          }
        ]
      }
      course_modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          order_index: number
          is_required: boolean
          estimated_duration_minutes: number
          learning_objectives: string[] | null
          summary: string | null
          prerequisite_module_ids: string[] | null
          is_published: boolean
          total_lessons: number
          completion_rate: number | null
          metadata: Json
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          order_index: number
          is_required?: boolean
          estimated_duration_minutes: number
          learning_objectives?: string[] | null
          summary?: string | null
          prerequisite_module_ids?: string[] | null
          is_published?: boolean
          total_lessons?: number
          completion_rate?: number | null
          metadata?: Json
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          order_index?: number
          is_required?: boolean
          estimated_duration_minutes?: number
          learning_objectives?: string[] | null
          summary?: string | null
          prerequisite_module_ids?: string[] | null
          is_published?: boolean
          total_lessons?: number
          completion_rate?: number | null
          metadata?: Json
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      course_tags: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          description: string
          slug: string
          thumbnail_url: string | null
          trailer_video_url: string | null
          learning_objectives: string[]
          prerequisites: string[] | null
          target_audience: string[] | null
          estimated_duration_hours: number
          difficulty_level: Database["public"]["Enums"]["difficulty_level"]
          instructor_id: string
          co_instructors: string[] | null
          status: Database["public"]["Enums"]["course_status"]
          is_featured: boolean
          is_free: boolean
          price: number | null
          currency: string | null
          max_enrollments: number | null
          enrollment_start_date: string | null
          enrollment_end_date: string | null
          course_start_date: string | null
          course_end_date: string | null
          category_id: string | null
          language: string
          certificate_template_id: string | null
          total_lessons: number
          total_modules: number
          average_rating: number | null
          total_ratings: number
          total_enrollments: number
          completion_rate: number | null
          version: number
          parent_course_id: string | null
          seo_title: string | null
          seo_description: string | null
          keywords: string[] | null
          tags: string[] | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          description: string
          slug: string
          thumbnail_url?: string | null
          trailer_video_url?: string | null
          learning_objectives: string[]
          prerequisites?: string[] | null
          target_audience?: string[] | null
          estimated_duration_hours: number
          difficulty_level: Database["public"]["Enums"]["difficulty_level"]
          instructor_id: string
          co_instructors?: string[] | null
          status?: Database["public"]["Enums"]["course_status"]
          is_featured?: boolean
          is_free?: boolean
          price?: number | null
          currency?: string | null
          max_enrollments?: number | null
          enrollment_start_date?: string | null
          enrollment_end_date?: string | null
          course_start_date?: string | null
          course_end_date?: string | null
          category_id?: string | null
          language?: string
          certificate_template_id?: string | null
          total_lessons?: number
          total_modules?: number
          average_rating?: number | null
          total_ratings?: number
          total_enrollments?: number
          completion_rate?: number | null
          version?: number
          parent_course_id?: string | null
          seo_title?: string | null
          seo_description?: string | null
          keywords?: string[] | null
          tags?: string[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          description?: string
          slug?: string
          thumbnail_url?: string | null
          trailer_video_url?: string | null
          learning_objectives?: string[]
          prerequisites?: string[] | null
          target_audience?: string[] | null
          estimated_duration_hours?: number
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"]
          instructor_id?: string
          co_instructors?: string[] | null
          status?: Database["public"]["Enums"]["course_status"]
          is_featured?: boolean
          is_free?: boolean
          price?: number | null
          currency?: string | null
          max_enrollments?: number | null
          enrollment_start_date?: string | null
          enrollment_end_date?: string | null
          course_start_date?: string | null
          course_end_date?: string | null
          category_id?: string | null
          language?: string
          certificate_template_id?: string | null
          total_lessons?: number
          total_modules?: number
          average_rating?: number | null
          total_ratings?: number
          total_enrollments?: number
          completion_rate?: number | null
          version?: number
          parent_course_id?: string | null
          seo_title?: string | null
          seo_description?: string | null
          keywords?: string[] | null
          tags?: string[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_parent_course_id_fkey"
            columns: ["parent_course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      content_approvals: {
        Row: {
          id: string
          content_id: string
          content_type: string
          version_id: string
          status: Database["public"]["Enums"]["approval_status"]
          reviewer_id: string
          reviewed_at: string | null
          feedback: string | null
          required_changes: string[] | null
          approval_level: number
          is_final_approval: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          content_type: string
          version_id: string
          status?: Database["public"]["Enums"]["approval_status"]
          reviewer_id: string
          reviewed_at?: string | null
          feedback?: string | null
          required_changes?: string[] | null
          approval_level?: number
          is_final_approval?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          content_type?: string
          version_id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          reviewer_id?: string
          reviewed_at?: string | null
          feedback?: string | null
          required_changes?: string[] | null
          approval_level?: number
          is_final_approval?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_approvals_version_id_fkey"
            columns: ["version_id"]
            referencedRelation: "content_versions"
            referencedColumns: ["id"]
          }
        ]
      }
      content_versions: {
        Row: {
          id: string
          content_id: string
          content_type: string
          version_number: number
          content_data: Json
          change_summary: string
          created_by: string
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          content_type: string
          version_number: number
          content_data: Json
          change_summary: string
          created_by: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          content_type?: string
          version_number?: number
          content_data?: Json
          change_summary?: string
          created_by?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_analytics: {
        Row: {
          id: string
          lesson_id: string
          course_id: string
          date: string
          unique_views: number
          total_views: number
          average_watch_time_seconds: number | null
          completion_rate: number | null
          drop_off_points: number[] | null
          average_score: number | null
          average_attempts: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          course_id: string
          date: string
          unique_views?: number
          total_views?: number
          average_watch_time_seconds?: number | null
          completion_rate?: number | null
          drop_off_points?: number[] | null
          average_score?: number | null
          average_attempts?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          course_id?: string
          date?: string
          unique_views?: number
          total_views?: number
          average_watch_time_seconds?: number | null
          completion_rate?: number | null
          drop_off_points?: number[] | null
          average_score?: number | null
          average_attempts?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_analytics_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_analytics_lesson_id_fkey"
            columns: ["lesson_id"]
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          }
        ]
      }
      lesson_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          course_id: string
          module_id: string
          status: Database["public"]["Enums"]["progress_status"]
          progress_percentage: number
          time_spent_minutes: number
          started_at: string | null
          completed_at: string | null
          last_accessed_at: string
          video_progress_seconds: number | null
          video_watch_percentage: number | null
          score: number | null
          max_score: number | null
          attempts: number
          notes: string | null
          bookmarks: number[] | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          course_id: string
          module_id: string
          status?: Database["public"]["Enums"]["progress_status"]
          progress_percentage?: number
          time_spent_minutes?: number
          started_at?: string | null
          completed_at?: string | null
          last_accessed_at?: string
          video_progress_seconds?: number | null
          video_watch_percentage?: number | null
          score?: number | null
          max_score?: number | null
          attempts?: number
          notes?: string | null
          bookmarks?: number[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          course_id?: string
          module_id?: string
          status?: Database["public"]["Enums"]["progress_status"]
          progress_percentage?: number
          time_spent_minutes?: number
          started_at?: string | null
          completed_at?: string | null
          last_accessed_at?: string
          video_progress_seconds?: number | null
          video_watch_percentage?: number | null
          score?: number | null
          max_score?: number | null
          attempts?: number
          notes?: string | null
          bookmarks?: number[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          }
        ]
      }
      lesson_resources: {
        Row: {
          id: string
          lesson_id: string
          title: string
          description: string | null
          file_url: string
          file_type: string
          file_size_bytes: number
          is_downloadable: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          title: string
          description?: string | null
          file_url: string
          file_type: string
          file_size_bytes: number
          is_downloadable?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_type?: string
          file_size_bytes?: number
          is_downloadable?: boolean
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          }
        ]
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          course_id: string
          title: string
          description: string | null
          order_index: number
          content_type: Database["public"]["Enums"]["content_type"]
          content_url: string | null
          content_data: Json
          estimated_duration_minutes: number
          mux_asset_id: string | null
          mux_playback_id: string | null
          video_duration_seconds: number | null
          text_content: string | null
          interactive_config: Json | null
          is_required: boolean
          prerequisite_lesson_ids: string[] | null
          is_published: boolean
          is_preview: boolean
          average_completion_time_minutes: number | null
          completion_rate: number | null
          metadata: Json
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          course_id: string
          title: string
          description?: string | null
          order_index: number
          content_type: Database["public"]["Enums"]["content_type"]
          content_url?: string | null
          content_data?: Json
          estimated_duration_minutes: number
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          video_duration_seconds?: number | null
          text_content?: string | null
          interactive_config?: Json | null
          is_required?: boolean
          prerequisite_lesson_ids?: string[] | null
          is_published?: boolean
          is_preview?: boolean
          average_completion_time_minutes?: number | null
          completion_rate?: number | null
          metadata?: Json
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          course_id?: string
          title?: string
          description?: string | null
          order_index?: number
          content_type?: Database["public"]["Enums"]["content_type"]
          content_url?: string | null
          content_data?: Json
          estimated_duration_minutes?: number
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          video_duration_seconds?: number | null
          text_content?: string | null
          interactive_config?: Json | null
          is_required?: boolean
          prerequisite_lesson_ids?: string[] | null
          is_published?: boolean
          is_preview?: boolean
          average_completion_time_minutes?: number | null
          completion_rate?: number | null
          metadata?: Json
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected" | "needs_revision"
      content_type: "video" | "text" | "quiz" | "assignment" | "document" | "interactive" | "live_session"
      course_status: "draft" | "under_review" | "published" | "archived" | "suspended"
      difficulty_level: "beginner" | "intermediate" | "advanced" | "expert"
      enrollment_status: "enrolled" | "completed" | "dropped" | "suspended"
      progress_status: "not_started" | "in_progress" | "completed" | "skipped"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}