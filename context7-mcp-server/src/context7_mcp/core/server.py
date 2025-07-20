"""Core MCP server implementation."""

import asyncio
import json
import logging
import sys
from typing import Any, Dict, List, Optional

from .config import get_settings
from .models import MCPToolCall, MCPToolResult
from ..tools.library_resolver import LibraryResolver
from ..tools.documentation_fetcher import DocumentationFetcher


class Context7MCPServer:
    """Context7 MCP Server implementation."""
    
    def __init__(self) -> None:
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)
        self.library_resolver = LibraryResolver()
        self.documentation_fetcher = DocumentationFetcher()
        
        # MCP protocol state
        self.initialized = False
        self.capabilities = {
            "tools": {
                "resolve-library-id": {
                    "description": "Resolves a general library name into a Context7-compatible library ID",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "libraryName": {
                                "type": "string",
                                "description": "The name of the library to search for"
                            }
                        },
                        "required": ["libraryName"]
                    }
                },
                "get-library-docs": {
                    "description": "Fetches documentation for a library using a Context7-compatible library ID",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "context7CompatibleLibraryID": {
                                "type": "string",
                                "description": "Exact Context7-compatible library ID (e.g., '/mongodb/docs', '/vercel/next.js')"
                            },
                            "topic": {
                                "type": "string",
                                "description": "Focus the docs on a specific topic (e.g., 'routing', 'hooks')"
                            },
                            "tokens": {
                                "type": "integer",
                                "description": "Max number of tokens to return",
                                "default": 10000,
                                "minimum": 1000
                            }
                        },
                        "required": ["context7CompatibleLibraryID"]
                    }
                }
            }
        }
    
    async def run_stdio(self) -> None:
        """Run the server with STDIO transport."""
        self.logger.info("Starting STDIO transport")
        
        try:
            while True:
                # Read JSON-RPC message from stdin
                line = await asyncio.get_event_loop().run_in_executor(
                    None, sys.stdin.readline
                )
                
                if not line:
                    break
                
                try:
                    message = json.loads(line.strip())
                    response = await self.handle_message(message)
                    
                    if response:
                        # Write response to stdout
                        print(json.dumps(response), flush=True)
                        
                except json.JSONDecodeError as e:
                    self.logger.error(f"Invalid JSON received: {e}")
                    error_response = self.create_error_response(
                        None, -32700, "Parse error"
                    )
                    print(json.dumps(error_response), flush=True)
                    
                except Exception as e:
                    self.logger.error(f"Error handling message: {e}")
                    error_response = self.create_error_response(
                        None, -32603, "Internal error"
                    )
                    print(json.dumps(error_response), flush=True)
                    
        except KeyboardInterrupt:
            self.logger.info("Received interrupt signal")
        except Exception as e:
            self.logger.error(f"STDIO transport error: {e}")
    
    async def handle_message(self, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Handle incoming MCP message."""
        method = message.get("method")
        params = message.get("params", {})
        msg_id = message.get("id")
        
        self.logger.debug(f"Handling method: {method}")
        
        try:
            if method == "initialize":
                return await self.handle_initialize(msg_id, params)
            elif method == "tools/list":
                return await self.handle_tools_list(msg_id)
            elif method == "tools/call":
                return await self.handle_tools_call(msg_id, params)
            elif method == "notifications/initialized":
                self.initialized = True
                return None  # No response for notifications
            else:
                return self.create_error_response(
                    msg_id, -32601, f"Method not found: {method}"
                )
                
        except Exception as e:
            self.logger.error(f"Error in handle_message: {e}")
            return self.create_error_response(
                msg_id, -32603, f"Internal error: {str(e)}"
            )
    
    async def handle_initialize(
        self, msg_id: Optional[str], params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle initialize request."""
        self.logger.info("Initializing Context7 MCP Server")
        
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "serverInfo": {
                    "name": "context7-mcp-server",
                    "version": self.settings.VERSION
                }
            }
        }
    
    async def handle_tools_list(self, msg_id: Optional[str]) -> Dict[str, Any]:
        """Handle tools/list request."""
        tools = []
        
        for tool_name, tool_info in self.capabilities["tools"].items():
            tools.append({
                "name": tool_name,
                "description": tool_info["description"],
                "inputSchema": tool_info["inputSchema"]
            })
        
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "tools": tools
            }
        }
    
    async def handle_tools_call(
        self, msg_id: Optional[str], params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle tools/call request."""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        self.logger.info(f"Calling tool: {tool_name}")
        
        try:
            if tool_name == "resolve-library-id":
                result = await self.resolve_library_id(arguments)
            elif tool_name == "get-library-docs":
                result = await self.get_library_docs(arguments)
            else:
                return self.create_error_response(
                    msg_id, -32601, f"Unknown tool: {tool_name}"
                )
            
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "content": result.content,
                    "isError": result.isError
                }
            }
            
        except Exception as e:
            self.logger.error(f"Tool call error: {e}")
            return self.create_error_response(
                msg_id, -32603, f"Tool execution error: {str(e)}"
            )
    
    async def resolve_library_id(self, arguments: Dict[str, Any]) -> MCPToolResult:
        """Resolve library name to Context7-compatible ID."""
        library_name = arguments.get("libraryName")
        
        if not library_name:
            return MCPToolResult(
                content=[{
                    "type": "text",
                    "text": "Error: libraryName parameter is required"
                }],
                isError=True
            )
        
        try:
            result = await self.library_resolver.resolve_library(library_name)
            
            if result.exact_match:
                response_text = f"Found exact match: {result.exact_match.id}\n"
                response_text += f"Name: {result.exact_match.name}\n"
                response_text += f"Description: {result.exact_match.description}"
            elif result.matches:
                response_text = f"Found {len(result.matches)} potential matches:\n\n"
                for i, match in enumerate(result.matches[:5], 1):
                    response_text += f"{i}. {match.id}\n"
                    response_text += f"   Name: {match.name}\n"
                    response_text += f"   Description: {match.description}\n\n"
            else:
                response_text = f"No matches found for '{library_name}'"
            
            return MCPToolResult(
                content=[{
                    "type": "text",
                    "text": response_text
                }]
            )
            
        except Exception as e:
            self.logger.error(f"Library resolution error: {e}")
            return MCPToolResult(
                content=[{
                    "type": "text",
                    "text": f"Error resolving library: {str(e)}"
                }],
                isError=True
            )
    
    async def get_library_docs(self, arguments: Dict[str, Any]) -> MCPToolResult:
        """Get documentation for a library."""
        library_id = arguments.get("context7CompatibleLibraryID")
        topic = arguments.get("topic")
        max_tokens = arguments.get("tokens", self.settings.DEFAULT_TOKEN_LIMIT)
        
        if not library_id:
            return MCPToolResult(
                content=[{
                    "type": "text",
                    "text": "Error: context7CompatibleLibraryID parameter is required"
                }],
                isError=True
            )
        
        try:
            result = await self.documentation_fetcher.fetch_documentation(
                library_id=library_id,
                topic=topic,
                max_tokens=max_tokens
            )
            
            response_text = f"# Documentation for {library_id}\n\n"
            if topic:
                response_text += f"**Topic**: {topic}\n\n"
            
            response_text += result.content
            
            if result.sources:
                response_text += f"\n\n**Sources**:\n"
                for source in result.sources:
                    response_text += f"- {source}\n"
            
            response_text += f"\n**Token count**: {result.token_count}"
            if result.cached:
                response_text += " (cached)"
            
            return MCPToolResult(
                content=[{
                    "type": "text",
                    "text": response_text
                }]
            )
            
        except Exception as e:
            self.logger.error(f"Documentation fetch error: {e}")
            return MCPToolResult(
                content=[{
                    "type": "text",
                    "text": f"Error fetching documentation: {str(e)}"
                }],
                isError=True
            )
    
    def create_error_response(
        self, msg_id: Optional[str], code: int, message: str
    ) -> Dict[str, Any]:
        """Create JSON-RPC error response."""
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "error": {
                "code": code,
                "message": message
            }
        }