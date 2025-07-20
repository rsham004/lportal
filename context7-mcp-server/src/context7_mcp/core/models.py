"""Data models for Context7 MCP Server."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, HttpUrl


class SourceType(str, Enum):
    """Documentation source types."""
    GITHUB = "github"
    OFFICIAL_DOCS = "official_docs"
    API_REFERENCE = "api_reference"
    NPM_REGISTRY = "npm_registry"
    PYPI_REGISTRY = "pypi_registry"
    COMMUNITY = "community"


class DocumentationSource(BaseModel):
    """Documentation source configuration."""
    url: HttpUrl
    type: SourceType
    priority: int = Field(ge=1, le=10, description="Priority (1=highest, 10=lowest)")
    cache_ttl: int = Field(default=3600, description="Cache TTL in seconds")
    enabled: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LibraryInfo(BaseModel):
    """Library information and metadata."""
    id: str = Field(description="Context7-compatible library ID (e.g., '/vercel/next.js')")
    name: str = Field(description="Human-readable library name")
    version: Optional[str] = Field(default=None, description="Library version")
    description: str = Field(description="Library description")
    documentation_sources: List[DocumentationSource] = Field(
        description="Available documentation sources"
    )
    repository_url: Optional[HttpUrl] = Field(default=None)
    package_manager: Optional[str] = Field(
        default=None, description="Package manager (npm, pypi, etc.)"
    )
    tags: List[str] = Field(default_factory=list, description="Library tags/categories")
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    popularity_score: float = Field(default=0.0, ge=0.0, le=1.0)


class DocumentationContent(BaseModel):
    """Processed documentation content."""
    library_id: str
    content: str
    source_url: str
    source_type: SourceType
    topic: Optional[str] = None
    token_count: int
    last_fetched: datetime = Field(default_factory=datetime.utcnow)
    quality_score: float = Field(default=0.0, ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LibraryResolutionResult(BaseModel):
    """Result of library name resolution."""
    query: str
    matches: List[LibraryInfo]
    exact_match: Optional[LibraryInfo] = None
    confidence_score: float = Field(ge=0.0, le=1.0)


class DocumentationRequest(BaseModel):
    """Request for documentation retrieval."""
    library_id: str
    topic: Optional[str] = None
    max_tokens: int = Field(default=10000, ge=1000, le=50000)
    include_examples: bool = True
    include_api_reference: bool = True


class DocumentationResponse(BaseModel):
    """Response containing documentation."""
    library_id: str
    content: str
    sources: List[str]
    token_count: int
    topic: Optional[str] = None
    cached: bool = False
    quality_score: float = Field(ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MCPToolCall(BaseModel):
    """MCP tool call request."""
    name: str
    arguments: Dict[str, Any]


class MCPToolResult(BaseModel):
    """MCP tool call result."""
    content: List[Dict[str, Any]]
    isError: bool = False