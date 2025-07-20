'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGamification } from '../gamification/GamificationProvider';
import { QuizBuilder } from './QuizBuilder';
import { AssignmentBuilder } from './AssignmentBuilder';
import { NotificationSystem } from '../notifications/NotificationSystem';
import { 
  AcademicCapIcon,
  TrophyIcon,
  EyeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  StarIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AssessmentConfig {
  id?: string;
  title: string;
  description: string;
  type: 'quiz' | 'assignment' | 'adaptive' | 'timed-challenge' | 'peer-assessment' | 'collaborative';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  timeLimit?: number;
  attempts: number;
  passingScore: number;
  
  // Gamification settings
  gamification: {
    baseXP: number;
    perfectScoreBonus: number;
    speedBonus: number;
    difficultyMultiplier: number;
    achievements: string[];
    showOnLeaderboard: boolean;
    anonymousSubmissions: boolean;
  };
  
  // Advanced settings
  adaptive?: {
    startingDifficulty: 'easy' | 'medium' | 'hard';
    algorithm: 'irt' | 'cat' | 'simple';
    minQuestions: number;
    maxQuestions: number;
  };
  
  peerAssessment?: {
    reviewCount: number;
    criteria: string[];
    blindReview: boolean;
  };
  
  collaborative?: {
    teamSize: number;
    individualGrading: boolean;
    roleAssignments: boolean;
  };
  
  // Analytics
  analytics: {
    trackAttempts: boolean;
    measureOutcomes: boolean;
    competencyMapping: string[];
    prerequisites: {
      assessmentId: string;
      minimumScore: number;
    }[];
  };
  
  // Content
  questions: any[];
  contentBlocks: any[];
}

interface EnhancedAssessmentBuilderProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  initialData?: Partial<AssessmentConfig>;
  onSave: (assessment: AssessmentConfig) => Promise<void>;
  onCancel: () => void;
  isLiveSession?: boolean;
  liveChanges?: Array<{
    userId: string;
    userName: string;
    change: string;
    timestamp?: string;
  }>;
  hasConflicts?: boolean;
  className?: string;
}

