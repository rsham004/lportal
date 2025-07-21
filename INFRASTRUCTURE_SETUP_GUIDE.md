# Learning Portal Infrastructure Setup Guide

## Overview
This guide walks through setting up the production infrastructure for the Learning Portal platform. All services must be configured before deployment.

## Required Infrastructure Services

### 1. Supabase Database Setup (Critical)

#### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project: "learning-portal-prod"
3. Choose region closest to your users
4. Note down:
   - Project URL: `https://[project-id].supabase.co`
   - Anon Key: `eyJ...` (public key)
   - Service Role Key: `eyJ...` (private key)

#### Step 2: Configure Database Schema
```sql
-- Run in Supabase SQL Editor
-- This creates all tables needed for the learning portal

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

-- Courses table
CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.user_profiles(id),
  category_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_block_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Course access policies
CREATE POLICY "Published courses are viewable by all" ON public.courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Instructors can manage their courses" ON public.courses
  FOR ALL USING (auth.uid() = instructor_id);

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
```

#### Step 3: Configure Storage
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('course-materials', 'course-materials', true),
  ('user-uploads', 'user-uploads', false),
  ('video-thumbnails', 'video-thumbnails', true);

-- Storage policies
CREATE POLICY "Course materials are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-materials');

CREATE POLICY "Users can upload to their folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 2. Clerk Authentication Setup (Critical)

#### Step 1: Create Clerk Application
1. Go to [clerk.com](https://clerk.com) and create account
2. Create new application: "Learning Portal"
3. Choose authentication methods:
   - Email/Password ✓
   - Google ✓
   - LinkedIn ✓
   - GitHub ✓

#### Step 2: Configure Social Providers
**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://[clerk-domain]/v1/oauth_callback`
6. Copy Client ID and Secret to Clerk

**LinkedIn OAuth:**
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com)
2. Create new app
3. Add redirect URL: `https://[clerk-domain]/v1/oauth_callback`
4. Copy Client ID and Secret to Clerk

**GitHub OAuth:**
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth app
3. Set Authorization callback URL: `https://[clerk-domain]/v1/oauth_callback`
4. Copy Client ID and Secret to Clerk

#### Step 3: Configure Webhooks
1. In Clerk Dashboard, go to Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `session.created`
   - `session.ended`

#### Step 4: Note Environment Variables
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
CLERK_WEBHOOK_SECRET=whsec_...
```

### 3. Mux Video Infrastructure Setup (Critical)

#### Step 1: Create Mux Account
1. Go to [mux.com](https://mux.com) and create account
2. Create new environment: "Production"
3. Note down:
   - Access Token ID
   - Secret Key
   - Webhook Signing Secret

#### Step 2: Configure Webhooks
1. In Mux Dashboard, go to Settings > Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/mux`
3. Select events:
   - `video.asset.ready`
   - `video.asset.errored`
   - `video.live_stream.active`
   - `video.live_stream.idle`

#### Step 3: Environment Variables
```env
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
MUX_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Redis Cache Setup (Critical)

#### Option A: Upstash (Recommended)
1. Go to [upstash.com](https://upstash.com) and create account
2. Create new Redis database
3. Choose region closest to your Vercel deployment
4. Note connection details:
   - Redis URL
   - Redis Token

#### Option B: Railway
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add Redis service
4. Note connection string

#### Environment Variables
```env
REDIS_URL=redis://...
REDIS_TOKEN=your_token (if using Upstash)
```

### 5. Vercel Deployment Setup (Critical)

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
vercel login
```

#### Step 2: Configure Project
```bash
cd live-coding
vercel
# Follow prompts to link project
```

#### Step 3: Set Environment Variables
```bash
# Set all environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add MUX_TOKEN_ID
vercel env add MUX_TOKEN_SECRET
vercel env add REDIS_URL
# ... add all other environment variables
```

#### Step 4: Deploy
```bash
vercel --prod
```

### 6. Domain and SSL Setup (Medium Priority)

#### Step 1: Configure Custom Domain
1. In Vercel Dashboard, go to your project
2. Go to Settings > Domains
3. Add your custom domain
4. Configure DNS records as instructed

#### Step 2: SSL Certificate
- Vercel automatically provisions SSL certificates
- Verify HTTPS is working after domain setup

### 7. Monitoring Setup (Medium Priority)

#### Step 1: Configure Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Add analytics script to your app

#### Step 2: Set up Error Tracking (Optional)
Consider adding Sentry for error tracking:
```bash
npm install @sentry/nextjs
```

## Environment Variables Checklist

Create `.env.local` file with all required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
CLERK_WEBHOOK_SECRET=whsec_...

# Mux Video
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
MUX_WEBHOOK_SECRET=your_webhook_secret

# Redis Cache
REDIS_URL=redis://...
REDIS_TOKEN=your_token

# Application
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secret_key
NODE_ENV=production
```

## Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] RLS policies configured
- [ ] Storage buckets created
- [ ] Clerk application configured
- [ ] Social login providers set up
- [ ] Clerk webhooks configured
- [ ] Mux account created
- [ ] Mux webhooks configured
- [ ] Redis instance deployed
- [ ] All environment variables set in Vercel
- [ ] Custom domain configured (optional)
- [ ] SSL certificate verified
- [ ] Production deployment successful
- [ ] Monitoring and analytics enabled

## Testing Production Setup

After deployment, test these critical flows:
1. User registration and login
2. Social login (Google, LinkedIn, GitHub)
3. Course creation and content upload
4. Video upload and playback
5. Progress tracking
6. Real-time features (chat, notifications)
7. Mobile responsiveness
8. PWA installation

## Support and Troubleshooting

### Common Issues:
1. **CORS Errors**: Check Supabase CORS settings
2. **Authentication Issues**: Verify Clerk webhook endpoints
3. **Video Upload Failures**: Check Mux API credentials
4. **Cache Issues**: Verify Redis connection
5. **Deployment Failures**: Check environment variables

### Getting Help:
- Supabase: [docs.supabase.com](https://docs.supabase.com)
- Clerk: [clerk.com/docs](https://clerk.com/docs)
- Mux: [docs.mux.com](https://docs.mux.com)
- Vercel: [vercel.com/docs](https://vercel.com/docs)