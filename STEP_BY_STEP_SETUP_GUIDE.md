# 🚀 Step-by-Step Infrastructure Setup Guide

## Overview
This guide provides detailed, copy-paste instructions to set up all infrastructure services for the Learning Portal. Follow each step exactly as written.

**Total Time**: ~50 minutes  
**Prerequisites**: Computer with internet access, email address, credit card (for some services)

---

## 📋 **STEP 1: Supabase Database Setup** (15 minutes)

### 1.1 Create Supabase Account and Project
1. **Go to**: [https://supabase.com](https://supabase.com)
2. **Click**: "Start your project" 
3. **Sign up** with GitHub or email
4. **Click**: "New project"
5. **Fill in**:
   - Organization: Select your organization
   - Name: `learning-portal-prod`
   - Database Password: Generate a strong password (save this!)
   - Region: Choose closest to your users
   - Pricing Plan: Free (can upgrade later)
6. **Click**: "Create new project"
7. **Wait**: 2-3 minutes for project creation

### 1.2 Save Your Supabase Credentials
1. **Go to**: Settings > API in your Supabase dashboard
2. **Copy and save** these values:
   ```
   Project URL: https://[your-project-id].supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role secret key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 1.3 Deploy Database Schema
1. **Go to**: SQL Editor in your Supabase dashboard
2. **Click**: "New query"
3. **Copy and paste** this entire SQL script:

```sql
-- Learning Portal Database Schema
-- Run this entire script in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin', 'super_admin')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course categories table
CREATE TABLE public.course_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.course_categories(id),
  path TEXT, -- For hierarchical categories
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course tags table
CREATE TABLE public.course_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.user_profiles(id),
  category_id UUID REFERENCES public.course_categories(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER, -- in minutes
  price DECIMAL(10,2) DEFAULT 0,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course tags junction table
CREATE TABLE public.course_course_tags (
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.course_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, tag_id)
);

-- Course modules table
CREATE TABLE public.course_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  lesson_type TEXT DEFAULT 'mixed' CHECK (lesson_type IN ('video', 'text', 'quiz', 'assignment', 'mixed')),
  estimated_duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content blocks table
CREATE TABLE public.content_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('text', 'video', 'image', 'audio', 'quiz', 'assignment', 'code', 'embed', 'download', 'callout', 'interactive', 'discussion')),
  content JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course enrollments table
CREATE TABLE public.course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id),
  course_id UUID REFERENCES public.courses(id),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Progress tracking table
CREATE TABLE public.content_block_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id),
  content_block_id UUID REFERENCES public.content_blocks(id),
  completed BOOLEAN DEFAULT FALSE,
  completion_time TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER DEFAULT 0, -- seconds
  engagement_data JSONB DEFAULT '{}',
  UNIQUE(user_id, content_block_id)
);

-- Assignment submissions table
CREATE TABLE public.assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id),
  content_block_id UUID REFERENCES public.content_blocks(id),
  submission_data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  grade DECIMAL(5,2),
  feedback TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned'))
);

-- Content versions table (for versioning)
CREATE TABLE public.content_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_block_id UUID REFERENCES public.content_blocks(id),
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT FALSE
);

-- Content approval table
CREATE TABLE public.content_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_version_id UUID REFERENCES public.content_versions(id),
  reviewer_id UUID REFERENCES public.user_profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_course_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_block_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Course policies
CREATE POLICY "Published courses are viewable by all" ON public.courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Instructors can manage their courses" ON public.courses
  FOR ALL USING (auth.uid() = instructor_id);

CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Course categories policies (public read)
CREATE POLICY "Categories are viewable by all" ON public.course_categories
  FOR SELECT USING (true);

-- Course tags policies (public read)
CREATE POLICY "Tags are viewable by all" ON public.course_tags
  FOR SELECT USING (true);

-- Course modules policies
CREATE POLICY "Course modules viewable by enrolled users" ON public.course_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      JOIN public.courses c ON c.id = ce.course_id
      WHERE c.id = course_id AND ce.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
  );

-- Lessons policies
CREATE POLICY "Lessons viewable by enrolled users" ON public.lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      JOIN public.courses c ON c.id = ce.course_id
      JOIN public.course_modules cm ON cm.course_id = c.id
      WHERE cm.id = module_id AND ce.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.course_modules cm ON cm.course_id = c.id
      WHERE cm.id = module_id AND c.instructor_id = auth.uid()
    )
  );

