'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotifications } from './NotificationProvider';
import { 
  BellIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
  FunnelIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface NotificationSystemProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  className?: string;
}

type NotificationFilter = 'all' | 'unread' | 'assignment_due' | 'course_update' | 'message' | 'achievement' | 'grade_updated';

export function NotificationSystem({ currentUser, className = '' }: NotificationSystemProps) {
  const {
    notifications,
    unreadCount,
    isPermissionGranted,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');

  // Filter notifications based on selected filter
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.read);
        break;
      case 'assignment_due':
      case 'course_update':
      case 'message':
      case 'achievement':
      case 'grade_updated':
        filtered = notifications.filter(n => n.type === filter);
        break;
      default:
        filtered = notifications;
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, filter]);

  // Show toast for new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      const isNew = new Date(latestNotification.createdAt).getTime() > Date.now() - 5000; // 5 seconds
      
      if (isNew && !latestNotification.read) {
        setToastNotification(latestNotification.title);
        setStatusAnnouncement(`New notification: ${latestNotification.title}`);
        
        // Clear toast after 5 seconds
        setTimeout(() => {
          setToastNotification(null);
          setStatusAnnouncement('');
        }, 5000);
      }
    }
  }, [notifications]);

  // Handle notification click
  const handleNotificationClick = useCallback(async (notificationId: string) => {
    await markAsRead(notificationId);
    
    // Handle navigation based on notification data
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.data) {
      // Navigate to relevant page based on notification type
      switch (notification.type) {
        case 'assignment_due':
          if (notification.data.assignmentId) {
            window.location.href = `/assignments/${notification.data.assignmentId}`;
          }
          break;
        case 'course_update':
          if (notification.data.courseId) {
            window.location.href = `/courses/${notification.data.courseId}`;
          }
          break;
        case 'message':
          if (notification.data.chatRoomId) {
            window.location.href = `/chat/${notification.data.chatRoomId}`;
          }
          break;
        default:
          break;
      }
    }
  }, [markAsRead, notifications]);

  // Handle permission request
  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      setStatusAnnouncement('Notification permission granted');
      setTimeout(() => setStatusAnnouncement(''), 3000);
    }
  }, [requestPermission]);

  // Handle subscription toggle
  const handleSubscriptionToggle = useCallback(async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        setStatusAnnouncement('Unsubscribed from push notifications');
        setTimeout(() => setStatusAnnouncement(''), 3000);
      }
    } else {
      const success = await subscribe();
      if (success) {
        setStatusAnnouncement('Subscribed to push notifications');
        setTimeout(() => setStatusAnnouncement(''), 3000);
      }
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment_due':
        return <ClipboardDocumentCheckIcon className="h-5 w-5 text-orange-500" data-testid="assignment-icon" />;
      case 'course_update':
        return <BookOpenIcon className="h-5 w-5 text-blue-500" data-testid="course-icon" />;
      case 'message':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-500" data-testid="message-icon" />;
      case 'achievement':
        return <TrophyIcon className="h-5 w-5 text-yellow-500" data-testid="achievement-icon" />;
      case 'grade_updated':
        return <AcademicCapIcon className="h-5 w-5 text-purple-500" data-testid="grade-icon" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
            aria-label="Unread notifications"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Filter */}
            <div className="mt-3 flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as NotificationFilter)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter notifications"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="assignment_due">Assignments</option>
                <option value="course_update">Course Updates</option>
                <option value="message">Messages</option>
                <option value="achievement">Achievements</option>
                <option value="grade_updated">Grades</option>
              </select>
            </div>

            {/* Actions */}
            <div className="mt-3 flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  aria-label="Mark all as read"
                >
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-red-600 hover:text-red-800"
                  aria-label="Clear all"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Permission/Subscription Settings */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            {!isPermissionGranted ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Enable Notifications</p>
                <button
                  onClick={handleRequestPermission}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  aria-label="Enable notifications"
                >
                  Enable Notifications
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Push Notifications</span>
                <button
                  onClick={handleSubscriptionToggle}
                  className={`px-3 py-1 text-sm rounded ${
                    isSubscribed
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  aria-label={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                >
                  {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    data-testid="notification-item"
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTimestamp(notification.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-green-600"
                                aria-label="Mark as read"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600"
                              aria-label="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastNotification && (
        <div 
          className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          role="alert"
        >
          <div className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{toastNotification}</span>
            <button
              onClick={() => setToastNotification(null)}
              className="text-blue-200 hover:text-white"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}