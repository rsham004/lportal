# 🚀 Corrected Step-by-Step Infrastructure Setup Guide

## Overview
This guide provides corrected, detailed instructions based on current UI patterns for all infrastructure services.

**Total Time**: ~50 minutes  
**Prerequisites**: Computer with internet access, email address, credit card (for some services)

---

## 📋 **STEP 1: Supabase Database Setup** (15 minutes)

### 1.1 Create Supabase Account and Project
1. **Go to**: [https://supabase.com](https://supabase.com)
2. **Click**: "Start your project" (green button)
3. **Sign up** with GitHub (recommended) or email
4. **After login, click**: "New project" (+ icon or button)
5. **Fill in the project creation form**:
   - **Organization**: Select your personal organization (usually your username)
   - **Project name**: `learning-portal-prod`
   - **Database Password**: Click "Generate a password" and **SAVE THIS PASSWORD**
   - **Region**: Choose closest to your users (e.g., "US East (N. Virginia)")
   - **Pricing plan**: "Free" (default selection)
6. **Click**: "Create new project" (green button)
7. **Wait**: 2-3 minutes for project provisioning (you'll see a progress screen)

### 1.2 Save Your Supabase Credentials
1. **After project creation**, you'll be in the project dashboard
2. **Go to**: Settings (gear icon in left sidebar) > API
3. **Copy and save these values** (click the copy icon next to each):
   ```
   Project URL: https://[your-project-id].supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role secret key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 1.3 Deploy Database Schema
1. **Go to**: SQL Editor (in left sidebar, looks like </> icon)
2. **Click**: "New query" button (+ icon)
3. **Delete any default content** in the editor
4. **Copy and paste** this entire SQL script:

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
  path TEXT,
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
  estimated_duration INTEGER,
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
  estimated_duration INTEGER,
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
  time_spent INTEGER DEFAULT 0,
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

-- Content versions table
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
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Published courses are viewable by all" ON public.courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Instructors can manage their courses" ON public.courses
  FOR ALL USING (auth.uid() = instructor_id);

CREATE POLICY "Categories are viewable by all" ON public.course_categories
  FOR SELECT USING (true);

CREATE POLICY "Tags are viewable by all" ON public.course_tags
  FOR SELECT USING (true);

CREATE POLICY "Users can view their enrollments" ON public.course_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses" ON public.course_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their progress" ON public.content_block_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their progress" ON public.content_block_progress
  FOR ALL USING (auth.uid() = user_id);

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

5. **Click**: "RUN" button (play icon, usually green)
6. **Verify**: You should see "Success. No rows returned" or similar success message

### 1.4 Set Up Storage Buckets
1. **Go to**: Storage (folder icon in left sidebar)
2. **Click**: "Create a new bucket" button
3. **Create first bucket**:
   - **Name**: `course-materials`
   - **Public bucket**: Toggle ON (✓)
   - **File size limit**: Leave default
   - **Allowed MIME types**: Leave default
   - **Click**: "Create bucket"
4. **Create second bucket**:
   - **Name**: `user-uploads`
   - **Public bucket**: Toggle OFF (✗)
   - **Click**: "Create bucket"
5. **Create third bucket**:
   - **Name**: `video-thumbnails`
   - **Public bucket**: Toggle ON (✓)
   - **Click**: "Create bucket"

### 1.5 Configure Storage Policies (CORRECTED)

**Important**: The Supabase Storage Policies UI has changed. Here are the correct steps:

1. **Go to**: Storage > Policies (in the Storage section)
2. **You'll see a table with your buckets**. For each bucket, you need to add policies.

#### For `course-materials` bucket:

**Policy 1: Public Read Access**
1. **Click**: "New Policy" button
2. **Select**: "For full customization" (not the templates)
3. **Fill in**:
   - **Policy name**: `Public read course materials`
   - **Allowed operation**: Select "SELECT" only
   - **Target roles**: Select "public"
   - **USING expression**:
     ```sql
     bucket_id = 'course-materials'
     ```
4. **Click**: "Review" → "Save policy"

**Policy 2: Authenticated Upload**
1. **Click**: "New Policy" button
2. **Fill in**:
   - **Policy name**: `Authenticated upload course materials`
   - **Allowed operation**: Select "INSERT" only
   - **Target roles**: Select "authenticated"
   - **WITH CHECK expression**:
     ```sql
     bucket_id = 'course-materials'
     ```
3. **Click**: "Review" → "Save policy"

#### For `user-uploads` bucket:

**Policy 3: Private Upload**
1. **Click**: "New Policy" button
2. **Fill in**:
   - **Policy name**: `Users upload to own folder`
   - **Allowed operation**: Select "INSERT" only
   - **Target roles**: Select "authenticated"
   - **WITH CHECK expression**:
     ```sql
     bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text
     ```
3. **Click**: "Review" → "Save policy"

**Policy 4: Private Read**
1. **Click**: "New Policy" button
2. **Fill in**:
   - **Policy name**: `Users read own uploads`
   - **Allowed operation**: Select "SELECT" only
   - **Target roles**: Select "authenticated"
   - **USING expression**:
     ```sql
     bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text
     ```
3. **Click**: "Review" → "Save policy"

#### For `video-thumbnails` bucket:

**Policy 5: Public Read**
1. **Click**: "New Policy" button
2. **Fill in**:
   - **Policy name**: `Public read thumbnails`
   - **Allowed operation**: Select "SELECT" only
   - **Target roles**: Select "public"
   - **USING expression**:
     ```sql
     bucket_id = 'video-thumbnails'
     ```
3. **Click**: "Review" → "Save policy"

**Policy 6: Authenticated Upload**
1. **Click**: "New Policy" button
2. **Fill in**:
   - **Policy name**: `Authenticated upload thumbnails`
   - **Allowed operation**: Select "INSERT" only
   - **Target roles**: Select "authenticated"
   - **WITH CHECK expression**:
     ```sql
     bucket_id = 'video-thumbnails'
     ```
3. **Click**: "Review" → "Save policy"

✅ **Supabase Setup Complete!**

---

## 🔐 **STEP 2: Clerk Authentication Setup** (10 minutes)

### 2.1 Create Clerk Account and Application (CORRECTED)
1. **Go to**: [https://clerk.com](https://clerk.com)
2. **Click**: "Get started for free" (main CTA button)
3. **Sign up** with GitHub (recommended) or email
4. **After signup**, you'll be prompted to create your first application
5. **Fill in the application creation form**:
   - **Application name**: `Learning Portal`
   - **How will your users sign in?** Select:
     - ✓ Email address
     - ✓ Google
     - ✓ LinkedIn  
     - ✓ GitHub
6. **Click**: "Create Application"

### 2.2 Save Your Clerk Credentials
1. **After app creation**, you'll see the "API Keys" page
2. **Copy and save** these values (click copy button):
   ```
   Publishable key: pk_test_...
   Secret key: sk_test_...
   ```

### 2.3 Configure Social Login Providers (CORRECTED)

#### Google OAuth Setup:
1. **In Clerk Dashboard**: Go to "User & Authentication" → "Social Connections"
2. **Find Google** in the list and click "Configure"
3. **You'll see**: "Add your Google OAuth credentials"
4. **Open new tab**: Go to [Google Cloud Console](https://console.cloud.google.com)
5. **Create/Select Project**: Create new project or select existing
6. **Enable APIs**: Go to "APIs & Services" → "Library" → Search "Google+ API" → Enable
7. **Create Credentials**: Go to "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
8. **Configure OAuth consent screen** (if prompted):
   - User Type: External
   - App name: Learning Portal
   - User support email: Your email
   - Developer contact: Your email
9. **Create OAuth Client**:
   - Application type: Web application
   - Name: Learning Portal
   - Authorized redirect URIs: Copy the redirect URI from Clerk (shown in the Google config page)
10. **Copy Client ID and Secret** from Google
11. **Back in Clerk**: Paste Client ID and Client Secret
12. **Click**: "Apply changes"

#### LinkedIn OAuth Setup:
1. **In Clerk Dashboard**: Find LinkedIn and click "Configure"
2. **Open new tab**: Go to [LinkedIn Developer Portal](https://developer.linkedin.com/apps)
3. **Click**: "Create app"
4. **Fill in**:
   - App name: Learning Portal
   - LinkedIn Page: Select your company page (create one if needed)
   - Privacy policy URL: https://your-domain.com/privacy (temporary)
   - App logo: Upload any logo
5. **Click**: "Create app"
6. **Go to**: "Auth" tab
7. **Add redirect URL**: Copy from Clerk LinkedIn config page
8. **Copy**: Client ID and Client Secret
9. **Back in Clerk**: Paste credentials and click "Apply changes"

#### GitHub OAuth Setup:
1. **In Clerk Dashboard**: Find GitHub and click "Configure"
2. **Open new tab**: Go to GitHub → Settings → Developer settings → OAuth Apps
3. **Click**: "New OAuth App"
4. **Fill in**:
   - Application name: Learning Portal
   - Homepage URL: https://your-domain.com (temporary)
   - Authorization callback URL: Copy from Clerk GitHub config page
5. **Click**: "Register application"
6. **Generate Client Secret** and copy both Client ID and Secret
7. **Back in Clerk**: Paste credentials and click "Apply changes"

### 2.4 Configure Webhooks
1. **In Clerk Dashboard**: Go to "Webhooks"
2. **Click**: "Add Endpoint"
3. **Fill in**:
   - **Endpoint URL**: `https://your-domain.vercel.app/api/webhooks/clerk` (you'll update this after Vercel deployment)
   - **Events**: Select:
     - ✓ user.created
     - ✓ user.updated
     - ✓ user.deleted
     - ✓ session.created
     - ✓ session.ended
4. **Click**: "Create"
5. **Copy**: Signing secret (click "Reveal" then copy)

✅ **Clerk Setup Complete!**

---

## 🎥 **STEP 3: Mux Video Infrastructure Setup** (10 minutes)

### 3.1 Create Mux Account (CORRECTED)
1. **Go to**: [https://mux.com](https://mux.com)
2. **Click**: "Start building for free"
3. **Sign up** with email (GitHub signup may not be available)
4. **Verify** your email address
5. **Complete onboarding**:
   - What are you building? Select "Education/E-learning"
   - Company size? Select appropriate size
   - Skip additional questions if desired

### 3.2 Create Environment and Get API Keys (CORRECTED)
1. **Go to**: Settings → Access Tokens (in left sidebar)
2. **Click**: "Generate new token"
3. **Fill in**:
   - **Name**: `Learning Portal Production`
   - **Environment**: Select "Production" (or create new environment)
   - **Permissions**: Select:
     - ✓ Mux Video (Full Access)
     - ✓ Mux Data (Read)
     - ✓ Mux Live (Full Access)
4. **Click**: "Generate token"
5. **IMPORTANT**: Copy and save immediately (you won't see the secret again):
   ```
   Access Token ID: [token-id]
   Secret Key: [secret-key]
   ```

### 3.3 Get Environment Key
1. **Go to**: Settings → Environments
2. **Find your environment** and copy the Environment Key (starts with `env_`)

### 3.4 Configure Webhooks
1. **Go to**: Settings → Webhooks
2. **Click**: "Create new webhook"
3. **Fill in**:
   - **URL**: `https://your-domain.vercel.app/api/webhooks/mux` (update after Vercel deployment)
   - **Events**: Select:
     - ✓ video.asset.ready
     - ✓ video.asset.errored
     - ✓ video.live_stream.active
     - ✓ video.live_stream.idle
4. **Click**: "Create webhook"
5. **Copy**: Signing secret

✅ **Mux Setup Complete!**

---

## 🔄 **STEP 4: Redis Cache Setup** (5 minutes)

### 4.1 Create Upstash Account (CORRECTED)
1. **Go to**: [https://upstash.com](https://upstash.com)
2. **Click**: "Get Started" or "Start Free"
3. **Sign up** with GitHub (recommended) or email
4. **After login**, click "Create Database"
5. **Fill in**:
   - **Name**: `learning-portal-cache`
   - **Type**: Regional
   - **Region**: Choose closest to your users
   - **TLS**: Enable (recommended)
6. **Click**: "Create"

### 4.2 Get Redis Credentials
1. **Go to**: Your database dashboard (click on the database name)
2. **Scroll down** to find connection details
3. **Copy and save**:
   ```
   UPSTASH_REDIS_REST_URL: https://...
   UPSTASH_REDIS_REST_TOKEN: ...
   ```
   OR
   ```
   Redis URL: redis://...
   ```

✅ **Redis Setup Complete!**

---

## 🌐 **STEP 5: Environment Configuration** (5 minutes)

### 5.1 Set Up Environment Variables
1. **Navigate to**: Your project's `live-coding` directory
2. **Copy environment template**:
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

### 6.3 Deploy to Vercel (CORRECTED)
1. **Navigate to**: `live-coding` directory
2. **Run**:
   ```bash
   vercel
   ```
3. **Answer prompts**:
   - "Set up and deploy ~/path/to/live-coding?" → `Y`
   - "Which scope do you want to deploy to?" → Select your account
   - "Link to existing project?" → `N`
   - "What's your project's name?" → `learning-portal`
   - "In which directory is your code located?" → `./`
   - "Want to modify these settings?" → `N`

### 6.4 Set Environment Variables in Vercel
**Method 1: Via CLI (Recommended)**
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

**Method 2: Via Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to Settings → Environment Variables
4. Add each variable manually

### 6.5 Deploy to Production
```bash
vercel --prod
```

### 6.6 Update Webhook URLs
1. **Copy your production URL** from Vercel output
2. **Update Clerk webhook**: 
   - Go to Clerk Dashboard → Webhooks
   - Edit your webhook
   - Update URL to: `https://your-domain.vercel.app/api/webhooks/clerk`
3. **Update Mux webhook**:
   - Go to Mux Dashboard → Settings → Webhooks
   - Edit your webhook
   - Update URL to: `https://your-domain.vercel.app/api/webhooks/mux`

✅ **Production Deployment Complete!**

---

## ✅ **STEP 7: Validation Testing** (10 minutes)

### 7.1 Test Authentication
1. **Visit**: Your production URL
2. **Test registration**: Create new account with email
3. **Test social login**: Try Google, LinkedIn, GitHub
4. **Verify**: User profile creation and login flow

### 7.2 Test Core Features
1. **Dashboard access**: Verify authenticated user can access dashboard
2. **Database connection**: Check if user profile is created in Supabase
3. **Storage access**: Try uploading a test file (if UI available)

### 7.3 Test PWA Features
1. **Open**: Chrome DevTools → Application → Manifest
2. **Verify**: PWA manifest loads correctly
3. **Test**: Install app prompt (may appear after multiple visits)

### 7.4 Performance Check
1. **Open**: Chrome DevTools → Lighthouse
2. **Run**: Performance audit
3. **Target**: 90+ scores across metrics

✅ **Validation Complete!**

---

## 🎉 **CONGRATULATIONS!**

Your Learning Portal is now **LIVE IN PRODUCTION**! 🚀

### **What You've Accomplished:**
- ✅ Production database with complete schema and RLS policies
- ✅ Authentication with social login providers
- ✅ Video infrastructure ready for streaming
- ✅ Cache layer for performance
- ✅ Production deployment with monitoring

### **Your Production URLs:**
- **Application**: https://your-domain.vercel.app
- **Supabase Dashboard**: https://supabase.com/dashboard/project/[project-id]
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Mux Dashboard**: https://dashboard.mux.com
- **Upstash Dashboard**: https://console.upstash.com

### **Next Steps:**
1. **Test thoroughly** with real user flows
2. **Monitor** performance and usage
3. **Scale** infrastructure as needed
4. **Add custom domain** (optional)

### **Troubleshooting:**
- **Authentication issues**: Check Clerk webhook URLs and credentials
- **Database errors**: Verify Supabase RLS policies and connection
- **Video upload issues**: Check Mux API credentials and webhooks
- **Performance issues**: Monitor Redis cache hit rates

**Your enterprise-grade learning platform is ready for users!** 🎓✨