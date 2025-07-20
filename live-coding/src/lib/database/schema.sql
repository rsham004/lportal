-- ============================================================================
-- Learning Portal Database Schema
-- Supabase PostgreSQL Schema for Content Management System
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE course_status AS ENUM (
  'draft',
  'under_review', 
  'published',
  'archived',
  'suspended'
);

CREATE TYPE content_type AS ENUM (
  'video',
  'text',
  'quiz',
  'assignment',
  'document',
  'interactive',
  'live_session',
  'mixed'
);

CREATE TYPE content_block_type AS ENUM (
  'text',
  'video',
  'image',
  'audio',
  'quiz',
  'assignment',
  'code',
  'embed',
  'download',
  'discussion',
  'interactive',
  'divider',
  'callout'
);

CREATE TYPE difficulty_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

CREATE TYPE enrollment_status AS ENUM (
  'enrolled',
  'completed',
  'dropped',
  'suspended'
);

CREATE TYPE progress_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'skipped'
);

CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'needs_revision'
);

-- ============================================================================
-- COURSE CATEGORIES
-- ============================================================================

CREATE TABLE course_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL,
  icon VARCHAR(100),
  color VARCHAR(7), -- Hex color code
  order_index INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  level INTEGER NOT NULL DEFAULT 0,
  path TEXT NOT NULL, -- Hierarchical path like "technology/web-development"
  course_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COURSE TAGS
-- ============================================================================

CREATE TABLE course_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COURSES
-- ============================================================================

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(300),
  description TEXT NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  thumbnail_url TEXT,
  trailer_video_url TEXT,
  
  -- Content and Structure
  learning_objectives TEXT[] NOT NULL DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  target_audience TEXT[] DEFAULT '{}',
  estimated_duration_hours DECIMAL(6,2) NOT NULL,
  difficulty_level difficulty_level NOT NULL,
  
  -- Instructor and Ownership
  instructor_id UUID NOT NULL, -- References auth.users
  co_instructors UUID[] DEFAULT '{}',
  
  -- Status and Visibility
  status course_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price DECIMAL(10,2),
  currency CHAR(3) DEFAULT 'USD',
  
  -- Enrollment and Access
  max_enrollments INTEGER,
  enrollment_start_date TIMESTAMP WITH TIME ZONE,
  enrollment_end_date TIMESTAMP WITH TIME ZONE,
  course_start_date TIMESTAMP WITH TIME ZONE,
  course_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Content Organization
  category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL,
  language CHAR(2) NOT NULL DEFAULT 'en',
  certificate_template_id UUID,
  
  -- Analytics and Metrics
  total_lessons INTEGER NOT NULL DEFAULT 0,
  total_modules INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2),
  total_ratings INTEGER NOT NULL DEFAULT 0,
  total_enrollments INTEGER NOT NULL DEFAULT 0,
  completion_rate DECIMAL(5,2),
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  parent_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  
  -- SEO and Marketing
  seo_title VARCHAR(200),
  seo_description VARCHAR(300),
  keywords TEXT[],
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_price CHECK (price IS NULL OR price >= 0),
  CONSTRAINT valid_duration CHECK (estimated_duration_hours > 0),
  CONSTRAINT valid_rating CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 5))
);

-- ============================================================================
-- COURSE MODULES
-- ============================================================================

CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Basic Information
  title VARCHAR(200) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  
  -- Content Details
  is_required BOOLEAN NOT NULL DEFAULT true,
  estimated_duration_minutes INTEGER NOT NULL,
  learning_objectives TEXT[],
  summary TEXT,
  
  -- Prerequisites
  prerequisite_module_ids UUID[],
  
  -- Status
  is_published BOOLEAN NOT NULL DEFAULT false,
  
  -- Analytics
  total_lessons INTEGER NOT NULL DEFAULT 0,
  completion_rate DECIMAL(5,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_duration_minutes CHECK (estimated_duration_minutes > 0),
  CONSTRAINT valid_order_index CHECK (order_index >= 0),
  CONSTRAINT unique_module_order UNIQUE (course_id, order_index)
);

-- ============================================================================
-- LESSONS
-- ============================================================================

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Basic Information
  title VARCHAR(200) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  
  -- Content Details
  content_type content_type NOT NULL,
  content_url TEXT,
  content_data JSONB DEFAULT '{}',
  estimated_duration_minutes INTEGER NOT NULL,
  
  -- Video-specific (Mux integration)
  mux_asset_id VARCHAR(100),
  mux_playback_id VARCHAR(100),
  video_duration_seconds INTEGER,
  
  -- Text content
  text_content TEXT,
  
  -- Interactive content
  interactive_config JSONB,
  
  -- Requirements
  is_required BOOLEAN NOT NULL DEFAULT true,
  prerequisite_lesson_ids UUID[],
  
  -- Status
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_preview BOOLEAN NOT NULL DEFAULT false,
  
  -- Analytics
  average_completion_time_minutes DECIMAL(8,2),
  completion_rate DECIMAL(5,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_duration_minutes CHECK (estimated_duration_minutes > 0),
  CONSTRAINT valid_order_index CHECK (order_index >= 0),
  CONSTRAINT unique_lesson_order UNIQUE (module_id, order_index),
  CONSTRAINT valid_video_duration CHECK (video_duration_seconds IS NULL OR video_duration_seconds > 0)
);

