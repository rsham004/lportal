'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { GraphQLSubscriptionManager } from '../../lib/graphql/subscriptions';
import { NotificationEvent } from '../../lib/graphql/types';

interface NotificationData {
  id: string;
  userId: string;
  type: 'assignment_due' | 'course_update' | 'message' | 'achievement' | 'grade_updated';
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isPermissionGranted: boolean;
  isSubscribed: boolean;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: React.ReactNode;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  value?: NotificationContextType; // For testing
}

export function NotificationProvider({ children, currentUser, value }: NotificationProviderProps) {
  // If value is provided (for testing), use it directly
  if (value) {
    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
  }

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const subscriptionManager = useRef<GraphQLSubscriptionManager>();
  const websocket = useRef<WebSocket>();
  const serviceWorkerRegistration = useRef<ServiceWorkerRegistration>();

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Initialize notification system
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Check notification permission
        if ('Notification' in window) {
          setIsPermissionGranted(Notification.permission === 'granted');
        }

        // Register service worker for push notifications
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          serviceWorkerRegistration.current = registration;

          // Check if already subscribed
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }

        // Initialize WebSocket connection
        websocket.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql');
        
        websocket.current.onopen = () => {
          console.log('Notification WebSocket connected');
        };

        websocket.current.onclose = () => {
          console.log('Notification WebSocket disconnected');
        };

        websocket.current.onerror = (error) => {
          console.error('Notification WebSocket error:', error);
        };

        // Initialize subscription manager
        subscriptionManager.current = new GraphQLSubscriptionManager();

        // Subscribe to user notifications
        await subscriptionManager.current.subscribe({
          id: `notifications-${currentUser.id}`,
          query: `
            subscription NotificationAdded($userId: ID!) {
              notificationAdded(userId: $userId) {
                id
                type
                title
                message
                data
                createdAt
                read
              }
            }
          `,
          variables: { userId: currentUser.id },
          websocket: websocket.current,
          context: { userId: currentUser.id, role: currentUser.role },
        });

        // Load initial notifications
        await loadInitialNotifications();

      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      if (subscriptionManager.current) {
        subscriptionManager.current.unsubscribe(`notifications-${currentUser.id}`);
      }
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [currentUser.id, currentUser.role]);

  // Load initial notifications from API
  const loadInitialNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${currentUser.id}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load initial notifications:', error);
    }
  };

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!serviceWorkerRegistration.current || !isPermissionGranted) {
      return false;
    }

    try {
      const subscription = await serviceWorkerRegistration.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          subscription,
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        return true;
      } else {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }, [isPermissionGranted, currentUser.id]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!serviceWorkerRegistration.current) {
      return false;
    }

    try {
      const subscription = await serviceWorkerRegistration.current.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.id,
          }),
        });
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }, [currentUser.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [currentUser.id]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [currentUser.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [currentUser.id]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });

      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }, [currentUser.id]);

  // Handle incoming notification events
  useEffect(() => {
    if (!websocket.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'data') {
          const { data } = message.payload;
          
          // Handle new notifications
          if (data.notificationAdded) {
            const newNotification = data.notificationAdded;
            
            setNotifications(prev => {
              // Check if notification already exists
              if (prev.some(n => n.id === newNotification.id)) {
                return prev;
              }
              return [newNotification, ...prev];
            });

            // Show browser notification if permission granted
            if (isPermissionGranted && !document.hasFocus()) {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/notification-icon.png',
                badge: '/notification-badge.png',
                tag: newNotification.id,
                data: newNotification.data,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse notification message:', error);
      }
    };

    websocket.current.addEventListener('message', handleMessage);

    return () => {
      if (websocket.current) {
        websocket.current.removeEventListener('message', handleMessage);
      }
    };
  }, [isPermissionGranted]);

  const contextValue: NotificationContextType = {
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
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}