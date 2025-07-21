#!/bin/bash

# 🔍 Infrastructure Setup Validation
# Clean, focused validation of Learning Portal infrastructure

echo "🔍 Learning Portal Infrastructure Validation"
echo "============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Check function
check_item() {
    local name=$1
    local command=$2
    ((TOTAL_CHECKS++))
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✅ $name${NC}"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}❌ $name${NC}"
        ((FAILED_CHECKS++))
    fi
}

# Environment check
check_env() {
    local var=$1
    ((TOTAL_CHECKS++))
    
    if [ -n "${!var}" ]; then
        echo -e "${GREEN}✅ $var is set${NC}"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}❌ $var is not set${NC}"
        ((FAILED_CHECKS++))
    fi
}

echo -e "\n${BLUE}📋 Prerequisites${NC}"
check_item "Node.js" "node --version"
check_item "npm" "npm --version"
check_item "Git" "git --version"

echo -e "\n${BLUE}📁 Project Files${NC}"
check_item "package.json" "test -f package.json"
check_item ".env.local" "test -f .env.local"
check_item "Jest config" "test -f jest.config.js"

echo -e "\n${BLUE}🔧 Environment Variables${NC}"
if [ -f ".env.local" ]; then
    source .env.local
    check_env "NEXT_PUBLIC_SUPABASE_URL"
    check_env "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    check_env "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    check_env "CLERK_SECRET_KEY"
    check_env "MUX_TOKEN_ID"
    check_env "REDIS_URL"
else
    echo -e "${RED}❌ .env.local file not found${NC}"
    ((TOTAL_CHECKS++))
    ((FAILED_CHECKS++))
fi

echo -e "\n${BLUE}📦 Dependencies${NC}"
check_item "node_modules" "test -d node_modules"
check_item "Next.js build" "npm run build"

echo -e "\n${BLUE}🧪 Tests${NC}"
check_item "Test configuration" "npm test -- --passWithNoTests --silent"

# Summary
echo -e "\n${BLUE}📊 Summary${NC}"
echo "==========="
echo -e "Total checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"

PASS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "Pass rate: $PASS_RATE%"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All checks passed! Infrastructure is ready.${NC}"
    exit 0
elif [ $PASS_RATE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️ Most checks passed. Fix remaining issues.${NC}"
    exit 1
else
    echo -e "\n${RED}❌ Multiple issues found. Please fix them.${NC}"
    echo -e "\n${BLUE}Quick fixes:${NC}"
    echo -e "1. ${YELLOW}npm install${NC}"
    echo -e "2. ${YELLOW}cp .env.example .env.local${NC}"
    echo -e "3. Fill in your API keys in .env.local"
    exit 1
fi