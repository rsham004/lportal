import { WebSocket } from 'ws';
import { 
  Subscription, 
  SubscriptionRequest, 
  SubscriptionEvent, 
  SubscriptionContext,
  SubscriptionMetrics,
  SubscriptionPerformanceConfig,
  SubscriptionError,
  AuthorizationError,
  ValidationError,
  ConnectionError,
  WebSocketMessage,
  GraphQLSubscriptionMessage
} from './types';

export class GraphQLSubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private connectionSubscriptions: Map<WebSocket, Set<string>> = new Map();
  private eventQueue: SubscriptionEvent[] = [];
  private isProcessingQueue = false;
  private metrics: SubscriptionMetrics;
  private config: SubscriptionPerformanceConfig;

  constructor(config?: Partial<SubscriptionPerformanceConfig>) {
    this.config = {
      maxSubscriptionsPerConnection: 50,
      maxEventBatchSize: 100,
      eventBatchTimeout: 100, // ms
      connectionTimeout: 30000, // 30 seconds
      heartbeatInterval: 25000, // 25 seconds
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      ...config,
    };

    this.metrics = {
      totalSubscriptions: 0,
      activeConnections: 0,
      eventsPublished: 0,
      averageLatency: 0,
      errorRate: 0,
      memoryUsage: 0,
    };

    // Start background processes
    this.startHeartbeat();
    this.startQueueProcessor();
    this.startMetricsCollection();
  }

  /**
   * Create a new GraphQL subscription
   */
  async subscribe(request: SubscriptionRequest): Promise<Subscription> {
    try {
      // Validate the subscription request
      await this.validateSubscriptionRequest(request);

      // Check connection limits
      this.enforceConnectionLimits(request.websocket);

      // Parse and validate GraphQL query
      this.validateGraphQLQuery(request.query);

      // Check authorization
      await this.authorizeSubscription(request);

      // Create subscription
      const subscription: Subscription = {
        id: request.id,
        query: request.query,
        variables: request.variables,
        websocket: request.websocket,
        context: request.context,
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      // Store subscription
      this.subscriptions.set(request.id, subscription);

      // Track connection subscriptions
      if (!this.connectionSubscriptions.has(request.websocket)) {
        this.connectionSubscriptions.set(request.websocket, new Set());
      }
      this.connectionSubscriptions.get(request.websocket)!.add(request.id);

      // Set up WebSocket event handlers
      this.setupWebSocketHandlers(request.websocket);

      // Update metrics
      this.metrics.totalSubscriptions++;
      this.updateActiveConnections();

      // Send connection acknowledgment
      this.sendMessage(request.websocket, {
        type: 'connection_ack',
        id: request.id,
      });

      return subscription;
    } catch (error) {
      this.metrics.errorRate++;
      throw error;
    }
  }

  /**
   * Remove a subscription
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    // Remove from connection tracking
    const connectionSubs = this.connectionSubscriptions.get(subscription.websocket);
    if (connectionSubs) {
      connectionSubs.delete(subscriptionId);
      if (connectionSubs.size === 0) {
        this.connectionSubscriptions.delete(subscription.websocket);
      }
    }

    // Remove subscription
    this.subscriptions.delete(subscriptionId);

    // Send completion message
    this.sendMessage(subscription.websocket, {
      type: 'complete',
      id: subscriptionId,
    });

    // Update metrics
    this.updateActiveConnections();

    return true;
  }

  /**
   * Publish an event to matching subscriptions
   */
  async publish(event: SubscriptionEvent): Promise<void> {
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    // Add to queue for batch processing
    this.eventQueue.push(eventWithTimestamp);

    // Process immediately if queue is getting full
    if (this.eventQueue.length >= this.config.maxEventBatchSize) {
      await this.processEventQueue();
    }
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch(events: SubscriptionEvent[]): Promise<void> {
    const eventsWithTimestamp = events.map(event => ({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    }));

    this.eventQueue.push(...eventsWithTimestamp);
    await this.processEventQueue();
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
  }

  /**
   * Handle WebSocket disconnection
   */
  async handleDisconnection(websocket: WebSocket): Promise<void> {
    const subscriptionIds = this.connectionSubscriptions.get(websocket);
    if (subscriptionIds) {
      for (const subscriptionId of subscriptionIds) {
        await this.unsubscribe(subscriptionId);
      }
    }
    this.connectionSubscriptions.delete(websocket);
    this.updateActiveConnections();
  }

  /**
   * Clean up inactive subscriptions
   */
  async cleanupInactiveSubscriptions(): Promise<void> {
    const inactiveSubscriptions: string[] = [];

    for (const [id, subscription] of this.subscriptions) {
      if (subscription.websocket.readyState !== WebSocket.OPEN) {
        inactiveSubscriptions.push(id);
      }
    }

    for (const id of inactiveSubscriptions) {
      await this.unsubscribe(id);
    }
  }

  /**
   * Get subscription metrics
   */
  getMetrics(): SubscriptionMetrics {
    return { ...this.metrics };
  }

  /**
   * Validate subscription request
   */
  private async validateSubscriptionRequest(request: SubscriptionRequest): Promise<void> {
    if (!request.id) {
      throw new ValidationError('Subscription ID is required');
    }

    if (!request.query) {
      throw new ValidationError('GraphQL query is required');
    }

    if (!request.websocket) {
      throw new ValidationError('WebSocket connection is required');
    }

    if (this.subscriptions.has(request.id)) {
      throw new ValidationError(`Subscription with ID ${request.id} already exists`);
    }
  }

  /**
   * Validate GraphQL query syntax
   */
  private validateGraphQLQuery(query: string): void {
    // Basic validation - in production, use a proper GraphQL parser
    if (!query.trim().startsWith('subscription')) {
      throw new ValidationError('Invalid GraphQL subscription query');
    }

    // Check for common GraphQL syntax
    if (!query.includes('{') || !query.includes('}')) {
      throw new ValidationError('Invalid GraphQL subscription query');
    }
  }

  /**
   * Check authorization for subscription
   */
  private async authorizeSubscription(request: SubscriptionRequest): Promise<void> {
    const context = request.context;
    
    // Check for admin-only subscriptions
    if (request.query.includes('adminOnlyData') && context?.role !== 'admin') {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Add more authorization logic as needed
    // This would typically integrate with your auth system
  }

  /**
   * Enforce connection limits
   */
  private enforceConnectionLimits(websocket: WebSocket): void {
    const existingSubscriptions = this.connectionSubscriptions.get(websocket);
    if (existingSubscriptions && existingSubscriptions.size >= this.config.maxSubscriptionsPerConnection) {
      throw new ConnectionError('Maximum subscriptions per connection exceeded');
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(websocket: WebSocket): void {
    if (websocket.listenerCount('close') === 0) {
      websocket.on('close', () => {
        this.handleDisconnection(websocket);
      });

      websocket.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(websocket);
      });
    }
  }

  /**
   * Send message to WebSocket
   */
  private sendMessage(websocket: WebSocket, message: WebSocketMessage): void {
    try {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this.metrics.errorRate++;
    }
  }

  /**
   * Process event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const events = this.eventQueue.splice(0, this.config.maxEventBatchSize);
      
      for (const event of events) {
        await this.processEvent(event);
      }

      this.metrics.eventsPublished += events.length;
    } catch (error) {
      console.error('Error processing event queue:', error);
      this.metrics.errorRate++;
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Process individual event
   */
  private async processEvent(event: SubscriptionEvent): Promise<void> {
    const startTime = Date.now();

    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive || subscription.websocket.readyState !== WebSocket.OPEN) {
        continue;
      }

      // Check if subscription matches event
      if (this.matchesSubscription(subscription, event)) {
        const message: GraphQLSubscriptionMessage = {
          type: 'data',
          id: subscription.id,
          payload: {
            data: {
              [event.type]: event.data,
            },
          },
        };

        this.sendMessage(subscription.websocket, message);
        subscription.lastActivity = new Date();
      }
    }

    // Update latency metrics
    const latency = Date.now() - startTime;
    this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
  }

  /**
   * Check if subscription matches event
   */
  private matchesSubscription(subscription: Subscription, event: SubscriptionEvent): boolean {
    // Extract subscription type from query
    const subscriptionType = this.extractSubscriptionType(subscription.query);
    
    if (subscriptionType !== event.type) {
      return false;
    }

    // Check filters
    if (event.filters) {
      for (const [key, value] of Object.entries(event.filters)) {
        if (subscription.variables[key] && subscription.variables[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Extract subscription type from GraphQL query
   */
  private extractSubscriptionType(query: string): string {
    // Simple regex to extract subscription type
    // In production, use a proper GraphQL parser
    const match = query.match(/subscription\s+\w*\s*(?:\([^)]*\))?\s*{\s*(\w+)/);
    return match ? match[1] : '';
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    setInterval(() => {
      for (const websocket of this.connectionSubscriptions.keys()) {
        if (websocket.readyState === WebSocket.OPEN) {
          this.sendMessage(websocket, { type: 'connection_ack' });
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    }, this.config.eventBatchTimeout);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update active connections count
   */
  private updateActiveConnections(): void {
    this.metrics.activeConnections = this.connectionSubscriptions.size;
  }

  /**
   * Update all metrics
   */
  private updateMetrics(): void {
    this.updateActiveConnections();
    this.metrics.memoryUsage = process.memoryUsage().heapUsed;
    
    // Clean up inactive subscriptions
    this.cleanupInactiveSubscriptions();
  }
}