'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { GraphQLSubscriptionManager } from '../../lib/graphql/subscriptions';
import { ChatMessage, UserPresence } from '../../lib/graphql/types';

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (message: Omit<ChatMessage, 'id' | 'author' | 'createdAt'>) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  isConnected: boolean;
  isTyping: boolean;
  typingUsers: ChatUser[];
  onlineUsers: ChatUser[];
  sendTypingIndicator: () => void;
  stopTypingIndicator: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
  children: React.ReactNode;
  roomId: string;
  currentUser: ChatUser;
  value?: ChatContextType; // For testing
}

export function ChatProvider({ children, roomId, currentUser, value }: ChatProviderProps) {
  // If value is provided (for testing), use it directly
  if (value) {
    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
  }

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<ChatUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const subscriptionManager = useRef<GraphQLSubscriptionManager>();
  const typingTimeout = useRef<NodeJS.Timeout>();
  const websocket = useRef<WebSocket>();

  // Initialize WebSocket connection and subscriptions
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Create WebSocket connection
        websocket.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql');
        
        websocket.current.onopen = () => {
          setIsConnected(true);
        };

        websocket.current.onclose = () => {
          setIsConnected(false);
        };

        websocket.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

        // Initialize subscription manager
        subscriptionManager.current = new GraphQLSubscriptionManager();

        // Subscribe to new messages
        await subscriptionManager.current.subscribe({
          id: `chat-messages-${roomId}`,
          query: `
            subscription MessageAdded($roomId: ID!) {
              messageAdded(roomId: $roomId) {
                id
                content
                author {
                  id
                  name
                  avatar
                  role
                }
                roomId
                createdAt
                editedAt
                type
                fileUrl
              }
            }
          `,
          variables: { roomId },
          websocket: websocket.current,
          context: { userId: currentUser.id, role: currentUser.role },
        });

        // Subscribe to typing indicators
        await subscriptionManager.current.subscribe({
          id: `typing-indicators-${roomId}`,
          query: `
            subscription TypingIndicator($roomId: ID!) {
              typingIndicator(roomId: $roomId) {
                userId
                userName
                isTyping
              }
            }
          `,
          variables: { roomId },
          websocket: websocket.current,
          context: { userId: currentUser.id, role: currentUser.role },
        });

        // Subscribe to user presence
        await subscriptionManager.current.subscribe({
          id: `user-presence-${roomId}`,
          query: `
            subscription UserPresenceUpdated($roomId: ID!) {
              userPresenceUpdated(roomId: $roomId) {
                userId
                userName
                status
                lastSeen
              }
            }
          `,
          variables: { roomId },
          websocket: websocket.current,
          context: { userId: currentUser.id, role: currentUser.role },
        });

        // Load initial messages
        await loadInitialMessages();

      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setIsConnected(false);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      if (subscriptionManager.current) {
        subscriptionManager.current.unsubscribe(`chat-messages-${roomId}`);
        subscriptionManager.current.unsubscribe(`typing-indicators-${roomId}`);
        subscriptionManager.current.unsubscribe(`user-presence-${roomId}`);
      }
      if (websocket.current) {
        websocket.current.close();
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [roomId, currentUser.id, currentUser.role]);

  // Load initial messages from API
  const loadInitialMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages?roomId=${roomId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load initial messages:', error);
    }
  };

  // Send a new message
  const sendMessage = useCallback(async (messageData: Omit<ChatMessage, 'id' | 'author' | 'createdAt'>) => {
    if (!isConnected || !subscriptionManager.current) {
      throw new Error('Chat is not connected');
    }

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...messageData,
          authorId: currentUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();

      // Publish the message event
      await subscriptionManager.current.publish({
        type: 'messageAdded',
        data: newMessage,
        filters: { roomId },
      });

      // Add message to local state immediately for optimistic updates
      setMessages(prev => [...prev, newMessage]);

    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [isConnected, currentUser.id, roomId]);

  // Edit an existing message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!isConnected) {
      throw new Error('Chat is not connected');
    }

    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newContent,
          userId: currentUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      const updatedMessage = await response.json();

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: newContent, editedAt: updatedMessage.editedAt }
            : msg
        )
      );

      // Publish update event
      if (subscriptionManager.current) {
        await subscriptionManager.current.publish({
          type: 'messageUpdated',
          data: updatedMessage,
          filters: { roomId },
        });
      }

    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  }, [isConnected, currentUser.id, roomId]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!isConnected) {
      throw new Error('Chat is not connected');
    }

    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      // Publish delete event
      if (subscriptionManager.current) {
        await subscriptionManager.current.publish({
          type: 'messageDeleted',
          data: { messageId },
          filters: { roomId },
        });
      }

    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }, [isConnected, currentUser.id, roomId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!isConnected || !subscriptionManager.current) return;

    setIsTyping(true);

    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Publish typing event
    subscriptionManager.current.publish({
      type: 'typingIndicator',
      data: {
        userId: currentUser.id,
        userName: currentUser.name,
        isTyping: true,
      },
      filters: { roomId },
    });

    // Auto-stop typing after 3 seconds
    typingTimeout.current = setTimeout(() => {
      stopTypingIndicator();
    }, 3000);
  }, [isConnected, currentUser.id, currentUser.name, roomId]);

  // Stop typing indicator
  const stopTypingIndicator = useCallback(() => {
    if (!isConnected || !subscriptionManager.current) return;

    setIsTyping(false);

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Publish stop typing event
    subscriptionManager.current.publish({
      type: 'typingIndicator',
      data: {
        userId: currentUser.id,
        userName: currentUser.name,
        isTyping: false,
      },
      filters: { roomId },
    });
  }, [isConnected, currentUser.id, currentUser.name, roomId]);

  // Handle incoming subscription events
  useEffect(() => {
    if (!websocket.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'data') {
          const { data } = message.payload;
          
          // Handle new messages
          if (data.messageAdded) {
            const newMessage = data.messageAdded;
            // Only add if it's not from current user (avoid duplicates from optimistic updates)
            if (newMessage.author.id !== currentUser.id) {
              setMessages(prev => {
                // Check if message already exists
                if (prev.some(msg => msg.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
            }
          }
          
          // Handle typing indicators
          if (data.typingIndicator) {
            const { userId, userName, isTyping: userIsTyping } = data.typingIndicator;
            
            if (userId !== currentUser.id) {
              setTypingUsers(prev => {
                if (userIsTyping) {
                  // Add user to typing list if not already there
                  if (!prev.some(user => user.id === userId)) {
                    return [...prev, { id: userId, name: userName, role: 'user' }];
                  }
                  return prev;
                } else {
                  // Remove user from typing list
                  return prev.filter(user => user.id !== userId);
                }
              });
            }
          }
          
          // Handle presence updates
          if (data.userPresenceUpdated) {
            const { userId, userName, status } = data.userPresenceUpdated;
            
            setOnlineUsers(prev => {
              if (status === 'online') {
                if (!prev.some(user => user.id === userId)) {
                  return [...prev, { id: userId, name: userName, role: 'user' }];
                }
                return prev;
              } else {
                return prev.filter(user => user.id !== userId);
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    websocket.current.addEventListener('message', handleMessage);

    return () => {
      if (websocket.current) {
        websocket.current.removeEventListener('message', handleMessage);
      }
    };
  }, [currentUser.id]);

  const contextValue: ChatContextType = {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    isConnected,
    isTyping,
    typingUsers,
    onlineUsers,
    sendTypingIndicator,
    stopTypingIndicator,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}