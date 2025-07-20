'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ReplyIcon,
  EllipsisVerticalIcon,
  PinIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface ForumUser {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  reputation?: number;
}

interface ForumPost {
  id: string;
  title?: string;
  content: string;
  author: ForumUser;
  createdAt: string;
  updatedAt?: string;
  upvotes: number;
  downvotes: number;
  replies: ForumPost[];
  isPinned?: boolean;
  isLocked?: boolean;
  tags?: string[];
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
}

interface LiveForumProps {
  forumId: string;
  currentUser: ForumUser;
  posts: ForumPost[];
  onCreatePost: (data: { title?: string; content: string; tags?: string[] }) => Promise<void>;
  onReplyToPost: (postId: string, content: string) => Promise<void>;
  onVotePost: (postId: string, voteType: 'up' | 'down') => Promise<void>;
  onPinPost?: (postId: string) => Promise<void>;
  onLockPost?: (postId: string) => Promise<void>;
  onReportPost?: (postId: string, reason: string) => Promise<void>;
  className?: string;
  maxHeight?: string;
}

type SortOption = 'newest' | 'oldest' | 'most_upvoted' | 'most_replies';

export function LiveForum({
  forumId,
  currentUser,
  posts,
  onCreatePost,
  onReplyToPost,
  onVotePost,
  onPinPost,
  onLockPost,
  onReportPost,
  className = '',
  maxHeight = '600px',
}: LiveForumProps) {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [replyingToPost, setReplyingToPost] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const isModerator = currentUser.role === 'instructor' || currentUser.role === 'admin';

  // Sort and filter posts
  const sortedPosts = useMemo(() => {
    let filtered = posts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title?.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.name.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort posts
    const sorted = [...filtered].sort((a, b) => {
      // Pinned posts always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (b.isPinned && !a.isPinned) return 1;

      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most_upvoted':
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        case 'most_replies':
          return b.replies.length - a.replies.length;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [posts, searchQuery, sortBy]);

  // Create new post
  const handleCreatePost = useCallback(async () => {
    if (!newPostContent.trim()) return;

    try {
      const tags = newPostTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await onCreatePost({
        title: newPostTitle.trim() || undefined,
        content: newPostContent.trim(),
        tags: tags.length > 0 ? tags : undefined,
      });

      // Reset form
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostTags('');
      setShowCreatePost(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  }, [newPostTitle, newPostContent, newPostTags, onCreatePost]);

  // Reply to post
  const handleReplyToPost = useCallback(async (postId: string) => {
    if (!replyContent.trim()) return;

    try {
      await onReplyToPost(postId, replyContent.trim());
      setReplyingToPost(null);
      setReplyContent('');
    } catch (error) {
      console.error('Failed to reply to post:', error);
    }
  }, [replyContent, onReplyToPost]);

  // Vote on post
  const handleVotePost = useCallback(async (postId: string, voteType: 'up' | 'down') => {
    try {
      await onVotePost(postId, voteType);
    } catch (error) {
      console.error('Failed to vote on post:', error);
    }
  }, [onVotePost]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Calculate net score
  const getNetScore = (post: ForumPost) => {
    return post.upvotes - post.downvotes;
  };

  // Render post content
  const renderPost = (post: ForumPost, isReply = false) => (
    <div
      key={post.id}
      className={`border border-gray-200 rounded-lg p-4 space-y-3 ${
        isReply ? 'ml-8 mt-2 bg-gray-50' : 'bg-white'
      }`}
    >
      {/* Post Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={post.author.avatar || '/default-avatar.png'}
            alt={post.author.name}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900">
                {post.author.name}
              </p>
              {post.author.role === 'instructor' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Instructor
                </span>
              )}
              {post.author.reputation && (
                <span className="text-xs text-gray-500">
                  {post.author.reputation} rep
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {formatTimestamp(post.createdAt)}
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <span className="ml-1">(edited)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {post.isPinned && (
            <PinIcon className="h-4 w-4 text-yellow-500" title="Pinned" />
          )}
          {post.isLocked && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              Locked
            </span>
          )}
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <EllipsisVerticalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Post Title */}
      {post.title && !isReply && (
        <h4 className="text-lg font-semibold text-gray-900">
          {post.title}
        </h4>
      )}

      {/* Post Content */}
      <div className="prose prose-sm max-w-none">
        <p className="text-gray-900 whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Post Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Voting */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleVotePost(post.id, 'up')}
              disabled={post.hasUpvoted}
              className={`p-1 rounded ${
                post.hasUpvoted
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              } disabled:cursor-not-allowed`}
              aria-label="Upvote"
            >
              <HandThumbUpIcon className="h-4 w-4" />
            </button>
            <span className={`text-sm font-medium ${
              getNetScore(post) > 0 ? 'text-green-600' : 
              getNetScore(post) < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {getNetScore(post)}
            </span>
            <button
              onClick={() => handleVotePost(post.id, 'down')}
              disabled={post.hasDownvoted}
              className={`p-1 rounded ${
                post.hasDownvoted
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              } disabled:cursor-not-allowed`}
              aria-label="Downvote"
            >
              <HandThumbDownIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Reply */}
          {!post.isLocked && (
            <button
              onClick={() => setReplyingToPost(post.id)}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 text-sm"
            >
              <ReplyIcon className="h-4 w-4" />
              <span>Reply</span>
            </button>
          )}

          {/* Reply Count */}
          {post.replies.length > 0 && (
            <span className="text-sm text-gray-500">
              {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Moderator Actions */}
          {isModerator && (
            <>
              {onPinPost && (
                <button
                  onClick={() => onPinPost(post.id)}
                  className="text-xs text-gray-600 hover:text-yellow-600"
                  title={post.isPinned ? 'Unpin' : 'Pin'}
                >
                  Pin
                </button>
              )}
              {onLockPost && (
                <button
                  onClick={() => onLockPost(post.id)}
                  className="text-xs text-gray-600 hover:text-red-600"
                  title={post.isLocked ? 'Unlock' : 'Lock'}
                >
                  {post.isLocked ? 'Unlock' : 'Lock'}
                </button>
              )}
            </>
          )}

          {/* Report */}
          {onReportPost && post.author.id !== currentUser.id && (
            <button
              onClick={() => onReportPost(post.id, 'inappropriate')}
              className="text-xs text-gray-600 hover:text-red-600"
              title="Report"
            >
              <FlagIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Reply Input */}
      {replyingToPost === post.id && (
        <div className="mt-3 space-y-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex space-x-2">
            <button
              onClick={() => handleReplyToPost(post.id)}
              disabled={!replyContent.trim()}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Reply
            </button>
            <button
              onClick={() => {
                setReplyingToPost(null);
                setReplyContent('');
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Replies */}
      {post.replies.length > 0 && (
        <div className="space-y-2">
          {post.replies.map(reply => renderPost(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Discussion Forum</h3>
        <button
          onClick={() => setShowCreatePost(!showCreatePost)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Post
        </button>
      </div>

      {/* Search and Sort */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search discussions..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most_upvoted">Most Upvoted</option>
            <option value="most_replies">Most Replies</option>
          </select>
        </div>
      </div>

      {/* Create Post Form */}
      {showCreatePost && (
        <div className="p-4 border-b border-gray-200 space-y-3">
          <input
            type="text"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="Post title (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What would you like to discuss?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />

          <input
            type="text"
            value={newPostTags}
            onChange={(e) => setNewPostTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex space-x-2">
            <button
              onClick={handleCreatePost}
              disabled={!newPostContent.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create Post
            </button>
            <button
              onClick={() => {
                setShowCreatePost(false);
                setNewPostTitle('');
                setNewPostContent('');
                setNewPostTags('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div 
        className="flex-1 overflow-y-auto p-4"
        style={{ maxHeight }}
      >
        {sortedPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No discussions yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPosts.map(post => renderPost(post))}
          </div>
        )}
      </div>
    </div>
  );
}