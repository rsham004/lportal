# Context7 MCP Server

A Python implementation of the Context7 MCP (Model Context Protocol) server that provides up-to-date, version-specific documentation and code examples for AI coding assistants.

## Features

- 🔄 **Live Documentation**: Fetches up-to-date documentation from multiple sources
- 🎯 **Smart Resolution**: Intelligent library name resolution with fuzzy matching
- 📚 **Multi-Source**: Supports GitHub, NPM, PyPI, and official documentation sites
- ⚡ **High Performance**: Redis caching and async processing
- 🔌 **MCP Compatible**: Works with Cursor, Windsurf, VS Code, and other MCP clients
- 🐍 **Python Native**: Built with FastAPI and modern Python async patterns

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd context7-mcp-server

# Install with uv (recommended)
uv venv
source .venv/bin/activate
uv pip install -e .

# Or with pip
pip install -e .
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### Running the Server

```bash
# STDIO transport (for most MCP clients)
context7-mcp

# HTTP transport
context7-mcp --transport http --port 8081

# SSE transport
context7-mcp --transport sse --port 8081
```

## MCP Client Configuration

### Cursor

Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "context7-mcp"
    }
  }
}
```

### VS Code

Add to your MCP configuration:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "type": "stdio",
        "command": "context7-mcp"
      }
    }
  }
}
```

## Usage

Once configured, use Context7 in your AI coding assistant:

```
Create a Next.js middleware that checks for JWT tokens. use context7

Configure Supabase authentication with social providers. use context7
```

## Available Tools

- `resolve-library-id`: Resolves library names to Context7-compatible IDs
- `get-library-docs`: Fetches documentation for specified libraries

## Development

```bash
# Install development dependencies
uv pip install -e ".[dev]"

# Run tests
pytest

# Format code
black .
ruff check --fix .

# Type checking
mypy .
```

## License

MIT License - see LICENSE file for details.