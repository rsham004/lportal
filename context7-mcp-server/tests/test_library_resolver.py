"""Tests for library resolver."""

import pytest
from unittest.mock import AsyncMock, patch

from context7_mcp.tools.library_resolver import LibraryResolver
from context7_mcp.core.models import LibraryInfo, SourceType, DocumentationSource


@pytest.fixture
def library_resolver():
    """Create a library resolver instance."""
    return LibraryResolver()


@pytest.mark.asyncio
async def test_resolve_exact_match(library_resolver):
    """Test exact library name resolution."""
    result = await library_resolver.resolve_library("Next.js")
    
    assert result.exact_match is not None
    assert result.exact_match.id == "/vercel/next.js"
    assert result.exact_match.name == "Next.js"
    assert result.confidence_score == 1.0


@pytest.mark.asyncio
async def test_resolve_fuzzy_match(library_resolver):
    """Test fuzzy library name resolution."""
    result = await library_resolver.resolve_library("nextjs")
    
    assert len(result.matches) > 0
    assert any(match.id == "/vercel/next.js" for match in result.matches)
    assert result.confidence_score > 0.0


@pytest.mark.asyncio
async def test_resolve_no_match(library_resolver):
    """Test resolution with no matches."""
    result = await library_resolver.resolve_library("nonexistent-library-xyz")
    
    assert result.exact_match is None
    assert len(result.matches) == 0
    assert result.confidence_score == 0.0


@pytest.mark.asyncio
async def test_get_library_by_id(library_resolver):
    """Test getting library by ID."""
    library = await library_resolver.get_library_by_id("/vercel/next.js")
    
    assert library is not None
    assert library.id == "/vercel/next.js"
    assert library.name == "Next.js"


@pytest.mark.asyncio
async def test_get_library_by_invalid_id(library_resolver):
    """Test getting library with invalid ID."""
    library = await library_resolver.get_library_by_id("/invalid/library")
    
    assert library is None


def test_registry_stats(library_resolver):
    """Test registry statistics."""
    stats = library_resolver.get_registry_stats()
    
    assert "total_entries" in stats
    assert "unique_libraries" in stats
    assert stats["total_entries"] > 0
    assert stats["unique_libraries"] > 0


@pytest.mark.asyncio
async def test_builtin_libraries_loaded(library_resolver):
    """Test that builtin libraries are loaded."""
    expected_libraries = [
        "/vercel/next.js",
        "/supabase/supabase", 
        "/facebook/react",
        "/tailwindlabs/tailwindcss",
        "/fastapi/fastapi",
        "/microsoft/typescript"
    ]
    
    for lib_id in expected_libraries:
        library = await library_resolver.get_library_by_id(lib_id)
        assert library is not None
        assert library.id == lib_id