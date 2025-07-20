/**
 * Mux Video Service
 * 
 * Service for integrating with Mux video processing and delivery platform.
 * Handles video upload, processing, streaming, and analytics.
 */

import Mux from '@mux/mux-node'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface MuxAsset {
  id: string
  status: 'waiting' | 'preparing' | 'ready' | 'errored'
  playback_ids: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  duration?: number
  aspect_ratio?: string
  created_at: string
  max_stored_resolution?: string
  max_stored_frame_rate?: number
  mp4_support?: 'none' | 'capped-1080p' | 'standard'
}

export interface MuxUploadUrl {
  id: string
  url: string
  timeout: number
  status: 'waiting' | 'asset_created' | 'errored' | 'cancelled' | 'timed_out'
  new_asset_settings: {
    playback_policy: Array<'public' | 'signed'>
    mp4_support?: 'none' | 'capped-1080p' | 'standard'
  }
}

export interface MuxPlaybackId {
  id: string
  policy: 'public' | 'signed'
}

export interface VideoUploadProgress {
  uploadId: string
  progress: number
  status: 'uploading' | 'processing' | 'ready' | 'error'
  assetId?: string
  playbackId?: string
  error?: string
}

export interface VideoMetrics {
  views: number
  playtime_mins: number
  avg_view_duration_mins: number
  unique_viewers: number
  engagement_score: number
}

// ============================================================================
// MUX SERVICE CLASS
// ============================================================================

export class MuxService {
  private static mux: typeof Mux | null = null

  /**
   * Initialize Mux client
   */
  private static getMuxClient() {
    if (!this.mux) {
      const tokenId = process.env.MUX_TOKEN_ID
      const tokenSecret = process.env.MUX_TOKEN_SECRET

      if (!tokenId || !tokenSecret) {
        throw new Error('Mux credentials not configured')
      }

      this.mux = new Mux(tokenId, tokenSecret)
    }
    return this.mux
  }

  // ============================================================================
  // UPLOAD OPERATIONS
  // ============================================================================

  /**
   * Create a direct upload URL for video files
   */
  static async createUploadUrl(options?: {
    mp4Support?: 'none' | 'capped-1080p' | 'standard'
    playbackPolicy?: Array<'public' | 'signed'>
    corsOrigin?: string
  }): Promise<MuxUploadUrl> {
    try {
      const mux = this.getMuxClient()
      
      const upload = await mux.Video.Uploads.create({
        new_asset_settings: {
          playback_policy: options?.playbackPolicy || ['public'],
          mp4_support: options?.mp4Support || 'standard'
        },
        cors_origin: options?.corsOrigin || '*'
      })

      return {
        id: upload.id!,
        url: upload.url!,
        timeout: upload.timeout!,
        status: upload.status as any,
        new_asset_settings: upload.new_asset_settings as any
      }
    } catch (error) {
      console.error('Failed to create Mux upload URL:', error)
      throw new Error('Failed to create video upload URL')
    }
  }

  /**
   * Get upload status
   */
  static async getUploadStatus(uploadId: string): Promise<MuxUploadUrl> {
    try {
      const mux = this.getMuxClient()
      const upload = await mux.Video.Uploads.get(uploadId)

      return {
        id: upload.id!,
        url: upload.url!,
        timeout: upload.timeout!,
        status: upload.status as any,
        new_asset_settings: upload.new_asset_settings as any
      }
    } catch (error) {
      console.error('Failed to get upload status:', error)
      throw new Error('Failed to get upload status')
    }
  }

  /**
   * Cancel an upload
   */
  static async cancelUpload(uploadId: string): Promise<void> {
    try {
      const mux = this.getMuxClient()
      await mux.Video.Uploads.cancel(uploadId)
    } catch (error) {
      console.error('Failed to cancel upload:', error)
      throw new Error('Failed to cancel upload')
    }
  }

  // ============================================================================
  // ASSET OPERATIONS
  // ============================================================================

  /**
   * Create asset from URL
   */
  static async createAssetFromUrl(
    url: string,
    options?: {
      mp4Support?: 'none' | 'capped-1080p' | 'standard'
      playbackPolicy?: Array<'public' | 'signed'>
      passthrough?: string
    }
  ): Promise<MuxAsset> {
    try {
      const mux = this.getMuxClient()
      
      const asset = await mux.Video.Assets.create({
        input: url,
        playback_policy: options?.playbackPolicy || ['public'],
        mp4_support: options?.mp4Support || 'standard',
        passthrough: options?.passthrough
      })

      return this.formatAsset(asset)
    } catch (error) {
      console.error('Failed to create Mux asset:', error)
      throw new Error('Failed to create video asset')
    }
  }

