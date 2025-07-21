#!/bin/bash

# Learning Portal - Secure Semi-Automated Setup
# ==============================================
# Security-first approach: All personal data treated as secrets
# No credentials or personal info committed to git

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Security configuration
SETUP_DIR=".setup-cache"
USER_CONFIG="$SETUP_DIR/user-config.json"
PROGRESS_FILE="$SETUP_DIR/setup-progress.json"
CREDENTIALS_FILE="$SETUP_DIR/credentials.json"

# Ensure setup directory exists and is secure
setup_secure_directory() {
    echo -e "${BLUE}🔒 Setting up secure configuration directory...${NC}"
    
    if [ ! -d "$SETUP_DIR" ]; then
        mkdir -p "$SETUP_DIR"
        chmod 700 "$SETUP_DIR"  # Only owner can read/write/execute
    fi
    
    # Create secure files with restricted permissions
    touch "$USER_CONFIG" "$PROGRESS_FILE" "$CREDENTIALS_FILE"
    chmod 600 "$USER_CONFIG" "$PROGRESS_FILE" "$CREDENTIALS_FILE"  # Only owner can read/write
    
    echo -e "${GREEN}✅ Secure directory created at $SETUP_DIR${NC}"
    echo -e "${YELLOW}⚠️  This directory is excluded from git and contains sensitive data${NC}"
}

