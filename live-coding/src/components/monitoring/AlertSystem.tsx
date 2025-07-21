'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ApplicationMonitor, type Alert } from '../../lib/monitoring/applicationMonitor';
import { ErrorTracker, type Incident, type ErrorEvent } from '../../lib/monitoring/errorTracker';

interface AlertSystemProps {
  className?: string;
  enableNotifications?: boolean;
  enableSound?: boolean;
  enableRealTime?: boolean;
  maxDisplayedAlerts?: number;
}

interface AlertNote {
  id: string;
  alertId: string;
  message: string;
  timestamp: number;
  author: string;
}

interface AlertState extends Alert {
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  dismissed?: boolean;
  notes?: AlertNote[];
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type TypeFilter = 'all' | string;
type SortOrder = 'newest' | 'oldest' | 'severity';

export const AlertSystem: React.FC<AlertSystemProps> = ({
  className = '',
  enableNotifications = false,
  enableSound = false,
  enableRealTime = false,
  maxDisplayedAlerts = 50,
}) => {
  const [alerts, setAlerts] = useState<AlertState[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertState | null>(null);
  const [newNote, setNewNote] = useState('');
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  const monitor = ApplicationMonitor.getInstance();
  const errorTracker = ErrorTracker.getInstance();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Initialize audio for sound alerts
  useEffect(() => {
    if (enableSound) {
      audioRef.current = new Audio('/alert-sound.mp3'); // You'd need to add this file
      audioRef.current.volume = 0.5;
    }
  }, [enableSound]);

  // Request notification permission
  useEffect(() => {
    if (enableNotifications && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, [enableNotifications]);

  // Load initial data
  const loadAlerts = useCallback(async () => {
    try {
      const activeAlerts = monitor.getActiveAlerts();
      const detectedIncidents = errorTracker.detectIncidents();
      
      setAlerts(activeAlerts.map(alert => ({ ...alert })));
      setIncidents(detectedIncidents);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }, [monitor, errorTracker]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Real-time monitoring
  useEffect(() => {
    if (enableRealTime) {
      monitor.startMonitoring((data) => {
        setAlerts(data.alerts.map((alert: Alert) => ({ ...alert })));
      }, 5000);

      return () => {
        monitor.stop();
      };
    }
  }, [enableRealTime, monitor]);

  // Critical error notifications
  useEffect(() => {
    if (enableNotifications || enableSound) {
      const handleCriticalError = (error: ErrorEvent) => {
        // Show browser notification
        if (enableNotifications && notificationPermission === 'granted') {
          new Notification('Critical Alert', {
            body: error.message,
            icon: '/alert-icon.png',
            tag: error.id,
            requireInteraction: true,
          });
        }

        // Play sound
        if (enableSound && audioRef.current) {
          audioRef.current.play().catch(console.error);
        }

        // Announce to screen readers
        if (announcementRef.current) {
          announcementRef.current.textContent = `Critical alert: ${error.message}`;
        }
      };

      errorTracker.onCriticalError(handleCriticalError);
    }
  }, [enableNotifications, enableSound, notificationPermission, errorTracker]);

  // Filter and sort alerts
  const filteredAlerts = alerts
    .filter(alert => {
      if (alert.dismissed) return false;
      if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
      if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
      if (searchQuery && !alert.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return b.timestamp - a.timestamp;
        case 'oldest':
          return a.timestamp - b.timestamp;
        case 'severity':
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        default:
          return b.timestamp - a.timestamp;
      }
    })
    .slice(0, maxDisplayedAlerts);

  // Get alert counts by severity
  const alertCounts = alerts.reduce((counts, alert) => {
    if (!alert.dismissed) {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
    }
    return counts;
  }, {} as Record<string, number>);

  // Include incidents in critical count
  alertCounts.critical = (alertCounts.critical || 0) + incidents.filter(i => !i.resolved).length;

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            acknowledged: true, 
            acknowledgedBy: 'current-user', // In real app, get from auth context
            acknowledgedAt: Date.now() 
          } 
        : alert
    ));
  };

  const handleAddNote = (alertId: string) => {
    if (!newNote.trim()) return;

    const note: AlertNote = {
      id: `note_${Date.now()}`,
      alertId,
      message: newNote.trim(),
      timestamp: Date.now(),
      author: 'current-user', // In real app, get from auth context
    };

    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, notes: [...(alert.notes || []), note] }
        : alert
    ));