-- ============================================================================
-- LESSON RESOURCES
-- ============================================================================

CREATE TABLE lesson_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  
  -- Resource Information
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  is_downloadable BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_file_size CHECK (file_size_bytes > 0)
);

-- ============================================================================
-- CONTENT BLOCKS
-- ============================================================================

CREATE TABLE content_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  
  -- Block Information
  block_type content_block_type NOT NULL,
  order_index INTEGER NOT NULL,
  
  -- Content Data
  content JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  
  -- Requirements
  is_required BOOLEAN NOT NULL DEFAULT true,
  estimated_duration_minutes INTEGER,
  
  -- Analytics
  completion_rate DECIMAL(5,2),
  average_time_spent_minutes DECIMAL(8,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_order_index CHECK (order_index >= 0),
  CONSTRAINT unique_block_order UNIQUE (lesson_id, order_index)
);

-- ============================================================================
-- CONTENT BLOCK PROGRESS
-- ============================================================================

CREATE TABLE content_block_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users
  content_block_id UUID NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Progress Status
  status progress_status NOT NULL DEFAULT 'not_started',
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Time Tracking
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Block-specific Progress Data
  block_data JSONB DEFAULT '{}', -- Quiz answers, assignment submissions, etc.
  
  -- Quiz/Assignment Results
  score DECIMAL(8,2),
  max_score DECIMAL(8,2),
  attempts INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  CONSTRAINT valid_time_spent CHECK (time_spent_minutes >= 0),
  CONSTRAINT valid_attempts CHECK (attempts >= 0),
  CONSTRAINT unique_user_block UNIQUE (user_id, content_block_id)
);

-- ============================================================================
-- ASSIGNMENT SUBMISSIONS
-- ============================================================================

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_block_id UUID NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References auth.users
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Submission Content
  submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('text', 'file', 'url', 'code')),
  content TEXT,
  file_url TEXT,
  file_name VARCHAR(255),
  file_size_bytes BIGINT,
  
  -- Grading
  status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned', 'late')),
  score DECIMAL(8,2),
  max_score DECIMAL(8,2) NOT NULL,
  feedback TEXT,
  graded_by UUID, -- References auth.users
  graded_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0 AND score <= max_score)),
  CONSTRAINT valid_max_score CHECK (max_score > 0),
  CONSTRAINT unique_user_assignment UNIQUE (user_id, content_block_id)
);

-- ============================================================================
-- QUIZ ATTEMPTS
-- ============================================================================

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_block_id UUID NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References auth.users
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Attempt Data
  attempt_number INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}', -- Question ID -> Answer mapping
  
  -- Results
  score DECIMAL(8,2) NOT NULL DEFAULT 0,
  max_score DECIMAL(8,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_minutes INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_attempt_number CHECK (attempt_number > 0),
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= max_score),
  CONSTRAINT valid_percentage CHECK (percentage >= 0 AND percentage <= 100),
  CONSTRAINT valid_time_spent CHECK (time_spent_minutes IS NULL OR time_spent_minutes >= 0)
);

-- ============================================================================
-- COURSE ENROLLMENTS
-- ============================================================================

CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Enrollment Status
  status enrollment_status NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  dropped_at TIMESTAMP WITH TIME ZONE,
  
  -- Progress Tracking
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  current_lesson_id UUID REFERENCES lessons(id),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Completion Tracking
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  completed_modules INTEGER NOT NULL DEFAULT 0,
  total_modules INTEGER NOT NULL DEFAULT 0,
  
  -- Time Tracking
  total_time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  
  -- Certificate
  certificate_issued_at TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  
  -- Payment (if applicable)
  payment_id VARCHAR(100),
  amount_paid DECIMAL(10,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  CONSTRAINT valid_time_spent CHECK (total_time_spent_minutes >= 0),
  CONSTRAINT unique_user_course UNIQUE (user_id, course_id)
);