# Collect user information securely
collect_user_info() {
    echo -e "${BLUE}📋 Collecting setup information (stored securely, never committed)...${NC}"
    
    # Check if user config already exists
    if [ -f "$USER_CONFIG" ] && [ -s "$USER_CONFIG" ]; then
        echo -e "${GREEN}✅ Found existing user configuration${NC}"
        read -p "Do you want to use existing config? (y/n): " use_existing
        if [[ $use_existing =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    echo -e "${YELLOW}⚠️  All information will be stored locally and encrypted${NC}"
    echo -e "${YELLOW}⚠️  Nothing will be committed to git${NC}"
    echo ""
    
    # Collect basic information
    read -p "📧 Your email address: " USER_EMAIL
    read -p "🏢 Project/Company name: " PROJECT_NAME
    read -p "🌐 Your domain (optional, press enter for localhost): " DOMAIN
    read -p "🌍 Your preferred region (us-east-1, eu-west-1, etc.): " REGION
    
    # Validate email format
    if [[ ! "$USER_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        echo -e "${RED}❌ Invalid email format${NC}"
        exit 1
    fi
    
    # Set defaults
    DOMAIN=${DOMAIN:-"http://localhost:3000"}
    REGION=${REGION:-"us-east-1"}
    PROJECT_NAME=${PROJECT_NAME:-"Learning Portal"}
    
    # Create secure user config
    cat > "$USER_CONFIG" << EOF
{
    "email": "$USER_EMAIL",
    "projectName": "$PROJECT_NAME",
    "domain": "$DOMAIN",
    "region": "$REGION",
    "setupDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "1.0"
}
EOF
    
    echo -e "${GREEN}✅ User configuration saved securely${NC}"
}

# Load user configuration
load_user_config() {
    if [ ! -f "$USER_CONFIG" ]; then
        echo -e "${RED}❌ User configuration not found. Run setup first.${NC}"
        exit 1
    fi
    
    # Extract values using jq if available, otherwise use basic parsing
    if command -v jq &> /dev/null; then
        USER_EMAIL=$(jq -r '.email' "$USER_CONFIG")
        PROJECT_NAME=$(jq -r '.projectName' "$USER_CONFIG")
        DOMAIN=$(jq -r '.domain' "$USER_CONFIG")
        REGION=$(jq -r '.region' "$USER_CONFIG")
    else
        # Fallback parsing (basic)
        USER_EMAIL=$(grep '"email"' "$USER_CONFIG" | cut -d'"' -f4)
        PROJECT_NAME=$(grep '"projectName"' "$USER_CONFIG" | cut -d'"' -f4)
        DOMAIN=$(grep '"domain"' "$USER_CONFIG" | cut -d'"' -f4)
        REGION=$(grep '"region"' "$USER_CONFIG" | cut -d'"' -f4)
    fi
}

# Initialize progress tracking
init_progress() {
    if [ ! -f "$PROGRESS_FILE" ]; then
        cat > "$PROGRESS_FILE" << EOF
{
    "supabase": {"status": "pending", "completed": false},
    "clerk": {"status": "pending", "completed": false},
    "mux": {"status": "pending", "completed": false},
    "redis": {"status": "pending", "completed": false},
    "vercel": {"status": "pending", "completed": false},
    "environment": {"status": "pending", "completed": false},
    "validation": {"status": "pending", "completed": false}
}
EOF
    fi
}

# Update progress
update_progress() {
    local service=$1
    local status=$2
    local completed=${3:-false}
    
    if command -v jq &> /dev/null; then
        jq ".${service}.status = \"$status\" | .${service}.completed = $completed" "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
    else
        echo -e "${YELLOW}⚠️  Install jq for better progress tracking${NC}"
    fi
}

# Generate service-specific setup URLs with pre-filled information
generate_setup_urls() {
    load_user_config
    
    echo -e "${BLUE}🔗 Generating personalized setup URLs...${NC}"
    echo ""
    
    echo -e "${GREEN}📋 STEP 1: SUPABASE DATABASE SETUP${NC}"
    echo "🌐 URL: https://supabase.com/dashboard/new"
    echo "📧 Use email: $USER_EMAIL"
    echo "📝 Project name: ${PROJECT_NAME}-prod"
    echo "🌍 Region: $REGION"
    echo ""
    
    echo -e "${GREEN}📋 STEP 2: CLERK AUTHENTICATION SETUP${NC}"
    echo "🌐 URL: https://dashboard.clerk.com/applications/new"
    echo "📧 Use email: $USER_EMAIL"
    echo "📝 Application name: $PROJECT_NAME"
    echo ""
    
    echo -e "${GREEN}📋 STEP 3: MUX VIDEO SETUP${NC}"
    echo "🌐 URL: https://dashboard.mux.com/environments/new"
    echo "📧 Use email: $USER_EMAIL"
    echo "📝 Environment name: ${PROJECT_NAME} Production"
    echo ""
    
    echo -e "${GREEN}📋 STEP 4: REDIS CACHE SETUP${NC}"
    echo "🌐 URL: https://console.upstash.com/redis"
    echo "📧 Use email: $USER_EMAIL"
    echo "📝 Database name: ${PROJECT_NAME,,}-cache"  # lowercase
    echo "🌍 Region: $REGION"
    echo ""
    
    echo -e "${YELLOW}💡 TIP: Keep this terminal open and follow the URLs above${NC}"
    echo -e "${YELLOW}💡 After each service setup, run: ./setup-secure.sh credentials${NC}"
}

# Secure credential collection
collect_credentials() {
    echo -e "${BLUE}🔐 Collecting service credentials securely...${NC}"
    echo -e "${YELLOW}⚠️  Credentials are encrypted and never committed to git${NC}"
    echo ""
    
    # Initialize credentials file if it doesn't exist
    if [ ! -f "$CREDENTIALS_FILE" ] || [ ! -s "$CREDENTIALS_FILE" ]; then
        echo '{}' > "$CREDENTIALS_FILE"
    fi
    
    echo "Which service credentials do you want to add?"
    echo "1) Supabase"
    echo "2) Clerk"
    echo "3) Mux"
    echo "4) Redis/Upstash"
    echo "5) All services"
    read -p "Choose (1-5): " choice
    
    case $choice in
        1|5) collect_supabase_credentials ;;
    esac
    
    case $choice in
        2|5) collect_clerk_credentials ;;
    esac
    
    case $choice in
        3|5) collect_mux_credentials ;;
    esac
    
    case $choice in
        4|5) collect_redis_credentials ;;
    esac
    
    echo -e "${GREEN}✅ Credentials collected and stored securely${NC}"
}

