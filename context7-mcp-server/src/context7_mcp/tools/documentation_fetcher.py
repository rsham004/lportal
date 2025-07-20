"""Documentation fetching and processing."""

import asyncio
import logging
import re
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

import aiohttp
from bs4 import BeautifulSoup
from markdownify import markdownify

from ..core.config import get_settings
from ..core.models import (
    DocumentationContent, 
    DocumentationRequest, 
    DocumentationResponse,
    LibraryInfo,
    SourceType
)
from ..core.cache import get_cache_manager
from .library_resolver import LibraryResolver


class DocumentationFetcher:
    """Fetches and processes documentation from various sources."""
    
    def __init__(self) -> None:
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)
        self.library_resolver = LibraryResolver()
        self._session: Optional[aiohttp.ClientSession] = None
        self._cache_manager = None
        
        # Token counting regex (approximate)
        self._token_pattern = re.compile(r'\b\w+\b|[^\w\s]')
    
    async def __aenter__(self):
        """Async context manager entry."""
        self._session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                "User-Agent": "Context7-MCP-Server/0.1.0 (Documentation Fetcher)"
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self._session:
            await self._session.close()
    
    async def fetch_documentation(
        self, 
        library_id: str, 
        topic: Optional[str] = None,
        max_tokens: int = 10000
    ) -> DocumentationResponse:
        """Fetch documentation for a library."""
        self.logger.info(f"Fetching documentation for {library_id}")
        
        # Initialize cache manager if not already done
        if not self._cache_manager:
            self._cache_manager = await get_cache_manager()
        
        # Check cache first
        cache_key = self._cache_manager.get_cache_key(
            "docs", library_id, topic or "default", str(max_tokens)
        )
        
        cached_result = await self._cache_manager.get(cache_key)
        if cached_result:
            self.logger.info(f"Returning cached documentation for {library_id}")
            cached_result["cached"] = True
            return DocumentationResponse(**cached_result)
        
        # Get library information
        library = await self.library_resolver.get_library_by_id(library_id)
        if not library:
            raise ValueError(f"Library not found: {library_id}")
        
        # Initialize session if not already done
        if not self._session:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={
                    "User-Agent": "Context7-MCP-Server/0.1.0 (Documentation Fetcher)"
                }
            )
        
        # Fetch from multiple sources
        all_content = []
        sources_used = []
        
        # Sort sources by priority
        sorted_sources = sorted(
            library.documentation_sources, 
            key=lambda x: x.priority
        )
        
        for source in sorted_sources:
            try:
                content = await self._fetch_from_source(source, library, topic)
                if content:
                    all_content.append(content)
                    sources_used.append(str(source.url))
                    
                    # Check if we have enough content
                    total_tokens = sum(self._count_tokens(c.content) for c in all_content)
                    if total_tokens >= max_tokens:
                        break
                        
            except Exception as e:
                self.logger.warning(f"Failed to fetch from {source.url}: {e}")
                continue
        
        if not all_content:
            raise ValueError(f"No documentation could be fetched for {library_id}")
        
        # Combine and process content
        combined_content = await self._combine_content(all_content, topic, max_tokens)
        
        result = DocumentationResponse(
            library_id=library_id,
            content=combined_content,
            sources=sources_used,
            token_count=self._count_tokens(combined_content),
            topic=topic,
            cached=False,
            quality_score=self._calculate_quality_score(combined_content),
            metadata={
                "library_name": library.name,
                "sources_count": len(sources_used),
                "processing_time": "N/A"  # TODO: Add timing
            }
        )
        
        # Cache the result
        await self._cache_manager.set(
            cache_key, 
            result.dict(exclude={"cached"}),
            ttl=self.settings.CACHE_TTL_SECONDS
        )
        
        return result
    
    async def _fetch_from_source(
        self, 
        source, 
        library: LibraryInfo, 
        topic: Optional[str]
    ) -> Optional[DocumentationContent]:
        """Fetch content from a specific source."""
        try:
            if source.type == SourceType.GITHUB:
                return await self._fetch_github_docs(source, library, topic)
            elif source.type == SourceType.OFFICIAL_DOCS:
                return await self._fetch_official_docs(source, library, topic)
            elif source.type == SourceType.API_REFERENCE:
                return await self._fetch_api_reference(source, library, topic)
            else:
                return await self._fetch_generic_docs(source, library, topic)
                
        except Exception as e:
            self.logger.error(f"Error fetching from {source.url}: {e}")
            return None
    
    async def _fetch_github_docs(
        self, 
        source, 
        library: LibraryInfo, 
        topic: Optional[str]
    ) -> Optional[DocumentationContent]:
        """Fetch documentation from GitHub repository."""
        base_url = str(source.url)
        
        # Try to fetch README first
        readme_urls = [
            f"{base_url}/blob/main/README.md",
            f"{base_url}/blob/master/README.md",
            f"{base_url}/raw/main/README.md",
            f"{base_url}/raw/master/README.md"
        ]
        
        content_parts = []
        
        # Fetch README
        for readme_url in readme_urls:
            try:
                async with self._session.get(readme_url) as response:
                    if response.status == 200:
                        readme_content = await response.text()
                        content_parts.append(f"# README\n\n{readme_content}")
                        break
            except Exception:
                continue
        
        # Try to fetch docs folder if topic is specified
        if topic:
            docs_urls = [
                f"{base_url}/blob/main/docs/{topic}.md",
                f"{base_url}/blob/master/docs/{topic}.md",
                f"{base_url}/raw/main/docs/{topic}.md",
                f"{base_url}/raw/master/docs/{topic}.md"
            ]
            
            for docs_url in docs_urls:
                try:
                    async with self._session.get(docs_url) as response:
                        if response.status == 200:
                            docs_content = await response.text()
                            content_parts.append(f"# {topic.title()}\n\n{docs_content}")
                            break
                except Exception:
                    continue
        
        if not content_parts:
            return None
        
        combined_content = "\n\n---\n\n".join(content_parts)
        
        return DocumentationContent(
            library_id=library.id,
            content=combined_content,
            source_url=str(source.url),
            source_type=source.type,
            topic=topic,
            token_count=self._count_tokens(combined_content)
        )
    
    async def _fetch_official_docs(
        self, 
        source, 
        library: LibraryInfo, 
        topic: Optional[str]
    ) -> Optional[DocumentationContent]:
        """Fetch documentation from official documentation sites."""
        url = str(source.url)
        
        # If topic is specified, try to construct a more specific URL
        if topic:
            # Common patterns for documentation URLs
            topic_urls = [
                f"{url}/{topic}",
                f"{url}/docs/{topic}",
                f"{url}/guide/{topic}",
                f"{url}/api/{topic}",
                f"{url}/{topic}.html"
            ]
            
            for topic_url in topic_urls:
                content = await self._fetch_html_content(topic_url)
                if content:
                    return DocumentationContent(
                        library_id=library.id,
                        content=content,
                        source_url=topic_url,
                        source_type=source.type,
                        topic=topic,
                        token_count=self._count_tokens(content)
                    )
        
        # Fallback to main documentation page
        content = await self._fetch_html_content(url)
        if content:
            return DocumentationContent(
                library_id=library.id,
                content=content,
                source_url=url,
                source_type=source.type,
                topic=topic,
                token_count=self._count_tokens(content)
            )
        
        return None
    
    async def _fetch_api_reference(
        self, 
        source, 
        library: LibraryInfo, 
        topic: Optional[str]
    ) -> Optional[DocumentationContent]:
        """Fetch API reference documentation."""
        # Similar to official docs but with API-specific processing
        return await self._fetch_official_docs(source, library, topic)
    
    async def _fetch_generic_docs(
        self, 
        source, 
        library: LibraryInfo, 
        topic: Optional[str]
    ) -> Optional[DocumentationContent]:
        """Fetch documentation from generic sources."""
        content = await self._fetch_html_content(str(source.url))
        if content:
            return DocumentationContent(
                library_id=library.id,
                content=content,
                source_url=str(source.url),
                source_type=source.type,
                topic=topic,
                token_count=self._count_tokens(content)
            )
        return None
    
    async def _fetch_html_content(self, url: str) -> Optional[str]:
        """Fetch and convert HTML content to markdown."""
        try:
            async with self._session.get(url) as response:
                if response.status != 200:
                    return None
                
                html_content = await response.text()
                
                # Parse HTML and extract main content
                soup = BeautifulSoup(html_content, 'html.parser')
                
                # Remove script and style elements
                for script in soup(["script", "style", "nav", "footer", "header"]):
                    script.decompose()
                
                # Try to find main content area
                main_content = None
                for selector in [
                    'main', 
                    '.content', 
                    '.documentation', 
                    '.docs', 
                    '#content',
                    'article',
                    '.markdown-body'
                ]:
                    main_content = soup.select_one(selector)
                    if main_content:
                        break
                
                if not main_content:
                    main_content = soup.body or soup
                
                # Convert to markdown
                markdown_content = markdownify(
                    str(main_content), 
                    heading_style="ATX",
                    bullets="-"
                )
                
                # Clean up the markdown
                markdown_content = self._clean_markdown(markdown_content)
                
                return markdown_content
                
        except Exception as e:
            self.logger.error(f"Error fetching HTML from {url}: {e}")
            return None
    
    def _clean_markdown(self, content: str) -> str:
        """Clean and normalize markdown content."""
        # Remove excessive whitespace
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        # Remove empty links
        content = re.sub(r'\[\]\([^)]*\)', '', content)
        
        # Clean up code blocks
        content = re.sub(r'```\s*\n\s*```', '', content)
        
        # Remove HTML comments
        content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
        
        return content.strip()
    
    async def _combine_content(
        self, 
        content_list: List[DocumentationContent], 
        topic: Optional[str],
        max_tokens: int
    ) -> str:
        """Combine content from multiple sources."""
        if not content_list:
            return ""
        
        combined_parts = []
        current_tokens = 0
        
        # Sort by quality score (if available) and source priority
        content_list.sort(key=lambda x: x.quality_score, reverse=True)
        
        for content in content_list:
            content_tokens = self._count_tokens(content.content)
            
            if current_tokens + content_tokens > max_tokens:
                # Truncate this content to fit
                remaining_tokens = max_tokens - current_tokens
                if remaining_tokens > 100:  # Only include if meaningful amount remains
                    truncated_content = self._truncate_content(
                        content.content, 
                        remaining_tokens
                    )
                    combined_parts.append(truncated_content)
                break
            
            combined_parts.append(content.content)
            current_tokens += content_tokens
        
        return "\n\n---\n\n".join(combined_parts)
    
    def _count_tokens(self, text: str) -> int:
        """Approximate token count."""
        if not text:
            return 0
        
        # Simple approximation: split on whitespace and punctuation
        tokens = self._token_pattern.findall(text)
        return len(tokens)
    
    def _truncate_content(self, content: str, max_tokens: int) -> str:
        """Truncate content to fit within token limit."""
        tokens = self._token_pattern.findall(content)
        
        if len(tokens) <= max_tokens:
            return content
        
        # Take first max_tokens tokens and try to end at a sentence boundary
        truncated_tokens = tokens[:max_tokens]
        truncated_text = ' '.join(truncated_tokens)
        
        # Try to end at a sentence
        last_period = truncated_text.rfind('.')
        last_newline = truncated_text.rfind('\n')
        
        cut_point = max(last_period, last_newline)
        if cut_point > len(truncated_text) * 0.8:  # Only if we don't lose too much
            truncated_text = truncated_text[:cut_point + 1]
        
        return truncated_text + "\n\n[Content truncated...]"
    
    def _calculate_quality_score(self, content: str) -> float:
        """Calculate a quality score for the content."""
        if not content:
            return 0.0
        
        score = 0.5  # Base score
        
        # Check for code examples
        if '```' in content or '`' in content:
            score += 0.2
        
        # Check for structured content (headers)
        if re.search(r'^#+\s', content, re.MULTILINE):
            score += 0.1
        
        # Check for links (indicates comprehensive documentation)
        if '[' in content and '](' in content:
            score += 0.1
        
        # Penalize very short content
        if len(content) < 500:
            score -= 0.2
        
        # Bonus for longer, detailed content
        if len(content) > 2000:
            score += 0.1
        
        return min(1.0, max(0.0, score))