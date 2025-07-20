"""Main entry point for Context7 MCP Server."""

import asyncio
import logging
import sys
from typing import Optional

import typer
import uvicorn
from rich.console import Console
from rich.logging import RichHandler

from .core.server import Context7MCPServer
from .core.config import get_settings

app = typer.Typer(help="Context7 MCP Server - Up-to-date code documentation for LLMs")
console = Console()


def setup_logging(debug: bool = False) -> None:
    """Set up logging configuration."""
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(console=console, rich_tracebacks=True)],
    )


@app.command()
def serve(
    transport: str = typer.Option(
        "stdio", help="Transport type: stdio, http, or sse"
    ),
    port: int = typer.Option(8081, help="Port for HTTP/SSE transport"),
    host: str = typer.Option("0.0.0.0", help="Host for HTTP/SSE transport"),
    debug: bool = typer.Option(False, help="Enable debug mode"),
) -> None:
    """Start the Context7 MCP server."""
    setup_logging(debug)
    settings = get_settings()
    
    if debug:
        settings.DEBUG = True
        settings.LOG_LEVEL = "DEBUG"
    
    logger = logging.getLogger(__name__)
    logger.info(f"Starting Context7 MCP Server v{settings.VERSION}")
    logger.info(f"Transport: {transport}")
    
    if transport == "stdio":
        # STDIO transport for MCP clients
        asyncio.run(run_stdio_server())
    elif transport in ["http", "sse"]:
        # HTTP/SSE transport
        run_http_server(host, port, transport == "sse")
    else:
        console.print(f"[red]Error: Unknown transport '{transport}'[/red]")
        raise typer.Exit(1)


async def run_stdio_server() -> None:
    """Run the server with STDIO transport."""
    server = Context7MCPServer()
    await server.run_stdio()


def run_http_server(host: str, port: int, sse: bool = False) -> None:
    """Run the server with HTTP/SSE transport."""
    from .core.http_server import create_app
    
    app = create_app(sse=sse)
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True,
    )


def main() -> None:
    """Main entry point."""
    try:
        app()
    except KeyboardInterrupt:
        console.print("\n[yellow]Shutting down Context7 MCP Server...[/yellow]")
        sys.exit(0)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)


if __name__ == "__main__":
    main()