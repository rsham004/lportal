#!/bin/bash

# 🔍 Infrastructure Validation Script
# This script checks if all your infrastructure services are properly configured

echo "🚀 Learning Portal Infrastructure Validation"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to check if a command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 is installed${NC}"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}❌ $1 is not installed${NC}"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

# Function to check environment variable
check_env_var() {
    if [ -n "${!1}" ]; then
        echo -e "${GREEN}✅ $1 is set${NC}"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}❌ $1 is not set${NC}"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}❌ $1 not found${NC}"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

# Function to check URL accessibility
check_url() {
    if curl -s --head "$1" | head -n 1 | grep -q "200 OK\|301\|302"; then
        echo -e "${GREEN}✅ $1 is accessible${NC}"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}❌ $1 is not accessible${NC}"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

echo -e "\n${BLUE}📋 Checking Prerequisites...${NC}"
check_command "node"
check_command "npm"
check_command "git"
check_command "curl"

echo -e "\n${BLUE}📁 Checking Project Files...${NC}"
check_file "package.json"
check_file ".env.local"
check_file "src/app/layout.tsx"
check_file "jest.config.js"

echo -e "\n${BLUE}🔧 Loading Environment Variables...${NC}"
if [ -f ".env.local" ]; then
    source .env.local
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
else
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo -e "${YELLOW}💡 Run: cp .env.example .env.local${NC}"
    exit 1
fi

echo -e "\n${BLUE}🗄️ Checking Supabase Configuration...${NC}"
check_env_var "NEXT_PUBLIC_SUPABASE_URL"
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env_var "SUPABASE_SERVICE_ROLE_KEY"

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${BLUE}🔍 Testing Supabase connection...${NC}"
    check_url "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
fi

echo -e "\n${BLUE}🔐 Checking Clerk Configuration...${NC}"
check_env_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
check_env_var "CLERK_SECRET_KEY"

echo -e "\n${BLUE}🎥 Checking Mux Configuration...${NC}"
check_env_var "MUX_TOKEN_ID"
check_env_var "MUX_TOKEN_SECRET"
check_env_var "NEXT_PUBLIC_MUX_ENV_KEY"

echo -e "\n${BLUE}🔄 Checking Redis Configuration...${NC}"
check_env_var "REDIS_URL"
check_env_var "REDIS_TOKEN"

echo -e "\n${BLUE}📦 Checking Node.js Dependencies...${NC}"
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Dependencies not installed${NC}"
    echo -e "${YELLOW}💡 Run: npm install${NC}"
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

echo -e "\n${BLUE}🧪 Checking Test Configuration...${NC}"
if npm run test -- --passWithNoTests --silent > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Test configuration working${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Test configuration has issues${NC}"
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

echo -e "\n${BLUE}🏗️ Checking Build Configuration...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build configuration working${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Build configuration has issues${NC}"
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

# Summary
echo -e "\n${BLUE}📊 Validation Summary${NC}"
echo "====================="
echo -e "Total checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"

PASS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "Pass rate: $PASS_RATE%"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All checks passed! Your infrastructure is ready.${NC}"
    echo -e "${GREEN}✅ You can now run: npm run dev${NC}"
    exit 0
elif [ $PASS_RATE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️ Most checks passed, but some issues need attention.${NC}"
    echo -e "${YELLOW}💡 Fix the failed checks above and run this script again.${NC}"
    exit 1
else
    echo -e "\n${RED}❌ Multiple issues found. Please fix them before proceeding.${NC}"
    echo -e "\n${BLUE}🔧 Quick fixes:${NC}"
    echo -e "1. Install dependencies: ${YELLOW}npm install${NC}"
    echo -e "2. Copy environment file: ${YELLOW}cp .env.example .env.local${NC}"
    echo -e "3. Fill in your API keys in .env.local"
    echo -e "4. Run this script again: ${YELLOW}./validate-infrastructure.sh${NC}"
    exit 1
fi