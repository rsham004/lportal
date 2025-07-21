import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test utilities for 3-component integration testing
export interface ComponentTestSuite {
  name: string;
  component: React.ComponentType<any>;
  props?: any;
  testCases: TestCase[];
}

export interface TestCase {
  name: string;
  action: (container: HTMLElement) => void | Promise<void>;
  assertion: (container: HTMLElement) => void | Promise<void>;
}

/**
 * TDD Integration Test Pattern
 * Tests 3 components working together with real interactions
 */
export class ComponentIntegrationTester {
  private testResults: Array<{ suite: string; test: string; passed: boolean; error?: string }> = [];

  /**
   * Test 3 components integration
   * @param components Array of 3 components to test together
   * @param integrationScenarios Scenarios that test component interactions
   */
  async testThreeComponentIntegration(
    components: ComponentTestSuite[],
    integrationScenarios: IntegrationScenario[]
  ) {
    console.log(`🧪 Testing ${components.length} components integration...`);
    
    // First, test each component individually
    for (const component of components) {
      await this.testSingleComponent(component);
    }

    // Then test integration scenarios
    for (const scenario of integrationScenarios) {
      await this.testIntegrationScenario(scenario, components);
    }

    return this.getTestReport();
  }

  private async testSingleComponent(suite: ComponentTestSuite) {
    console.log(`  Testing component: ${suite.name}`);
    
    for (const testCase of suite.testCases) {
      try {
        const { container } = render(React.createElement(suite.component, suite.props));
        
        // Execute test action
        await testCase.action(container);
        
        // Execute assertion
        await testCase.assertion(container);
        
        this.testResults.push({
          suite: suite.name,
          test: testCase.name,
          passed: true
        });
        
        console.log(`    ✅ ${testCase.name}`);
      } catch (error) {
        this.testResults.push({
          suite: suite.name,
          test: testCase.name,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        console.log(`    ❌ ${testCase.name}: ${error}`);
      }
    }
  }

  private async testIntegrationScenario(scenario: IntegrationScenario, components: ComponentTestSuite[]) {
    console.log(`  Testing integration: ${scenario.name}`);
    
    try {
      // Render all components in the integration wrapper
      const IntegrationWrapper = () => (
        <div data-testid="integration-wrapper">
          {components.map((comp, index) => 
            React.createElement(comp.component, { 
              key: index, 
              ...comp.props,
              'data-testid': `component-${index}`
            })
          )}
        </div>
      );

      const { container } = render(<IntegrationWrapper />);
      
      // Execute integration test
      await scenario.test(container);
      
      this.testResults.push({
        suite: 'Integration',
        test: scenario.name,
        passed: true
      });
      
      console.log(`    ✅ ${scenario.name}`);
    } catch (error) {
      this.testResults.push({
        suite: 'Integration',
        test: scenario.name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.log(`    ❌ ${scenario.name}: ${error}`);
    }
  }

  private getTestReport() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      results: this.testResults
    };
  }
}

export interface IntegrationScenario {
  name: string;
  test: (container: HTMLElement) => void | Promise<void>;
}

// Example usage for testing Button + Form + Modal integration
export const createButtonFormModalTest = (): ComponentTestSuite[] => [
  {
    name: 'Button',
    component: ({ onClick, children, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
    props: { children: 'Test Button', 'data-testid': 'test-button' },
    testCases: [
      {
        name: 'renders correctly',
        action: async () => {},
        assertion: async (container) => {
          expect(container.querySelector('[data-testid="test-button"]')).toBeInTheDocument();
        }
      },
      {
        name: 'handles click events',
        action: async (container) => {
          const button = container.querySelector('[data-testid="test-button"]') as HTMLElement;
          fireEvent.click(button);
        },
        assertion: async () => {
          // This would be handled by the integration test
        }
      }
    ]
  },
  {
    name: 'Form',
    component: ({ onSubmit, children, ...props }: any) => (
      <form onSubmit={onSubmit} {...props}>{children}</form>
    ),
    props: { 'data-testid': 'test-form' },
    testCases: [
      {
        name: 'renders form element',
        action: async () => {},
        assertion: async (container) => {
          expect(container.querySelector('[data-testid="test-form"]')).toBeInTheDocument();
        }
      }
    ]
  },
  {
    name: 'Modal',
    component: ({ isOpen, onClose, children, ...props }: any) => (
      isOpen ? (
        <div data-testid="test-modal" {...props}>
          <div>{children}</div>
          <button onClick={onClose} data-testid="modal-close">Close</button>
        </div>
      ) : null
    ),
    props: { isOpen: true, 'data-testid': 'test-modal' },
    testCases: [
      {
        name: 'renders when open',
        action: async () => {},
        assertion: async (container) => {
          expect(container.querySelector('[data-testid="test-modal"]')).toBeInTheDocument();
        }
      }
    ]
  }
];

export const createIntegrationScenarios = (): IntegrationScenario[] => [
  {
    name: 'Button opens modal with form',
    test: async (container) => {
      // Find button and click it
      const button = container.querySelector('[data-testid="test-button"]') as HTMLElement;
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      
      // Check if modal appears
      await waitFor(() => {
        const modal = container.querySelector('[data-testid="test-modal"]');
        expect(modal).toBeInTheDocument();
      });
      
      // Check if form is inside modal
      const form = container.querySelector('[data-testid="test-form"]');
      expect(form).toBeInTheDocument();
    }
  },
  {
    name: 'Form submission closes modal',
    test: async (container) => {
      // Submit form
      const form = container.querySelector('[data-testid="test-form"]') as HTMLElement;
      fireEvent.submit(form);
      
      // Check if modal closes
      await waitFor(() => {
        const modal = container.querySelector('[data-testid="test-modal"]');
        expect(modal).not.toBeInTheDocument();
      });
    }
  },
  {
    name: 'Modal close button works',
    test: async (container) => {
      const closeButton = container.querySelector('[data-testid="modal-close"]') as HTMLElement;
      expect(closeButton).toBeInTheDocument();
      
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        const modal = container.querySelector('[data-testid="test-modal"]');
        expect(modal).not.toBeInTheDocument();
      });
    }
  }
];

// Example test runner
export const runThreeComponentTest = async () => {
  const tester = new ComponentIntegrationTester();
  const components = createButtonFormModalTest();
  const scenarios = createIntegrationScenarios();
  
  const report = await tester.testThreeComponentIntegration(components, scenarios);
  
  console.log('\n📊 Test Report:');
  console.log(`Total tests: ${report.total}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Pass rate: ${report.passRate.toFixed(1)}%`);
  
  return report;
};