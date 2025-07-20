import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WebSocket } from 'ws';
import { GraphQLSubscriptionManager } from './subscriptions';
import { SubscriptionEvent, SubscriptionFilter } from './types';

// Mock WebSocket for testing
jest.mock('ws');

describe('GraphQLSubscriptionManager', () => {
  let subscriptionManager: GraphQLSubscriptionManager;
  let mockWebSocket: jest.Mocked<WebSocket>;

  beforeEach(() => {
    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as any;

    subscriptionManager = new GraphQLSubscriptionManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Subscription Management', () => {
    it('should create a new subscription', async () => {
      const subscriptionId = 'test-subscription-1';
      const query = `
        subscription CourseUpdated($courseId: ID!) {
          courseUpdated(courseId: $courseId) {
            id
            title
            updatedAt
          }
        }
      `;
      const variables = { courseId: 'course-123' };

      const subscription = await subscriptionManager.subscribe({
        id: subscriptionId,
        query,
        variables,
        websocket: mockWebSocket,
      });

      expect(subscription).toBeDefined();
      expect(subscription.id).toBe(subscriptionId);
      expect(subscription.query).toBe(query);
      expect(subscription.variables).toEqual(variables);
      expect(subscription.isActive).toBe(true);
    });

    it('should unsubscribe from a subscription', async () => {
      const subscriptionId = 'test-subscription-2';
      const query = `subscription { messageAdded { id content } }`;

      await subscriptionManager.subscribe({
        id: subscriptionId,
        query,
        variables: {},
        websocket: mockWebSocket,
      });

      const result = await subscriptionManager.unsubscribe(subscriptionId);

      expect(result).toBe(true);
      expect(subscriptionManager.getActiveSubscriptions()).toHaveLength(0);
    });

    it('should handle multiple subscriptions', async () => {
      const subscriptions = [
        { id: 'sub-1', query: 'subscription { messageAdded { id } }' },
        { id: 'sub-2', query: 'subscription { userOnline { id } }' },
        { id: 'sub-3', query: 'subscription { courseUpdated { id } }' },
      ];

      for (const sub of subscriptions) {
        await subscriptionManager.subscribe({
          ...sub,
          variables: {},
          websocket: mockWebSocket,
        });
      }

      expect(subscriptionManager.getActiveSubscriptions()).toHaveLength(3);
    });
  });

  describe('Event Publishing', () => {
    it('should publish events to matching subscriptions', async () => {
      const subscriptionId = 'course-update-sub';
      const query = `
        subscription CourseUpdated($courseId: ID!) {
          courseUpdated(courseId: $courseId) {
            id
            title
            updatedAt
          }
        }
      `;

      await subscriptionManager.subscribe({
        id: subscriptionId,
        query,
        variables: { courseId: 'course-123' },
        websocket: mockWebSocket,
      });

      const event: SubscriptionEvent = {
        type: 'courseUpdated',
        data: {
          id: 'course-123',
          title: 'Updated Course Title',
          updatedAt: new Date().toISOString(),
        },
        filters: { courseId: 'course-123' },
      };

      await subscriptionManager.publish(event);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('courseUpdated')
      );
    });

    it('should filter events based on subscription variables', async () => {
      const subscription1 = await subscriptionManager.subscribe({
        id: 'sub-course-123',
        query: 'subscription CourseUpdated($courseId: ID!) { courseUpdated(courseId: $courseId) { id } }',
        variables: { courseId: 'course-123' },
        websocket: mockWebSocket,
      });

      const subscription2 = await subscriptionManager.subscribe({
        id: 'sub-course-456',
        query: 'subscription CourseUpdated($courseId: ID!) { courseUpdated(courseId: $courseId) { id } }',
        variables: { courseId: 'course-456' },
        websocket: mockWebSocket,
      });

      const event: SubscriptionEvent = {
        type: 'courseUpdated',
        data: { id: 'course-123', title: 'Test Course' },
        filters: { courseId: 'course-123' },
      };

      await subscriptionManager.publish(event);

      // Only subscription1 should receive the event
      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
    });

    it('should handle real-time chat messages', async () => {
      const chatSubscription = await subscriptionManager.subscribe({
        id: 'chat-sub-1',
        query: `
          subscription MessageAdded($roomId: ID!) {
            messageAdded(roomId: $roomId) {
              id
              content
              author {
                id
                name
              }
              createdAt
            }
          }
        `,
        variables: { roomId: 'room-general' },
        websocket: mockWebSocket,
      });

      const messageEvent: SubscriptionEvent = {
        type: 'messageAdded',
        data: {
          id: 'msg-1',
          content: 'Hello everyone!',
          author: { id: 'user-1', name: 'John Doe' },
          createdAt: new Date().toISOString(),
        },
        filters: { roomId: 'room-general' },
      };

      await subscriptionManager.publish(messageEvent);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('messageAdded')
      );
    });
  });

  describe('Connection Management', () => {
    it('should handle WebSocket disconnections', async () => {
      const subscriptionId = 'disconnect-test';
      
      await subscriptionManager.subscribe({
        id: subscriptionId,
        query: 'subscription { messageAdded { id } }',
        variables: {},
        websocket: mockWebSocket,
      });

      // Simulate WebSocket disconnection
      mockWebSocket.readyState = WebSocket.CLOSED;
      
      await subscriptionManager.handleDisconnection(mockWebSocket);

      expect(subscriptionManager.getActiveSubscriptions()).toHaveLength(0);
    });

    it('should clean up inactive subscriptions', async () => {
      const subscriptions = [
        { id: 'active-sub', websocket: mockWebSocket },
        { id: 'inactive-sub', websocket: { ...mockWebSocket, readyState: WebSocket.CLOSED } },
      ];

      for (const sub of subscriptions) {
        await subscriptionManager.subscribe({
          ...sub,
          query: 'subscription { messageAdded { id } }',
          variables: {},
        });
      }

      await subscriptionManager.cleanupInactiveSubscriptions();

      const activeSubscriptions = subscriptionManager.getActiveSubscriptions();
      expect(activeSubscriptions).toHaveLength(1);
      expect(activeSubscriptions[0].id).toBe('active-sub');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-frequency events efficiently', async () => {
      const startTime = Date.now();
      
      // Create multiple subscriptions
      for (let i = 0; i < 100; i++) {
        await subscriptionManager.subscribe({
          id: `perf-sub-${i}`,
          query: 'subscription { messageAdded { id } }',
          variables: {},
          websocket: mockWebSocket,
        });
      }

      // Publish multiple events
      for (let i = 0; i < 50; i++) {
        await subscriptionManager.publish({
          type: 'messageAdded',
          data: { id: `msg-${i}`, content: `Message ${i}` },
          filters: {},
        });
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within reasonable time (< 1 second)
      expect(executionTime).toBeLessThan(1000);
    });

    it('should batch multiple events for efficiency', async () => {
      const batchSize = 10;
      const events: SubscriptionEvent[] = [];

      for (let i = 0; i < batchSize; i++) {
        events.push({
          type: 'messageAdded',
          data: { id: `batch-msg-${i}`, content: `Batch message ${i}` },
          filters: {},
        });
      }

      await subscriptionManager.subscribe({
        id: 'batch-test-sub',
        query: 'subscription { messageAdded { id content } }',
        variables: {},
        websocket: mockWebSocket,
      });

      await subscriptionManager.publishBatch(events);

      // Should send batched events efficiently
      expect(mockWebSocket.send).toHaveBeenCalledTimes(batchSize);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed subscription queries', async () => {
      const invalidQuery = 'invalid graphql query';

      await expect(
        subscriptionManager.subscribe({
          id: 'invalid-sub',
          query: invalidQuery,
          variables: {},
          websocket: mockWebSocket,
        })
      ).rejects.toThrow('Invalid GraphQL subscription query');
    });

    it('should handle WebSocket send errors gracefully', async () => {
      mockWebSocket.send.mockImplementation(() => {
        throw new Error('WebSocket send failed');
      });

      await subscriptionManager.subscribe({
        id: 'error-test-sub',
        query: 'subscription { messageAdded { id } }',
        variables: {},
        websocket: mockWebSocket,
      });

      const event: SubscriptionEvent = {
        type: 'messageAdded',
        data: { id: 'msg-1', content: 'Test message' },
        filters: {},
      };

      // Should not throw error, but handle gracefully
      await expect(subscriptionManager.publish(event)).resolves.not.toThrow();
    });

    it('should validate subscription permissions', async () => {
      const restrictedQuery = `
        subscription AdminOnlyData {
          adminOnlyData {
            sensitiveInfo
          }
        }
      `;

      const userContext = { userId: 'user-123', role: 'student' };

      await expect(
        subscriptionManager.subscribe({
          id: 'restricted-sub',
          query: restrictedQuery,
          variables: {},
          websocket: mockWebSocket,
          context: userContext,
        })
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Real-time Features Integration', () => {
    it('should support live course progress updates', async () => {
      await subscriptionManager.subscribe({
        id: 'progress-sub',
        query: `
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
        variables: { userId: 'user-123', courseId: 'course-456' },
        websocket: mockWebSocket,
      });

      const progressEvent: SubscriptionEvent = {
        type: 'courseProgressUpdated',
        data: {
          userId: 'user-123',
          courseId: 'course-456',
          completedLessons: 5,
          totalLessons: 10,
          progressPercentage: 50,
          lastAccessedAt: new Date().toISOString(),
        },
        filters: { userId: 'user-123', courseId: 'course-456' },
      };

      await subscriptionManager.publish(progressEvent);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('courseProgressUpdated')
      );
    });

    it('should support live Q&A session updates', async () => {
      await subscriptionManager.subscribe({
        id: 'qa-sub',
        query: `
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
              }
              updatedAt
            }
          }
        `,
        variables: { sessionId: 'qa-session-789' },
        websocket: mockWebSocket,
      });

      const qaEvent: SubscriptionEvent = {
        type: 'qaSessionUpdated',
        data: {
          id: 'qa-1',
          question: 'How does GraphQL subscriptions work?',
          answer: 'GraphQL subscriptions enable real-time updates...',
          status: 'answered',
          votes: 5,
          author: { id: 'instructor-1', name: 'Jane Smith' },
          updatedAt: new Date().toISOString(),
        },
        filters: { sessionId: 'qa-session-789' },
      };

      await subscriptionManager.publish(qaEvent);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('qaSessionUpdated')
      );
    });

    it('should support presence indicators', async () => {
      await subscriptionManager.subscribe({
        id: 'presence-sub',
        query: `
          subscription UserPresenceUpdated($courseId: ID!) {
            userPresenceUpdated(courseId: $courseId) {
              userId
              status
              lastSeen
              currentLesson
            }
          }
        `,
        variables: { courseId: 'course-123' },
        websocket: mockWebSocket,
      });

      const presenceEvent: SubscriptionEvent = {
        type: 'userPresenceUpdated',
        data: {
          userId: 'user-456',
          status: 'online',
          lastSeen: new Date().toISOString(),
          currentLesson: 'lesson-5',
        },
        filters: { courseId: 'course-123' },
      };

      await subscriptionManager.publish(presenceEvent);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('userPresenceUpdated')
      );
    });
  });
});