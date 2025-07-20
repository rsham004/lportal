'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from './ChatProvider';
import { ChatMessage } from '../../lib/graphql/types';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface LiveChatProps {
  roomId: string;
  currentUserId?: string;
  className?: string;
  maxHeight?: string;
}

export function LiveChat({ 
  roomId, 
  currentUserId, 
  className = '',
  maxHeight = '400px' 
}: LiveChatProps) {
  const {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    isConnected,
    typingUsers,
    onlineUsers,
    sendTypingIndicator,
    stopTypingIndicator,
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newMessageAnnouncement, setNewMessageAnnouncement] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Announce new messages for screen readers
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.author.id !== currentUserId) {
        setNewMessageAnnouncement(`New message from ${latestMessage.author.name}`);
        // Clear announcement after 3 seconds
        setTimeout(() => setNewMessageAnnouncement(''), 3000);
      }
    }
  }, [messages, currentUserId]);

  // Handle message input changes with typing indicators
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Send typing indicator
    sendTypingIndicator();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIndicator();
    }, 1000);
  }, [sendTypingIndicator, stopTypingIndicator]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    const content = messageInput.trim();
    if (!content) return;

    try {
      await sendMessage({
        content,
        roomId,
        type: 'text',
      });
      setMessageInput('');
      stopTypingIndicator();
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast
    }
  }, [messageInput, roomId, sendMessage, stopTypingIndicator]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Start editing message
  const startEditing = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  }, []);

  // Save edited message
  const saveEdit = useCallback(async () => {
    if (!editingMessageId || !editingContent.trim()) return;

    try {
      await editMessage(editingMessageId, editingContent.trim());
      setEditingMessageId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Failed to edit message:', error);
      // TODO: Show error toast
    }
  }, [editingMessageId, editingContent, editMessage]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent('');
  }, []);

  // Delete message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      // TODO: Show error toast
    }
  }, [deleteMessage]);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Upload file to storage service
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);

      const uploadResponse = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const { fileUrl } = await uploadResponse.json();

      // Send file message
      await sendMessage({
        content: file.name,
        roomId,
        type: 'file',
        fileUrl,
      });

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      // TODO: Show error toast
    }
  }, [roomId, sendMessage]);

  // Group consecutive messages from the same user
  const groupedMessages = messages.reduce((groups: ChatMessage[][], message, index) => {
    const prevMessage = messages[index - 1];
    const shouldGroup = prevMessage && 
      prevMessage.author.id === message.author.id &&
      new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 5 * 60 * 1000; // 5 minutes

    if (shouldGroup) {
      groups[groups.length - 1].push(message);
    } else {
      groups.push([message]);
    }
    return groups;
  }, []);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render message content based on type
  const renderMessageContent = (message: ChatMessage) => {
    switch (message.type) {
      case 'file':
        return (
          <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
            <DocumentIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm">{message.content}</span>
            {message.fileUrl && (
              <a
                href={message.fileUrl}
                download
                className="text-blue-600 hover:text-blue-800 text-sm"
                aria-label="Download file"
              >
                Download
              </a>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="max-w-xs">
            <img
              src={message.fileUrl}
              alt={message.content}
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        );
      default:
        return (
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {message.content}
            {message.editedAt && (
              <span className="text-xs text-gray-500 ml-2">(edited)</span>
            )}
          </p>
        );
    }
  };

  return (
    <div className={`flex flex-col bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Chat</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-500">
            {isConnected ? `${onlineUsers.length} online` : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight }}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {groupedMessages.map((messageGroup, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            {/* Show author info for first message in group */}
            <div className="flex items-center space-x-2">
              <img
                src={messageGroup[0].author.avatar || '/default-avatar.png'}
                alt={messageGroup[0].author.name}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium text-gray-900">
                {messageGroup[0].author.name}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimestamp(messageGroup[0].createdAt)}
              </span>
            </div>

            {/* Messages in group */}
            {messageGroup.map((message) => (
              <div
                key={message.id}
                data-testid="message"
                className="ml-10 group relative"
                onMouseEnter={() => {
                  // Show message actions on hover
                }}
              >
                {editingMessageId === message.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit();
                        } else if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                    />
                    <button
                      onClick={saveEdit}
                      className="text-green-600 hover:text-green-800"
                      aria-label="Save edit"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-600 hover:text-gray-800"
                      aria-label="Cancel edit"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {renderMessageContent(message)}
                    </div>

                    {/* Message actions */}
                    {currentUserId === message.author.id && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => startEditing(message.id, message.content)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          aria-label="Edit message"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(message.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          aria-label="Delete message"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Delete confirmation */}
                {showDeleteConfirm === message.id && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">Delete this message?</p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        aria-label="Confirm delete"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                        aria-label="Cancel delete"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0].name} is typing...`
                : `${typingUsers.map(u => u.name).join(', ')} are typing...`
              }
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            ref={messageInputRef}
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Message input"
            disabled={!isConnected}
          />

          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Attach file"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            disabled={!isConnected}
            aria-label="Attach file"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !isConnected}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {newMessageAnnouncement}
      </div>
    </div>
  );
}