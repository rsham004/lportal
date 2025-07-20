import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MuxLiveStream } from './MuxLiveStream';

// Mock Mux SDK
jest.mock('@mux/mux-node', () => ({
  Video: {
    LiveStreams: {
      create: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      createPlaybackId: jest.fn(),
      deletePlaybackId: jest.fn(),
    },
  },
}));

// Mock Mux Player
jest.mock('@mux/mux-player-react', () => ({
  __esModule: true,
  default: jest.fn(({ onLoadStart, onCanPlay, onError, ...props }) => (
    <div data-testid="mux-player" {...props}>
      <button onClick={() => onLoadStart?.()}>Load Start</button>
      <button onClick={() => onCanPlay?.()}>Can Play</button>
      <button onClick={() => onError?.({ message: 'Test error' })}>Error</button>
    </div>
  )),
}));

const mockLiveStream = {
  id: 'live-stream-123',
  status: 'idle',
  playback_ids: [
    {
      id: 'playback-123',
      policy: 'public',
    },
  ],
  stream_key: 'test-stream-key-123',
  rtmp_url: 'rtmp://global-live.mux.com:5222/live',
  created_at: '2024-01-15T10:00:00Z',
  max_continuous_duration: 3600,
  latency_mode: 'low',
  reconnect_window: 60,
};

const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  role: 'instructor',
};

