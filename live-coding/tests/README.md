# 🧪 Tests Directory

This directory contains all testing and verification files for the Learning Portal project.

## Structure

```
tests/
├── unit/                     # Unit tests for individual components/functions
├── integration/              # Integration tests for feature interactions
├── infrastructure/           # Infrastructure setup and validation scripts
├── scripts/                  # Testing workflow and automation scripts
└── README.md                # This file
```

## Test Categories

### 📦 Unit Tests (`/unit/`)
- Individual component tests
- Function/utility tests
- Service tests
- Hook tests

### 🔗 Integration Tests (`/integration/`)
- Feature interaction tests
- Cross-component tests
- API integration tests
- Phase integration verification

### 🏗️ Infrastructure Tests (`/infrastructure/`)
- Setup validation scripts
- Service connectivity tests
- Environment verification
- Deployment validation

### 🛠️ Scripts (`/scripts/`)
- TDD workflow automation
- Test running utilities
- Development helpers

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Categories
```bash
# Unit tests only
npm test -- tests/unit/

# Integration tests only
npm test -- tests/integration/

# Specific test file
npm test -- tests/unit/Button.test.tsx
```

### Infrastructure Validation
```bash
# Validate infrastructure setup
./tests/infrastructure/validate-infrastructure.sh

# Set up infrastructure
./tests/infrastructure/setup-infrastructure.sh
```

### TDD Workflow
```bash
# Start TDD workflow
./tests/scripts/tdd-workflow.sh
```

## Test Standards

- **Coverage**: Minimum 90% for unit tests
- **Integration**: Test component interactions
- **TDD**: Write tests before implementation
- **Clean**: Tests should be readable and maintainable
- **Fast**: Unit tests should run quickly
- **Isolated**: Tests should not depend on each other