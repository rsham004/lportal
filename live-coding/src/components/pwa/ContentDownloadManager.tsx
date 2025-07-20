'use client';

import React, { useState, useEffect } from 'react';
import { usePWA } from './PWAProvider';
import { useEdgeCache } from './EdgeCacheProvider';
import { CacheStrategy } from '../../lib/services/edgeCache';
import {
  CloudArrowDownIcon,
  ArrowPathIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WifiOffIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';

interface DownloadedContent {
  id: string;
  title: string;
  type: 'course' | 'lesson' | 'video';
  downloadedAt: Date;
  size: number;
  progress?: number;
}

interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
}

interface ContentDownloadManagerProps {
  courseId?: string;
  className?: string;
}

export const ContentDownloadManager: React.FC<ContentDownloadManagerProps> = ({
  courseId,
  className = '',
}) => {
  const { isOnline, isOffline, syncProgress } = usePWA();
  const { fetchWithCache, isLoading } = useEdgeCache();
  
  const [downloadedContent, setDownloadedContent] = useState<DownloadedContent[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDownloadedContent();
    updateStorageInfo();
  }, []);

  useEffect(() => {
    // Listen for progress updates
    const handleProgressUpdate = (event: CustomEvent) => {
      const { courseId, progress } = event.detail;
      syncProgress(courseId, progress);
    };

    window.addEventListener('progress-update', handleProgressUpdate as EventListener);
    
    return () => {
      window.removeEventListener('progress-update', handleProgressUpdate as EventListener);
    };
  }, [syncProgress]);

  const loadDownloadedContent = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['downloads'], 'readonly');
      const store = transaction.objectStore('downloads');
      const request = store.getAll();
      
      request.onsuccess = () => {
        setDownloadedContent(request.result || []);
      };
      
      request.onerror = () => {
        console.error('Failed to load downloaded content');
      };
    } catch (error) {
      console.error('Failed to open database:', error);
    }
  };

  const updateStorageInfo = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;
        
        setStorageInfo({ used, quota, percentage });
      }
    } catch (error) {
      console.warn('Storage API not available:', error);
    }
  };

  const downloadCourse = async (courseId: string) => {
    if (!isOnline) {
      setError('Cannot download while offline');
      return;
    }

    try {
      setError(null);
      setDownloadProgress(prev => ({ ...prev, [courseId]: 0 }));

      // Fetch course data
      const courseData = await fetchWithCache(`/api/courses/${courseId}`, {
        strategy: CacheStrategy.NETWORK_FIRST,
        key: `course-${courseId}`,
        ttl: 24 * 60 * 60 * 1000, // 24 hours
      });

      if (!courseData) {
        throw new Error('Failed to fetch course data');
      }

      setDownloadProgress(prev => ({ ...prev, [courseId]: 25 }));

      // Download lessons
      const lessons = courseData.lessons || [];
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        
        // Download lesson content
        await fetchWithCache(`/api/lessons/${lesson.id}`, {
          strategy: CacheStrategy.NETWORK_FIRST,
          key: `lesson-${lesson.id}`,
          ttl: 24 * 60 * 60 * 1000,
        });

        // Download video if available
        if (lesson.videoUrl) {
          await cacheVideo(lesson.videoUrl, `video-${lesson.id}`);
        }

        const progress = 25 + ((i + 1) / lessons.length) * 75;
        setDownloadProgress(prev => ({ ...prev, [courseId]: progress }));
      }

      // Save to IndexedDB
      await saveDownloadedContent({
        id: courseId,
        title: courseData.title,
        type: 'course',
        downloadedAt: new Date(),
        size: estimateContentSize(courseData),
      });

      setDownloadProgress(prev => ({ ...prev, [courseId]: 100 }));
      
      // Remove progress after completion
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[courseId];
          return newProgress;
        });
      }, 2000);

      await loadDownloadedContent();
      await updateStorageInfo();
    } catch (error) {
      console.error('Download failed:', error);
      
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        setError('Storage quota exceeded. Please free up space and try again.');
      } else {
        setError(error instanceof Error ? error.message : 'Download failed');
      }
      
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[courseId];
        return newProgress;
      });
    }
  };

  const cacheVideo = async (videoUrl: string, key: string) => {
    // In a real implementation, this would download and cache video chunks
    // For now, we'll just cache the video metadata
    await fetchWithCache(videoUrl, {
      strategy: CacheStrategy.NETWORK_FIRST,
      key,
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  };

  const saveDownloadedContent = async (content: DownloadedContent) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['downloads'], 'readwrite');
      const store = transaction.objectStore('downloads');
      
      await new Promise((resolve, reject) => {
        const request = store.put(content);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to save downloaded content:', error);
    }
  };

  const deleteDownloadedContent = async (contentId: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['downloads'], 'readwrite');
      const store = transaction.objectStore('downloads');
      
      await new Promise((resolve, reject) => {
        const request = store.delete(contentId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      await loadDownloadedContent();
      await updateStorageInfo();
      setError('Content deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Failed to delete content:', error);
      setError('Failed to delete content');
    }
  };

  const syncNow = async () => {
    try {
      setSyncStatus('syncing');
      setError(null);

      // Sync progress for all downloaded courses
      for (const content of downloadedContent) {
        if (content.type === 'course') {
          // Get stored progress and sync
          const progress = getStoredProgress(content.id);
          await syncProgress(content.id, progress);
        }
      }

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setError('Sync failed. Will retry automatically when online.');
    }
  };

  const getStoredProgress = (courseId: string): number => {
    // In a real implementation, this would get progress from local storage
    return Math.floor(Math.random() * 100);
  };

  const estimateContentSize = (courseData: any): number => {
    // Rough estimation based on content
    const baseSize = 1024 * 1024; // 1MB base
    const lessonCount = courseData.lessons?.length || 0;
    const videoSize = lessonCount * 50 * 1024 * 1024; // 50MB per video
    return baseSize + videoSize;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('learning-portal-downloads', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('downloads')) {
          const store = db.createObjectStore('downloads', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }
      };
    });
  };

  return (
    <Card className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Content Downloads
        </h3>
        <Button
          onClick={syncNow}
          disabled={syncStatus === 'syncing' || isOffline}
          variant="outline"
          size="sm"
          aria-label="Sync downloaded content with server"
        >
          <ArrowPathIcon 
            className={`h-4 w-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} 
          />
          Sync Now
        </Button>
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
              Downloaded content is available. Changes will sync when you're back online.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Sync Status */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sync Status:
        </span>
        {syncStatus === 'idle' && (
          <span className="text-sm text-gray-500 dark:text-gray-400">Ready</span>
        )}
        {syncStatus === 'syncing' && (
          <span className="text-sm text-blue-600 dark:text-blue-400">Syncing...</span>
        )}
        {syncStatus === 'success' && (
          <div className="flex items-center space-x-1">
            <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-600 dark:text-green-400">Synced</span>
          </div>
        )}
        {syncStatus === 'error' && (
          <span className="text-sm text-red-600 dark:text-red-400">Error</span>
        )}
      </div>

      {/* Storage Information */}
      {storageInfo && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Storage Used
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
            </span>
          </div>
          <Progress 
            value={storageInfo.percentage} 
            className={storageInfo.percentage > 90 ? 'bg-red-200' : 'bg-blue-200'}
          />
          {storageInfo.percentage > 90 && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Storage is running low. Consider deleting some downloaded content.
            </p>
          )}
        </div>
      )}

      {/* Course Download */}
      {courseId && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Download Course
          </h4>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => downloadCourse(courseId)}
              disabled={isLoading || isOffline || downloadProgress[courseId] !== undefined}
              aria-label="Download course for offline access"
            >
              <CloudArrowDownIcon className="h-4 w-4 mr-2" />
              {downloadProgress[courseId] !== undefined ? 'Downloading...' : 'Download Course'}
            </Button>
            
            {downloadProgress[courseId] !== undefined && (
              <div className="flex-1">
                <Progress 
                  value={downloadProgress[courseId]} 
                  aria-label={`Download progress: ${downloadProgress[courseId]}%`}
                  aria-valuenow={downloadProgress[courseId]}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {Math.round(downloadProgress[courseId])}% complete
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Downloaded Content List */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Downloaded Content
        </h4>
        
        {downloadedContent.length === 0 ? (
          <div className="text-center py-6">
            <CloudArrowDownIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No downloaded content
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {downloadedContent.map((content) => (
              <div
                key={content.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800"
              >
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    {content.title}
                  </h5>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{content.type}</span>
                    <span>{formatBytes(content.size)}</span>
                    <span>
                      Downloaded {content.downloadedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => deleteDownloadedContent(content.id)}
                  variant="outline"
                  size="sm"
                  aria-label={`Delete ${content.title}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};