# AGENTS.md - Development Guidelines

## Project Overview
This is a minimal Git repository with only a README.md file. The project appears to be in early initialization phase.

## Build/Test Commands
No build system detected. Common commands to check when code is added:
- `npm run build` / `npm run dev` (if Node.js project)
- `python -m pytest` / `python -m pytest path/to/test_file.py::test_function` (if Python)
- `go test ./...` / `go test -run TestName` (if Go)
- `cargo build` / `cargo test test_name` (if Rust)
- `mvn test` / `mvn test -Dtest=TestClass#testMethod` (if Java/Maven)

## Code Style Guidelines
Since no source code exists yet, follow these general principles:
- Use consistent indentation (2 or 4 spaces, no tabs)
- Follow language-specific naming conventions (camelCase for JS/TS, snake_case for Python, etc.)
- Add type annotations where supported (TypeScript, Python type hints, etc.)
- Use descriptive variable and function names
- Handle errors gracefully with proper error types
- Import statements should be organized: standard library, third-party, local imports
- Add JSDoc/docstrings for public APIs
- Use const/let over var in JavaScript/TypeScript

## Notes
- No existing Cursor rules or Copilot instructions found
- No package.json, requirements.txt, or other dependency files detected
- Repository is ready for initial project setup