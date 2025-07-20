"""Configuration management for Context7 MCP Server."""

import os
from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    VERSION: str = "0.1.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_ENABLED: bool = Field(default=False, env="REDIS_ENABLED")
    
    # API Keys
    GITHUB_TOKEN: Optional[str] = Field(default=None, env="GITHUB_TOKEN")
    NPM_REGISTRY_URL: str = Field(
        default="https://registry.npmjs.org", env="NPM_REGISTRY_URL"
    )
    
    # Rate Limiting
    MAX_REQUESTS_PER_MINUTE: int = Field(default=60, env="MAX_REQUESTS_PER_MINUTE")
    MAX_CONCURRENT_REQUESTS: int = Field(default=10, env="MAX_CONCURRENT_REQUESTS")
    
    # Documentation Processing
    MAX_DOC_SIZE_MB: int = Field(default=10, env="MAX_DOC_SIZE_MB")
    DEFAULT_TOKEN_LIMIT: int = Field(default=10000, env="DEFAULT_TOKEN_LIMIT")
    CACHE_TTL_SECONDS: int = Field(default=3600, env="CACHE_TTL_SECONDS")
    
    # Library Registry
    LIBRARY_REGISTRY_URL: str = Field(
        default="https://raw.githubusercontent.com/context7/registry/main/libraries.json",
        env="LIBRARY_REGISTRY_URL"
    )
    REGISTRY_UPDATE_INTERVAL_HOURS: int = Field(
        default=24, env="REGISTRY_UPDATE_INTERVAL_HOURS"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()