-- ============================================================================
-- LESSON PROGRESS
-- ============================================================================

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  
  -- Progress Status
  status progress_status NOT NULL DEFAULT 'not_started',
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Time Tracking
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Video Progress (for video lessons)
  video_progress_seconds INTEGER,
  video_watch_percentage DECIMAL(5,2),
  
  -- Quiz/Assignment Results
  score DECIMAL(8,2),
  max_score DECIMAL(8,2),
  attempts INTEGER NOT NULL DEFAULT 0,
  
  -- Notes and Bookmarks
  notes TEXT,
  bookmarks INTEGER[], -- Array of timestamps for video bookmarks
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  CONSTRAINT valid_time_spent CHECK (time_spent_minutes >= 0),
  CONSTRAINT valid_video_progress CHECK (video_progress_seconds IS NULL OR video_progress_seconds >= 0),
  CONSTRAINT valid_video_watch_percentage CHECK (video_watch_percentage IS NULL OR (video_watch_percentage >= 0 AND video_watch_percentage <= 100)),
  CONSTRAINT valid_attempts CHECK (attempts >= 0),
  CONSTRAINT unique_user_lesson UNIQUE (user_id, lesson_id)
);

-- ============================================================================
-- CONTENT VERSIONING
-- ============================================================================

CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('course', 'module', 'lesson')),
  version_number INTEGER NOT NULL,
  
  -- Content Data
  content_data JSONB NOT NULL,
  
  -- Version Metadata
  change_summary TEXT NOT NULL,
  created_by UUID NOT NULL, -- References auth.users
  
  -- Approval Workflow
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approved_by UUID, -- References auth.users
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Publishing
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_version_number CHECK (version_number > 0),
  CONSTRAINT unique_content_version UNIQUE (content_id, content_type, version_number)
);

-- ============================================================================
-- CONTENT APPROVALS
-- ============================================================================

CREATE TABLE content_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('course', 'module', 'lesson')),
  version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  
  -- Approval Details
  status approval_status NOT NULL DEFAULT 'pending',
  reviewer_id UUID NOT NULL, -- References auth.users
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Feedback
  feedback TEXT,
  required_changes TEXT[],
  
  -- Workflow
  approval_level INTEGER NOT NULL DEFAULT 1,
  is_final_approval BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_approval_level CHECK (approval_level > 0)
);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

CREATE TABLE course_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Enrollment Metrics
  new_enrollments INTEGER NOT NULL DEFAULT 0,
  total_enrollments INTEGER NOT NULL DEFAULT 0,
  active_learners INTEGER NOT NULL DEFAULT 0,
  
  -- Engagement Metrics
  total_lesson_views INTEGER NOT NULL DEFAULT 0,
  total_time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  average_session_duration_minutes DECIMAL(8,2),
  
  -- Completion Metrics
  lesson_completions INTEGER NOT NULL DEFAULT 0,
  module_completions INTEGER NOT NULL DEFAULT 0,
  course_completions INTEGER NOT NULL DEFAULT 0,
  
  -- Performance Metrics
  average_quiz_score DECIMAL(5,2),
  average_completion_time_days DECIMAL(8,2),
  
  -- Retention Metrics
  day_1_retention DECIMAL(5,2),
  day_7_retention DECIMAL(5,2),
  day_30_retention DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_course_date UNIQUE (course_id, date),
  CONSTRAINT valid_retention_metrics CHECK (
    day_1_retention IS NULL OR (day_1_retention >= 0 AND day_1_retention <= 100)
  )
);

CREATE TABLE lesson_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- View Metrics
  unique_views INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  
  -- Engagement Metrics
  average_watch_time_seconds DECIMAL(8,2),
  completion_rate DECIMAL(5,2),
  drop_off_points INTEGER[], -- For video content
  
  -- Performance Metrics
  average_score DECIMAL(5,2),
  average_attempts DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_lesson_date UNIQUE (lesson_id, date),
  CONSTRAINT valid_completion_rate CHECK (completion_rate IS NULL OR (completion_rate >= 0 AND completion_rate <= 100))
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Course indexes
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_is_featured ON courses(is_featured);
CREATE INDEX idx_courses_difficulty_level ON courses(difficulty_level);
CREATE INDEX idx_courses_language ON courses(language);
CREATE INDEX idx_courses_created_at ON courses(created_at);
CREATE INDEX idx_courses_average_rating ON courses(average_rating);
CREATE INDEX idx_courses_total_enrollments ON courses(total_enrollments);

-- Full-text search indexes
CREATE INDEX idx_courses_title_search ON courses USING gin(to_tsvector('english', title));
CREATE INDEX idx_courses_description_search ON courses USING gin(to_tsvector('english', description));
CREATE INDEX idx_courses_tags_search ON courses USING gin(tags);

-- Module indexes
CREATE INDEX idx_modules_course_id ON course_modules(course_id);
CREATE INDEX idx_modules_order_index ON course_modules(course_id, order_index);

-- Lesson indexes
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_lessons_content_type ON lessons(content_type);
CREATE INDEX idx_lessons_order_index ON lessons(module_id, order_index);
CREATE INDEX idx_lessons_mux_asset_id ON lessons(mux_asset_id) WHERE mux_asset_id IS NOT NULL;

