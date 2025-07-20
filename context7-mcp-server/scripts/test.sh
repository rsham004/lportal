#!/bin/bash

# Context7 MCP Server Test Script

set -e

echo "🧪 Running Context7 MCP Server tests..."

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run tests with coverage
echo "📊 Running tests with coverage..."
pytest tests/ \
    --cov=src/context7_mcp \
    --cov-report=html \
    --cov-report=term-missing \
    --cov-fail-under=80 \
    -v

echo "✅ Tests completed!"

# Run linting
echo "🔍 Running code quality checks..."

echo "  - Black formatting check..."
black --check src/ tests/

echo "  - Ruff linting..."
ruff check src/ tests/

echo "  - MyPy type checking..."
mypy src/

echo "✅ All quality checks passed!"
echo ""
echo "📊 Coverage report generated in htmlcov/"