# ⚡ FastMCP: Python Framework for MCP Servers

FastMCP is a Python library designed to simplify the creation of MCP (Model Context Protocol) servers, particularly those using SSE (Server-Sent Events) for communication. It integrates well with ASGI frameworks like Starlette or FastAPI.

*(Note: FastMCP appears to be a specific implementation or library, potentially less widespread than FastAPI itself. Ensure you are referring to the correct library, possibly from a specific source like ShoggyAI as mentioned in the MCP notes.)*

## 🚀 Why Use FastMCP?

*   **MCP Focus:** Specifically designed for building servers that adhere to the Model Context Protocol standard.
*   **SSE Integration:** Simplifies handling Server-Sent Events, which is a common transport method for MCP servers needing real-time updates.
*   **Pythonic:** Leverages Python's features, including type hints and async/await.
*   **Tool Definition:** Provides decorators or conventions (like `@tool`) to easily expose Python functions as tools callable by an MCP client/agent.
*   **Integration with ASGI:** Designed to work within ASGI frameworks like Starlette or FastAPI, allowing you to combine MCP functionality with standard web API features.

## 🛠️ Installation / Setup

*   **Prerequisites:** Python installed (see [../foundational/Python.md](../foundational/Python.md)), preferably managed with `uv` or `venv`. An ASGI framework like Starlette or FastAPI might also be needed depending on how FastMCP is structured.
*   **Installation:**
    ```bash
    # Using pip (within an activated venv)
    # Replace 'fastmcp' with the actual package name if different
    pip install fastmcp 

    # Using uv (recommended)
    uv add fastmcp 
    ```
    *   You might also need `starlette` or `fastapi` and an ASGI server like `uvicorn`:
        ```bash
        # Using pip
        pip install starlette uvicorn

        # Using uv
        uv add starlette uvicorn
        ```

## 💡 Getting Started (Conceptual Example)

*(Based on typical patterns seen in MCP server implementations and the snippets in `05-BuildingMCP.md`)*

### 1. Define Tools

Create Python functions and decorate them to expose them as tools.

```python
# Example: tools.py
from fastmcp import tool # Assuming 'tool' decorator exists in fastmcp

@tool
async def run_command(cmd: str) -> str:
    """
    Runs a shell command and returns its output.
    Use with caution. Only allows safe commands. 
    """
    # IMPORTANT: Add security checks here to prevent dangerous commands!
    # This is a simplified example.
    import asyncio
    process = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()
    
    if process.returncode == 0:
        return stdout.decode().strip()
    else:
        return f"Error: {stderr.decode().strip()}"

@tool
async def add_numbers(a: float, b: float) -> float:
    """Adds two floating-point numbers."""
    return a + b

# You might need a way to register these tools with the FastMCP server instance
# e.g., tool_registry.register(run_command)
# tool_registry.register(add_numbers)
```

### 2. Set up ASGI Application (e.g., using Starlette)

Create your main application file (e.g., `server.py`) to handle incoming MCP requests, likely via an SSE endpoint.

```python
# Example: server.py
from starlette.applications import Starlette
from starlette.routing import Route
from starlette.responses import Response # Or SSE response from fastmcp/starlette
from fastmcp import MCPServer, SSEHandler # Hypothetical FastMCP components
# Import or register your tools
from . import tools 

# Initialize the MCP Server logic (details depend on FastMCP library)
# This might involve loading tools, handling protocol messages, etc.
mcp_server = MCPServer(tools=[tools.run_command, tools.add_numbers]) 

# Define the SSE endpoint handler
async def handle_sse_request(request):
    # This handler would likely use FastMCP's SSE capabilities
    # to manage the connection and delegate tool calls to mcp_server
    sse_handler = SSEHandler(mcp_server) 
    return await sse_handler.handle_request(request) # Hypothetical method

# Define routes
routes = [
    Route("/sse", endpoint=handle_sse_request) 
]

# Create the Starlette app
app = Starlette(routes=routes)

# You would run this with: uvicorn server:app --port 8081
```

### 3. Running the Server

*   Use an ASGI server like Uvicorn:
    ```bash
    uvicorn server:app --host 0.0.0.0 --port 8081 --reload 
    ```

### 4. Connecting a Client

*   An MCP client would connect to the `/sse` endpoint (`http://localhost:8081/sse`).
*   The client would send MCP messages (likely JSON) over the SSE connection to list available tools or invoke specific tools (e.g., requesting `run_command` with a `cmd` parameter).
*   The FastMCP server would process these messages, execute the corresponding Python tool function, and stream results back over SSE.

## 📚 Help & Resources

*   **Primary Source:** Look for the specific GitHub repository or documentation associated with the `fastmcp` library mentioned in the project (e.g., ShoggyAI's repository if applicable).
*   **Model Context Protocol Specs:** Understanding the underlying MCP standard is helpful. Search for specifications from sources like Anthropic or community discussions.
*   **Starlette Documentation:** [https://www.starlette.io/](https://www.starlette.io/) (If used as the underlying framework).
*   **Server-Sent Events (SSE) MDN Docs:** [https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)

## ✅ Next Steps

*   Consult the specific `fastmcp` library's documentation for accurate usage.
*   Implement robust security checks, especially for tools like `run_command`.
*   Integrate the server with your chosen ASGI framework (Starlette/FastAPI).
*   Test the server using a compatible MCP client.
*   Containerize the server using Docker for deployment (see [../infrastructure/Docker.md](../infrastructure/Docker.md)).

---
*Licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)*
*Visit [ProductFoundry.ai](https://productfoundry.ai)*