-- Enrollment indexes
CREATE INDEX idx_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_status ON course_enrollments(status);
CREATE INDEX idx_enrollments_enrolled_at ON course_enrollments(enrolled_at);

-- Progress indexes
CREATE INDEX idx_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX idx_progress_course_id ON lesson_progress(course_id);
CREATE INDEX idx_progress_status ON lesson_progress(status);
CREATE INDEX idx_progress_last_accessed_at ON lesson_progress(last_accessed_at);

-- Analytics indexes
CREATE INDEX idx_course_analytics_course_date ON course_analytics(course_id, date);
CREATE INDEX idx_lesson_analytics_lesson_date ON lesson_analytics(lesson_id, date);

-- Content block indexes
CREATE INDEX idx_content_blocks_lesson_id ON content_blocks(lesson_id);
CREATE INDEX idx_content_blocks_type ON content_blocks(block_type);
CREATE INDEX idx_content_blocks_order ON content_blocks(lesson_id, order_index);

-- Content block progress indexes
CREATE INDEX idx_block_progress_user_id ON content_block_progress(user_id);
CREATE INDEX idx_block_progress_block_id ON content_block_progress(content_block_id);
CREATE INDEX idx_block_progress_lesson_id ON content_block_progress(lesson_id);
CREATE INDEX idx_block_progress_status ON content_block_progress(status);

-- Assignment submission indexes
CREATE INDEX idx_assignment_submissions_user_id ON assignment_submissions(user_id);
CREATE INDEX idx_assignment_submissions_block_id ON assignment_submissions(content_block_id);
CREATE INDEX idx_assignment_submissions_status ON assignment_submissions(status);
CREATE INDEX idx_assignment_submissions_submitted_at ON assignment_submissions(submitted_at);

-- Quiz attempt indexes
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_block_id ON quiz_attempts(content_block_id);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON course_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_blocks_updated_at BEFORE UPDATE ON content_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_block_progress_updated_at BEFORE UPDATE ON content_block_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_attempts_updated_at BEFORE UPDATE ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update course totals when modules/lessons change
CREATE OR REPLACE FUNCTION update_course_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'course_modules' THEN
    UPDATE courses 
    SET total_modules = (SELECT COUNT(*) FROM course_modules WHERE course_id = COALESCE(NEW.course_id, OLD.course_id))
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  ELSIF TG_TABLE_NAME = 'lessons' THEN
    UPDATE courses 
    SET total_lessons = (SELECT COUNT(*) FROM lessons WHERE course_id = COALESCE(NEW.course_id, OLD.course_id))
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
    UPDATE course_modules 
    SET total_lessons = (SELECT COUNT(*) FROM lessons WHERE module_id = COALESCE(NEW.module_id, OLD.module_id))
    WHERE id = COALESCE(NEW.module_id, OLD.module_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_module_totals AFTER INSERT OR UPDATE OR DELETE ON course_modules FOR EACH ROW EXECUTE FUNCTION update_course_totals();
CREATE TRIGGER update_course_lesson_totals AFTER INSERT OR UPDATE OR DELETE ON lessons FOR EACH ROW EXECUTE FUNCTION update_course_totals();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Course policies
CREATE POLICY "Public courses are viewable by everyone" ON courses FOR SELECT USING (status = 'published');
CREATE POLICY "Users can view their own courses" ON courses FOR SELECT USING (instructor_id = auth.uid());
CREATE POLICY "Instructors can manage their own courses" ON courses FOR ALL USING (instructor_id = auth.uid());

-- Enrollment policies
CREATE POLICY "Users can view their own enrollments" ON course_enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own enrollments" ON course_enrollments FOR ALL USING (user_id = auth.uid());

-- Progress policies
CREATE POLICY "Users can view their own progress" ON lesson_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own progress" ON lesson_progress FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- SAMPLE DATA (Optional - for development)
-- ============================================================================

-- Insert sample categories
INSERT INTO course_categories (title, slug, description, path, level) VALUES
('Technology', 'technology', 'Technology and programming courses', 'technology', 0),
('Web Development', 'web-development', 'Frontend and backend web development', 'technology/web-development', 1),
('Mobile Development', 'mobile-development', 'iOS and Android app development', 'technology/mobile-development', 1),
('Data Science', 'data-science', 'Data analysis and machine learning', 'technology/data-science', 1);

-- Insert sample tags
INSERT INTO course_tags (name, slug, description) VALUES
('React', 'react', 'React.js framework'),
('TypeScript', 'typescript', 'TypeScript programming language'),
('Next.js', 'nextjs', 'Next.js framework'),
('Beginner Friendly', 'beginner-friendly', 'Suitable for beginners'),
('Hands-on', 'hands-on', 'Practical, project-based learning');

-- Note: Actual course data would be inserted through the application