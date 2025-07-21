#!/bin/bash

# Learning Portal - Setup Validation & Testing
# ============================================
# Comprehensive validation of all services and configurations

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SETUP_DIR=".setup-cache"
CREDENTIALS_FILE="$SETUP_DIR/credentials.json"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Test runner
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${BLUE}🧪 Testing: $test_name${NC}"
    
    if eval "$test_command" &>/dev/null; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test environment file
test_environment_file() {
    echo -e "${BLUE}📋 Testing Environment Configuration${NC}"
    echo "===================================="
    
    run_test "Environment file exists" "[ -f 'live-coding/.env.local' ]"
    
    if [ -f "live-coding/.env.local" ]; then
        run_test "Supabase URL configured" "grep -q 'NEXT_PUBLIC_SUPABASE_URL=' live-coding/.env.local"
        run_test "Clerk keys configured" "grep -q 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' live-coding/.env.local"
        run_test "Mux credentials configured" "grep -q 'MUX_TOKEN_ID=' live-coding/.env.local"
        run_test "Redis URL configured" "grep -q 'REDIS_URL=' live-coding/.env.local"
    fi
    
    echo ""
}

# Test Node.js and dependencies
test_dependencies() {
    echo -e "${BLUE}📦 Testing Dependencies${NC}"
    echo "======================="
    
    run_test "Node.js installed" "command -v node"
    run_test "npm installed" "command -v npm"
    run_test "Node.js version >= 18" "node -v | grep -E 'v(1[8-9]|[2-9][0-9])'"
    
    if [ -d "live-coding/node_modules" ]; then
        run_test "Dependencies installed" "[ -d 'live-coding/node_modules' ]"
    else
        echo -e "${YELLOW}⚠️  Installing dependencies...${NC}"
        cd live-coding && npm install && cd ..
        run_test "Dependencies installed" "[ -d 'live-coding/node_modules' ]"
    fi
    
    echo ""
}

# Test build process
test_build() {
    echo -e "${BLUE}🔨 Testing Build Process${NC}"
    echo "========================"
    
    cd live-coding
    
    run_test "TypeScript compilation" "npm run type-check"
    run_test "Linting passes" "npm run lint"
    run_test "Build succeeds" "npm run build"
    run_test "Tests pass" "npm test -- --passWithNoTests"
    
    cd ..
    echo ""
}

# Test service connections
test_service_connections() {
    echo -e "${BLUE}🌐 Testing Service Connections${NC}"
    echo "==============================="
    
    if [ ! -f "$CREDENTIALS_FILE" ]; then
        echo -e "${YELLOW}⚠️  No credentials file found. Skipping connection tests.${NC}"
        return
    fi
    
    # Test Supabase connection
    if command -v jq &> /dev/null && jq -e '.supabase' "$CREDENTIALS_FILE" > /dev/null; then
        SUPABASE_URL=$(jq -r '.supabase.url' "$CREDENTIALS_FILE")
        run_test "Supabase API accessible" "curl -s -f '$SUPABASE_URL/rest/v1/' -H 'apikey: $(jq -r '.supabase.anonKey' '$CREDENTIALS_FILE')'"
    fi
    
    # Test Redis connection (if available)
    if command -v redis-cli &> /dev/null && jq -e '.redis' "$CREDENTIALS_FILE" > /dev/null; then
        REDIS_URL=$(jq -r '.redis.url' "$CREDENTIALS_FILE")
        run_test "Redis connection" "redis-cli -u '$REDIS_URL' ping"
    fi
    
    echo ""
}

# Test security configuration
test_security() {
    echo -e "${BLUE}🔒 Testing Security Configuration${NC}"
    echo "=================================="
    
    run_test "Sensitive files in .gitignore" "grep -q '.env.local' live-coding/.gitignore"
    run_test "Setup cache in .gitignore" "grep -q '.setup-cache' .gitignore"
    run_test "Credentials file secured" "[ ! -r '$CREDENTIALS_FILE' ] || [ \$(stat -c '%a' '$CREDENTIALS_FILE') = '600' ]"
    run_test "No credentials in git" "! git log --all --full-history -- '*.env*' | grep -q 'commit'"
    
    echo ""
}

