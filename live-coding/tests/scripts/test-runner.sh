#!/bin/bash

# 🧪 Consolidated Test Runner
# Clean, organized test execution for the Learning Portal

echo "🧪 Learning Portal Test Runner"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to run specific test category
run_test_category() {
    local category=$1
    local description=$2
    
    echo -e "\n${BLUE}🔍 Running $description...${NC}"
    
    if [ "$category" = "unit" ]; then
        npm test -- tests/unit/ --verbose
    elif [ "$category" = "integration" ]; then
        npm test -- tests/integration/ --verbose
    elif [ "$category" = "all" ]; then
        npm test -- --verbose
    elif [ "$category" = "coverage" ]; then
        npm test -- --coverage --verbose
    elif [ "$category" = "watch" ]; then
        npm test -- --watch
    else
        npm test -- "$category" --verbose
    fi
    
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $description passed${NC}"
    else
        echo -e "${RED}❌ $description failed${NC}"
    fi
    
    return $exit_code
}

# Function to validate infrastructure
validate_infrastructure() {
    echo -e "\n${BLUE}🏗️ Validating infrastructure...${NC}"
    
    if [ -f "tests/infrastructure/validate-infrastructure.sh" ]; then
        ./tests/infrastructure/validate-infrastructure.sh
    else
        echo -e "${YELLOW}⚠️ Infrastructure validation script not found${NC}"
        return 1
    fi
}

# Function to show test statistics
show_test_stats() {
    echo -e "\n${BLUE}📊 Test Statistics${NC}"
    echo "=================="
    
    local unit_count=$(find tests/unit -name "*.test.*" | wc -l)
    local integration_count=$(find tests/integration -name "*.test.*" | wc -l)
    local total_count=$((unit_count + integration_count))
    
    echo -e "Unit tests: $unit_count"
    echo -e "Integration tests: $integration_count"
    echo -e "Total tests: $total_count"
}

# Main menu
show_menu() {
    echo -e "\n${BLUE}🧪 Test Options:${NC}"
    echo "1. Run all tests"
    echo "2. Run unit tests only"
    echo "3. Run integration tests only"
    echo "4. Run tests with coverage"
    echo "5. Watch mode (continuous testing)"
    echo "6. Run specific test file"
    echo "7. Validate infrastructure"
    echo "8. Show test statistics"
    echo "9. Exit"
    echo -e "\n${YELLOW}Choose an option (1-9):${NC}"
}

# Main script
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1)
            run_test_category "all" "All Tests"
            ;;
        2)
            run_test_category "unit" "Unit Tests"
            ;;
        3)
            run_test_category "integration" "Integration Tests"
            ;;
        4)
            run_test_category "coverage" "Tests with Coverage"
            ;;
        5)
            run_test_category "watch" "Watch Mode"
            ;;
        6)
            echo -e "${YELLOW}Enter test file path (e.g., tests/unit/Button.test.tsx):${NC}"
            read -r test_file
            run_test_category "$test_file" "Specific Test: $test_file"
            ;;
        7)
            validate_infrastructure
            ;;
        8)
            show_test_stats
            ;;
        9)
            echo -e "${GREEN}👋 Happy testing!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option. Please choose 1-9.${NC}"
            ;;
    esac
    
    echo -e "\n${YELLOW}Press Enter to continue...${NC}"
    read -r
done