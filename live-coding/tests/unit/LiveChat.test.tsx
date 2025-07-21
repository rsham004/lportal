import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LiveChat } from './LiveChat';
import { ChatProvider } from './ChatProvider';

// Mock the GraphQL subscription manager
jest.mock('../../lib/graphql/subscriptions', () => ({
  GraphQLSubscriptionManager: jest.fn().mockImplementation(() => ({
    subscribe: jest.fn(),
    publish: jest.fn(),
    unsubscribe: jest.fn(),
  })),
}));

// Mock user context
const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
  role: 'student',
};

const mockChatContext = {
  messages: [
    {
      id: 'msg-1',
      content: 'Hello everyone!',
      author: mockUser,
      roomId: 'room-general',
      createdAt: '2024-01-15T10:00:00Z',
      type: 'text' as const,
    },
    {
      id: 'msg-2',
      content: 'How is everyone doing?',
      author: {
        id: 'user-456',
        name: 'Jane Smith',
        avatar: 'https://example.com/avatar2.jpg',
        role: 'instructor',
      },
      roomId: 'room-general',
      createdAt: '2024-01-15T10:05:00Z',
      type: 'text' as const,
    },
  ],
  sendMessage: jest.fn(),
  editMessage: jest.fn(),
  deleteMessage: jest.fn(),
  isConnected: true,
  isTyping: false,
  typingUsers: [],
  onlineUsers: [mockUser],
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ChatProvider value={mockChatContext}>
      {component}
    </ChatProvider>
  );
};