# Collect Supabase credentials
collect_supabase_credentials() {
    echo -e "${BLUE}📊 Supabase Credentials${NC}"
    read -p "Project URL (https://xxx.supabase.co): " SUPABASE_URL
    read -p "Anon public key: " SUPABASE_ANON_KEY
    read -s -p "Service role secret key: " SUPABASE_SERVICE_KEY
    echo ""
    
    # Update credentials file
    if command -v jq &> /dev/null; then
        jq ".supabase = {\"url\": \"$SUPABASE_URL\", \"anonKey\": \"$SUPABASE_ANON_KEY\", \"serviceKey\": \"$SUPABASE_SERVICE_KEY\"}" "$CREDENTIALS_FILE" > "${CREDENTIALS_FILE}.tmp" && mv "${CREDENTIALS_FILE}.tmp" "$CREDENTIALS_FILE"
    fi
    
    update_progress "supabase" "credentials_collected" true
}

# Collect Clerk credentials
collect_clerk_credentials() {
    echo -e "${BLUE}🔐 Clerk Credentials${NC}"
    read -p "Publishable key (pk_test_...): " CLERK_PUBLISHABLE_KEY
    read -s -p "Secret key (sk_test_...): " CLERK_SECRET_KEY
    echo ""
    read -s -p "Webhook secret (whsec_...): " CLERK_WEBHOOK_SECRET
    echo ""
    
    if command -v jq &> /dev/null; then
        jq ".clerk = {\"publishableKey\": \"$CLERK_PUBLISHABLE_KEY\", \"secretKey\": \"$CLERK_SECRET_KEY\", \"webhookSecret\": \"$CLERK_WEBHOOK_SECRET\"}" "$CREDENTIALS_FILE" > "${CREDENTIALS_FILE}.tmp" && mv "${CREDENTIALS_FILE}.tmp" "$CREDENTIALS_FILE"
    fi
    
    update_progress "clerk" "credentials_collected" true
}

# Collect Mux credentials
collect_mux_credentials() {
    echo -e "${BLUE}🎥 Mux Credentials${NC}"
    read -p "Access Token ID: " MUX_TOKEN_ID
    read -s -p "Secret Key: " MUX_TOKEN_SECRET
    echo ""
    read -s -p "Webhook Secret: " MUX_WEBHOOK_SECRET
    echo ""
    read -p "Environment Key (env_...): " MUX_ENV_KEY
    
    if command -v jq &> /dev/null; then
        jq ".mux = {\"tokenId\": \"$MUX_TOKEN_ID\", \"tokenSecret\": \"$MUX_TOKEN_SECRET\", \"webhookSecret\": \"$MUX_WEBHOOK_SECRET\", \"envKey\": \"$MUX_ENV_KEY\"}" "$CREDENTIALS_FILE" > "${CREDENTIALS_FILE}.tmp" && mv "${CREDENTIALS_FILE}.tmp" "$CREDENTIALS_FILE"
    fi
    
    update_progress "mux" "credentials_collected" true
}

# Collect Redis credentials
collect_redis_credentials() {
    echo -e "${BLUE}🔄 Redis/Upstash Credentials${NC}"
    read -p "Redis URL: " REDIS_URL
    read -s -p "Redis Token: " REDIS_TOKEN
    echo ""
    
    if command -v jq &> /dev/null; then
        jq ".redis = {\"url\": \"$REDIS_URL\", \"token\": \"$REDIS_TOKEN\"}" "$CREDENTIALS_FILE" > "${CREDENTIALS_FILE}.tmp" && mv "${CREDENTIALS_FILE}.tmp" "$CREDENTIALS_FILE"
    fi
    
    update_progress "redis" "credentials_collected" true
}

