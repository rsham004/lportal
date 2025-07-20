"""Tests for MCP server."""

import json
import pytest
from unittest.mock import AsyncMock, patch

from context7_mcp.core.server import Context7MCPServer


@pytest.fixture
def mcp_server():
    """Create an MCP server instance."""
    return Context7MCPServer()


@pytest.mark.asyncio
async def test_handle_initialize(mcp_server):
    """Test initialize message handling."""
    message = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0.0"}
        }
    }
    
    response = await mcp_server.handle_message(message)
    
    assert response is not None
    assert response["jsonrpc"] == "2.0"
    assert response["id"] == "1"
    assert "result" in response
    assert response["result"]["protocolVersion"] == "2024-11-05"
    assert "serverInfo" in response["result"]


@pytest.mark.asyncio
async def test_handle_tools_list(mcp_server):
    """Test tools/list message handling."""
    # Initialize first
    await mcp_server.handle_message({
        "jsonrpc": "2.0",
        "id": "1",
        "method": "initialize",
        "params": {}
    })
    
    message = {
        "jsonrpc": "2.0",
        "id": "2",
        "method": "tools/list",
        "params": {}
    }
    
    response = await mcp_server.handle_message(message)
    
    assert response is not None
    assert response["jsonrpc"] == "2.0"
    assert response["id"] == "2"
    assert "result" in response
    assert "tools" in response["result"]
    
    tools = response["result"]["tools"]
    tool_names = [tool["name"] for tool in tools]
    assert "resolve-library-id" in tool_names
    assert "get-library-docs" in tool_names


@pytest.mark.asyncio
async def test_resolve_library_id_tool(mcp_server):
    """Test resolve-library-id tool."""
    message = {
        "jsonrpc": "2.0",
        "id": "3",
        "method": "tools/call",
        "params": {
            "name": "resolve-library-id",
            "arguments": {
                "libraryName": "Next.js"
            }
        }
    }
    
    response = await mcp_server.handle_message(message)
    
    assert response is not None
    assert response["jsonrpc"] == "2.0"
    assert response["id"] == "3"
    assert "result" in response
    assert "content" in response["result"]
    assert response["result"]["isError"] is False
    
    content = response["result"]["content"][0]["text"]
    assert "Found exact match" in content
    assert "/vercel/next.js" in content


@pytest.mark.asyncio
async def test_resolve_library_id_tool_missing_param(mcp_server):
    """Test resolve-library-id tool with missing parameter."""
    message = {
        "jsonrpc": "2.0",
        "id": "4",
        "method": "tools/call",
        "params": {
            "name": "resolve-library-id",
            "arguments": {}
        }
    }
    
    response = await mcp_server.handle_message(message)
    
    assert response is not None
    assert "result" in response
    assert response["result"]["isError"] is True
    
    content = response["result"]["content"][0]["text"]
    assert "libraryName parameter is required" in content


@pytest.mark.asyncio
async def test_get_library_docs_tool_missing_param(mcp_server):
    """Test get-library-docs tool with missing parameter."""
    message = {
        "jsonrpc": "2.0",
        "id": "5",
        "method": "tools/call",
        "params": {
            "name": "get-library-docs",
            "arguments": {}
        }
    }
    
    response = await mcp_server.handle_message(message)
    
    assert response is not None
    assert "result" in response
    assert response["result"]["isError"] is True
    
    content = response["result"]["content"][0]["text"]
    assert "context7CompatibleLibraryID parameter is required" in content


@pytest.mark.asyncio
async def test_unknown_method(mcp_server):
    """Test handling of unknown method."""
    message = {
        "jsonrpc": "2.0",
        "id": "6",
        "method": "unknown/method",
        "params": {}
    }
    
    response = await mcp_server.handle_message(message)
    
    assert response is not None
    assert "error" in response
    assert response["error"]["code"] == -32601
    assert "Method not found" in response["error"]["message"]


@pytest.mark.asyncio
async def test_unknown_tool(mcp_server):
    """Test handling of unknown tool."""
    message = {
        "jsonrpc": "2.0",
        "id": "7",
        "method": "tools/call",
        "params": {
            "name": "unknown-tool",
            "arguments": {}
        }
    }
    
    response = await mcp_server.handle_message(message)
    
    assert response is not None
    assert "error" in response
    assert response["error"]["code"] == -32601
    assert "Unknown tool" in response["error"]["message"]


def test_create_error_response(mcp_server):
    """Test error response creation."""
    response = mcp_server.create_error_response("123", -32600, "Invalid Request")
    
    assert response["jsonrpc"] == "2.0"
    assert response["id"] == "123"
    assert response["error"]["code"] == -32600
    assert response["error"]["message"] == "Invalid Request"