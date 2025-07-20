'use client';

import React, { useState, useEffect } from 'react';
import { usePWA } from './PWAProvider';
import { 
  ArrowPathIcon, 
  TrashIcon, 
  CloudArrowDownIcon,
  WifiOffIcon 
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface CacheManagerProps {
  className?: string;
  title?: string;
  courseId?: string;
  showActions?: boolean;
}

export const CacheManager: React.FC<CacheManagerProps> = ({
  className = '',
  title = 'Cache Status',
  courseId,
  showActions = true,
}) => {
  const { 
    isOnline, 
    isOffline, 
    cacheStatus, 
    cacheContent, 
    clearCache, 
    getCacheStatus 
  } = usePWA();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isCaching, setIsCaching] = useState(false);

  useEffect(() => {
    // Load cache status on mount
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await getCacheStatus();
    } catch (error) {
      console.error('Failed to refresh cache status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setIsClearing(true);
      await clearCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleCacheContent = async () => {
    if (!courseId) return;
    
    try {
      setIsCaching(true);
      await cacheContent('course', courseId);
    } catch (error) {
      console.error('Failed to cache content:', error);
    } finally {
      setIsCaching(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {showActions && (
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || isOffline}
              variant="outline"
              size="sm"
              aria-label="Refresh cache status"
            >
              <ArrowPathIcon 
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
            </Button>
          )}
        </div>

        {/* Offline Status */}
        {isOffline && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
            <WifiOffIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                You are currently offline
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                Cached content is available for offline access
              </p>
            </div>
          </div>
        )}

        {/* Cache Status */}
        <div className="space-y-3">
          {cacheStatus === null ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Loading cache status...
              </p>
            </div>
          ) : cacheStatus.size === 0 ? (
            <div className="text-center py-4">
              <CloudArrowDownIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No cached content
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatBytes(cacheStatus.size)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cache Size
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {cacheStatus.items}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {cacheStatus.items === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
          )}

          {cacheStatus?.lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Last updated: {formatDate(cacheStatus.lastUpdated)}
            </p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="space-y-2">
            {courseId && (
              <Button
                onClick={handleCacheContent}
                disabled={isCaching || isOffline}
                className="w-full"
                aria-label="Cache course for offline access"
              >
                <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                {isCaching ? 'Caching...' : 'Cache Course'}
              </Button>
            )}
            
            <Button
              onClick={handleClearCache}
              disabled={isClearing || isOffline || cacheStatus?.size === 0}
              variant="outline"
              className="w-full"
              aria-label="Clear all cached content"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {isClearing ? 'Clearing...' : 'Clear Cache'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};