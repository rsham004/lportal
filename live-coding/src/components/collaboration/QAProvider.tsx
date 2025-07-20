'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { GraphQLSubscriptionManager } from '../../lib/graphql/subscriptions';
import { QASession } from '../../lib/graphql/types';

interface QAUser {
  id: string;
  name: string;
  role: string;
}

interface QAContextType {
  questions: QASession[];
  submitQuestion: (data: { question: string; sessionId: string }) => Promise<void>;
  answerQuestion: (questionId: string, answer: string) => Promise<void>;
  voteQuestion: (questionId: string) => Promise<void>;
  isConnected: boolean;
  currentUser: QAUser;
  searchQuestions?: (query: string) => void;
}

const QAContext = createContext<QAContextType | null>(null);

interface QAProviderProps {
  children: React.ReactNode;
  sessionId: string;
  currentUser: QAUser;
  value?: QAContextType; // For testing
}

export function QAProvider({ children, sessionId, currentUser, value }: QAProviderProps) {
  // If value is provided (for testing), use it directly
  if (value) {
    return <QAContext.Provider value={value}>{children}</QAContext.Provider>;
  }

  const [questions, setQuestions] = useState<QASession[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const subscriptionManager = useRef<GraphQLSubscriptionManager>();
  const websocket = useRef<WebSocket>();

  // Initialize WebSocket connection and subscriptions
  useEffect(() => {
    const initializeQA = async () => {
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

        // Subscribe to Q&A session updates
        await subscriptionManager.current.subscribe({
          id: `qa-session-${sessionId}`,
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
                  role
                }
                sessionId
                createdAt
                updatedAt
              }
            }
          `,
          variables: { sessionId },
          websocket: websocket.current,
          context: { userId: currentUser.id, role: currentUser.role },
        });

        // Load initial questions
        await loadInitialQuestions();

      } catch (error) {
        console.error('Failed to initialize Q&A:', error);
        setIsConnected(false);
      }
    };

    initializeQA();

    // Cleanup on unmount
    return () => {
      if (subscriptionManager.current) {
        subscriptionManager.current.unsubscribe(`qa-session-${sessionId}`);
      }
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [sessionId, currentUser.id, currentUser.role]);

  // Load initial questions from API
  const loadInitialQuestions = async () => {
    try {
      const response = await fetch(`/api/qa/sessions/${sessionId}/questions`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Failed to load initial questions:', error);
    }
  };

  // Submit a new question
  const submitQuestion = useCallback(async (data: { question: string; sessionId: string }) => {
    if (!isConnected || !subscriptionManager.current) {
      throw new Error('Q&A is not connected');
    }

    try {
      const response = await fetch('/api/qa/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          authorId: currentUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit question');
      }

      const newQuestion = await response.json();

      // Publish the question event
      await subscriptionManager.current.publish({
        type: 'qaSessionUpdated',
        data: newQuestion,
        filters: { sessionId },
      });

      // Add question to local state immediately for optimistic updates
      setQuestions(prev => [newQuestion, ...prev]);

    } catch (error) {
      console.error('Failed to submit question:', error);
      throw error;
    }
  }, [isConnected, currentUser.id, sessionId]);

  // Answer a question (instructor only)
  const answerQuestion = useCallback(async (questionId: string, answer: string) => {
    if (!isConnected || !subscriptionManager.current) {
      throw new Error('Q&A is not connected');
    }

    if (currentUser.role !== 'instructor' && currentUser.role !== 'admin') {
      throw new Error('Only instructors can answer questions');
    }

    try {
      const response = await fetch(`/api/qa/questions/${questionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer,
          instructorId: currentUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to answer question');
      }

      const updatedQuestion = await response.json();

      // Update local state
      setQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
            ? { ...q, answer, status: 'answered', updatedAt: updatedQuestion.updatedAt }
            : q
        )
      );

      // Publish update event
      await subscriptionManager.current.publish({
        type: 'qaSessionUpdated',
        data: updatedQuestion,
        filters: { sessionId },
      });

    } catch (error) {
      console.error('Failed to answer question:', error);
      throw error;
    }
  }, [isConnected, currentUser.id, currentUser.role, sessionId]);

  // Vote on a question
  const voteQuestion = useCallback(async (questionId: string) => {
    if (!isConnected || !subscriptionManager.current) {
      throw new Error('Q&A is not connected');
    }

    try {
      const response = await fetch(`/api/qa/questions/${questionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote on question');
      }

      const updatedQuestion = await response.json();

      // Update local state
      setQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
            ? { ...q, votes: updatedQuestion.votes, hasVoted: true }
            : q
        )
      );

      // Publish update event
      await subscriptionManager.current.publish({
        type: 'qaSessionUpdated',
        data: updatedQuestion,
        filters: { sessionId },
      });

    } catch (error) {
      console.error('Failed to vote on question:', error);
      throw error;
    }
  }, [isConnected, currentUser.id, sessionId]);

  // Search questions
  const searchQuestions = useCallback((query: string) => {
    // This would typically be implemented with a debounced API call
    // For now, we'll filter locally
    if (!query.trim()) {
      loadInitialQuestions();
      return;
    }

    setQuestions(prev => 
      prev.filter(q => 
        q.question.toLowerCase().includes(query.toLowerCase()) ||
        (q.answer && q.answer.toLowerCase().includes(query.toLowerCase()))
      )
    );
  }, []);

  // Handle incoming subscription events
  useEffect(() => {
    if (!websocket.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'data') {
          const { data } = message.payload;
          
          // Handle Q&A session updates
          if (data.qaSessionUpdated) {
            const updatedQuestion = data.qaSessionUpdated;
            
            setQuestions(prev => {
              // Check if question already exists
              const existingIndex = prev.findIndex(q => q.id === updatedQuestion.id);
              
              if (existingIndex >= 0) {
                // Update existing question
                const updated = [...prev];
                updated[existingIndex] = updatedQuestion;
                return updated;
              } else {
                // Add new question
                return [updatedQuestion, ...prev];
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
  }, []);

  const contextValue: QAContextType = {
    questions,
    submitQuestion,
    answerQuestion,
    voteQuestion,
    isConnected,
    currentUser,
    searchQuestions,
  };

  return (
    <QAContext.Provider value={contextValue}>
      {children}
    </QAContext.Provider>
  );
}

export function useQA() {
  const context = useContext(QAContext);
  if (!context) {
    throw new Error('useQA must be used within a QAProvider');
  }
  return context;
}