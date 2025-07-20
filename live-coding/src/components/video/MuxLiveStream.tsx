'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { 
  PlayIcon,
  StopIcon,
  CogIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  SignalIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { LiveChat } from '../collaboration/LiveChat';
import { ChatProvider } from '../collaboration/ChatProvider';

interface MuxLiveStreamData {
  id: string;
  status: 'idle' | 'active' | 'disconnected';
  playback_ids: Array<{
    id: string;
    policy: 'public' | 'signed';
  }>;
  stream_key: string;
  rtmp_url: string;
  created_at: string;
  max_continuous_duration: number;
  latency_mode: 'low' | 'reduced' | 'standard';
  reconnect_window: number;
  title?: string;
  description?: string;
}

interface StreamUser {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface MuxLiveStreamProps {
  currentUser: StreamUser;
  liveStream?: MuxLiveStreamData;
  viewerCount?: number;
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  showChat?: boolean;
  onStreamStart: (stream: MuxLiveStreamData) => void;
  onStreamEnd: () => void;
  onViewerJoin?: (viewer: StreamUser) => void;
  onViewerLeave?: (viewerId: string) => void;
  className?: string;
}

export function MuxLiveStream({
  currentUser,
  liveStream,
  viewerCount = 0,
  connectionQuality = 'good',
  showChat = false,
  onStreamStart,
  onStreamEnd,
  onViewerJoin,
  onViewerLeave,
  className = '',
}: MuxLiveStreamProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(showChat);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');

  const playerRef = useRef<HTMLVideoElement>(null);

  const isInstructor = currentUser.role === 'instructor' || currentUser.role === 'admin';
  const hasActiveStream = liveStream && liveStream.status === 'active';

  // Handle stream status changes for announcements
  useEffect(() => {
    if (liveStream?.status === 'active') {
      setStatusAnnouncement('Stream is now live');
      setTimeout(() => setStatusAnnouncement(''), 3000);
    } else if (liveStream?.status === 'disconnected') {
      setStatusAnnouncement('Stream has disconnected');
      setTimeout(() => setStatusAnnouncement(''), 3000);
    }
  }, [liveStream?.status]);

  // Create new live stream
  const handleCreateStream = useCallback(async () => {
    if (!streamTitle.trim()) {
      setError('Title is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/mux/live-streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: streamTitle.trim(),
          description: streamDescription.trim(),
          instructorId: currentUser.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create stream');
      }

      const { liveStream: newStream } = await response.json();
      onStreamStart(newStream);
      
      // Reset form
      setStreamTitle('');
      setStreamDescription('');
      setError(null);
    } catch (error) {
      console.error('Failed to create stream:', error);
      setError('Failed to create live stream');
    } finally {
      setIsCreating(false);
    }
  }, [streamTitle, streamDescription, currentUser.id, onStreamStart]);

  // End live stream
  const handleEndStream = useCallback(async () => {
    if (!liveStream) return;

    try {
      const response = await fetch(`/api/mux/live-streams/${liveStream.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to end stream');
      }

      onStreamEnd();
      setShowEndConfirm(false);
    } catch (error) {
      console.error('Failed to end stream:', error);
      setError('Failed to end stream');
    }
  }, [liveStream, onStreamEnd]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  // Get status display
  const getStatusDisplay = () => {
    if (!liveStream) return { icon: '⚪', text: 'No Stream', color: 'text-gray-500' };
    
    switch (liveStream.status) {
      case 'active':
        return { icon: '🔴', text: 'Live', color: 'text-red-500' };
      case 'idle':
        return { icon: '⚪', text: 'Idle', color: 'text-gray-500' };
      case 'disconnected':
        return { icon: '🟡', text: 'Disconnected', color: 'text-yellow-500' };
      default:
        return { icon: '⚪', text: 'Unknown', color: 'text-gray-500' };
    }
  };

  // Get connection quality display
  const getConnectionQualityDisplay = () => {
    switch (connectionQuality) {
      case 'excellent':
        return { text: 'Excellent', color: 'text-green-500' };
      case 'good':
        return { text: 'Good', color: 'text-green-500' };
      case 'fair':
        return { text: 'Fair', color: 'text-yellow-500' };
      case 'poor':
        return { text: 'Poor', color: 'text-red-500' };
      default:
        return { text: 'Unknown', color: 'text-gray-500' };
    }
  };

  const statusDisplay = getStatusDisplay();
  const connectionDisplay = getConnectionQualityDisplay();

  // Render stream creation form
  if (!liveStream && isInstructor) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Live Stream</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="stream-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="stream-title"
              type="text"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              placeholder="Stream title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="stream-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="stream-description"
              value={streamDescription}
              onChange={(e) => setStreamDescription(e.target.value)}
              placeholder="Stream description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            onClick={handleCreateStream}
            disabled={isCreating || !streamTitle.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                <span>Create Stream</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Render no stream message for students
  if (!liveStream && !isInstructor) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <PlayIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No live stream available</h3>
        <p className="text-gray-600">Check back later for live sessions.</p>
      </div>
    );
  }

  // Render live stream player
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="flex">
        {/* Main video area */}
        <div className={`flex-1 ${showChatPanel ? 'w-2/3' : 'w-full'}`}>
          {/* Stream header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {liveStream?.title || 'Live Stream'}
                </h3>
                {liveStream?.description && (
                  <p className="text-sm text-gray-600 mt-1">{liveStream.description}</p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Status */}
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${statusDisplay.color}`}>
                    {statusDisplay.icon} {statusDisplay.text}
                  </span>
                </div>

                {/* Viewer count */}
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <EyeIcon className="h-4 w-4" />
                  <span>{viewerCount} viewers</span>
                </div>

                {/* Connection quality */}
                <div className="flex items-center space-x-1 text-sm">
                  <SignalIcon className="h-4 w-4" />
                  <span className={connectionDisplay.color} data-testid="connection-indicator">
                    {connectionDisplay.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Video player */}
          <div className="relative bg-black" role="region" aria-label="Live stream">
            {liveStream?.playback_ids?.[0] ? (
              <MuxPlayer
                ref={playerRef}
                playbackId={liveStream.playback_ids[0].id}
                streamType="live"
                autoPlay
                muted={false}
                controls
                style={{ width: '100%', aspectRatio: '16/9' }}
                onLoadStart={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                onError={(error) => {
                  setIsLoading(false);
                  setError('Error loading stream');
                  console.error('Mux player error:', error);
                }}
                aria-label="Video player"
              />
            ) : (
              <div className="flex items-center justify-center h-96 text-white">
                <div className="text-center">
                  <PlayIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Waiting for stream to start...</p>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                  <p>Loading...</p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="text-red-400 mb-2">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stream controls */}
          {isInstructor && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {liveStream?.latency_mode === 'low' && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Low Latency
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowChatPanel(!showChatPanel)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                    aria-label="Toggle chat"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                    aria-label="Stream settings"
                  >
                    <CogIcon className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => setShowEndConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    aria-label="End stream"
                  >
                    <StopIcon className="h-4 w-4 mr-2" />
                    End Stream
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat panel */}
        {showChatPanel && (
          <div className="w-1/3 border-l border-gray-200">
            <ChatProvider
              roomId={`stream-${liveStream?.id}`}
              currentUser={{
                id: currentUser.id,
                name: currentUser.name,
                avatar: currentUser.avatar,
                role: currentUser.role,
              }}
            >
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Live Chat</h4>
                  <button
                    onClick={() => setShowChatPanel(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <LiveChat roomId={`stream-${liveStream?.id}`} className="flex-1 border-0" />
              </div>
            </ChatProvider>
          </div>
        )}
      </div>

      {/* Settings modal */}
      {showSettings && liveStream && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Stream Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stream Key:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={liveStream.stream_key}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(liveStream.stream_key)}
                    className="p-2 text-gray-600 hover:text-blue-600"
                    aria-label="Copy stream key"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RTMP URL:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={liveStream.rtmp_url}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(liveStream.rtmp_url)}
                    className="p-2 text-gray-600 hover:text-blue-600"
                    aria-label="Copy RTMP URL"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                <p>Use these credentials in your streaming software (OBS, etc.)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End stream confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">End Stream?</h3>
            <p className="text-gray-600 mb-6">
              This will end the live stream for all viewers. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleEndStream}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                aria-label="Confirm"
              >
                End Stream
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement}
      </div>
    </div>
  );
}