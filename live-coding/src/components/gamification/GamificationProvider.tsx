'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { GraphQLSubscriptionManager } from '../../lib/graphql/subscriptions';

interface UserProgress {
  level: number;
  xp: number;
  totalXp: number;
  achievements: string[];
  badges: string[];
  streak: number;
  rank: number;
  lastActivity: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'learning' | 'social' | 'achievement' | 'special';
  requirements: {
    type: string;
    value: number;
    description: string;
  }[];
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  rank: number;
  streak: number;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'badge' | 'avatar' | 'theme' | 'feature';
  available: boolean;
}

interface GamificationContextType {
  userProgress: UserProgress;
  leaderboard: LeaderboardEntry[];
  achievements: Achievement[];
  availableRewards: Reward[];
  awardXP: (amount: number, reason: string, metadata?: any) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<boolean>;
  updateStreak: (activity: string) => Promise<void>;
  getAvailableRewards: () => Promise<Reward[]>;
  claimReward: (rewardId: string) => Promise<boolean>;
  getProgressToNextLevel: () => { current: number; required: number; percentage: number };
  checkAchievementProgress: (achievementId: string) => Promise<{ progress: number; total: number }>;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

interface GamificationProviderProps {
  children: React.ReactNode;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  value?: GamificationContextType; // For testing
}

export function GamificationProvider({ children, currentUser, value }: GamificationProviderProps) {
  // If value is provided (for testing), use it directly
  if (value) {
    return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
  }

  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1,
    xp: 0,
    totalXp: 0,
    achievements: [],
    badges: [],
    streak: 0,
    rank: 0,
    lastActivity: new Date().toISOString(),
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);

  const subscriptionManager = useRef<GraphQLSubscriptionManager>();
  const websocket = useRef<WebSocket>();

  // XP levels configuration
  const XP_LEVELS = [
    0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7250, 9250, // Levels 1-11
    11500, 14000, 16750, 19750, 23000, 26500, 30250, 34250, 38500, 43000, // Levels 12-21
    47750, 52750, 58000, 63500, 69250, 75250, 81500, 88000, 94750, 101750, // Levels 22-31
  ];

