#!/bin/bash

# 🧪 TDD Workflow Script
# Automates Test-Driven Development workflow with 3-component integration testing

echo "🧪 TDD Workflow for Learning Portal"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to run tests and show results
run_tests() {
    echo -e "\n${BLUE}🧪 Running tests...${NC}"
    
    if npm test -- --passWithNoTests --verbose; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        return 1
    fi
}

# Function to run specific test file
run_specific_test() {
    local test_file=$1
    echo -e "\n${BLUE}🧪 Running specific test: $test_file${NC}"
    
    if npm test -- "$test_file" --verbose; then
        echo -e "${GREEN}✅ Test passed: $test_file${NC}"
        return 0
    else
        echo -e "${RED}❌ Test failed: $test_file${NC}"
        return 1
    fi
}

# Function to watch tests
watch_tests() {
    echo -e "\n${BLUE}👀 Starting test watch mode...${NC}"
    echo -e "${YELLOW}Press 'q' to quit, 'a' to run all tests${NC}"
    npm test -- --watch
}

# Function to run integration tests
run_integration_tests() {
    echo -e "\n${BLUE}🔗 Running integration tests...${NC}"
    
    # Run integration tests specifically
    if npm test -- --testPathPattern="integration" --verbose; then
        echo -e "${GREEN}✅ Integration tests passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Integration tests failed${NC}"
        return 1
    fi
}

# Function to create a new component with TDD
create_component_tdd() {
    local component_name=$1
    local component_path="src/components/$component_name"
    
    echo -e "\n${BLUE}🏗️ Creating component with TDD: $component_name${NC}"
    
    # Create component directory
    mkdir -p "$component_path"
    
    # Create test file first (TDD approach)
    cat > "$component_path/$component_name.test.tsx" << EOF
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { $component_name } from './$component_name';

describe('$component_name', () => {
  it('renders correctly', () => {
    render(<$component_name />);
    expect(screen.getByTestId('$component_name')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    render(<$component_name />);
    // Add your interaction tests here
  });

  it('integrates with other components', () => {
    // Add integration tests here
  });
});
EOF

    # Create basic component structure
    cat > "$component_path/$component_name.tsx" << EOF
import React from 'react';

export interface ${component_name}Props {
  // Define your props here
}

export function $component_name(props: ${component_name}Props) {
  return (
    <div data-testid="$component_name">
      {/* Implement your component here */}
      <p>$component_name component</p>
    </div>
  );
}
EOF

    # Create index file
    cat > "$component_path/index.ts" << EOF
export { $component_name } from './$component_name';
export type { ${component_name}Props } from './$component_name';
EOF

    echo -e "${GREEN}✅ Component created: $component_path${NC}"
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo -e "1. Write your tests in $component_path/$component_name.test.tsx"
    echo -e "2. Run: npm test -- $component_name.test.tsx"
    echo -e "3. Implement the component to make tests pass"
    echo -e "4. Refactor and repeat"
}

# Function to run 3-component integration test
run_three_component_test() {
    local comp1=$1
    local comp2=$2
    local comp3=$3
    
    echo -e "\n${BLUE}🔗 Running 3-component integration test${NC}"
    echo -e "Components: $comp1, $comp2, $comp3"
    
    # Create temporary integration test
    cat > "src/__tests__/temp-integration.test.tsx" << EOF
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentIntegrationTester, createButtonFormModalTest, createIntegrationScenarios } from './integration/ComponentIntegrationTest';

describe('Three Component Integration Test', () => {
  it('tests $comp1, $comp2, and $comp3 working together', async () => {
    const tester = new ComponentIntegrationTester();
    const components = createButtonFormModalTest();
    const scenarios = createIntegrationScenarios();
    
    const report = await tester.testThreeComponentIntegration(components, scenarios);
    
    expect(report.passRate).toBeGreaterThan(80);
    expect(report.failed).toBeLessThan(2);
  });
});
EOF

    # Run the integration test
    if npm test -- "temp-integration.test.tsx" --verbose; then
        echo -e "${GREEN}✅ 3-component integration test passed!${NC}"
        rm "src/__tests__/temp-integration.test.tsx"
        return 0
    else
        echo -e "${RED}❌ 3-component integration test failed${NC}"
        rm "src/__tests__/temp-integration.test.tsx"
        return 1
    fi
}

# Main menu
show_menu() {
    echo -e "\n${BLUE}🧪 TDD Workflow Options:${NC}"
    echo "1. Run all tests"
    echo "2. Run specific test file"
    echo "3. Watch tests (continuous)"
    echo "4. Run integration tests"
    echo "5. Create new component (TDD)"
    echo "6. Run 3-component integration test"
    echo "7. Fix test configuration"
    echo "8. Exit"
    echo -e "\n${YELLOW}Choose an option (1-8):${NC}"
}

# Fix test configuration
fix_test_config() {
    echo -e "\n${BLUE}🔧 Fixing test configuration...${NC}"
    
    # Install missing dependencies
    echo -e "${YELLOW}Installing test dependencies...${NC}"
    npm install --save-dev @hello-pangea/dnd
    
    # Run tests to check if fixed
    if npm test -- --passWithNoTests --silent; then
        echo -e "${GREEN}✅ Test configuration fixed!${NC}"
    else
        echo -e "${RED}❌ Test configuration still has issues${NC}"
        echo -e "${YELLOW}💡 Check the error messages above${NC}"
    fi
}

# Main script
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1)
            run_tests
            ;;
        2)
            echo -e "${YELLOW}Enter test file path (e.g., Button.test.tsx):${NC}"
            read -r test_file
            run_specific_test "$test_file"
            ;;
        3)
            watch_tests
            ;;
        4)
            run_integration_tests
            ;;
        5)
            echo -e "${YELLOW}Enter component name (e.g., MyComponent):${NC}"
            read -r component_name
            create_component_tdd "$component_name"
            ;;
        6)
            echo -e "${YELLOW}Enter 3 component names (space-separated):${NC}"
            read -r comp1 comp2 comp3
            run_three_component_test "$comp1" "$comp2" "$comp3"
            ;;
        7)
            fix_test_config
            ;;
        8)
            echo -e "${GREEN}👋 Happy coding with TDD!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option. Please choose 1-8.${NC}"
            ;;
    esac
    
    echo -e "\n${YELLOW}Press Enter to continue...${NC}"
    read -r
done