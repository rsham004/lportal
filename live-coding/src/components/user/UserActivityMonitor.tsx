/**
 * User Activity Monitor Component
 * 
 * Displays user activity history, session tracking, and monitoring
 * with integration to audit logging system.
 */

'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Can } from '../authorization/Can'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { UserRole, getUserRole } from '../../lib/authorization/roles'
import { AuditEvent, auditLogger } from '../../lib/authorization/audit'

interface User {
  id: string
  firstName: string
  lastName: string
  emailAddresses: Array<{ emailAddress: string }>
  publicMetadata: { role: UserRole }
  lastSignInAt: Date | null
  createdAt: Date
}

export interface UserActivityMonitorProps {
  user: User
  isOwnProfile?: boolean
  className?: string
}

interface ActivitySession {
  id: string
  startTime: Date
  endTime?: Date
  duration?: number
  ipAddress?: string
  userAgent?: string
  location?: string
}

interface ActivitySummary {
  totalSessions: number
  totalTime: number
  averageSessionTime: number
  lastActivity: Date | null
  mostActiveDay: string
  deviceTypes: Record<string, number>
}

export function UserActivityMonitor({
  user,
  isOwnProfile = false,
  className = '',
}: UserActivityMonitorProps) {
  const { user: currentUser } = useAuth()
  const currentUserRole = getUserRole(currentUser)

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [activityType, setActivityType] = useState<'all' | 'login' | 'access' | 'role' | 'security'>('all')

  // Check if current user can view this activity
  const canViewActivity = useMemo(() => {
    if (isOwnProfile) return true
    if (currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.SUPER_ADMIN) return true
    return false
  }, [isOwnProfile, currentUserRole])

  // Mock activity data - in real implementation, this would come from API
  const mockSessions: ActivitySession[] = [
    {
      id: 'session_1',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      duration: 60 * 60 * 1000, // 1 hour
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: 'New York, NY',
    },
    {
      id: 'session_2',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      endTime: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
      duration: 60 * 60 * 1000, // 1 hour
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      location: 'New York, NY',
    },
  ]

  // Get audit events for this user
  const auditEvents = useMemo(() => {
    const events = auditLogger.getEvents()
    return events.filter(event => 
      event.userId === user.id &&
      (activityType === 'all' || event.eventType.includes(activityType))
    )
  }, [user.id, activityType])

  // Calculate activity summary
  const activitySummary: ActivitySummary = useMemo(() => {
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30d':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90d':
        cutoffDate.setDate(now.getDate() - 90)
        break
      default:
        cutoffDate.setFullYear(2000) // All time
    }

    const recentSessions = mockSessions.filter(session => session.startTime >= cutoffDate)
    const totalTime = recentSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    
    return {
      totalSessions: recentSessions.length,
      totalTime,
      averageSessionTime: recentSessions.length > 0 ? totalTime / recentSessions.length : 0,
      lastActivity: user.lastSignInAt,
      mostActiveDay: 'Monday', // Would be calculated from actual data
      deviceTypes: {
        Desktop: recentSessions.filter(s => s.userAgent?.includes('Windows')).length,
        Mobile: recentSessions.filter(s => s.userAgent?.includes('iPhone')).length,
        Tablet: 0,
      },
    }
  }, [mockSessions, timeRange, user.lastSignInAt])

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('iPhone') || userAgent.includes('Android')) {
      return '📱'
    }
    if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      return '📱'
    }
    return '💻'
  }

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('login')) return '🔐'
    if (eventType.includes('access')) return '👁️'
    if (eventType.includes('role')) return '👤'
    if (eventType.includes('security')) return '🛡️'
    return '📝'
  }

  const getEventColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 dark:text-red-400'
      case 'medium':
        return 'text-orange-600 dark:text-orange-400'
      case 'low':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-muted-foreground'
    }
  }

  if (!canViewActivity) {
    return (
      <Card className={`p-6 ${className}`} data-testid="activity-access-denied">
        <div className="text-center text-muted-foreground">
          <p>You don't have permission to view this user's activity.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="user-activity-monitor">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {isOwnProfile ? 'Your Activity' : `${user.firstName}'s Activity`}
          </h3>
          <p className="text-sm text-muted-foreground">
            Session history and security monitoring
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="p-2 border border-border rounded-md bg-background text-sm"
            data-testid="time-range-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as any)}
            className="p-2 border border-border rounded-md bg-background text-sm"
            data-testid="activity-type-select"
          >
            <option value="all">All activity</option>
            <option value="login">Login events</option>
            <option value="access">Access events</option>
            <option value="role">Role changes</option>
            <option value="security">Security events</option>
          </select>
        </div>
      </div>

      {/* Activity Summary */}
      <Card className="p-6" data-testid="activity-summary">
        <h4 className="text-md font-medium text-foreground mb-4">Activity Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{activitySummary.totalSessions}</div>
            <div className="text-sm text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {formatDuration(activitySummary.totalTime)}
            </div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {formatDuration(activitySummary.averageSessionTime)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Session</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {activitySummary.lastActivity 
                ? activitySummary.lastActivity.toLocaleDateString()
                : 'Never'
              }
            </div>
            <div className="text-sm text-muted-foreground">Last Active</div>
          </div>
        </div>
      </Card>

      {/* Device Usage */}
      <Card className="p-6" data-testid="device-usage">
        <h4 className="text-md font-medium text-foreground mb-4">Device Usage</h4>
        <div className="space-y-3">
          {Object.entries(activitySummary.deviceTypes).map(([device, count]) => (
            <div key={device} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>{device === 'Desktop' ? '💻' : device === 'Mobile' ? '📱' : '📱'}</span>
                <span className="text-foreground">{device}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ 
                      width: `${activitySummary.totalSessions > 0 ? (count / activitySummary.totalSessions) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Sessions */}
      <Card className="p-6" data-testid="recent-sessions">
        <h4 className="text-md font-medium text-foreground mb-4">Recent Sessions</h4>
        <div className="space-y-3">
          {mockSessions.length > 0 ? (
            mockSessions.map((session) => (
              <div 
                key={session.id} 
                className="flex items-center justify-between p-3 border border-border rounded-lg"
                data-testid={`session-${session.id}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getDeviceIcon(session.userAgent || '')}</span>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {session.startTime.toLocaleDateString()} at {session.startTime.toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.location} • {session.ipAddress}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-foreground">
                    {session.duration ? formatDuration(session.duration) : 'Active'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.endTime ? 'Ended' : 'Ongoing'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No recent sessions found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Audit Events */}
      <Can permission="view_audit_logs">
        <Card className="p-6" data-testid="audit-events">
          <h4 className="text-md font-medium text-foreground mb-4">Security Events</h4>
          <div className="space-y-3">
            {auditEvents.length > 0 ? (
              auditEvents.slice(0, 10).map((event, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                  data-testid={`audit-event-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getEventIcon(event.eventType)}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {event.eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleDateString()} at {event.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getEventColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </div>
                    {event.details && (
                      <div className="text-xs text-muted-foreground max-w-32 truncate">
                        {typeof event.details === 'string' ? event.details : JSON.stringify(event.details)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No security events found</p>
              </div>
            )}
          </div>
        </Card>
      </Can>

      {/* Export Options */}
      <Can permission="export_user_data">
        <Card className="p-6" data-testid="export-options">
          <h4 className="text-md font-medium text-foreground mb-4">Export Data</h4>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" data-testid="export-sessions">
              Export Sessions
            </Button>
            <Button variant="outline" size="sm" data-testid="export-audit-log">
              Export Audit Log
            </Button>
            <Button variant="outline" size="sm" data-testid="export-full-report">
              Full Activity Report
            </Button>
          </div>
        </Card>
      </Can>
    </div>
  )
}