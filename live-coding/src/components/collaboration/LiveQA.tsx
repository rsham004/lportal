'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQA } from './QAProvider';
import { QASession } from '../../lib/graphql/types';
import { 
  HandRaisedIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface LiveQAProps {
  sessionId: string;
  className?: string;
  maxHeight?: string;
}

type QuestionStatus = 'all' | 'pending' | 'answered';

export function LiveQA({ 
  sessionId, 
  className = '',
  maxHeight = '600px' 
}: LiveQAProps) {
  const {
    questions,
    submitQuestion,
    answerQuestion,
    voteQuestion,
    isConnected,
    currentUser,
    searchQuestions,
  } = useQA();

  const [questionInput, setQuestionInput] = useState('');
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuestionStatus>('all');
  const [newQuestionAnnouncement, setNewQuestionAnnouncement] = useState('');

  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const maxQuestionLength = 500;
  const isInstructor = currentUser.role === 'instructor' || currentUser.role === 'admin';

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    let filtered = questions;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) ||
        (q.answer && q.answer.toLowerCase().includes(query)) ||
        q.author.name.toLowerCase().includes(query)
      );
    }

    // Sort by votes (descending) and then by creation time (newest first)
    return filtered.sort((a, b) => {
      // Pending questions first
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      
      // Then by votes
      if (a.votes !== b.votes) return b.votes - a.votes;
      
      // Finally by creation time
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [questions, statusFilter, searchQuery]);

  // Announce new questions for screen readers
  useEffect(() => {
    if (questions.length > 0) {
      const latestQuestion = questions[0];
      if (latestQuestion.author.id !== currentUser.id) {
        setNewQuestionAnnouncement(`New question from ${latestQuestion.author.name}`);
        setTimeout(() => setNewQuestionAnnouncement(''), 3000);
      }
    }
  }, [questions, currentUser.id]);

  // Handle search with debouncing
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuestions) {
        searchQuestions(query);
      }
    }, 300);
  }, [searchQuestions]);

  // Submit new question
  const handleSubmitQuestion = useCallback(async () => {
    const question = questionInput.trim();
    if (!question || question.length > maxQuestionLength) return;

    try {
      await submitQuestion({
        question,
        sessionId,
      });
      setQuestionInput('');
    } catch (error) {
      console.error('Failed to submit question:', error);
      // TODO: Show error toast
    }
  }, [questionInput, sessionId, submitQuestion]);

  // Handle Enter key press for question submission
  const handleQuestionKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitQuestion();
    }
  }, [handleSubmitQuestion]);

  // Start answering a question
  const startAnswering = useCallback((questionId: string) => {
    setAnsweringQuestionId(questionId);
    setAnswerInput('');
  }, []);

  // Submit answer
  const handleSubmitAnswer = useCallback(async () => {
    if (!answeringQuestionId || !answerInput.trim()) return;

    try {
      await answerQuestion(answeringQuestionId, answerInput.trim());
      setAnsweringQuestionId(null);
      setAnswerInput('');
    } catch (error) {
      console.error('Failed to submit answer:', error);
      // TODO: Show error toast
    }
  }, [answeringQuestionId, answerInput, answerQuestion]);

  // Cancel answering
  const cancelAnswering = useCallback(() => {
    setAnsweringQuestionId(null);
    setAnswerInput('');
  }, []);

  // Vote on question
  const handleVoteQuestion = useCallback(async (questionId: string) => {
    try {
      await voteQuestion(questionId);
    } catch (error) {
      console.error('Failed to vote on question:', error);
      // TODO: Show error toast
    }
  }, [voteQuestion]);

  // Check if user can vote on question
  const canVoteOnQuestion = useCallback((question: QASession) => {
    return question.author.id !== currentUser.id && !question.hasVoted;
  }, [currentUser.id]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'answered':
        return 'Answered';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`flex flex-col bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Q&A Session</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as QuestionStatus)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by status"
          >
            <option value="all">All Questions</option>
            <option value="pending">Pending</option>
            <option value="answered">Answered</option>
          </select>
        </div>
      </div>

      {/* Question Input */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-3">
          <textarea
            ref={questionInputRef}
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            onKeyPress={handleQuestionKeyPress}
            placeholder="Ask a question..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={maxQuestionLength}
            disabled={!isConnected}
            aria-label="Question input"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {questionInput.length}/{maxQuestionLength}
            </span>
            <button
              onClick={handleSubmitQuestion}
              disabled={!questionInput.trim() || questionInput.length > maxQuestionLength || !isConnected}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              aria-label="Submit question"
            >
              <HandRaisedIcon className="h-4 w-4" />
              <span>Ask Question</span>
            </button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div 
        className="flex-1 overflow-y-auto p-4"
        style={{ maxHeight }}
        role="region"
        aria-label="Q&A Session"
      >
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          <div className="space-y-4" role="list" aria-label="Questions">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                data-testid="qa-question"
                className="border border-gray-200 rounded-lg p-4 space-y-3"
                role="listitem"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={question.author.avatar || '/default-avatar.png'}
                      alt={question.author.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {question.author.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(question.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(question.status)}
                    <span className="text-sm text-gray-600">
                      {getStatusText(question.status)}
                    </span>
                  </div>
                </div>

                {/* Question Content */}
                <div className="ml-11">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {question.question}
                  </p>
                </div>

                {/* Answer */}
                {question.answer && (
                  <div className="ml-11 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-sm font-medium text-blue-900 mb-1">Answer:</p>
                    <p className="text-blue-800 whitespace-pre-wrap">
                      {question.answer}
                    </p>
                  </div>
                )}

                {/* Answer Input (for instructors) */}
                {answeringQuestionId === question.id && (
                  <div className="ml-11 space-y-2">
                    <textarea
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Type your answer..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!answerInput.trim()}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        aria-label="Submit answer"
                      >
                        Submit Answer
                      </button>
                      <button
                        onClick={cancelAnswering}
                        className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                        aria-label="Cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="ml-11 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Vote Button */}
                    <button
                      onClick={() => handleVoteQuestion(question.id)}
                      disabled={!canVoteOnQuestion(question) || !isConnected}
                      className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                        question.hasVoted
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      aria-label="Vote for question"
                    >
                      <HandRaisedIcon className="h-4 w-4" />
                      <span>{question.votes}</span>
                    </button>
                  </div>

                  {/* Answer Button (for instructors) */}
                  {isInstructor && question.status === 'pending' && (
                    <button
                      onClick={() => startAnswering(question.id)}
                      disabled={!isConnected}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      aria-label="Answer question"
                    >
                      Answer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {newQuestionAnnouncement}
      </div>
    </div>
  );
}