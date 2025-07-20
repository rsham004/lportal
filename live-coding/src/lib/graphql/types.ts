import { WebSocket } from 'ws';

// Core subscription types
export interface SubscriptionEvent {
  type: string;
  data: any;
  filters?: Record<string, any>;
  timestamp?: string;
}

export interface SubscriptionFilter {
  [key: string]: any;
}

export interface SubscriptionContext {
  userId?: string;
  role?: string;
  permissions?: string[];
  [key: string]: any;
}

export interface Subscription {
  id: string;
  query: string;
  variables: Record<string, any>;
  websocket: WebSocket;
  context?: SubscriptionContext;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface SubscriptionRequest {
  id: string;
  query: string;
  variables: Record<string, any>;
  websocket: WebSocket;
  context?: SubscriptionContext;
}

// GraphQL Schema Types for Real-time Features
export interface CourseProgressUpdate {
  userId: string;
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  lastAccessedAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  roomId: string;
  createdAt: string;
  editedAt?: string;
  type: 'text' | 'image' | 'file' | 'system';
}

export interface QASession {
  id: string;
  question: string;
  answer?: string;
  status: 'pending' | 'answered' | 'closed';
  votes: number;
  author: {
    id: string;
    name: string;
    role: string;
  };
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  currentLesson?: string;
  courseId?: string;
}

export interface LiveStreamEvent {
  id: string;
  streamId: string;
  type: 'started' | 'ended' | 'paused' | 'resumed';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NotificationEvent {
  id: string;
  userId: string;
  type: 'assignment_due' | 'course_update' | 'message' | 'achievement';
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: string;
  read: boolean;
}

// Subscription Event Types
export type SubscriptionEventType = 
  | 'courseUpdated'
  | 'courseProgressUpdated'
  | 'messageAdded'
  | 'qaSessionUpdated'
  | 'userPresenceUpdated'
  | 'liveStreamEvent'
  | 'notificationAdded'
  | 'assignmentSubmitted'
  | 'gradeUpdated';

// GraphQL Subscription Queries
export const SUBSCRIPTION_QUERIES = {
  COURSE_UPDATED: `
    subscription CourseUpdated($courseId: ID!) {
      courseUpdated(courseId: $courseId) {
        id
        title
        description
        updatedAt
        lessons {
          id
          title
          order
        }
      }
    }
  `,
  
  COURSE_PROGRESS_UPDATED: `
    subscription CourseProgressUpdated($userId: ID!, $courseId: ID!) {
      courseProgressUpdated(userId: $userId, courseId: $courseId) {
        userId
        courseId
        completedLessons
        totalLessons
        progressPercentage
        lastAccessedAt
      }
    }
  `,
  
  MESSAGE_ADDED: `
    subscription MessageAdded($roomId: ID!) {
      messageAdded(roomId: $roomId) {
        id
        content
        author {
          id
          name
          avatar
        }
        roomId
        createdAt
        type
      }
    }
  `,
  
  QA_SESSION_UPDATED: `
    subscription QASessionUpdated($sessionId: ID!) {
      qaSessionUpdated(sessionId: $sessionId) {
        id
        question
        answer
        status
        votes
        author {
          id
          name
          role
        }
        updatedAt
      }
    }
  `,
  
  USER_PRESENCE_UPDATED: `
    subscription UserPresenceUpdated($courseId: ID!) {
      userPresenceUpdated(courseId: $courseId) {
        userId
        status
        lastSeen
        currentLesson
      }
    }
  `,
  
  LIVE_STREAM_EVENT: `
    subscription LiveStreamEvent($streamId: ID!) {
      liveStreamEvent(streamId: $streamId) {
        id
        streamId
        type
        timestamp
        metadata
      }
    }
  `,
  
  NOTIFICATION_ADDED: `
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
} as const;

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'connection_init' | 'start' | 'stop' | 'connection_ack' | 'data' | 'error' | 'complete';
  id?: string;
  payload?: any;
}

export interface GraphQLSubscriptionMessage extends WebSocketMessage {
  type: 'start' | 'data' | 'error' | 'complete';
  id: string;
  payload: {
    query?: string;
    variables?: Record<string, any>;
    data?: any;
    errors?: any[];
  };
}

// Performance and Monitoring Types
export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeConnections: number;
  eventsPublished: number;
  averageLatency: number;
  errorRate: number;
  memoryUsage: number;
}

export interface SubscriptionPerformanceConfig {
  maxSubscriptionsPerConnection: number;
  maxEventBatchSize: number;
  eventBatchTimeout: number;
  connectionTimeout: number;
  heartbeatInterval: number;
  maxMemoryUsage: number;
}

// Error Types
export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public subscriptionId?: string
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

export class AuthorizationError extends SubscriptionError {
  constructor(message: string, subscriptionId?: string) {
    super(message, 'AUTHORIZATION_ERROR', subscriptionId);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends SubscriptionError {
  constructor(message: string, subscriptionId?: string) {
    super(message, 'VALIDATION_ERROR', subscriptionId);
    this.name = 'ValidationError';
  }
}

export class ConnectionError extends SubscriptionError {
  constructor(message: string, subscriptionId?: string) {
    super(message, 'CONNECTION_ERROR', subscriptionId);
    this.name = 'ConnectionError';
  }
}