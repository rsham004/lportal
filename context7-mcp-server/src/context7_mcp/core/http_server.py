"""HTTP/SSE server implementation for Context7 MCP."""

import asyncio
import json
import logging
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware

from .server import Context7MCPServer
from .config import get_settings


def create_app(sse: bool = False) -> FastAPI:
    """Create FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title="Context7 MCP Server",
        description="Up-to-date code documentation for LLMs",
        version=settings.VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Initialize MCP server
    mcp_server = Context7MCPServer()
    logger = logging.getLogger(__name__)
    
    @app.get("/health")
    async def health_check() -> Dict[str, str]:
        """Health check endpoint."""
        return {"status": "healthy", "version": settings.VERSION}
    
    @app.post("/mcp")
    async def handle_mcp_request(request: Request) -> Dict[str, Any]:
        """Handle MCP requests via HTTP POST."""
        try:
            message = await request.json()
            response = await mcp_server.handle_message(message)
            
            if response is None:
                # For notifications that don't expect a response
                return {"status": "ok"}
            
            return response
            
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON")
        except Exception as e:
            logger.error(f"MCP request error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    if sse:
        @app.get("/sse")
        async def handle_sse_connection(request: Request) -> StreamingResponse:
            """Handle SSE connections for real-time MCP communication."""
            
            async def event_stream():
                """Generate SSE events."""
                try:
                    # Send initial connection event
                    yield f"data: {json.dumps({'type': 'connected', 'server': 'context7-mcp'})}\n\n"
                    
                    # Keep connection alive and handle incoming messages
                    # This is a simplified implementation - in production you'd want
                    # to handle bidirectional communication properly
                    while True:
                        # In a real implementation, you'd read from a queue or websocket
                        # For now, just keep the connection alive
                        yield f"data: {json.dumps({'type': 'ping', 'timestamp': str(asyncio.get_event_loop().time())})}\n\n"
                        await asyncio.sleep(30)  # Ping every 30 seconds
                        
                except Exception as e:
                    logger.error(f"SSE stream error: {e}")
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            
            return StreamingResponse(
                event_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Cache-Control",
                }
            )
    
    return app