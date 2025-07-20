'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { GraphQLSubscriptionManager } from '../../lib/graphql/subscriptions';

interface OverviewMetrics {
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  averageScore: number;
  totalAssessments: number;
  totalLessons: number;
  totalCourses: number;
  engagementScore: number;
}

interface EngagementData {
  dailyActiveUsers: Array<{
    date: string;
    users: number;
    newUsers: number;
    returningUsers: number;
  }>;
  sessionDuration: {
    average: number;
    median: number;
    distribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  };
  contentInteraction: {
    videos: { views: number; completions: number; averageWatchTime: number };
    quizzes: { attempts: number; completions: number; averageScore: number };
    assignments: { submissions: number; completions: number; averageGrade: number };
    discussions: { posts: number; replies: number; activeParticipants: number };
  };
  deviceUsage: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  timeOfDay: Array<{
    hour: number;
    activity: number;
  }>;
}

interface PerformanceData {
  assessmentScores: Array<{
    assessmentId: string;
    title: string;
    averageScore: number;
    medianScore: number;
    attempts: number;
    completions: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    timeSpent: number;
  }>;
  learningOutcomes: Array<{
    outcome: string;
    mastery: number;
    studentsAssessed: number;
    improvementRate: number;
  }>;
  progressTracking: {
    onTrack: number;
    atRisk: number;
    needsSupport: number;
    excelling: number;
  };
  skillDevelopment: Array<{
    skill: string;
    beginnerLevel: number;
    intermediateLevel: number;
    advancedLevel: number;
    expertLevel: number;
  }>;
  retentionRates: {
    weekly: number;
    monthly: number;
    courseCompletion: number;
  };
}