    setNewNote('');
    setSelectedAlert(null);
  };

  const handleCreateIncident = (alert: AlertState) => {
    if (!incidentTitle.trim()) return;

    // In a real app, this would create an incident in the system
    console.log('Creating incident:', {
      title: incidentTitle,
      alertId: alert.id,
      severity: alert.severity,
      description: alert.message,
    });

    setIncidentTitle('');
    setShowCreateIncident(false);
    setSelectedAlert(null);
  };

  const handleExportAlerts = (format: 'json' | 'csv') => {
    const dataToExport = alerts.filter(alert => !alert.dismissed);
    
    if (format === 'json') {
      const jsonData = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alerts_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csvHeaders = 'ID,Type,Severity,Message,Timestamp,Acknowledged\n';
      const csvData = dataToExport.map(alert => 
        `"${alert.id}","${alert.type}","${alert.severity}","${alert.message}","${new Date(alert.timestamp).toISOString()}","${alert.acknowledged || false}"`
      ).join('\n');
      
      const blob = new Blob([csvHeaders + csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alerts_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    setShowExportModal(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  const getContextDisplay = (alert: AlertState) => {
    if (!alert.context) return null;

    const contextItems = [];
    if (alert.context.userId) contextItems.push(`User: ${alert.context.userId}`);
    if (alert.context.courseId) contextItems.push(`Course: ${alert.context.courseId}`);
    if (alert.context.videoId) contextItems.push(`Video: ${alert.context.videoId}`);
    if (alert.context.feature) contextItems.push(`Feature: ${alert.context.feature}`);
    if (alert.context.attempts) contextItems.push(`Attempts: ${alert.context.attempts}`);

    return contextItems.length > 0 ? contextItems.join(' • ') : null;
  };

  return (
    <div className={`alert-system ${className}`}>
      <div role="region" aria-label="Alert System">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Alert System</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Monitor and manage system alerts and incidents
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                View History
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm font-medium text-red-800">Critical: {alertCounts.critical || 0}</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-800">High: {alertCounts.high || 0}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm font-medium text-yellow-800">Medium: {alertCounts.medium || 0}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-800">Low: {alertCounts.low || 0}</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              aria-label="Search alerts"
            />
          </div>
          
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            aria-label="Filter by severity"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            <option value="high_memory">Memory</option>
            <option value="slow_response">Response Time</option>
            <option value="auth_failure">Authentication</option>
            <option value="video_failure">Video</option>
            <option value="offline_sync_failure">PWA Sync</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            aria-label="Sort by time"
          >
            Sort by Time {sortOrder === 'newest' ? '↓' : '↑'}
          </button>
        </div>

        {/* Incidents Section */}
        {incidents.filter(i => !i.resolved).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Incidents</h3>
            <div className="space-y-3">
              {incidents.filter(i => !i.resolved).map((incident) => (
                <div key={incident.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">🚨</span>
                        <h4 className="text-sm font-medium text-red-900">{incident.message}</h4>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        {incident.errorCount} errors • {incident.affectedUsers.length} users affected
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {new Date(incident.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                        Escalate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Active Alerts ({filteredAlerts.length})
            </h3>
          </div>
          
          <div 
            className="max-h-96 overflow-y-auto"
            data-testid="alert-list-container"
          >
            <ul role="list" aria-label="Active alerts" className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <li key={alert.id} className="p-6" data-testid="alert-item">
                    <div className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{getSeverityIcon(alert.severity)}</span>
                            <h4 className="text-sm font-medium">{alert.message}</h4>
                            {alert.acknowledged && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Acknowledged
                              </span>
                            )}
                          </div>
                          
                          {getContextDisplay(alert) && (
                            <p className="text-xs mt-1 opacity-75">
                              {getContextDisplay(alert)}
                            </p>
                          )}
                          
                          <p className="text-xs mt-1 opacity-75">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>

                          {alert.notes && alert.notes.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {alert.notes.map((note) => (
                                <div key={note.id} className="text-xs bg-white bg-opacity-50 rounded p-2">
                                  <p>{note.message}</p>
                                  <p className="text-xs opacity-75 mt-1">
                                    {note.author} • {new Date(note.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          {!alert.acknowledged && (
                            <button
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            >
                              Acknowledge
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDismissAlert(alert.id)}
                            className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                          >
                            Dismiss
                          </button>
                          
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Details
                          </button>
                          
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                          >
                            Add Note
                          </button>
                          
                          {alert.severity === 'critical' || alert.severity === 'high' ? (
                            <button
                              onClick={() => {
                                setSelectedAlert(alert);
                                setShowCreateIncident(true);
                              }}
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                            >
                              Create Incident
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No active alerts
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Alert Details Modal */}
        {selectedAlert && !showCreateIncident && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Alert Details</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Alert ID:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">{selectedAlert.id}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Type:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">{selectedAlert.type}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Severity:</span>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Message:</span>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAlert.message}</p>
                </div>
                
                {/* Add Note Section */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add Note
                  </label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this alert..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                    aria-label="Add note"
                  />
                  <button
                    onClick={() => handleAddNote(selectedAlert.id)}
                    disabled={!newNote.trim()}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Incident Modal */}
        {showCreateIncident && selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create Incident</h3>
                <button
                  onClick={() => {
                    setShowCreateIncident(false);
                    setSelectedAlert(null);
                    setIncidentTitle('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Incident Title
                  </label>
                  <input
                    type="text"
                    value={incidentTitle}
                    onChange={(e) => setIncidentTitle(e.target.value)}
                    placeholder="Enter incident title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    aria-label="Incident title"
                  />
                </div>
                
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Based on alert:</span>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedAlert.message}</p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleCreateIncident(selectedAlert)}
                    disabled={!incidentTitle.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Incident
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateIncident(false);
                      setSelectedAlert(null);
                      setIncidentTitle('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Export Alerts</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose export format for active alerts:
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleExportAlerts('json')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => handleExportAlerts('csv')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screen reader announcements */}
        <div
          ref={announcementRef}
          role="status"
          aria-live="assertive"
          className="sr-only"
        />
      </div>
    </div>
  );
};