describe('LiveChat', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Display', () => {
    it('should render chat messages correctly', () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      expect(screen.getByText('How is everyone doing?')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should display message timestamps', () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      expect(screen.getByText('10:05 AM')).toBeInTheDocument();
    });

    it('should show user avatars', () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      const avatars = screen.getAllByRole('img');
      expect(avatars).toHaveLength(2);
      expect(avatars[0]).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(avatars[1]).toHaveAttribute('src', 'https://example.com/avatar2.jpg');
    });

    it('should group consecutive messages from same user', () => {
      const messagesWithGrouping = [
        ...mockChatContext.messages,
        {
          id: 'msg-3',
          content: 'Another message from John',
          author: mockUser,
          roomId: 'room-general',
          createdAt: '2024-01-15T10:01:00Z',
          type: 'text' as const,
        },
      ];

      const contextWithGrouping = {
        ...mockChatContext,
        messages: messagesWithGrouping,
      };

      render(
        <ChatProvider value={contextWithGrouping}>
          <LiveChat roomId="room-general" />
        </ChatProvider>
      );

      // Should only show John's name once for grouped messages
      const johnNameElements = screen.getAllByText('John Doe');
      expect(johnNameElements).toHaveLength(1);
    });
  });

  describe('Message Input', () => {
    it('should render message input field', () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      const input = screen.getByPlaceholderText('Type a message...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should send message when Enter is pressed', async () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'New test message');
      await user.keyboard('{Enter}');

      expect(mockChatContext.sendMessage).toHaveBeenCalledWith({
        content: 'New test message',
        roomId: 'room-general',
        type: 'text',
      });
    });

    it('should send message when send button is clicked', async () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Button click message');
      await user.click(sendButton);

      expect(mockChatContext.sendMessage).toHaveBeenCalledWith({
        content: 'Button click message',
        roomId: 'room-general',
        type: 'text',
      });
    });

    it('should not send empty messages', async () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.keyboard('{Enter}');

      expect(mockChatContext.sendMessage).not.toHaveBeenCalled();
    });

    it('should clear input after sending message', async () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');

      expect(input.value).toBe('');
    });
  });

  describe('Real-time Features', () => {
    it('should show typing indicators', () => {
      const contextWithTyping = {
        ...mockChatContext,
        typingUsers: [{ id: 'user-456', name: 'Jane Smith' }],
      };

      render(
        <ChatProvider value={contextWithTyping}>
          <LiveChat roomId="room-general" />
        </ChatProvider>
      );

      expect(screen.getByText('Jane Smith is typing...')).toBeInTheDocument();
    });

    it('should show multiple users typing', () => {
      const contextWithMultipleTyping = {
        ...mockChatContext,
        typingUsers: [
          { id: 'user-456', name: 'Jane Smith' },
          { id: 'user-789', name: 'Bob Johnson' },
        ],
      };

      render(
        <ChatProvider value={contextWithMultipleTyping}>
          <LiveChat roomId="room-general" />
        </ChatProvider>
      );

      expect(screen.getByText('Jane Smith, Bob Johnson are typing...')).toBeInTheDocument();
    });

    it('should show online users count', () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      expect(screen.getByText('1 online')).toBeInTheDocument();
    });

    it('should show connection status', () => {
      const disconnectedContext = {
        ...mockChatContext,
        isConnected: false,
      };

      render(
        <ChatProvider value={disconnectedContext}>
          <LiveChat roomId="room-general" />
        </ChatProvider>
      );

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  describe('Message Actions', () => {
    it('should show edit option for own messages', () => {
      renderWithProvider(<LiveChat roomId="room-general" currentUserId="user-123" />);

      const ownMessage = screen.getByText('Hello everyone!').closest('[data-testid="message"]');
      fireEvent.mouseEnter(ownMessage!);

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('should not show edit option for other users messages', () => {
      renderWithProvider(<LiveChat roomId="room-general" currentUserId="user-123" />);

      const otherMessage = screen.getByText('How is everyone doing?').closest('[data-testid="message"]');
      fireEvent.mouseEnter(otherMessage!);

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    it('should edit message when edit button is clicked', async () => {
      renderWithProvider(<LiveChat roomId="room-general" currentUserId="user-123" />);

      const ownMessage = screen.getByText('Hello everyone!').closest('[data-testid="message"]');
      fireEvent.mouseEnter(ownMessage!);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const editInput = screen.getByDisplayValue('Hello everyone!');
      await user.clear(editInput);
      await user.type(editInput, 'Edited message');
      await user.keyboard('{Enter}');

      expect(mockChatContext.editMessage).toHaveBeenCalledWith('msg-1', 'Edited message');
    });

    it('should delete message when delete button is clicked', async () => {
      renderWithProvider(<LiveChat roomId="room-general" currentUserId="user-123" />);

      const ownMessage = screen.getByText('Hello everyone!').closest('[data-testid="message"]');
      fireEvent.mouseEnter(ownMessage!);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(mockChatContext.deleteMessage).toHaveBeenCalledWith('msg-1');
    });
  });

  describe('File Sharing', () => {
    it('should show file upload button', () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      expect(screen.getByRole('button', { name: /attach file/i })).toBeInTheDocument();
    });

    it('should handle file upload', async () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      const fileInput = screen.getByLabelText(/attach file/i);
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

      await user.upload(fileInput, file);

      expect(mockChatContext.sendMessage).toHaveBeenCalledWith({
        content: 'test.txt',
        roomId: 'room-general',
        type: 'file',
        fileData: expect.any(Object),
      });
    });

    it('should display file messages correctly', () => {
      const contextWithFile = {
        ...mockChatContext,
        messages: [
          ...mockChatContext.messages,
          {
            id: 'msg-file',
            content: 'document.pdf',
            author: mockUser,
            roomId: 'room-general',
            createdAt: '2024-01-15T10:10:00Z',
            type: 'file' as const,
            fileUrl: 'https://example.com/document.pdf',
          },
        ],
      };

      render(
        <ChatProvider value={contextWithFile}>
          <LiveChat roomId="room-general" />
        </ChatProvider>
      );

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /download/i })).toHaveAttribute(
        'href',
        'https://example.com/document.pdf'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      expect(screen.getByRole('log', { name: /chat messages/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      renderWithProvider(<LiveChat roomId="room-general" />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.tab();
      expect(input).toHaveFocus();

      await user.tab();
      expect(sendButton).toHaveFocus();
    });

    it('should announce new messages to screen readers', async () => {
      const { rerender } = renderWithProvider(<LiveChat roomId="room-general" />);

      const newContext = {
        ...mockChatContext,
        messages: [
          ...mockChatContext.messages,
          {
            id: 'msg-new',
            content: 'New message arrived',
            author: { id: 'user-456', name: 'Jane Smith', role: 'instructor' },
            roomId: 'room-general',
            createdAt: '2024-01-15T10:15:00Z',
            type: 'text' as const,
          },
        ],
      };

      render(
        <ChatProvider value={newContext}>
          <LiveChat roomId="room-general" />
        </ChatProvider>
      );

      expect(screen.getByRole('status')).toHaveTextContent('New message from Jane Smith');
    });
  });

  describe('Performance', () => {
    it('should virtualize long message lists', () => {
      const manyMessages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        author: mockUser,
        roomId: 'room-general',
        createdAt: new Date(Date.now() - i * 1000).toISOString(),
        type: 'text' as const,
      }));

      const contextWithManyMessages = {
        ...mockChatContext,
        messages: manyMessages,
      };

      render(
        <ChatProvider value={contextWithManyMessages}>
          <LiveChat roomId="room-general" />
        </ChatProvider>
      );

      // Should only render visible messages (virtualization)
      const renderedMessages = screen.getAllByTestId('message');
      expect(renderedMessages.length).toBeLessThan(100); // Should be much less than 1000
    });

    it('should debounce typing indicators', async () => {
      const mockSendTyping = jest.fn();
      const contextWithTyping = {
        ...mockChatContext,
        sendTypingIndicator: mockSendTyping,
      };

      render(
        <ChatProvider value={contextWithTyping}>
          <LiveChat roomId="room-general" />
        </ChatProvider>
      );

      const input = screen.getByPlaceholderText('Type a message...');
      
      // Type multiple characters quickly
      await user.type(input, 'hello');

      // Should debounce and only send typing indicator once
      await waitFor(() => {
        expect(mockSendTyping).toHaveBeenCalledTimes(1);
      });
    });
  });
});