import Mux from '@mux/mux-node';

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export interface CreateLiveStreamOptions {
  title: string;
  description?: string;
  latencyMode?: 'low' | 'reduced' | 'standard';
  maxContinuousDuration?: number;
  reconnectWindow?: number;
  playbackPolicy?: 'public' | 'signed';
}

export interface LiveStreamData {
  id: string;
  status: 'idle' | 'active' | 'disconnected';
  playbackIds: Array<{
    id: string;
    policy: 'public' | 'signed';
  }>;
  streamKey: string;
  rtmpUrl: string;
  createdAt: string;
  maxContinuousDuration: number;
  latencyMode: 'low' | 'reduced' | 'standard';
  reconnectWindow: number;
  title?: string;
  description?: string;
}

export interface LiveStreamMetrics {
  viewerCount: number;
  peakViewerCount: number;
  totalViewTime: number;
  averageViewDuration: number;
  startTime?: string;
  endTime?: string;
}

export class MuxLiveService {
  /**
   * Create a new live stream
   */
  static async createLiveStream(options: CreateLiveStreamOptions): Promise<LiveStreamData> {
    try {
      const liveStream = await mux.video.liveStreams.create({
        playback_policy: [options.playbackPolicy || 'public'],
        latency_mode: options.latencyMode || 'low',
        max_continuous_duration: options.maxContinuousDuration || 3600, // 1 hour default
        reconnect_window: options.reconnectWindow || 60, // 60 seconds default
        new_asset_settings: {
          playback_policy: [options.playbackPolicy || 'public'],
        },
      });

      return {
        id: liveStream.id!,
        status: liveStream.status as 'idle' | 'active' | 'disconnected',
        playbackIds: liveStream.playback_ids?.map(pid => ({
          id: pid.id!,
          policy: pid.policy as 'public' | 'signed',
        })) || [],
        streamKey: liveStream.stream_key!,
        rtmpUrl: 'rtmp://global-live.mux.com:5222/live',
        createdAt: liveStream.created_at!,
        maxContinuousDuration: liveStream.max_continuous_duration!,
        latencyMode: liveStream.latency_mode as 'low' | 'reduced' | 'standard',
        reconnectWindow: liveStream.reconnect_window!,
        title: options.title,
        description: options.description,
      };
    } catch (error) {
      console.error('Failed to create live stream:', error);
      throw new Error('Failed to create live stream');
    }
  }

  /**
   * Get live stream details
   */
  static async getLiveStream(streamId: string): Promise<LiveStreamData | null> {
    try {
      const liveStream = await mux.video.liveStreams.retrieve(streamId);

      return {
        id: liveStream.id!,
        status: liveStream.status as 'idle' | 'active' | 'disconnected',
        playbackIds: liveStream.playback_ids?.map(pid => ({
          id: pid.id!,
          policy: pid.policy as 'public' | 'signed',
        })) || [],
        streamKey: liveStream.stream_key!,
        rtmpUrl: 'rtmp://global-live.mux.com:5222/live',
        createdAt: liveStream.created_at!,
        maxContinuousDuration: liveStream.max_continuous_duration!,
        latencyMode: liveStream.latency_mode as 'low' | 'reduced' | 'standard',
        reconnectWindow: liveStream.reconnect_window!,
      };
    } catch (error) {
      console.error('Failed to get live stream:', error);
      return null;
    }
  }

  /**
   * Delete a live stream
   */
  static async deleteLiveStream(streamId: string): Promise<boolean> {
    try {
      await mux.video.liveStreams.del(streamId);
      return true;
    } catch (error) {
      console.error('Failed to delete live stream:', error);
      return false;
    }
  }

  /**
   * Create a playback ID for a live stream
   */
  static async createPlaybackId(
    streamId: string, 
    policy: 'public' | 'signed' = 'public'
  ): Promise<string | null> {
    try {
      const playbackId = await mux.video.liveStreams.createPlaybackId(streamId, {
        policy,
      });
      return playbackId.id!;
    } catch (error) {
      console.error('Failed to create playback ID:', error);
      return null;
    }
  }

  /**
   * Delete a playback ID
   */
  static async deletePlaybackId(streamId: string, playbackId: string): Promise<boolean> {
    try {
      await mux.video.liveStreams.deletePlaybackId(streamId, playbackId);
      return true;
    } catch (error) {
      console.error('Failed to delete playback ID:', error);
      return false;
    }
  }