-- Content blocks policies
CREATE POLICY "Content blocks viewable by enrolled users" ON public.content_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      JOIN public.courses c ON c.id = ce.course_id
      JOIN public.course_modules cm ON cm.course_id = c.id
      JOIN public.lessons l ON l.module_id = cm.id
      WHERE l.id = lesson_id AND ce.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.course_modules cm ON cm.course_id = c.id
      JOIN public.lessons l ON l.module_id = cm.id
      WHERE l.id = lesson_id AND c.instructor_id = auth.uid()
    )
  );

-- Enrollment policies
CREATE POLICY "Users can view their enrollments" ON public.course_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses" ON public.course_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Progress tracking policies
CREATE POLICY "Users can view their progress" ON public.content_block_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their progress" ON public.content_block_progress
  FOR ALL USING (auth.uid() = user_id);

-- Assignment submission policies
CREATE POLICY "Users can view their submissions" ON public.assignment_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" ON public.assignment_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

4. **Click**: "Run" to execute the script
5. **Verify**: You should see "Success. No rows returned" message

### 1.4 Set Up Storage Buckets
1. **Go to**: Storage in your Supabase dashboard
2. **Click**: "Create a new bucket"
3. **Create these buckets**:
   - Name: `course-materials`, Public: ✓
   - Name: `user-uploads`, Public: ✗
   - Name: `video-thumbnails`, Public: ✓

### 1.5 Configure Storage Policies
1. **Go to**: Storage > Policies
2. **Click**: "New policy" for `course-materials` bucket
3. **Add this policy**:
   ```sql
   CREATE POLICY "Course materials are publicly accessible" ON storage.objects
     FOR SELECT USING (bucket_id = 'course-materials');
   ```
4. **Add policy for user-uploads**:
   ```sql
   CREATE POLICY "Users can upload to their folder" ON storage.objects
     FOR INSERT WITH CHECK (
       bucket_id = 'user-uploads' AND 
       auth.uid()::text = (storage.foldername(name))[1]
     );
   ```

✅ **Supabase Setup Complete!**

---

## 🔐 **STEP 2: Clerk Authentication Setup** (10 minutes)