interface RealTimeData {
  currentOnline: number;
  liveStreams: number;
  activeAssessments: number;
  concurrentSessions: number;
  recentActivity: Array<{
    userId: string;
    userName: string;
    action: string;
    details: string;
    timestamp: string;
    courseId?: string;
    lessonId?: string;
  }>;
  systemHealth: {
    serverLoad: number;
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
}

interface GamificationData {
  xpDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  achievementUnlocks: Array<{
    achievementId: string;
    name: string;
    unlocks: number;
    rarity: number;
  }>;
  leaderboardActivity: {
    topPerformers: Array<{
      userId: string;
      name: string;
      xp: number;
      level: number;
      rank: number;
    }>;
    recentChanges: Array<{
      userId: string;
      name: string;
      previousRank: number;
      currentRank: number;
      change: number;
    }>;
  };
  streakAnalytics: {
    averageStreak: number;
    longestStreak: number;
    activeStreaks: number;
    streakDistribution: Array<{
      days: string;
      count: number;
    }>;
  };
  badgeDistribution: Array<{
    badgeId: string;
    name: string;
    earned: number;
    rarity: number;
  }>;
}

interface AnalyticsData {
  overview: OverviewMetrics;
  engagement: EngagementData;
  performance: PerformanceData;
  realTime: RealTimeData;
  gamification: GamificationData;
  lastUpdated: string;
}

interface AnalyticsFilters {
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  courseId?: string;
  studentGroup?: string;
  assessmentType?: string;
}

interface AnalyticsContextType {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  refreshData: (filters?: AnalyticsFilters) => Promise<void>;
  exportData: (section: string, format?: 'csv' | 'excel' | 'pdf') => Promise<void>;
  getDetailedReport: (type: string, id: string) => Promise<any>;
  subscribeToRealTime: () => void;
  unsubscribeFromRealTime: () => void;
  setFilters: (filters: AnalyticsFilters) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  value?: AnalyticsContextType; // For testing
}

export function AnalyticsProvider({ children, currentUser, value }: AnalyticsProviderProps) {
  // If value is provided (for testing), use it directly
  if (value) {
    return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
  }

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: 'last-30-days',
  });

  const subscriptionManager = useRef<GraphQLSubscriptionManager>();
  const websocket = useRef<WebSocket>();
  const refreshInterval = useRef<NodeJS.Timeout>();

  // Initialize analytics system
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Create WebSocket connection for real-time updates
        websocket.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql');
        
        websocket.current.onopen = () => {
          console.log('Analytics WebSocket connected');
        };

        websocket.current.onclose = () => {
          console.log('Analytics WebSocket disconnected');
        };

        websocket.current.onerror = (error) => {
          console.error('Analytics WebSocket error:', error);
        };

        // Initialize subscription manager
        subscriptionManager.current = new GraphQLSubscriptionManager();

        // Load initial data
        await refreshData();

        // Set up auto-refresh for real-time data
        refreshInterval.current = setInterval(() => {
          refreshRealTimeData();
        }, 30000); // Refresh every 30 seconds

      } catch (error) {
        console.error('Failed to initialize analytics:', error);
        setError('Failed to initialize analytics system');
      }
    };

    initializeAnalytics();

    // Cleanup on unmount
    return () => {
      if (subscriptionManager.current) {
        subscriptionManager.current.unsubscribe(`analytics-${currentUser.id}`);
      }
      if (websocket.current) {
        websocket.current.close();
      }
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [currentUser.id]);

  // Refresh analytics data
  const refreshData = useCallback(async (newFilters?: AnalyticsFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const activeFilters = { ...filters, ...newFilters };
      
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/analytics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.id}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analyticsData = await response.json();
      setData({
        ...analyticsData,
        lastUpdated: new Date().toISOString(),
      });

      if (newFilters) {
        setFilters(activeFilters);
      }

    } catch (error) {
      console.error('Failed to refresh analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentUser.id]);

  // Refresh only real-time data
  const refreshRealTimeData = useCallback(async () => {
    if (!data) return;

    try {
      const response = await fetch('/api/analytics/real-time', {
        headers: {
          'Authorization': `Bearer ${currentUser.id}`,
        },
      });

      if (response.ok) {
        const realTimeData = await response.json();
        setData(prev => prev ? {
          ...prev,
          realTime: realTimeData,
          lastUpdated: new Date().toISOString(),
        } : null);
      }
    } catch (error) {
      console.error('Failed to refresh real-time data:', error);
    }
  }, [data, currentUser.id]);

  // Export analytics data
  const exportData = useCallback(async (section: string, format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const params = new URLSearchParams({
        section,
        format,
        ...filters,
      });

      const response = await fetch(`/api/analytics/export?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.id}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${section}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }, [filters, currentUser.id]);

  // Get detailed report for specific item
  const getDetailedReport = useCallback(async (type: string, id: string) => {
    try {
      const response = await fetch(`/api/analytics/detailed/${type}/${id}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.id}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch detailed report');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get detailed report:', error);
      throw error;
    }
  }, [currentUser.id]);

  // Subscribe to real-time analytics updates
  const subscribeToRealTime = useCallback(async () => {
    if (!subscriptionManager.current || !websocket.current) return;

    try {
      await subscriptionManager.current.subscribe({
        id: `analytics-${currentUser.id}`,
        query: `
          subscription AnalyticsUpdated($userId: ID!) {
            analyticsUpdated(userId: $userId) {
              type
              data
              timestamp
            }
          }
        `,
        variables: { userId: currentUser.id },
        websocket: websocket.current,
        context: { userId: currentUser.id, role: currentUser.role },
      });
    } catch (error) {
      console.error('Failed to subscribe to real-time analytics:', error);
    }
  }, [currentUser.id, currentUser.role]);

  // Unsubscribe from real-time updates
  const unsubscribeFromRealTime = useCallback(() => {
    if (subscriptionManager.current) {
      subscriptionManager.current.unsubscribe(`analytics-${currentUser.id}`);
    }
  }, [currentUser.id]);

  // Handle incoming real-time updates
  useEffect(() => {
    if (!websocket.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'data') {
          const { data: updateData } = message.payload;
          
          if (updateData.analyticsUpdated) {
            const update = updateData.analyticsUpdated;
            
            // Update specific sections based on update type
            setData(prev => {
              if (!prev) return null;
              
              switch (update.type) {
                case 'real_time_update':
                  return {
                    ...prev,
                    realTime: {
                      ...prev.realTime,
                      ...update.data,
                    },
                    lastUpdated: update.timestamp,
                  };
                
                case 'engagement_update':
                  return {
                    ...prev,
                    engagement: {
                      ...prev.engagement,
                      ...update.data,
                    },
                    lastUpdated: update.timestamp,
                  };
                
                case 'performance_update':
                  return {
                    ...prev,
                    performance: {
                      ...prev.performance,
                      ...update.data,
                    },
                    lastUpdated: update.timestamp,
                  };
                
                default:
                  return prev;
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to parse analytics update:', error);
      }
    };

    websocket.current.addEventListener('message', handleMessage);

    return () => {
      if (websocket.current) {
        websocket.current.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  // Auto-subscribe to real-time updates when data is loaded
  useEffect(() => {
    if (data && websocket.current?.readyState === WebSocket.OPEN) {
      subscribeToRealTime();
    }
  }, [data, subscribeToRealTime]);

  const contextValue: AnalyticsContextType = {
    data,
    isLoading,
    error,
    filters,
    refreshData,
    exportData,
    getDetailedReport,
    subscribeToRealTime,
    unsubscribeFromRealTime,
    setFilters,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}