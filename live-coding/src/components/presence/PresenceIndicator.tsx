'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GraphQLSubscriptionManager } from '../../lib/graphql/subscriptions';
import { UserPresence } from '../../lib/graphql/types';
import { 
  EyeIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  currentLesson?: string;
}

interface PresenceIndicatorProps {
  courseId?: string;
  lessonId?: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  showUserList?: boolean;
  maxUsers?: number;
  className?: string;
}

export function PresenceIndicator({
  courseId,
  lessonId,
  currentUser,
  showUserList = false,
  maxUsers = 10,
  className = '',
}: PresenceIndicatorProps) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);

  const subscriptionManager = useRef<GraphQLSubscriptionManager>();
  const websocket = useRef<WebSocket>();
  const heartbeatInterval = useRef<NodeJS.Timeout>();
  const lastActivity = useRef<number>(Date.now());

  // Initialize presence system
  useEffect(() => {
    const initializePresence = async () => {
      try {
        // Create WebSocket connection
        websocket.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql');
        
        websocket.current.onopen = () => {
          setIsConnected(true);
          startHeartbeat();
        };

        websocket.current.onclose = () => {
          setIsConnected(false);
          stopHeartbeat();
        };

        websocket.current.onerror = (error) => {
          console.error('Presence WebSocket error:', error);
          setIsConnected(false);
        };

        // Initialize subscription manager
        subscriptionManager.current = new GraphQLSubscriptionManager();

        // Subscribe to presence updates
        const subscriptionId = courseId 
          ? `presence-course-${courseId}`
          : lessonId 
          ? `presence-lesson-${lessonId}`
          : 'presence-global';

        await subscriptionManager.current.subscribe({
          id: subscriptionId,
          query: `
            subscription UserPresenceUpdated($courseId: ID, $lessonId: ID) {
              userPresenceUpdated(courseId: $courseId, lessonId: $lessonId) {
                userId
                userName
                userAvatar
                status
                lastSeen
                currentLesson
              }
            }
          `,
          variables: { courseId, lessonId },
          websocket: websocket.current,
          context: { userId: currentUser.id },
        });

        // Send initial presence
        await updatePresence('online');

        // Load initial presence data
        await loadInitialPresence();

      } catch (error) {
        console.error('Failed to initialize presence:', error);
      }
    };

    initializePresence();

    // Cleanup on unmount
    return () => {
      updatePresence('offline');
      
      if (subscriptionManager.current) {
        const subscriptionId = courseId 
          ? `presence-course-${courseId}`
          : lessonId 
          ? `presence-lesson-${lessonId}`
          : 'presence-global';
        subscriptionManager.current.unsubscribe(subscriptionId);
      }
      
      if (websocket.current) {
        websocket.current.close();
      }
      
      stopHeartbeat();
    };
  }, [courseId, lessonId, currentUser.id]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      lastActivity.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);

  // Load initial presence data
  const loadInitialPresence = async () => {
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      if (lessonId) params.append('lessonId', lessonId);

      const response = await fetch(`/api/presence?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load initial presence:', error);
    }
  };

  // Update user presence
  const updatePresence = useCallback(async (status: 'online' | 'away' | 'offline') => {
    if (!subscriptionManager.current) return;

    try {
      const response = await fetch('/api/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          status,
          courseId,
          lessonId,
          lastSeen: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Publish presence update
        await subscriptionManager.current.publish({
          type: 'userPresenceUpdated',
          data: {
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            status,
            lastSeen: new Date().toISOString(),
            currentLesson: lessonId,
          },
          filters: { courseId, lessonId },
        });
      }
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, [currentUser, courseId, lessonId]);

  // Start heartbeat to maintain presence
  const startHeartbeat = useCallback(() => {
    heartbeatInterval.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity.current;
      
      // Mark as away after 5 minutes of inactivity
      const status = timeSinceActivity > 5 * 60 * 1000 ? 'away' : 'online';
      updatePresence(status);
    }, 30000); // Update every 30 seconds
  }, [updatePresence]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
  }, []);

  // Handle incoming presence events
  useEffect(() => {
    if (!websocket.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'data') {
          const { data } = message.payload;
          
          if (data.userPresenceUpdated) {
            const presenceUpdate = data.userPresenceUpdated;
            
            setOnlineUsers(prev => {
              const filtered = prev.filter(user => user.id !== presenceUpdate.userId);
              
              if (presenceUpdate.status === 'online' || presenceUpdate.status === 'away') {
                return [
                  ...filtered,
                  {
                    id: presenceUpdate.userId,
                    name: presenceUpdate.userName,
                    avatar: presenceUpdate.userAvatar,
                    status: presenceUpdate.status,
                    lastSeen: presenceUpdate.lastSeen,
                    currentLesson: presenceUpdate.currentLesson,
                  },
                ].sort((a, b) => a.name.localeCompare(b.name));
              }
              
              return filtered;
            });
          }
        }
      } catch (error) {
        console.error('Failed to parse presence message:', error);
      }
    };

    websocket.current.addEventListener('message', handleMessage);

    return () => {
      if (websocket.current) {
        websocket.current.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
        lastActivity.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updatePresence]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  // Format last seen
  const formatLastSeen = (lastSeen: string) => {
    return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
  };

  const displayUsers = onlineUsers.slice(0, maxUsers);
  const additionalCount = Math.max(0, onlineUsers.length - maxUsers);

  return (
    <div className={`relative ${className}`}>
      {/* Presence Indicator */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <EyeIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {onlineUsers.length} {onlineUsers.length === 1 ? 'viewer' : 'viewers'}
          </span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* User Avatars */}
        {showUserList && displayUsers.length > 0 && (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {displayUsers.map((user) => (
                <div
                  key={user.id}
                  className="relative"
                  title={`${user.name} - ${getStatusText(user.status)}`}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                </div>
              ))}
            </div>

            {additionalCount > 0 && (
              <button
                onClick={() => setShowUserPanel(!showUserPanel)}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
              >
                +{additionalCount} more
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Panel */}
      {showUserPanel && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">Online Users</h4>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {onlineUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <UserIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No users online</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="p-3 flex items-center space-x-3">
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{getStatusText(user.status)}</span>
                        {user.status !== 'online' && (
                          <>
                            <ClockIcon className="h-3 w-3" />
                            <span>{formatLastSeen(user.lastSeen)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showUserPanel && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserPanel(false)}
        />
      )}
    </div>
  );
}