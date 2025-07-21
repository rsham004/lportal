#!/bin/bash

# Learning Portal Infrastructure Setup Script
# This script helps you set up the required infrastructure services

echo "🚀 Learning Portal Infrastructure Setup"
echo "========================================"
echo ""

# Check if required tools are installed
echo "📋 Checking prerequisites..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check for git
if ! command -v git &> /dev/null; then
    echo "❌ git is not installed. Please install git first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI already installed"
fi

echo ""
echo "🔧 Infrastructure Setup Checklist"
echo "=================================="
echo ""

echo "Please complete these steps manually:"
echo ""

echo "1. 🗄️  SUPABASE SETUP"
echo "   - Go to https://supabase.com"
echo "   - Create new project: 'learning-portal-prod'"
echo "   - Run the SQL schema from INFRASTRUCTURE_SETUP_GUIDE.md"
echo "   - Copy Project URL and API keys"
echo ""

echo "2. 🔐 CLERK AUTHENTICATION SETUP"
echo "   - Go to https://clerk.com"
echo "   - Create new application: 'Learning Portal'"
echo "   - Enable Email/Password, Google, LinkedIn, GitHub"
echo "   - Configure webhooks and copy keys"
echo ""

echo "3. 🎥 MUX VIDEO SETUP"
echo "   - Go to https://mux.com"
echo "   - Create new environment: 'Production'"
echo "   - Configure webhooks and copy API credentials"
echo ""

echo "4. 🔄 REDIS CACHE SETUP"
echo "   - Go to https://upstash.com (recommended)"
echo "   - Create new Redis database"
echo "   - Copy connection URL and token"
echo ""

echo "5. 🌐 VERCEL DEPLOYMENT"
echo "   - Run: vercel login"
echo "   - Run: vercel (in live-coding directory)"
echo "   - Set all environment variables"
echo "   - Run: vercel --prod"
echo ""

echo "📝 Next Steps:"
echo "1. Read INFRASTRUCTURE_SETUP_GUIDE.md for detailed instructions"
echo "2. Copy .env.example to .env.local and fill in your values"
echo "3. Test your setup locally with: npm run dev"
echo "4. Deploy to production with: vercel --prod"
echo ""

echo "🆘 Need Help?"
echo "- Check INFRASTRUCTURE_SETUP_GUIDE.md for troubleshooting"
echo "- Verify all environment variables are set correctly"
echo "- Test each service individually before full deployment"
echo ""

echo "✨ Your Learning Portal is ready for infrastructure setup!"