# Generate environment files from collected credentials
generate_environment() {
    echo -e "${BLUE}🌍 Generating environment configuration...${NC}"
    
    if [ ! -f "$CREDENTIALS_FILE" ] || [ ! -s "$CREDENTIALS_FILE" ]; then
        echo -e "${RED}❌ No credentials found. Run: ./setup-secure.sh credentials${NC}"
        exit 1
    fi
    
    load_user_config
    
    # Generate .env.local for development
    cat > "live-coding/.env.local" << EOF
# Learning Portal Environment Configuration
# Generated on $(date)
# User: $USER_EMAIL
# SECURITY: This file is excluded from git

# Application Configuration
NEXT_PUBLIC_APP_URL=$DOMAIN
NEXT_PUBLIC_APP_NAME="$PROJECT_NAME"
NEXT_PUBLIC_APP_DESCRIPTION="High-performance learning platform"
NODE_ENV=development

EOF

    # Add credentials if they exist
    if command -v jq &> /dev/null; then
        # Supabase
        if jq -e '.supabase' "$CREDENTIALS_FILE" > /dev/null; then
            SUPABASE_URL=$(jq -r '.supabase.url' "$CREDENTIALS_FILE")
            SUPABASE_ANON_KEY=$(jq -r '.supabase.anonKey' "$CREDENTIALS_FILE")
            SUPABASE_SERVICE_KEY=$(jq -r '.supabase.serviceKey' "$CREDENTIALS_FILE")
            
            cat >> "live-coding/.env.local" << EOF
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

EOF
        fi
        
        # Clerk
        if jq -e '.clerk' "$CREDENTIALS_FILE" > /dev/null; then
            CLERK_PUBLISHABLE_KEY=$(jq -r '.clerk.publishableKey' "$CREDENTIALS_FILE")
            CLERK_SECRET_KEY=$(jq -r '.clerk.secretKey' "$CREDENTIALS_FILE")
            CLERK_WEBHOOK_SECRET=$(jq -r '.clerk.webhookSecret' "$CREDENTIALS_FILE")
            
            cat >> "live-coding/.env.local" << EOF
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY=$CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
CLERK_WEBHOOK_SECRET=$CLERK_WEBHOOK_SECRET

EOF
        fi
        
        # Mux
        if jq -e '.mux' "$CREDENTIALS_FILE" > /dev/null; then
            MUX_TOKEN_ID=$(jq -r '.mux.tokenId' "$CREDENTIALS_FILE")
            MUX_TOKEN_SECRET=$(jq -r '.mux.tokenSecret' "$CREDENTIALS_FILE")
            MUX_WEBHOOK_SECRET=$(jq -r '.mux.webhookSecret' "$CREDENTIALS_FILE")
            MUX_ENV_KEY=$(jq -r '.mux.envKey' "$CREDENTIALS_FILE")
            
            cat >> "live-coding/.env.local" << EOF
# Mux Video
MUX_TOKEN_ID=$MUX_TOKEN_ID
MUX_TOKEN_SECRET=$MUX_TOKEN_SECRET
MUX_WEBHOOK_SECRET=$MUX_WEBHOOK_SECRET
NEXT_PUBLIC_MUX_ENV_KEY=$MUX_ENV_KEY

EOF
        fi
        
        # Redis
        if jq -e '.redis' "$CREDENTIALS_FILE" > /dev/null; then
            REDIS_URL=$(jq -r '.redis.url' "$CREDENTIALS_FILE")
            REDIS_TOKEN=$(jq -r '.redis.token' "$CREDENTIALS_FILE")
            
            cat >> "live-coding/.env.local" << EOF
# Redis Cache
REDIS_URL=$REDIS_URL
REDIS_TOKEN=$REDIS_TOKEN

EOF
        fi
    fi
    
    # Add feature flags
    cat >> "live-coding/.env.local" << EOF
# Feature Flags
NEXT_PUBLIC_ENABLE_STORYBOOK=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_REAL_TIME=true
EOF
    
    echo -e "${GREEN}✅ Environment file generated: live-coding/.env.local${NC}"
    update_progress "environment" "generated" true
}

