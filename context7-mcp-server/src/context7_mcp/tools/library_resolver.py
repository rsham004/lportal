"""Library name resolution and registry management."""

import asyncio
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta

import aiohttp
from fuzzywuzzy import fuzz, process

from ..core.config import get_settings
from ..core.models import LibraryInfo, LibraryResolutionResult, DocumentationSource, SourceType


class LibraryResolver:
    """Resolves library names to Context7-compatible IDs."""
    
    def __init__(self) -> None:
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)
        self._registry: Dict[str, LibraryInfo] = {}
        self._last_update: Optional[datetime] = None
        self._update_lock = asyncio.Lock()
        
        # Initialize with built-in libraries
        self._initialize_builtin_libraries()
    
    def _initialize_builtin_libraries(self) -> None:
        """Initialize with commonly used libraries."""
        builtin_libraries = [
            LibraryInfo(
                id="/vercel/next.js",
                name="Next.js",
                description="The React Framework for Production",
                documentation_sources=[
                    DocumentationSource(
                        url="https://nextjs.org/docs",
                        type=SourceType.OFFICIAL_DOCS,
                        priority=1
                    ),
                    DocumentationSource(
                        url="https://github.com/vercel/next.js",
                        type=SourceType.GITHUB,
                        priority=2
                    )
                ],
                repository_url="https://github.com/vercel/next.js",
                package_manager="npm",
                tags=["react", "framework", "ssr", "static-site"],
                popularity_score=0.95
            ),
            LibraryInfo(
                id="/supabase/supabase",
                name="Supabase",
                description="The Open Source Firebase Alternative",
                documentation_sources=[
                    DocumentationSource(
                        url="https://supabase.com/docs",
                        type=SourceType.OFFICIAL_DOCS,
                        priority=1
                    ),
                    DocumentationSource(
                        url="https://github.com/supabase/supabase",
                        type=SourceType.GITHUB,
                        priority=2
                    )
                ],
                repository_url="https://github.com/supabase/supabase",
                package_manager="npm",
                tags=["database", "auth", "backend", "postgresql"],
                popularity_score=0.90
            ),
            LibraryInfo(
                id="/facebook/react",
                name="React",
                description="A JavaScript library for building user interfaces",
                documentation_sources=[
                    DocumentationSource(
                        url="https://react.dev",
                        type=SourceType.OFFICIAL_DOCS,
                        priority=1
                    ),
                    DocumentationSource(
                        url="https://github.com/facebook/react",
                        type=SourceType.GITHUB,
                        priority=2
                    )
                ],
                repository_url="https://github.com/facebook/react",
                package_manager="npm",
                tags=["ui", "library", "javascript", "frontend"],
                popularity_score=0.98
            ),
            LibraryInfo(
                id="/tailwindlabs/tailwindcss",
                name="Tailwind CSS",
                description="A utility-first CSS framework",
                documentation_sources=[
                    DocumentationSource(
                        url="https://tailwindcss.com/docs",
                        type=SourceType.OFFICIAL_DOCS,
                        priority=1
                    ),
                    DocumentationSource(
                        url="https://github.com/tailwindlabs/tailwindcss",
                        type=SourceType.GITHUB,
                        priority=2
                    )
                ],
                repository_url="https://github.com/tailwindlabs/tailwindcss",
                package_manager="npm",
                tags=["css", "framework", "utility", "styling"],
                popularity_score=0.92
            ),
            LibraryInfo(
                id="/fastapi/fastapi",
                name="FastAPI",
                description="FastAPI framework, high performance, easy to learn",
                documentation_sources=[
                    DocumentationSource(
                        url="https://fastapi.tiangolo.com",
                        type=SourceType.OFFICIAL_DOCS,
                        priority=1
                    ),
                    DocumentationSource(
                        url="https://github.com/tiangolo/fastapi",
                        type=SourceType.GITHUB,
                        priority=2
                    )
                ],
                repository_url="https://github.com/tiangolo/fastapi",
                package_manager="pypi",
                tags=["python", "api", "framework", "async"],
                popularity_score=0.94
            ),
            LibraryInfo(
                id="/microsoft/typescript",
                name="TypeScript",
                description="TypeScript is a superset of JavaScript",
                documentation_sources=[
                    DocumentationSource(
                        url="https://www.typescriptlang.org/docs",
                        type=SourceType.OFFICIAL_DOCS,
                        priority=1
                    ),
                    DocumentationSource(
                        url="https://github.com/microsoft/TypeScript",
                        type=SourceType.GITHUB,
                        priority=2
                    )
                ],
                repository_url="https://github.com/microsoft/TypeScript",
                package_manager="npm",
                tags=["typescript", "javascript", "language", "types"],
                popularity_score=0.96
            )
        ]
        
        for library in builtin_libraries:
            self._registry[library.id] = library
            # Also index by name for easier lookup
            self._registry[library.name.lower()] = library
    
    async def resolve_library(self, library_name: str) -> LibraryResolutionResult:
        """Resolve a library name to Context7-compatible ID(s)."""
        await self._ensure_registry_updated()
        
        query = library_name.lower().strip()
        self.logger.info(f"Resolving library: {query}")
        
        # Check for exact match by ID or name
        exact_match = None
        if query in self._registry:
            exact_match = self._registry[query]
        else:
            # Check if query matches any library ID or name exactly
            for lib_id, library in self._registry.items():
                if (library.name.lower() == query or 
                    library.id.lower() == query or
                    library.id.lower().endswith(f"/{query}")):
                    exact_match = library
                    break
        
        # Fuzzy matching for potential matches
        library_names = [lib.name for lib in self._registry.values() if hasattr(lib, 'name')]
        library_ids = [lib.id for lib in self._registry.values() if hasattr(lib, 'id')]
        
        # Get fuzzy matches
        name_matches = process.extract(query, library_names, limit=10, scorer=fuzz.ratio)
        id_matches = process.extract(query, library_ids, limit=10, scorer=fuzz.ratio)
        
        # Combine and deduplicate matches
        all_matches = []
        seen_ids = set()
        
        # Add high-confidence matches
        for match_name, score in name_matches:
            if score >= 60:  # Minimum confidence threshold
                for library in self._registry.values():
                    if (hasattr(library, 'name') and 
                        library.name == match_name and 
                        library.id not in seen_ids):
                        all_matches.append(library)
                        seen_ids.add(library.id)
                        break
        
        for match_id, score in id_matches:
            if score >= 60 and match_id not in seen_ids:
                if match_id in self._registry:
                    library = self._registry[match_id]
                    if hasattr(library, 'id'):
                        all_matches.append(library)
                        seen_ids.add(library.id)
        
        # Sort by popularity score
        all_matches.sort(key=lambda x: x.popularity_score, reverse=True)
        
        # Calculate confidence score
        confidence = 1.0 if exact_match else (
            max([score/100 for _, score in name_matches + id_matches]) 
            if name_matches or id_matches else 0.0
        )
        
        return LibraryResolutionResult(
            query=library_name,
            matches=all_matches[:10],  # Limit to top 10 matches
            exact_match=exact_match,
            confidence_score=confidence
        )
    
    async def get_library_by_id(self, library_id: str) -> Optional[LibraryInfo]:
        """Get library information by ID."""
        await self._ensure_registry_updated()
        return self._registry.get(library_id)
    
    async def _ensure_registry_updated(self) -> None:
        """Ensure the library registry is up to date."""
        if self._should_update_registry():
            async with self._update_lock:
                if self._should_update_registry():  # Double-check after acquiring lock
                    await self._update_registry()
    
    def _should_update_registry(self) -> bool:
        """Check if registry needs updating."""
        if self._last_update is None:
            return True
        
        update_interval = timedelta(hours=self.settings.REGISTRY_UPDATE_INTERVAL_HOURS)
        return datetime.utcnow() - self._last_update > update_interval
    
    async def _update_registry(self) -> None:
        """Update the library registry from remote source."""
        try:
            self.logger.info("Updating library registry")
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.settings.LIBRARY_REGISTRY_URL) as response:
                    if response.status == 200:
                        registry_data = await response.json()
                        await self._process_registry_data(registry_data)
                        self._last_update = datetime.utcnow()
                        self.logger.info(f"Registry updated with {len(self._registry)} libraries")
                    else:
                        self.logger.warning(f"Failed to fetch registry: HTTP {response.status}")
                        
        except Exception as e:
            self.logger.error(f"Error updating registry: {e}")
            # Continue with existing registry
    
    async def _process_registry_data(self, registry_data: Dict) -> None:
        """Process and merge registry data."""
        try:
            libraries = registry_data.get("libraries", [])
            
            for lib_data in libraries:
                try:
                    # Convert sources
                    sources = []
                    for source_data in lib_data.get("documentation_sources", []):
                        source = DocumentationSource(**source_data)
                        sources.append(source)
                    
                    # Create library info
                    library = LibraryInfo(
                        id=lib_data["id"],
                        name=lib_data["name"],
                        description=lib_data.get("description", ""),
                        documentation_sources=sources,
                        repository_url=lib_data.get("repository_url"),
                        package_manager=lib_data.get("package_manager"),
                        tags=lib_data.get("tags", []),
                        popularity_score=lib_data.get("popularity_score", 0.5)
                    )
                    
                    self._registry[library.id] = library
                    self._registry[library.name.lower()] = library
                    
                except Exception as e:
                    self.logger.warning(f"Error processing library {lib_data.get('id', 'unknown')}: {e}")
                    
        except Exception as e:
            self.logger.error(f"Error processing registry data: {e}")
    
    def get_registry_stats(self) -> Dict[str, int]:
        """Get registry statistics."""
        unique_libraries = set()
        for library in self._registry.values():
            if hasattr(library, 'id'):
                unique_libraries.add(library.id)
        
        return {
            "total_entries": len(self._registry),
            "unique_libraries": len(unique_libraries),
            "last_update": self._last_update.isoformat() if self._last_update else None
        }