  /**
   * Get asset by ID
   */
  static async getAsset(assetId: string): Promise<MuxAsset> {
    try {
      const mux = this.getMuxClient()
      const asset = await mux.Video.Assets.get(assetId)
      return this.formatAsset(asset)
    } catch (error) {
      console.error('Failed to get Mux asset:', error)
      throw new Error('Failed to get video asset')
    }
  }

  /**
   * Delete asset
   */
  static async deleteAsset(assetId: string): Promise<void> {
    try {
      const mux = this.getMuxClient()
      await mux.Video.Assets.del(assetId)
    } catch (error) {
      console.error('Failed to delete Mux asset:', error)
      throw new Error('Failed to delete video asset')
    }
  }

  /**
   * Update asset
   */
  static async updateAsset(
    assetId: string, 
    updates: {
      mp4Support?: 'none' | 'capped-1080p' | 'standard'
      passthrough?: string
    }
  ): Promise<MuxAsset> {
    try {
      const mux = this.getMuxClient()
      const asset = await mux.Video.Assets.update(assetId, {
        mp4_support: updates.mp4Support,
        passthrough: updates.passthrough
      })
      return this.formatAsset(asset)
    } catch (error) {
      console.error('Failed to update Mux asset:', error)
      throw new Error('Failed to update video asset')
    }
  }

  // ============================================================================
  // PLAYBACK OPERATIONS
  // ============================================================================

  /**
   * Create playback ID for asset
   */
  static async createPlaybackId(
    assetId: string, 
    policy: 'public' | 'signed' = 'public'
  ): Promise<MuxPlaybackId> {
    try {
      const mux = this.getMuxClient()
      const playbackId = await mux.Video.Assets.createPlaybackId(assetId, {
        policy
      })

      return {
        id: playbackId.id!,
        policy: playbackId.policy as 'public' | 'signed'
      }
    } catch (error) {
      console.error('Failed to create playback ID:', error)
      throw new Error('Failed to create playback ID')
    }
  }

  /**
   * Delete playback ID
   */
  static async deletePlaybackId(assetId: string, playbackId: string): Promise<void> {
    try {
      const mux = this.getMuxClient()
      await mux.Video.Assets.deletePlaybackId(assetId, playbackId)
    } catch (error) {
      console.error('Failed to delete playback ID:', error)
      throw new Error('Failed to delete playback ID')
    }
  }

  /**
   * Generate signed URL for private playback
   */
  static generateSignedUrl(
    playbackId: string,
    options?: {
      expiresIn?: number // seconds
      type?: 'video' | 'thumbnail' | 'gif'
    }
  ): string {
    try {
      const mux = this.getMuxClient()
      
      // Default to 1 hour expiration
      const expiresIn = options?.expiresIn || 3600
      const type = options?.type || 'video'
      
      return mux.JWT.sign(playbackId, {
        type,
        expiration: `${expiresIn}s`
      })
    } catch (error) {
      console.error('Failed to generate signed URL:', error)
      throw new Error('Failed to generate signed URL')
    }
  }

  // ============================================================================
  // THUMBNAIL OPERATIONS
  // ============================================================================

  /**
   * Generate thumbnail URL
   */
  static getThumbnailUrl(
    playbackId: string,
    options?: {
      time?: number // seconds
      width?: number
      height?: number
      fit_mode?: 'preserve' | 'stretch' | 'crop'
    }
  ): string {
    const params = new URLSearchParams()
    
    if (options?.time) params.append('time', options.time.toString())
    if (options?.width) params.append('width', options.width.toString())
    if (options?.height) params.append('height', options.height.toString())
    if (options?.fit_mode) params.append('fit_mode', options.fit_mode)

    const queryString = params.toString()
    return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
  }