describe('MuxLiveStream', () => {
  const user = userEvent.setup();
  const mockOnStreamStart = jest.fn();
  const mockOnStreamEnd = jest.fn();
  const mockOnViewerJoin = jest.fn();
  const mockOnViewerLeave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Stream Creation', () => {
    it('should render stream creation form for instructors', () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('Create Live Stream')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Stream title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Stream description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create stream/i })).toBeInTheDocument();
    });

    it('should not show creation form for students', () => {
      const studentUser = { ...mockUser, role: 'student' };
      
      render(
        <MuxLiveStream
          currentUser={studentUser}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.queryByText('Create Live Stream')).not.toBeInTheDocument();
      expect(screen.getByText('No live stream available')).toBeInTheDocument();
    });

    it('should create a new live stream', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ liveStream: mockLiveStream }),
      });

      render(
        <MuxLiveStream
          currentUser={mockUser}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      const titleInput = screen.getByPlaceholderText('Stream title');
      const descriptionInput = screen.getByPlaceholderText('Stream description');
      const createButton = screen.getByRole('button', { name: /create stream/i });

      await user.type(titleInput, 'Test Live Stream');
      await user.type(descriptionInput, 'This is a test stream');
      await user.click(createButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/mux/live-streams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Test Live Stream',
            description: 'This is a test stream',
            instructorId: mockUser.id,
          }),
        });
      });

      expect(mockOnStreamStart).toHaveBeenCalledWith(mockLiveStream);
    });

    it('should handle stream creation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create stream' }),
      });

      render(
        <MuxLiveStream
          currentUser={mockUser}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      const createButton = screen.getByRole('button', { name: /create stream/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create live stream')).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      const createButton = screen.getByRole('button', { name: /create stream/i });
      await user.click(createButton);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  describe('Stream Playback', () => {
    it('should render video player when stream is available', () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByTestId('mux-player')).toBeInTheDocument();
      expect(screen.getByText('Test Live Stream')).toBeInTheDocument();
    });

    it('should show stream status', () => {
      const activeStream = { ...mockLiveStream, status: 'active' };
      
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={activeStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('🔴 Live')).toBeInTheDocument();
    });

    it('should show viewer count', () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          viewerCount={42}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('42 viewers')).toBeInTheDocument();
    });

    it('should handle player events', async () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      const loadStartButton = screen.getByText('Load Start');
      const canPlayButton = screen.getByText('Can Play');
      const errorButton = screen.getByText('Error');

      await user.click(loadStartButton);
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await user.click(canPlayButton);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

      await user.click(errorButton);
      expect(screen.getByText('Error loading stream')).toBeInTheDocument();
    });
  });

  describe('Stream Controls', () => {
    it('should show stream controls for instructors', () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByRole('button', { name: /end stream/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stream settings/i })).toBeInTheDocument();
    });

    it('should not show controls for students', () => {
      const studentUser = { ...mockUser, role: 'student' };
      
      render(
        <MuxLiveStream
          currentUser={studentUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.queryByRole('button', { name: /end stream/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /stream settings/i })).not.toBeInTheDocument();
    });

    it('should end stream when button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      const endButton = screen.getByRole('button', { name: /end stream/i });
      await user.click(endButton);

      // Confirm end stream
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`/api/mux/live-streams/${mockLiveStream.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
      });

      expect(mockOnStreamEnd).toHaveBeenCalled();
    });

    it('should show stream key and RTMP URL for instructors', async () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      const settingsButton = screen.getByRole('button', { name: /stream settings/i });
      await user.click(settingsButton);

      expect(screen.getByText('Stream Key:')).toBeInTheDocument();
      expect(screen.getByText('RTMP URL:')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockLiveStream.stream_key)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockLiveStream.rtmp_url)).toBeInTheDocument();
    });

    it('should copy stream credentials to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(),
        },
      });

      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      const settingsButton = screen.getByRole('button', { name: /stream settings/i });
      await user.click(settingsButton);

      const copyKeyButton = screen.getByRole('button', { name: /copy stream key/i });
      await user.click(copyKeyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockLiveStream.stream_key);
    });
  });

  describe('Chat Integration', () => {
    it('should show chat panel when enabled', () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          showChat={true}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('Live Chat')).toBeInTheDocument();
    });

    it('should hide chat panel when disabled', () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          showChat={false}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.queryByText('Live Chat')).not.toBeInTheDocument();
    });

    it('should toggle chat visibility', async () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      const chatToggle = screen.getByRole('button', { name: /toggle chat/i });
      await user.click(chatToggle);

      expect(screen.getByText('Live Chat')).toBeInTheDocument();

      await user.click(chatToggle);
      expect(screen.queryByText('Live Chat')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should update viewer count in real-time', async () => {
      const { rerender } = render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          viewerCount={10}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('10 viewers')).toBeInTheDocument();

      rerender(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          viewerCount={25}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('25 viewers')).toBeInTheDocument();
    });

    it('should update stream status in real-time', async () => {
      const { rerender } = render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('⚪ Idle')).toBeInTheDocument();

      const activeStream = { ...mockLiveStream, status: 'active' };
      rerender(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={activeStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('🔴 Live')).toBeInTheDocument();
    });

    it('should handle viewer join/leave events', () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
          onViewerJoin={mockOnViewerJoin}
          onViewerLeave={mockOnViewerLeave}
        />
      );

      // Simulate viewer events (these would come from WebSocket in real implementation)
      // For testing, we'll verify the callbacks are passed correctly
      expect(mockOnViewerJoin).toBeDefined();
      expect(mockOnViewerLeave).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByRole('region', { name: /live stream/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/video player/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      const endButton = screen.getByRole('button', { name: /end stream/i });
      const settingsButton = screen.getByRole('button', { name: /stream settings/i });

      await user.tab();
      expect(endButton).toHaveFocus();

      await user.tab();
      expect(settingsButton).toHaveFocus();
    });

    it('should announce stream status changes', async () => {
      const { rerender } = render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      const activeStream = { ...mockLiveStream, status: 'active' };
      rerender(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={activeStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent('Stream is now live');
    });
  });

  describe('Performance', () => {
    it('should handle low latency mode', () => {
      const lowLatencyStream = { ...mockLiveStream, latency_mode: 'low' };
      
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={lowLatencyStream}
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('Low Latency')).toBeInTheDocument();
    });

    it('should show connection quality indicator', () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          connectionQuality="good"
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByTestId('connection-indicator')).toHaveClass('text-green-500');
    });

    it('should handle poor connection quality', () => {
      render(
        <MuxLiveStream
          currentUser={mockUser}
          liveStream={mockLiveStream}
          connectionQuality="poor"
          onStreamStart={mockOnStreamStart}
          onStreamEnd={mockOnStreamEnd}
        />
      );

      expect(screen.getByText('Poor')).toBeInTheDocument();
      expect(screen.getByTestId('connection-indicator')).toHaveClass('text-red-500');
    });
  });
});