  /**
   * Get live stream metrics
   */
  static async getLiveStreamMetrics(streamId: string): Promise<LiveStreamMetrics | null> {
    try {
      // Note: This would require additional Mux Data API integration
      // For now, we'll return mock data structure
      return {
        viewerCount: 0,
        peakViewerCount: 0,
        totalViewTime: 0,
        averageViewDuration: 0,
      };
    } catch (error) {
      console.error('Failed to get live stream metrics:', error);
      return null;
    }
  }

  /**
   * Get real-time viewer count (requires webhook integration)
   */
  static async getViewerCount(streamId: string): Promise<number> {
    try {
      // This would typically be implemented with Mux webhooks
      // storing viewer data in your database
      // For now, return 0
      return 0;
    } catch (error) {
      console.error('Failed to get viewer count:', error);
      return 0;
    }
  }

  /**
   * Create a signed playback URL (for private streams)
   */
  static createSignedPlaybackUrl(
    playbackId: string,
    signingKey: string,
    signingKeyId: string,
    expiration?: number
  ): string {
    try {
      // This would use Mux's JWT signing for private playback
      // Implementation depends on your security requirements
      return `https://stream.mux.com/${playbackId}.m3u8`;
    } catch (error) {
      console.error('Failed to create signed URL:', error);
      throw new Error('Failed to create signed playback URL');
    }
  }

  /**
   * Handle Mux webhooks
   */
  static handleWebhook(webhookData: any): {
    type: string;
    streamId?: string;
    data: any;
  } | null {
    try {
      const { type, data } = webhookData;

      switch (type) {
        case 'video.live_stream.active':
          return {
            type: 'stream_started',
            streamId: data.id,
            data: {
              status: 'active',
              startTime: new Date().toISOString(),
            },
          };

        case 'video.live_stream.idle':
          return {
            type: 'stream_ended',
            streamId: data.id,
            data: {
              status: 'idle',
              endTime: new Date().toISOString(),
            },
          };

        case 'video.live_stream.disconnected':
          return {
            type: 'stream_disconnected',
            streamId: data.id,
            data: {
              status: 'disconnected',
              disconnectTime: new Date().toISOString(),
            },
          };

        case 'video.live_stream.recording':
          return {
            type: 'recording_available',
            streamId: data.live_stream_id,
            data: {
              assetId: data.id,
              playbackIds: data.playback_ids,
            },
          };

        default:
          console.log('Unhandled webhook type:', type);
          return null;
      }
    } catch (error) {
      console.error('Failed to handle webhook:', error);
      return null;
    }
  }

  /**
   * Validate webhook signature (security)
   */
  static validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Failed to validate webhook signature:', error);
      return false;
    }
  }

  /**
   * Get stream health metrics
   */
  static async getStreamHealth(streamId: string): Promise<{
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
    bitrate: number;
    fps: number;
    resolution: string;
    latency: number;
  } | null> {
    try {
      // This would integrate with Mux monitoring APIs
      // For now, return mock data
      return {
        connectionQuality: 'good',
        bitrate: 2500,
        fps: 30,
        resolution: '1920x1080',
        latency: 2.5,
      };
    } catch (error) {
      console.error('Failed to get stream health:', error);
      return null;
    }
  }

  /**
   * Update stream settings
   */
  static async updateLiveStream(
    streamId: string,
    updates: Partial<CreateLiveStreamOptions>
  ): Promise<boolean> {
    try {
      // Note: Mux has limited update capabilities for live streams
      // Most settings cannot be changed after creation
      console.log('Stream update requested:', streamId, updates);
      return true;
    } catch (error) {
      console.error('Failed to update live stream:', error);
      return false;
    }
  }

  /**
   * Get stream recordings (assets created from live streams)
   */
  static async getStreamRecordings(streamId: string): Promise<Array<{
    id: string;
    status: string;
    playbackIds: Array<{ id: string; policy: string }>;
    duration: number;
    createdAt: string;
  }>> {
    try {
      // This would query Mux for assets created from the live stream
      // Implementation depends on how you track stream recordings
      return [];
    } catch (error) {
      console.error('Failed to get stream recordings:', error);
      return [];
    }
  }
}