  /**
   * Generate animated GIF URL
   */
  static getAnimatedGifUrl(
    playbackId: string,
    options?: {
      start?: number // seconds
      end?: number // seconds
      width?: number
      height?: number
      fps?: number
    }
  ): string {
    const params = new URLSearchParams()
    
    if (options?.start) params.append('start', options.start.toString())
    if (options?.end) params.append('end', options.end.toString())
    if (options?.width) params.append('width', options.width.toString())
    if (options?.height) params.append('height', options.height.toString())
    if (options?.fps) params.append('fps', options.fps.toString())

    const queryString = params.toString()
    return `https://image.mux.com/${playbackId}/animated.gif${queryString ? `?${queryString}` : ''}`
  }

  // ============================================================================
  // ANALYTICS OPERATIONS
  // ============================================================================

  /**
   * Get video metrics
   */
  static async getVideoMetrics(
    assetId: string,
    timeframe?: '24:hours' | '7:days' | '30:days'
  ): Promise<VideoMetrics> {
    try {
      const mux = this.getMuxClient()
      
      // Get basic metrics
      const metrics = await mux.Data.Metrics.breakdown('asset_id', {
        filters: [`asset_id:${assetId}`],
        timeframe: timeframe || '7:days',
        measurement: 'video_startup_time'
      })

      // This is a simplified version - real implementation would aggregate multiple metrics
      return {
        views: metrics.data?.length || 0,
        playtime_mins: 0, // Would calculate from actual data
        avg_view_duration_mins: 0, // Would calculate from actual data
        unique_viewers: 0, // Would calculate from actual data
        engagement_score: 0 // Would calculate from actual data
      }
    } catch (error) {
      console.error('Failed to get video metrics:', error)
      // Return default metrics on error
      return {
        views: 0,
        playtime_mins: 0,
        avg_view_duration_mins: 0,
        unique_viewers: 0,
        engagement_score: 0
      }
    }
  }

  // ============================================================================
  // WEBHOOK HANDLING
  // ============================================================================

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const mux = this.getMuxClient()
      return mux.Webhooks.verifyHeader(rawBody, signature, secret)
    } catch (error) {
      console.error('Failed to verify webhook signature:', error)
      return false
    }
  }

  /**
   * Handle webhook event
   */
  static async handleWebhookEvent(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'video.asset.ready':
          await this.handleAssetReady(event.data)
          break
        case 'video.asset.errored':
          await this.handleAssetError(event.data)
          break
        case 'video.upload.asset_created':
          await this.handleUploadAssetCreated(event.data)
          break
        default:
          console.log('Unhandled webhook event type:', event.type)
      }
    } catch (error) {
      console.error('Failed to handle webhook event:', error)
      throw error
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Format Mux asset response
   */
  private static formatAsset(asset: any): MuxAsset {
    return {
      id: asset.id,
      status: asset.status,
      playback_ids: asset.playback_ids || [],
      duration: asset.duration,
      aspect_ratio: asset.aspect_ratio,
      created_at: asset.created_at,
      max_stored_resolution: asset.max_stored_resolution,
      max_stored_frame_rate: asset.max_stored_frame_rate,
      mp4_support: asset.mp4_support
    }
  }

  /**
   * Handle asset ready webhook
   */
  private static async handleAssetReady(assetData: any): Promise<void> {
    // Update lesson in database with asset information
    console.log('Asset ready:', assetData.id)
    // Implementation would update the lesson record with playback_id, duration, etc.
  }

  /**
   * Handle asset error webhook
   */
  private static async handleAssetError(assetData: any): Promise<void> {
    // Handle asset processing error
    console.error('Asset error:', assetData.id, assetData.errors)
    // Implementation would update lesson status and notify user
  }

  /**
   * Handle upload asset created webhook
   */
  private static async handleUploadAssetCreated(uploadData: any): Promise<void> {
    // Link upload to asset
    console.log('Upload asset created:', uploadData.id)
    // Implementation would update lesson with asset_id
  }

  /**
   * Get streaming URL for playback
   */
  static getStreamingUrl(playbackId: string, signed = false): string {
    if (signed) {
      // For signed URLs, you'd generate a JWT token
      return `https://stream.mux.com/${playbackId}.m3u8?token=${this.generateSignedUrl(playbackId)}`
    }
    return `https://stream.mux.com/${playbackId}.m3u8`
  }

  /**
   * Get MP4 download URL (if MP4 support is enabled)
   */
  static getMp4Url(playbackId: string, quality: 'low' | 'medium' | 'high' = 'medium'): string {
    return `https://stream.mux.com/${playbackId}/${quality}.mp4`
  }
}

export default MuxService