export function EnhancedAssessmentBuilder({
  currentUser,
  initialData,
  onSave,
  onCancel,
  isLiveSession = false,
  liveChanges = [],
  hasConflicts = false,
  className = '',
}: EnhancedAssessmentBuilderProps) {
  const { userProgress, awardXP, unlockAchievement } = useGamification();
  
  const [activeTab, setActiveTab] = useState<'details' | 'gamification' | 'analytics' | 'preview'>('details');
  const [assessment, setAssessment] = useState<AssessmentConfig>({
    title: '',
    description: '',
    type: 'quiz',
    difficulty: 'medium',
    attempts: 3,
    passingScore: 70,
    gamification: {
      baseXP: 100,
      perfectScoreBonus: 50,
      speedBonus: 25,
      difficultyMultiplier: 1.0,
      achievements: [],
      showOnLeaderboard: true,
      anonymousSubmissions: false,
    },
    analytics: {
      trackAttempts: true,
      measureOutcomes: true,
      competencyMapping: [],
      prerequisites: [],
    },
    questions: [],
    contentBlocks: [],
    ...initialData,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  
  const isInstructor = currentUser.role === 'instructor' || currentUser.role === 'admin';

  // Update difficulty multiplier when difficulty changes
  useEffect(() => {
    const multipliers = { easy: 0.8, medium: 1.0, hard: 1.5, expert: 2.0 };
    setAssessment(prev => ({
      ...prev,
      gamification: {
        ...prev.gamification,
        difficultyMultiplier: multipliers[prev.difficulty],
      },
    }));
  }, [assessment.difficulty]);

  // Handle assessment field changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    setAssessment(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle nested field changes
  const handleNestedFieldChange = useCallback((section: string, field: string, value: any) => {
    setAssessment(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof AssessmentConfig],
        [field]: value,
      },
    }));
  }, []);

  // Validate assessment configuration
  const validateAssessment = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!assessment.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (assessment.questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }
    
    if (assessment.gamification.baseXP < 0) {
      newErrors.baseXP = 'XP must be positive';
    }
    
    if (assessment.timeLimit && assessment.timeLimit < 1) {
      newErrors.timeLimit = 'Time limit must be at least 1 minute';
    }
    
    if (assessment.passingScore < 0 || assessment.passingScore > 100) {
      newErrors.passingScore = 'Passing score must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [assessment]);

  // Save assessment
  const handleSave = useCallback(async () => {
    if (!validateAssessment()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      await onSave(assessment);
      
      // Award XP for creating assessment
      await awardXP(50, 'Created assessment', { assessmentId: assessment.id });
      
      // Check for achievements
      if (assessment.type === 'adaptive') {
        await unlockAchievement('adaptive-master');
      }
      
    } catch (error) {
      console.error('Failed to save assessment:', error);
    } finally {
      setIsSaving(false);
    }
  }, [assessment, validateAssessment, onSave, awardXP, unlockAchievement]);

  // Handle quiz changes from QuizBuilder
  const handleQuizChange = useCallback((quizData: any) => {
    setAssessment(prev => ({
      ...prev,
      questions: quizData.questions || [],
      timeLimit: quizData.timeLimit,
    }));
  }, []);

  // Handle assignment changes from AssignmentBuilder
  const handleAssignmentChange = useCallback((assignmentData: any) => {
    setAssessment(prev => ({
      ...prev,
      ...assignmentData,
    }));
  }, []);

  // Calculate potential XP
  const calculatePotentialXP = useCallback(() => {
    const { baseXP, perfectScoreBonus, speedBonus, difficultyMultiplier } = assessment.gamification;
    return Math.round((baseXP + perfectScoreBonus + speedBonus) * difficultyMultiplier);
  }, [assessment.gamification]);

  // Get available achievements for this assessment type
  const getAvailableAchievements = useCallback(() => {
    const achievements = [
      { id: 'first-attempt', name: 'First Try', description: 'Complete on first attempt' },
      { id: 'perfect-score', name: 'Perfect Score', description: 'Score 100%' },
      { id: 'speed-demon', name: 'Speed Demon', description: 'Complete in under 5 minutes' },
      { id: 'persistent', name: 'Persistent', description: 'Complete after multiple attempts' },
    ];
    
    if (assessment.type === 'adaptive') {
      achievements.push({ id: 'adaptive-master', name: 'Adaptive Master', description: 'Excel at adaptive assessments' });
    }
    
    return achievements;
  }, [assessment.type]);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={assessment.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter assessment title"
                />
                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Type
                </label>
                <select
                  id="type"
                  value={assessment.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="adaptive">Adaptive Assessment</option>
                  <option value="timed-challenge">Timed Challenge</option>
                  <option value="peer-assessment">Peer Assessment</option>
                  <option value="collaborative">Collaborative</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={assessment.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the assessment objectives and instructions"
              />
            </div>

            {/* Assessment Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  id="difficulty"
                  value={assessment.difficulty}
                  onChange={(e) => handleFieldChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  XP Multiplier: {assessment.gamification.difficultyMultiplier}x
                </p>
              </div>

              <div>
                <label htmlFor="attempts" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Attempts
                </label>
                <input
                  id="attempts"
                  type="number"
                  min="1"
                  max="10"
                  value={assessment.attempts}
                  onChange={(e) => handleFieldChange('attempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="passingScore" className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Score (%)
                </label>
                <input
                  id="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={assessment.passingScore}
                  onChange={(e) => handleFieldChange('passingScore', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.passingScore && <p className="text-red-600 text-sm mt-1">{errors.passingScore}</p>}
              </div>
            </div>

            {/* Type-specific settings */}
            {assessment.type === 'adaptive' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">Adaptive Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="startingDifficulty" className="block text-sm font-medium text-blue-700 mb-1">
                      Starting Difficulty
                    </label>
                    <select
                      id="startingDifficulty"
                      value={assessment.adaptive?.startingDifficulty || 'medium'}
                      onChange={(e) => handleNestedFieldChange('adaptive', 'startingDifficulty', e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="algorithm" className="block text-sm font-medium text-blue-700 mb-1">
                      Adaptation Algorithm
                    </label>
                    <select
                      id="algorithm"
                      value={assessment.adaptive?.algorithm || 'simple'}
                      onChange={(e) => handleNestedFieldChange('adaptive', 'algorithm', e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="simple">Simple</option>
                      <option value="irt">Item Response Theory</option>
                      <option value="cat">Computer Adaptive Testing</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="minQuestions" className="block text-sm font-medium text-blue-700 mb-1">
                      Min Questions
                    </label>
                    <input
                      id="minQuestions"
                      type="number"
                      min="5"
                      max="50"
                      value={assessment.adaptive?.minQuestions || 10}
                      onChange={(e) => handleNestedFieldChange('adaptive', 'minQuestions', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {assessment.type === 'timed-challenge' && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-3">Time Challenge Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="timeLimit" className="block text-sm font-medium text-orange-700 mb-1">
                      Time Limit (minutes)
                    </label>
                    <input
                      id="timeLimit"
                      type="number"
                      min="1"
                      max="180"
                      value={assessment.timeLimit || 30}
                      onChange={(e) => handleFieldChange('timeLimit', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {errors.timeLimit && <p className="text-red-600 text-sm mt-1">{errors.timeLimit}</p>}
                  </div>

                  <div className="flex items-center">
                    <input
                      id="showTimer"
                      type="checkbox"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="showTimer" className="ml-2 text-sm text-orange-700">
                      Show Timer
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="autoSubmit"
                      type="checkbox"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoSubmit" className="ml-2 text-sm text-orange-700">
                      Auto Submit
                    </label>
                  </div>
                </div>
              </div>
            )}

            {assessment.type === 'peer-assessment' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-3">Peer Assessment Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reviewCount" className="block text-sm font-medium text-green-700 mb-1">
                      Number of Peer Reviews
                    </label>
                    <input
                      id="reviewCount"
                      type="number"
                      min="2"
                      max="10"
                      value={assessment.peerAssessment?.reviewCount || 3}
                      onChange={(e) => handleNestedFieldChange('peerAssessment', 'reviewCount', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="reviewCriteria" className="block text-sm font-medium text-green-700 mb-1">
                      Review Criteria
                    </label>
                    <textarea
                      id="reviewCriteria"
                      placeholder="Enter criteria separated by commas"
                      className="w-full px-3 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {assessment.type === 'collaborative' && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-3">Collaboration Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="teamSize" className="block text-sm font-medium text-purple-700 mb-1">
                      Team Size
                    </label>
                    <input
                      id="teamSize"
                      type="number"
                      min="2"
                      max="8"
                      value={assessment.collaborative?.teamSize || 4}
                      onChange={(e) => handleNestedFieldChange('collaborative', 'teamSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      id="individualGrading"
                      type="checkbox"
                      checked={assessment.collaborative?.individualGrading || false}
                      onChange={(e) => handleNestedFieldChange('collaborative', 'individualGrading', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="individualGrading" className="ml-2 text-sm text-purple-700">
                      Individual Grading
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="roleAssignments"
                      type="checkbox"
                      checked={assessment.collaborative?.roleAssignments || false}
                      onChange={(e) => handleNestedFieldChange('collaborative', 'roleAssignments', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="roleAssignments" className="ml-2 text-sm text-purple-700">
                      Role Assignments
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Content Builder Integration */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Assessment Content</h4>
              
              {assessment.type === 'quiz' && (
                <QuizBuilder
                  initialQuestions={assessment.questions}
                  onQuizChange={handleQuizChange}
                  currentUser={currentUser}
                />
              )}
              
              {assessment.type === 'assignment' && (
                <AssignmentBuilder
                  initialData={assessment}
                  onAssignmentChange={handleAssignmentChange}
                  currentUser={currentUser}
                />
              )}

              {/* Add Content Block Button */}
              <div className="mt-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  aria-label="Add content block"
                >
                  <LightBulbIcon className="h-4 w-4" />
                  <span>Add Content Block</span>
                </button>
                
                {/* Content block options */}
                <div className="mt-2 text-sm text-gray-600">
                  <span>Available: </span>
                  <span className="inline-flex space-x-2">
                    <span>Text Block</span>
                    <span>•</span>
                    <span>Video Block</span>
                    <span>•</span>
                    <span>Interactive Block</span>
                  </span>
                </div>
              </div>

              {errors.questions && <p className="text-red-600 text-sm mt-2">{errors.questions}</p>}
            </div>
          </div>
        );

      case 'gamification':
        return (
          <div className="space-y-6">
            {/* XP Rewards */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-4 flex items-center">
                <TrophyIcon className="h-5 w-5 mr-2" />
                XP Rewards
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="baseXP" className="block text-sm font-medium text-yellow-700 mb-1">
                    Base XP
                  </label>
                  <input
                    id="baseXP"
                    type="number"
                    min="0"
                    value={assessment.gamification.baseXP}
                    onChange={(e) => handleNestedFieldChange('gamification', 'baseXP', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  {errors.baseXP && <p className="text-red-600 text-sm mt-1">{errors.baseXP}</p>}
                </div>

                <div>
                  <label htmlFor="perfectScoreBonus" className="block text-sm font-medium text-yellow-700 mb-1">
                    Perfect Score Bonus
                  </label>
                  <input
                    id="perfectScoreBonus"
                    type="number"
                    min="0"
                    value={assessment.gamification.perfectScoreBonus}
                    onChange={(e) => handleNestedFieldChange('gamification', 'perfectScoreBonus', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label htmlFor="speedBonus" className="block text-sm font-medium text-yellow-700 mb-1">
                    Speed Bonus
                  </label>
                  <input
                    id="speedBonus"
                    type="number"
                    min="0"
                    value={assessment.gamification.speedBonus}
                    onChange={(e) => handleNestedFieldChange('gamification', 'speedBonus', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* Achievement Triggers */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-4 flex items-center">
                <StarIcon className="h-5 w-5 mr-2" />
                Achievement Triggers
              </h4>
              
              <div className="space-y-3">
                {getAvailableAchievements().map((achievement) => (
                  <div key={achievement.id} className="flex items-center">
                    <input
                      id={achievement.id}
                      type="checkbox"
                      checked={assessment.gamification.achievements.includes(achievement.id)}
                      onChange={(e) => {
                        const achievements = e.target.checked
                          ? [...assessment.gamification.achievements, achievement.id]
                          : assessment.gamification.achievements.filter(id => id !== achievement.id);
                        handleNestedFieldChange('gamification', 'achievements', achievements);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={achievement.id} className="ml-3 text-sm">
                      <span className="font-medium text-blue-900">{achievement.name}</span>
                      <span className="text-blue-700 ml-2">{achievement.description}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Settings */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Leaderboard Settings
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="showOnLeaderboard"
                    type="checkbox"
                    checked={assessment.gamification.showOnLeaderboard}
                    onChange={(e) => handleNestedFieldChange('gamification', 'showOnLeaderboard', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showOnLeaderboard" className="ml-3 text-sm text-green-700">
                    Show on Leaderboard
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="anonymousSubmissions"
                    type="checkbox"
                    checked={assessment.gamification.anonymousSubmissions}
                    onChange={(e) => handleNestedFieldChange('gamification', 'anonymousSubmissions', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymousSubmissions" className="ml-3 text-sm text-green-700">
                    Anonymous Submissions
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Learning Analytics */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Learning Analytics
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="trackAttempts"
                    type="checkbox"
                    checked={assessment.analytics.trackAttempts}
                    onChange={(e) => handleNestedFieldChange('analytics', 'trackAttempts', e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="trackAttempts" className="ml-3 text-sm text-purple-700">
                    Track Attempt Patterns
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="measureOutcomes"
                    type="checkbox"
                    checked={assessment.analytics.measureOutcomes}
                    onChange={(e) => handleNestedFieldChange('analytics', 'measureOutcomes', e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="measureOutcomes" className="ml-3 text-sm text-purple-700">
                    Measure Learning Outcomes
                  </label>
                </div>
              </div>
            </div>

            {/* Competency Mapping */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-medium text-indigo-900 mb-4">Competency Mapping</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="learningObjectives" className="block text-sm font-medium text-indigo-700 mb-1">
                    Learning Objectives
                  </label>
                  <textarea
                    id="learningObjectives"
                    placeholder="Enter learning objectives separated by commas"
                    className="w-full px-3 py-2 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label htmlFor="skillCategories" className="block text-sm font-medium text-indigo-700 mb-1">
                    Skill Categories
                  </label>
                  <input
                    id="skillCategories"
                    type="text"
                    placeholder="e.g., Problem Solving, Critical Thinking"
                    className="w-full px-3 py-2 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Prerequisites */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-900 mb-4">Prerequisites</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="requiredAssessments" className="block text-sm font-medium text-red-700 mb-1">
                    Required Assessments
                  </label>
                  <select
                    id="requiredAssessments"
                    multiple
                    className="w-full px-3 py-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="assessment-1">Introduction Quiz</option>
                    <option value="assessment-2">Midterm Exam</option>
                    <option value="assessment-3">Project Assignment</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="minimumScore" className="block text-sm font-medium text-red-700 mb-1">
                    Minimum Score (%)
                  </label>
                  <input
                    id="minimumScore"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="70"
                    className="w-full px-3 py-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            {/* Assessment Preview */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <EyeIcon className="h-5 w-5 mr-2" />
                Assessment Preview
              </h4>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border">
                  <h5 className="font-medium text-lg">{assessment.title || 'Untitled Assessment'}</h5>
                  <p className="text-gray-600 mt-1">{assessment.description || 'No description provided'}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {assessment.type}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {assessment.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {assessment.questions.length} questions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gamification Preview */}
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-4">Gamification Preview</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded border text-center">
                  <TrophyIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="font-medium">Potential XP: {calculatePotentialXP()}</p>
                  <p className="text-sm text-gray-600">Maximum possible</p>
                </div>

                <div className="bg-white p-4 rounded border text-center">
                  <StarIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-medium">Available Achievements</p>
                  <p className="text-sm text-gray-600">{assessment.gamification.achievements.length} configured</p>
                </div>

                <div className="bg-white p-4 rounded border text-center">
                  <ChartBarIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">Leaderboard</p>
                  <p className="text-sm text-gray-600">
                    {assessment.gamification.showOnLeaderboard ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            {isLiveSession && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-4">Live Preview</h4>
                <p className="text-blue-700">
                  This assessment is being created in a live session. Changes will be visible to all collaborators in real-time.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Enhanced Assessment Builder</h2>
            <p className="text-gray-600 mt-1">Create engaging assessments with gamification and analytics</p>
          </div>

          {/* Live Collaboration Indicator */}
          {isLiveSession && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-700">Live Collaboration</span>
              <span className="text-gray-500">2 collaborators online</span>
            </div>
          )}

          {/* Notifications */}
          <NotificationSystem currentUser={currentUser} />
        </div>

        {/* Live Changes */}
        {liveChanges.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Recent Changes</h4>
            <div className="space-y-1">
              {liveChanges.slice(0, 3).map((change, index) => (
                <p key={index} className="text-sm text-blue-700">
                  <span className="font-medium">{change.userName}</span> {change.change}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Conflict Warning */}
        {hasConflicts && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-800 font-medium">Merge Conflicts Detected</span>
              <button
                onClick={() => setShowConflictResolver(true)}
                className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                aria-label="Resolve conflicts"
              >
                Resolve Conflicts
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" role="tablist" aria-label="Assessment builder tabs">
          {[
            { id: 'details', label: 'Assessment Details', icon: AcademicCapIcon },
            { id: 'gamification', label: 'Gamification', icon: TrophyIcon },
            { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
            { id: 'preview', label: 'Preview', icon: EyeIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isInstructor && (
            <>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Advanced Settings
              </button>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Grading Rubric
              </button>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            aria-label="Save assessment"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span>Save Assessment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}