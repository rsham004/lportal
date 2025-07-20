#!/bin/bash

# Context7 MCP Server Installation Script

set -e

echo "🚀 Installing Context7 MCP Server..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.11+ is required. Found: $python_version"
    exit 1
fi

echo "✅ Python version check passed: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -e .

# Install development dependencies if requested
if [ "$1" = "--dev" ]; then
    echo "🔧 Installing development dependencies..."
    pip install -e ".[dev]"
fi

echo "✅ Installation complete!"
echo ""
echo "🎯 Quick start:"
echo "  source .venv/bin/activate"
echo "  context7-mcp --help"
echo ""
echo "📖 For MCP client configuration, see README.md"