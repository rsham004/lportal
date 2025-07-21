'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAnalytics } from './AnalyticsProvider';
import { NotificationSystem } from '../notifications/NotificationSystem';
import { PresenceIndicator } from '../presence/PresenceIndicator';
import Chart from 'chart.js/auto';
import {
  ChartBarIcon,
  UsersIcon,
  AcademicCapIcon,
  ClockIcon,
  TrophyIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarIcon,
  FunnelIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface AnalyticsDashboardProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  className?: string;
}

export function AnalyticsDashboard({ currentUser, className = '' }: AnalyticsDashboardProps) {
  const {
    data,
    isLoading,
    error,
    filters,
    refreshData,
    exportData,
    getDetailedReport,
    setFilters,
  } = useAnalytics();

  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'engagement' | 'real-time' | 'gamification'>('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const chartRefs = useRef<{ [key: string]: Chart | null }>({});
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const isInstructor = currentUser.role === 'instructor' || currentUser.role === 'admin';

  // Initialize charts
  useEffect(() => {
    if (!data || isLoading) return;

    // Clean up existing charts
    Object.values(chartRefs.current).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    chartRefs.current = {};

    // Create engagement chart
    if (canvasRefs.current.engagement && data.engagement.dailyActiveUsers.length > 0) {
      const ctx = canvasRefs.current.engagement.getContext('2d');
      if (ctx) {
        chartRefs.current.engagement = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.engagement.dailyActiveUsers.map(d => d.date),
            datasets: [
              {
                label: 'Active Users',
                data: data.engagement.dailyActiveUsers.map(d => d.users),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
              },
              {
                label: 'New Users',
                data: data.engagement.dailyActiveUsers.map(d => d.newUsers || 0),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      }
    }

    // Create performance chart
    if (canvasRefs.current.performance && data.performance.assessmentScores.length > 0) {
      const ctx = canvasRefs.current.performance.getContext('2d');
      if (ctx) {
        chartRefs.current.performance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.performance.assessmentScores.map(a => a.title),
            datasets: [
              {
                label: 'Average Score',
                data: data.performance.assessmentScores.map(a => a.averageScore),
                backgroundColor: 'rgba(168, 85, 247, 0.8)',
                borderColor: 'rgb(168, 85, 247)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
              },
            },
          },
        });
      }
    }

    // Create session duration chart
    if (canvasRefs.current.sessionDuration && data.engagement.sessionDuration.distribution.length > 0) {
      const ctx = canvasRefs.current.sessionDuration.getContext('2d');
      if (ctx) {
        chartRefs.current.sessionDuration = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: data.engagement.sessionDuration.distribution.map(d => d.range),
            datasets: [
              {
                data: data.engagement.sessionDuration.distribution.map(d => d.count),
                backgroundColor: [
                  'rgba(239, 68, 68, 0.8)',
                  'rgba(245, 158, 11, 0.8)',
                  'rgba(34, 197, 94, 0.8)',
                  'rgba(59, 130, 246, 0.8)',
                ],
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
          },
        });
      }
    }

    return () => {
      Object.values(chartRefs.current).forEach(chart => {
        if (chart) {
          chart.destroy();
        }
      });
    };
  }, [data, isLoading, activeTab]);

  // Handle export
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await exportData(activeTab, format);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [activeTab, exportData]);

  // Handle detailed report
  const handleDetailedReport = useCallback(async (type: string, id: string) => {
    try {
      const report = await getDetailedReport(type, id);
      console.log('Detailed report:', report);
      // TODO: Show detailed report modal
    } catch (error) {
      console.error('Failed to get detailed report:', error);
    }
  }, [getDetailedReport]);

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Render metric card
  const renderMetricCard = (title: string, value: string | number, icon: React.ElementType, color: string, change?: number) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {React.createElement(icon, { className: 'h-6 w-6 text-white' })}
        </div>
      </div>
    </div>
  );

  // Render tab content
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" data-testid="loading-spinner" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error loading analytics</p>
            <button
              onClick={() => refreshData()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              aria-label="Retry"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No data available</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderMetricCard('Total Students', formatNumber(data.overview.totalStudents), UsersIcon, 'bg-blue-500')}
              {renderMetricCard('Active Students', formatNumber(data.overview.activeStudents), UsersIcon, 'bg-green-500')}
              {renderMetricCard('Completion Rate', `${data.overview.completionRate}%`, CheckCircleIcon, 'bg-purple-500')}
              {renderMetricCard('Average Score', data.overview.averageScore.toFixed(1), AcademicCapIcon, 'bg-yellow-500')}
            </div>

            {/* Engagement Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Active Users</h3>
              <div className="h-64">
                <canvas
                  ref={el => canvasRefs.current.engagement = el}
                  data-testid="engagement-chart"
                />
              </div>
            </div>

            {/* Session Duration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Session Duration</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{data.engagement.sessionDuration.average} min avg</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{data.engagement.sessionDuration.median} min median</span>
                  </p>
                </div>
                <div className="h-48 mt-4">
                  <canvas ref={el => canvasRefs.current.sessionDuration = el} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Content Interaction</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Video Views</span>
                    <span className="font-medium">{formatNumber(data.engagement.contentInteraction.videos.views)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quiz Attempts</span>
                    <span className="font-medium">{formatNumber(data.engagement.contentInteraction.quizzes.attempts)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Assignment Submissions</span>
                    <span className="font-medium">{formatNumber(data.engagement.contentInteraction.assignments.submissions)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Discussion Posts</span>
                    <span className="font-medium">{formatNumber(data.engagement.contentInteraction.discussions.posts)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            {/* Assessment Performance */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assessment Performance</h3>
              <div className="h-64 mb-4">
                <canvas ref={el => canvasRefs.current.performance = el} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assessment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attempts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.performance.assessmentScores.map((assessment) => (
                      <tr key={assessment.assessmentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDetailedReport('assessment', assessment.assessmentId)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {assessment.title}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assessment.averageScore.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assessment.attempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {((assessment.completions / assessment.attempts) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Learning Outcomes */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Outcomes</h3>
              <div className="space-y-4">
                {data.performance.learningOutcomes.map((outcome) => (
                  <div key={outcome.outcome} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{outcome.outcome}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${outcome.mastery}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{outcome.mastery.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Tracking</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.performance.progressTracking.onTrack}</div>
                  <div className="text-sm text-gray-600">on track</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{data.performance.progressTracking.atRisk}</div>
                  <div className="text-sm text-gray-600">at risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data.performance.progressTracking.needsSupport}</div>
                  <div className="text-sm text-gray-600">need support</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.performance.progressTracking.excelling}</div>
                  <div className="text-sm text-gray-600">excelling</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'real-time':
        return (
          <div className="space-y-6">
            {/* Real-time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderMetricCard('Currently Online', `${data.realTime.currentOnline} users`, EyeIcon, 'bg-green-500')}
              {renderMetricCard('Live Streams', `${data.realTime.liveStreams} active`, ClockIcon, 'bg-red-500')}
              {renderMetricCard('Active Assessments', data.realTime.activeAssessments.toString(), AcademicCapIcon, 'bg-blue-500')}
              {renderMetricCard('Concurrent Sessions', data.realTime.concurrentSessions.toString(), UsersIcon, 'bg-purple-500')}
            </div>

            {/* System Health */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.realTime.systemHealth.serverLoad}%</div>
                  <div className="text-sm text-gray-600">Server Load</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.realTime.systemHealth.responseTime}ms</div>
                  <div className="text-sm text-gray-600">Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{data.realTime.systemHealth.errorRate}%</div>
                  <div className="text-sm text-gray-600">Error Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{data.realTime.systemHealth.uptime}%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {data.realTime.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-gray-900">
                        <span className="font-medium">{activity.userName}</span> {activity.action}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'gamification':
        return (
          <div className="space-y-6">
            {/* XP Distribution */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">XP Distribution</h3>
              <div className="space-y-3">
                {data.gamification.xpDistribution.map((range) => (
                  <div key={range.range} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{range.range}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${range.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">{range.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Unlocks */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Achievement Unlocks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.gamification.achievementUnlocks.map((achievement) => (
                  <div key={achievement.achievementId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{achievement.name}</p>
                      <p className="text-sm text-gray-600">{achievement.unlocks} unlocks</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Rarity</p>
                      <p className="font-medium">{achievement.rarity.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Activity */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Leaderboard Activity</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        XP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.gamification.leaderboardActivity.topPerformers.slice(0, 10).map((performer) => (
                      <tr key={performer.userId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{performer.rank}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {performer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(performer.xp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {performer.level}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Streak Analytics */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Streak Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{data.gamification.streakAnalytics.averageStreak}</div>
                  <div className="text-sm text-gray-600">Average Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data.gamification.streakAnalytics.longestStreak}</div>
                  <div className="text-sm text-gray-600">Longest Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.gamification.streakAnalytics.activeStreaks}</div>
                  <div className="text-sm text-gray-600">Active Streaks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.gamification.streakAnalytics.streakDistribution.reduce((sum, d) => sum + d.count, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Participants</div>
                </div>
              </div>
            </div>
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
            <h2 className="text-xl font-semibold text-gray-900">
              {isInstructor ? 'Class Analytics' : 'My Progress'}
            </h2>
            <p className="text-gray-600 mt-1">
              {data && `Last updated ${formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true })}`}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Real-time indicator */}
            {data && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-700">{data.realTime.currentOnline} online now</span>
              </div>
            )}

            {/* Presence indicator */}
            <PresenceIndicator currentUser={currentUser} />

            {/* Notifications */}
            <NotificationSystem currentUser={currentUser} />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
            </button>

            <select
              value={filters.dateRange || 'last-30-days'}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Date Range"
            >
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="last-90-days">Last 90 days</option>
              <option value="custom">Custom Range</option>
            </select>

            {isInstructor && (
              <select
                value={filters.courseId || ''}
                onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Course Filter"
              >
                <option value="">All Courses</option>
                <option value="react-fundamentals">React Fundamentals</option>
                <option value="advanced-javascript">Advanced JavaScript</option>
                <option value="web-development">Web Development</option>
              </select>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              aria-label="Export data"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              aria-label="Generate report"
            >
              <DocumentChartBarIcon className="h-4 w-4" />
              <span>Report</span>
            </button>

            {filters.dateRange === 'custom' && (
              <button
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                aria-label="Custom range"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Custom Range</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" role="tablist" aria-label="Analytics tabs">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'performance', label: 'Performance', icon: AcademicCapIcon },
            { id: 'engagement', label: 'Engagement', icon: UsersIcon },
            { id: 'real-time', label: 'Real-time', icon: EyeIcon },
            { id: 'gamification', label: 'Gamification', icon: TrophyIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as AnalyticsTab)}
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
      <main className="p-6" role="main" aria-label="Analytics dashboard content">
        {renderTabContent()}
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Format</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left border border-gray-300 rounded hover:bg-gray-50"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left border border-gray-300 rounded hover:bg-gray-50"
              >
                Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left border border-gray-300 rounded hover:bg-gray-50"
              >
                PDF Report
              </button>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2">
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Custom range</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Include Sections</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Overview
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Performance
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Engagement
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  // Generate report logic
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-40 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}