# Test PWA configuration
test_pwa() {
    echo -e "${BLUE}📱 Testing PWA Configuration${NC}"
    echo "============================="
    
    run_test "PWA manifest exists" "[ -f 'live-coding/public/manifest.json' ]"
    run_test "Service worker exists" "[ -f 'live-coding/public/sw.js' ]"
    run_test "Offline page exists" "[ -f 'live-coding/public/offline.html' ]"
    
    echo ""
}

# Performance tests
test_performance() {
    echo -e "${BLUE}⚡ Testing Performance${NC}"
    echo "======================"
    
    if [ -d "live-coding/.next" ]; then
        # Check bundle sizes
        run_test "Build output exists" "[ -d 'live-coding/.next' ]"
        
        # Check for large bundles (basic check)
        if [ -f "live-coding/.next/static/chunks/pages/_app.js" ]; then
            APP_SIZE=$(stat -c%s "live-coding/.next/static/chunks/pages/_app.js" 2>/dev/null || echo "0")
            run_test "App bundle size reasonable (<500KB)" "[ $APP_SIZE -lt 512000 ]"
        fi
    else
        echo -e "${YELLOW}⚠️  No build found. Run 'npm run build' first.${NC}"
    fi
    
    echo ""
}

# Test deployment readiness
test_deployment_readiness() {
    echo -e "${BLUE}🚀 Testing Deployment Readiness${NC}"
    echo "==============================="
    
    run_test "Vercel CLI available" "command -v vercel"
    run_test "Production build exists" "[ -d 'live-coding/.next' ]"
    run_test "Environment variables set" "[ -f 'live-coding/.env.local' ]"
    
    # Check for common deployment issues
    run_test "No hardcoded localhost URLs" "! grep -r 'localhost:3000' live-coding/src/ || true"
    run_test "No console.log in production code" "! grep -r 'console.log' live-coding/src/ || true"
    
    echo ""
}

# Generate test report
generate_report() {
    echo -e "${BLUE}📊 Test Report${NC}"
    echo "=============="
    echo ""
    echo "Total Tests: $TESTS_TOTAL"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Your setup is ready for production.${NC}"
        return 0
    else
        echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
        return 1
    fi
}

# Fix common issues
fix_common_issues() {
    echo -e "${BLUE}🔧 Attempting to fix common issues...${NC}"
    
    # Install missing dependencies
    if [ ! -d "live-coding/node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        cd live-coding && npm install && cd ..
    fi
    
    # Install jq if not available
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}📦 Installing jq for JSON processing...${NC}"
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y jq
        elif command -v brew &> /dev/null; then
            brew install jq
        else
            echo -e "${YELLOW}⚠️  Please install jq manually for better functionality${NC}"
        fi
    fi
    
    # Fix file permissions
    if [ -f "$CREDENTIALS_FILE" ]; then
        chmod 600 "$CREDENTIALS_FILE"
    fi
    
    echo -e "${GREEN}✅ Common issues fixed${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Learning Portal - Setup Validation${NC}"
    echo "======================================"
    echo ""
    
    case "${1:-all}" in
        "env") test_environment_file ;;
        "deps") test_dependencies ;;
        "build") test_build ;;
        "services") test_service_connections ;;
        "security") test_security ;;
        "pwa") test_pwa ;;
        "performance") test_performance ;;
        "deployment") test_deployment_readiness ;;
        "fix") fix_common_issues ;;
        "all"|*)
            test_environment_file
            test_dependencies
            test_build
            test_service_connections
            test_security
            test_pwa
            test_performance
            test_deployment_readiness
            ;;
    esac
    
    generate_report
}

# Run main with arguments
main "$@"