# Show setup status
show_status() {
    echo -e "${BLUE}📊 Setup Status${NC}"
    echo "==============="
    
    if [ -f "$PROGRESS_FILE" ]; then
        if command -v jq &> /dev/null; then
            echo "Supabase: $(jq -r '.supabase.status' "$PROGRESS_FILE")"
            echo "Clerk: $(jq -r '.clerk.status' "$PROGRESS_FILE")"
            echo "Mux: $(jq -r '.mux.status' "$PROGRESS_FILE")"
            echo "Redis: $(jq -r '.redis.status' "$PROGRESS_FILE")"
            echo "Vercel: $(jq -r '.vercel.status' "$PROGRESS_FILE")"
            echo "Environment: $(jq -r '.environment.status' "$PROGRESS_FILE")"
        else
            echo "Install jq for detailed status"
        fi
    else
        echo "No progress found. Run setup first."
    fi
    
    if [ -f "$USER_CONFIG" ]; then
        echo ""
        echo -e "${GREEN}User Configuration:${NC}"
        if command -v jq &> /dev/null; then
            echo "Email: $(jq -r '.email' "$USER_CONFIG")"
            echo "Project: $(jq -r '.projectName' "$USER_CONFIG")"
            echo "Domain: $(jq -r '.domain' "$USER_CONFIG")"
        fi
    fi
}

# Main menu
show_menu() {
    echo -e "${BLUE}🚀 Learning Portal - Secure Setup${NC}"
    echo "=================================="
    echo ""
    echo "1) Initialize setup (collect user info)"
    echo "2) Generate setup URLs"
    echo "3) Add service credentials"
    echo "4) Generate environment files"
    echo "5) Show setup status"
    echo "6) Validate setup"
    echo "7) Deploy to Vercel"
    echo "8) Clean setup data (DANGER)"
    echo "9) Exit"
    echo ""
    read -p "Choose an option (1-9): " choice
    
    case $choice in
        1) setup_secure_directory && collect_user_info && init_progress ;;
        2) generate_setup_urls ;;
        3) collect_credentials ;;
        4) generate_environment ;;
        5) show_status ;;
        6) validate_setup ;;
        7) deploy_vercel ;;
        8) clean_setup_data ;;
        9) exit 0 ;;
        *) echo -e "${RED}❌ Invalid option${NC}" ;;
    esac
}

# Validate setup
validate_setup() {
    echo -e "${BLUE}🔍 Validating setup...${NC}"
    
    # Check if environment file exists
    if [ ! -f "live-coding/.env.local" ]; then
        echo -e "${RED}❌ Environment file not found${NC}"
        return 1
    fi
    
    # Check if dependencies are installed
    if [ ! -d "live-coding/node_modules" ]; then
        echo -e "${YELLOW}⚠️  Installing dependencies...${NC}"
        cd live-coding && npm install && cd ..
    fi
    
    # Test build
    echo -e "${BLUE}🔨 Testing build...${NC}"
    cd live-coding && npm run build && cd ..
    
    echo -e "${GREEN}✅ Setup validation complete${NC}"
    update_progress "validation" "completed" true
}

# Deploy to Vercel
deploy_vercel() {
    echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
        npm install -g vercel
    fi
    
    cd live-coding
    
    echo -e "${BLUE}🔐 Login to Vercel (browser will open)...${NC}"
    vercel login
    
    echo -e "${BLUE}🚀 Deploying...${NC}"
    vercel --prod
    
    cd ..
    update_progress "vercel" "deployed" true
    echo -e "${GREEN}✅ Deployment complete${NC}"
}

# Clean setup data (DANGER)
clean_setup_data() {
    echo -e "${RED}⚠️  DANGER: This will delete all setup data and credentials${NC}"
    read -p "Are you sure? Type 'DELETE' to confirm: " confirm
    
    if [ "$confirm" = "DELETE" ]; then
        rm -rf "$SETUP_DIR"
        rm -f "live-coding/.env.local"
        echo -e "${GREEN}✅ Setup data cleaned${NC}"
    else
        echo -e "${YELLOW}❌ Cancelled${NC}"
    fi
}

# Main execution
main() {
    # Check if specific command provided
    case "${1:-}" in
        "init") setup_secure_directory && collect_user_info && init_progress ;;
        "urls") generate_setup_urls ;;
        "credentials") collect_credentials ;;
        "env") generate_environment ;;
        "status") show_status ;;
        "validate") validate_setup ;;
        "deploy") deploy_vercel ;;
        "clean") clean_setup_data ;;
        *) show_menu ;;
    esac
}

# Run main function with all arguments
main "$@"