  // Initialize gamification system
  useEffect(() => {
    const initializeGamification = async () => {
      try {
        // Create WebSocket connection
        websocket.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql');
        
        websocket.current.onopen = () => {
          console.log('Gamification WebSocket connected');
        };

        websocket.current.onclose = () => {
          console.log('Gamification WebSocket disconnected');
        };

        websocket.current.onerror = (error) => {
          console.error('Gamification WebSocket error:', error);
        };

        // Initialize subscription manager
        subscriptionManager.current = new GraphQLSubscriptionManager();

        // Subscribe to gamification updates
        await subscriptionManager.current.subscribe({
          id: `gamification-${currentUser.id}`,
          query: `
            subscription GamificationUpdated($userId: ID!) {
              gamificationUpdated(userId: $userId) {
                type
                data {
                  xpGained
                  newLevel
                  achievementUnlocked
                  streakUpdated
                  rankChanged
                }
              }
            }
          `,
          variables: { userId: currentUser.id },
          websocket: websocket.current,
          context: { userId: currentUser.id, role: currentUser.role },
        });

        // Load initial data
        await Promise.all([
          loadUserProgress(),
          loadLeaderboard(),
          loadAchievements(),
          loadAvailableRewards(),
        ]);

      } catch (error) {
        console.error('Failed to initialize gamification:', error);
      }
    };

    initializeGamification();

    // Cleanup on unmount
    return () => {
      if (subscriptionManager.current) {
        subscriptionManager.current.unsubscribe(`gamification-${currentUser.id}`);
      }
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [currentUser.id, currentUser.role]);

  // Load user progress
  const loadUserProgress = async () => {
    try {
      const response = await fetch(`/api/gamification/progress/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data.progress);
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  // Load leaderboard
  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/gamification/leaderboard?limit=50');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  // Load achievements
  const loadAchievements = async () => {
    try {
      const response = await fetch('/api/gamification/achievements');
      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  // Load available rewards
  const loadAvailableRewards = async () => {
    try {
      const response = await fetch(`/api/gamification/rewards?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableRewards(data.rewards);
      }
    } catch (error) {
      console.error('Failed to load rewards:', error);
    }
  };

  // Award XP to user
  const awardXP = useCallback(async (amount: number, reason: string, metadata?: any) => {
    try {
      const response = await fetch('/api/gamification/award-xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          amount,
          reason,
          metadata,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setUserProgress(prev => ({
          ...prev,
          xp: data.newXP,
          totalXp: data.totalXP,
          level: data.newLevel,
        }));

        // Publish update event
        if (subscriptionManager.current) {
          await subscriptionManager.current.publish({
            type: 'gamificationUpdated',
            data: {
              type: 'xp_awarded',
              data: {
                xpGained: amount,
                newLevel: data.newLevel,
                reason,
              },
            },
            filters: { userId: currentUser.id },
          });
        }

        // Check for level up
        if (data.leveledUp) {
          // Show level up notification
          console.log(`Level up! Now level ${data.newLevel}`);
        }
      }
    } catch (error) {
      console.error('Failed to award XP:', error);
    }
  }, [currentUser.id]);

  // Unlock achievement
  const unlockAchievement = useCallback(async (achievementId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/gamification/unlock-achievement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          achievementId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.unlocked) {
          // Update local state
          setUserProgress(prev => ({
            ...prev,
            achievements: [...prev.achievements, achievementId],
            xp: prev.xp + data.xpReward,
            totalXp: prev.totalXp + data.xpReward,
          }));

          // Publish update event
          if (subscriptionManager.current) {
            await subscriptionManager.current.publish({
              type: 'gamificationUpdated',
              data: {
                type: 'achievement_unlocked',
                data: {
                  achievementUnlocked: achievementId,
                  xpGained: data.xpReward,
                },
              },
              filters: { userId: currentUser.id },
            });
          }

          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
      return false;
    }
  }, [currentUser.id]);

  // Update streak
  const updateStreak = useCallback(async (activity: string) => {
    try {
      const response = await fetch('/api/gamification/update-streak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          activity,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        setUserProgress(prev => ({
          ...prev,
          streak: data.newStreak,
          lastActivity: new Date().toISOString(),
        }));

        // Check for streak achievements
        if (data.streakMilestone) {
          await unlockAchievement(`streak-${data.newStreak}`);
        }
      }
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  }, [currentUser.id, unlockAchievement]);

  // Get available rewards
  const getAvailableRewards = useCallback(async (): Promise<Reward[]> => {
    try {
      const response = await fetch(`/api/gamification/rewards?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableRewards(data.rewards);
        return data.rewards;
      }
      return [];
    } catch (error) {
      console.error('Failed to get available rewards:', error);
      return [];
    }
  }, [currentUser.id]);

  // Claim reward
  const claimReward = useCallback(async (rewardId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/gamification/claim-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          rewardId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.claimed) {
          // Update local state
          setUserProgress(prev => ({
            ...prev,
            xp: prev.xp - data.cost,
          }));

          // Update available rewards
          setAvailableRewards(prev => 
            prev.map(reward => 
              reward.id === rewardId 
                ? { ...reward, available: false }
                : reward
            )
          );

          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to claim reward:', error);
      return false;
    }
  }, [currentUser.id]);

  // Get progress to next level
  const getProgressToNextLevel = useCallback(() => {
    const currentLevel = userProgress.level;
    const currentXP = userProgress.xp;
    
    if (currentLevel >= XP_LEVELS.length) {
      return { current: currentXP, required: currentXP, percentage: 100 };
    }
    
    const currentLevelXP = XP_LEVELS[currentLevel - 1] || 0;
    const nextLevelXP = XP_LEVELS[currentLevel] || currentXP;
    const progressXP = currentXP - currentLevelXP;
    const requiredXP = nextLevelXP - currentLevelXP;
    const percentage = Math.min(100, (progressXP / requiredXP) * 100);
    
    return {
      current: progressXP,
      required: requiredXP,
      percentage,
    };
  }, [userProgress.level, userProgress.xp]);

  // Check achievement progress
  const checkAchievementProgress = useCallback(async (achievementId: string) => {
    try {
      const response = await fetch(`/api/gamification/achievement-progress/${achievementId}?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        return data.progress;
      }
      return { progress: 0, total: 1 };
    } catch (error) {
      console.error('Failed to check achievement progress:', error);
      return { progress: 0, total: 1 };
    }
  }, [currentUser.id]);

  // Handle incoming gamification events
  useEffect(() => {
    if (!websocket.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'data') {
          const { data } = message.payload;
          
          if (data.gamificationUpdated) {
            const update = data.gamificationUpdated;
            
            // Handle different types of updates
            switch (update.type) {
              case 'xp_awarded':
                // Show XP notification
                console.log(`+${update.data.xpGained} XP: ${update.data.reason}`);
                break;
              case 'achievement_unlocked':
                // Show achievement notification
                console.log(`Achievement unlocked: ${update.data.achievementUnlocked}`);
                break;
              case 'level_up':
                // Show level up notification
                console.log(`Level up! Now level ${update.data.newLevel}`);
                break;
              case 'streak_updated':
                // Show streak notification
                console.log(`Streak updated: ${update.data.streakUpdated} days`);
                break;
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse gamification message:', error);
      }
    };

    websocket.current.addEventListener('message', handleMessage);

    return () => {
      if (websocket.current) {
        websocket.current.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  const contextValue: GamificationContextType = {
    userProgress,
    leaderboard,
    achievements,
    availableRewards,
    awardXP,
    unlockAchievement,
    updateStreak,
    getAvailableRewards,
    claimReward,
    getProgressToNextLevel,
    checkAchievementProgress,
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}