### 2.1 Create Clerk Account and Application
1. **Go to**: [https://clerk.com](https://clerk.com)
2. **Click**: "Start building for free"
3. **Sign up** with GitHub or email
4. **Click**: "Create application"
5. **Fill in**:
   - Application name: `Learning Portal`
   - Select sign-in options:
     - ✓ Email address
     - ✓ Google
     - ✓ LinkedIn
     - ✓ GitHub
6. **Click**: "Create application"

### 2.2 Save Your Clerk Credentials
1. **Copy and save** these values from the dashboard:
   ```
   Publishable key: pk_test_...
   Secret key: sk_test_...
   ```

### 2.3 Configure Social Login Providers

#### Google OAuth Setup:
1. **Go to**: [Google Cloud Console](https://console.cloud.google.com)
2. **Create new project** or select existing
3. **Go to**: APIs & Services > Credentials
4. **Click**: "Create Credentials" > "OAuth 2.0 Client IDs"
5. **Configure**:
   - Application type: Web application
   - Name: Learning Portal
   - Authorized redirect URIs: `https://[your-clerk-domain]/v1/oauth_callback`
6. **Copy**: Client ID and Client Secret
7. **In Clerk Dashboard**: Go to User & Authentication > Social Connections > Google
8. **Paste**: Client ID and Client Secret
9. **Click**: "Apply changes"

#### LinkedIn OAuth Setup:
1. **Go to**: [LinkedIn Developer Portal](https://developer.linkedin.com)
2. **Click**: "Create app"
3. **Fill in**:
   - App name: Learning Portal
   - LinkedIn Page: Your company page
   - App logo: Upload a logo
4. **Go to**: Auth tab
5. **Add redirect URL**: `https://[your-clerk-domain]/v1/oauth_callback`
6. **Copy**: Client ID and Client Secret
7. **In Clerk Dashboard**: Go to User & Authentication > Social Connections > LinkedIn
8. **Paste**: Client ID and Client Secret
9. **Click**: "Apply changes"

#### GitHub OAuth Setup:
1. **Go to**: GitHub Settings > Developer settings > OAuth Apps
2. **Click**: "New OAuth App"
3. **Fill in**:
   - Application name: Learning Portal
   - Homepage URL: https://your-domain.com
   - Authorization callback URL: `https://[your-clerk-domain]/v1/oauth_callback`
4. **Click**: "Register application"
5. **Copy**: Client ID and generate Client Secret
6. **In Clerk Dashboard**: Go to User & Authentication > Social Connections > GitHub
7. **Paste**: Client ID and Client Secret
8. **Click**: "Apply changes"

### 2.4 Configure Webhooks
1. **In Clerk Dashboard**: Go to Webhooks
2. **Click**: "Add Endpoint"
3. **Fill in**:
   - Endpoint URL: `https://your-domain.com/api/webhooks/clerk` (you'll update this later)
   - Subscribe to events:
     - ✓ user.created
     - ✓ user.updated
     - ✓ user.deleted
     - ✓ session.created
     - ✓ session.ended
4. **Click**: "Create"
5. **Copy**: Webhook signing secret

✅ **Clerk Setup Complete!**

---

## 🎥 **STEP 3: Mux Video Infrastructure Setup** (10 minutes)

### 3.1 Create Mux Account
1. **Go to**: [https://mux.com](https://mux.com)
2. **Click**: "Get started free"
3. **Sign up** with email
4. **Verify** your email address
5. **Complete** onboarding questionnaire

### 3.2 Create Environment and Get API Keys
1. **Go to**: Settings > Access Tokens
2. **Click**: "Generate new token"
3. **Fill in**:
   - Name: Learning Portal Production
   - Environment: Create new environment "Production"
   - Permissions: 
     - ✓ Mux Video (Full Access)
     - ✓ Mux Data (Read)
     - ✓ Mux Live (Full Access)
4. **Click**: "Generate token"
5. **Copy and save**:
   ```
   Access Token ID: [token-id]
   Secret Key: [secret-key]
   ```

### 3.3 Get Environment Key
1. **Go to**: Settings > Environment
2. **Copy**: Environment Key (starts with `env_`)

### 3.4 Configure Webhooks
1. **Go to**: Settings > Webhooks
2. **Click**: "Create new webhook"
3. **Fill in**:
   - URL: `https://your-domain.com/api/webhooks/mux` (you'll update this later)
   - Events to send:
     - ✓ video.asset.ready
     - ✓ video.asset.errored
     - ✓ video.live_stream.active
     - ✓ video.live_stream.idle
4. **Click**: "Create webhook"
5. **Copy**: Webhook signing secret

✅ **Mux Setup Complete!**

---

## 🔄 **STEP 4: Redis Cache Setup** (5 minutes)

### 4.1 Create Upstash Account (Recommended)
1. **Go to**: [https://upstash.com](https://upstash.com)
2. **Click**: "Get Started"
3. **Sign up** with GitHub or email
4. **Click**: "Create database"
5. **Fill in**:
   - Name: `learning-portal-cache`
   - Region: Choose closest to your users
   - Type: Regional (free tier)
6. **Click**: "Create"

### 4.2 Get Redis Credentials
1. **Go to**: Your database dashboard
2. **Copy and save**:
   ```
   Redis URL: redis://...
   Redis Token: [your-token]
   ```

### Alternative: Railway Redis
If you prefer Railway:
1. **Go to**: [https://railway.app](https://railway.app)
2. **Sign up** with GitHub
3. **Click**: "New Project" > "Add Redis"
4. **Copy**: Connection string from Variables tab

✅ **Redis Setup Complete!**

---

## 🌐 **STEP 5: Environment Configuration** (5 minutes)

### 5.1 Set Up Environment Variables
1. **Navigate to**: Your project's `live-coding` directory
2. **Copy**: `.env.example` to `.env.local`
   ```bash
   cp .env.example .env.local
   ```
3. **Open**: `.env.local` in your text editor
4. **Fill in all values** with the credentials you saved:

```env
# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Learning Portal"
NEXT_PUBLIC_APP_DESCRIPTION="High-performance learning platform"
NODE_ENV=development

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[your-publishable-key]
CLERK_SECRET_KEY=[your-secret-key]
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
CLERK_WEBHOOK_SECRET=[your-webhook-secret]

# Mux Video
MUX_TOKEN_ID=[your-token-id]
MUX_TOKEN_SECRET=[your-secret-key]
MUX_WEBHOOK_SECRET=[your-webhook-secret]
NEXT_PUBLIC_MUX_ENV_KEY=[your-env-key]

# Redis Cache
REDIS_URL=[your-redis-url]
REDIS_TOKEN=[your-redis-token]

# Feature Flags
NEXT_PUBLIC_ENABLE_STORYBOOK=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_REAL_TIME=true
```

5. **Save** the file

### 5.2 Test Local Setup
1. **Install dependencies**:
   ```bash
   cd live-coding
   npm install
   ```
2. **Start development server**:
   ```bash
   npm run dev
   ```
3. **Open**: http://localhost:3000
4. **Verify**: Application loads without errors

✅ **Environment Setup Complete!**

---

## 🚀 **STEP 6: Vercel Production Deployment** (10 minutes)

### 6.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 6.2 Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate.

### 6.3 Deploy to Vercel
1. **Navigate to**: `live-coding` directory
2. **Run**:
   ```bash
   vercel
   ```
3. **Answer prompts**:
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N`
   - Project name? `learning-portal`
   - Directory? `./` (current directory)
   - Override settings? `N`

### 6.4 Set Environment Variables in Vercel
For each environment variable in your `.env.local`, run:
```bash
vercel env add VARIABLE_NAME
```

**Set these variables** (copy values from your `.env.local`):
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add CLERK_WEBHOOK_SECRET
vercel env add MUX_TOKEN_ID
vercel env add MUX_TOKEN_SECRET
vercel env add MUX_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_MUX_ENV_KEY
vercel env add REDIS_URL
vercel env add REDIS_TOKEN
vercel env add NEXT_PUBLIC_ENABLE_PWA
vercel env add NEXT_PUBLIC_ENABLE_REAL_TIME
```

### 6.5 Deploy to Production
```bash
vercel --prod
```

### 6.6 Update Webhook URLs
1. **Copy your production URL** from Vercel output
2. **Update Clerk webhook**: Replace endpoint URL with `https://your-domain.vercel.app/api/webhooks/clerk`
3. **Update Mux webhook**: Replace endpoint URL with `https://your-domain.vercel.app/api/webhooks/mux`

✅ **Production Deployment Complete!**

---

## ✅ **STEP 7: Validation Testing** (10 minutes)

### 7.1 Test Authentication
1. **Visit**: Your production URL
2. **Click**: "Sign In"
3. **Test**: Email/password registration
4. **Test**: Google social login
5. **Test**: LinkedIn social login
6. **Test**: GitHub social login

### 7.2 Test Core Features
1. **Create**: A test course (if you have instructor role)
2. **Upload**: A test video
3. **Test**: Course navigation
4. **Test**: Progress tracking
5. **Test**: Real-time features (if available)

### 7.3 Test PWA Features
1. **Open**: Chrome DevTools > Application > Manifest
2. **Verify**: PWA manifest is loaded
3. **Test**: "Install app" prompt
4. **Test**: Offline functionality

### 7.4 Performance Check
1. **Open**: Chrome DevTools > Lighthouse
2. **Run**: Performance audit
3. **Verify**: 90+ scores across all metrics

✅ **Validation Complete!**

---

## 🎉 **CONGRATULATIONS!**

Your Learning Portal is now **LIVE IN PRODUCTION**! 🚀

### **What You've Accomplished:**
- ✅ Production database with complete schema
- ✅ Authentication with social login providers
- ✅ Video infrastructure for streaming
- ✅ Cache layer for performance
- ✅ Production deployment with monitoring

### **Your Production URLs:**
- **Application**: https://your-domain.vercel.app
- **Supabase Dashboard**: https://app.supabase.com/project/[project-id]
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Mux Dashboard**: https://dashboard.mux.com
- **Upstash Dashboard**: https://console.upstash.com

### **Next Steps:**
1. **Share** your production URL with users
2. **Monitor** performance and usage
3. **Scale** infrastructure as needed
4. **Plan** future enhancements

### **Support:**
- Check `INFRASTRUCTURE_SETUP_GUIDE.md` for troubleshooting
- Review `PRODUCTION_MONITORING_GUIDE.md` for operations
- Use `PRODUCTION_READINESS_ASSESSMENT.md` for validation

**Your enterprise-grade learning platform is ready for users!** 🎓✨