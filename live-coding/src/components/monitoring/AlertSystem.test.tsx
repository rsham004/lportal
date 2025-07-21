import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AlertSystem } from './AlertSystem';

// Mock the monitoring services
jest.mock('../../lib/monitoring/applicationMonitor', () => ({
  ApplicationMonitor: {
    getInstance: jest.fn(() => ({
      getActiveAlerts: jest.fn().mockReturnValue([
        {
          id: 'alert1',
          type: 'high_memory',
          severity: 'high',
          message: 'High memory usage detected: 85%',
          timestamp: Date.now() - 5000,
          resolved: false
        },
        {
          id: 'alert2',
          type: 'slow_response',
          severity: 'medium',
          message: 'Slow API response time: 1500ms',
          timestamp: Date.now() - 10000,
          resolved: false
        }
      ]),
      startMonitoring: jest.fn(),
      stop: jest.fn()
    }))
  }
}));

jest.mock('../../lib/monitoring/errorTracker', () => ({
  ErrorTracker: {
    getInstance: jest.fn(() => ({
      detectIncidents: jest.fn().mockReturnValue([
        {
          id: 'incident1',
          type: 'high_error_rate',
          severity: 'critical',
          message: 'High error rate detected: 15 errors in 5 minutes',
          timestamp: Date.now() - 2000,
          errorCount: 15,
          affectedUsers: ['user1', 'user2'],
          component: 'api'
        }
      ]),
      onCriticalError: jest.fn()
    }))
  }
}));

// Mock notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: jest.fn().mockImplementation((title, options) => ({
    title,
    ...options,
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

Object.defineProperty(Notification, 'permission', {
  writable: true,
  value: 'granted',
});

Object.defineProperty(Notification, 'requestPermission', {
  writable: true,
  value: jest.fn().mockResolvedValue('granted'),
});

describe('AlertSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the alert system', () => {
      render(<AlertSystem />);
      
      expect(screen.getByText('Alert System')).toBeInTheDocument();
    });

    it('should display active alerts', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('High memory usage detected: 85%')).toBeInTheDocument();
        expect(screen.getByText('Slow API response time: 1500ms')).toBeInTheDocument();
      });
    });

    it('should display incidents', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('High error rate detected: 15 errors in 5 minutes')).toBeInTheDocument();
      });
    });

    it('should show alert counts by severity', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('Critical: 1')).toBeInTheDocument();
        expect(screen.getByText('High: 1')).toBeInTheDocument();
        expect(screen.getByText('Medium: 1')).toBeInTheDocument();
      });
    });
  });

  describe('Alert Management', () => {
    it('should allow dismissing alerts', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        const dismissButton = screen.getAllByText('Dismiss')[0];
        fireEvent.click(dismissButton);
      });

      // Alert should be marked as dismissed
      expect(screen.queryByText('High memory usage detected: 85%')).not.toBeInTheDocument();
    });

    it('should allow acknowledging alerts', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        const acknowledgeButton = screen.getAllByText('Acknowledge')[0];
        fireEvent.click(acknowledgeButton);
      });

      // Alert should be marked as acknowledged
      expect(screen.getByText('Acknowledged')).toBeInTheDocument();
    });

    it('should show alert details when expanded', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        const expandButton = screen.getAllByText('Details')[0];
        fireEvent.click(expandButton);
      });

      expect(screen.getByText('Alert ID:')).toBeInTheDocument();
      expect(screen.getByText('Timestamp:')).toBeInTheDocument();
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter alerts by severity', async () => {
      render(<AlertSystem />);
      
      const severityFilter = screen.getByRole('combobox', { name: /filter by severity/i });
      fireEvent.change(severityFilter, { target: { value: 'high' } });
      
      await waitFor(() => {
        expect(screen.getByText('High memory usage detected: 85%')).toBeInTheDocument();
        expect(screen.queryByText('Slow API response time: 1500ms')).not.toBeInTheDocument();
      });
    });

    it('should filter alerts by type', async () => {
      render(<AlertSystem />);
      
      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i });
      fireEvent.change(typeFilter, { target: { value: 'high_memory' } });
      
      await waitFor(() => {
        expect(screen.getByText('High memory usage detected: 85%')).toBeInTheDocument();
        expect(screen.queryByText('Slow API response time: 1500ms')).not.toBeInTheDocument();
      });
    });

    it('should sort alerts by timestamp', async () => {
      render(<AlertSystem />);
      
      const sortButton = screen.getByRole('button', { name: /sort by time/i });
      fireEvent.click(sortButton);
      
      // Should sort alerts by timestamp (newest first by default)
      const alerts = screen.getAllByTestId('alert-item');
      expect(alerts[0]).toHaveTextContent('High memory usage detected');
    });

    it('should search alerts by message', async () => {
      render(<AlertSystem />);
      
      const searchInput = screen.getByRole('textbox', { name: /search alerts/i });
      fireEvent.change(searchInput, { target: { value: 'memory' } });
      
      await waitFor(() => {
        expect(screen.getByText('High memory usage detected: 85%')).toBeInTheDocument();
        expect(screen.queryByText('Slow API response time: 1500ms')).not.toBeInTheDocument();
      });
    });
  });

  describe('Notifications', () => {
    it('should request notification permission on mount', async () => {
      render(<AlertSystem enableNotifications />);
      
      await waitFor(() => {
        expect(Notification.requestPermission).toHaveBeenCalled();
      });
    });

    it('should show browser notifications for critical alerts', async () => {
      render(<AlertSystem enableNotifications />);
      
      // Simulate a new critical alert
      const mockErrorTracker = require('../../lib/monitoring/errorTracker').ErrorTracker.getInstance();
      const criticalErrorCallback = mockErrorTracker.onCriticalError.mock.calls[0][0];
      
      criticalErrorCallback({
        id: 'critical1',
        type: 'system',
        severity: 'critical',
        message: 'System failure detected',
        timestamp: Date.now()
      });
      
      await waitFor(() => {
        expect(window.Notification).toHaveBeenCalledWith(
          'Critical Alert',
          expect.objectContaining({
            body: 'System failure detected',
            icon: expect.any(String),
            tag: 'critical1'
          })
        );
      });
    });

    it('should play sound for critical alerts when enabled', async () => {
      const mockPlay = jest.fn();
      global.Audio = jest.fn().mockImplementation(() => ({
        play: mockPlay,
        pause: jest.fn(),
        load: jest.fn(),
      }));

      render(<AlertSystem enableNotifications enableSound />);
      
      // Simulate a critical alert
      const mockErrorTracker = require('../../lib/monitoring/errorTracker').ErrorTracker.getInstance();
      const criticalErrorCallback = mockErrorTracker.onCriticalError.mock.calls[0][0];
      
      criticalErrorCallback({
        id: 'critical1',
        type: 'system',
        severity: 'critical',
        message: 'System failure detected',
        timestamp: Date.now()
      });
      
      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update alerts in real-time when enabled', async () => {
      const mockStartMonitoring = jest.fn();
      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        startMonitoring: mockStartMonitoring,
      });

      render(<AlertSystem enableRealTime />);
      
      await waitFor(() => {
        expect(mockStartMonitoring).toHaveBeenCalled();
      });
    });

    it('should stop monitoring when component unmounts', () => {
      const mockStop = jest.fn();
      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        stop: mockStop,
      });

      const { unmount } = render(<AlertSystem enableRealTime />);
      unmount();
      
      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe('Alert Actions', () => {
    it('should show escalation options for critical alerts', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        const escalateButton = screen.getByText('Escalate');
        expect(escalateButton).toBeInTheDocument();
      });
    });

    it('should allow creating incidents from alerts', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        const createIncidentButton = screen.getAllByText('Create Incident')[0];
        fireEvent.click(createIncidentButton);
      });

      expect(screen.getByText('Create Incident')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /incident title/i })).toBeInTheDocument();
    });

    it('should allow adding notes to alerts', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        const addNoteButton = screen.getAllByText('Add Note')[0];
        fireEvent.click(addNoteButton);
      });

      const noteInput = screen.getByRole('textbox', { name: /add note/i });
      fireEvent.change(noteInput, { target: { value: 'Investigating this issue' } });
      
      const saveButton = screen.getByText('Save Note');
      fireEvent.click(saveButton);
      
      expect(screen.getByText('Investigating this issue')).toBeInTheDocument();
    });
  });

  describe('Alert History', () => {
    it('should show alert history when requested', async () => {
      render(<AlertSystem />);
      
      const historyButton = screen.getByText('View History');
      fireEvent.click(historyButton);
      
      expect(screen.getByText('Alert History')).toBeInTheDocument();
    });

    it('should allow exporting alert data', async () => {
      render(<AlertSystem />);
      
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      expect(screen.getByText('Export Alerts')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
    });
  });

  describe('Integration with Previous Phases', () => {
    it('should handle authentication-related alerts', async () => {
      // Mock auth-specific alert
      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        getActiveAlerts: jest.fn().mockReturnValue([
          {
            id: 'auth-alert',
            type: 'auth_failure',
            severity: 'medium',
            message: 'Multiple failed login attempts detected',
            timestamp: Date.now(),
            resolved: false,
            context: { userId: 'user123', attempts: 5 }
          }
        ])
      });

      render(<AlertSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('Multiple failed login attempts detected')).toBeInTheDocument();
        expect(screen.getByText('User: user123')).toBeInTheDocument();
      });
    });

    it('should handle content-related alerts', async () => {
      // Mock content-specific alert
      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        getActiveAlerts: jest.fn().mockReturnValue([
          {
            id: 'content-alert',
            type: 'video_failure',
            severity: 'high',
            message: 'Video streaming failure detected',
            timestamp: Date.now(),
            resolved: false,
            context: { courseId: 'course123', videoId: 'video456' }
          }
        ])
      });

      render(<AlertSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('Video streaming failure detected')).toBeInTheDocument();
        expect(screen.getByText('Course: course123')).toBeInTheDocument();
      });
    });

    it('should handle PWA-related alerts', async () => {
      // Mock PWA-specific alert
      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        getActiveAlerts: jest.fn().mockReturnValue([
          {
            id: 'pwa-alert',
            type: 'offline_sync_failure',
            severity: 'medium',
            message: 'Offline sync failure detected',
            timestamp: Date.now(),
            resolved: false,
            context: { feature: 'course_download', error: 'storage_quota_exceeded' }
          }
        ])
      });

      render(<AlertSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('Offline sync failure detected')).toBeInTheDocument();
        expect(screen.getByText('Feature: course_download')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /alert system/i })).toBeInTheDocument();
        expect(screen.getByRole('list', { name: /active alerts/i })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<AlertSystem />);
      
      await waitFor(() => {
        const firstAlert = screen.getAllByRole('listitem')[0];
        const dismissButton = firstAlert.querySelector('button');
        
        dismissButton?.focus();
        expect(dismissButton).toHaveFocus();
        
        fireEvent.keyDown(dismissButton!, { key: 'Enter' });
        // Should trigger dismiss action
      });
    });

    it('should announce new alerts to screen readers', async () => {
      render(<AlertSystem />);
      
      // Should have aria-live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of alerts efficiently', async () => {
      // Mock many alerts
      const manyAlerts = Array.from({ length: 100 }, (_, i) => ({
        id: `alert-${i}`,
        type: 'test_alert',
        severity: 'low' as const,
        message: `Test alert ${i}`,
        timestamp: Date.now() - i * 1000,
        resolved: false
      }));

      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        getActiveAlerts: jest.fn().mockReturnValue(manyAlerts)
      });

      const startTime = performance.now();
      render(<AlertSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('Test alert 0')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
    });

    it('should implement virtual scrolling for large alert lists', async () => {
      render(<AlertSystem />);
      
      // Should have virtual scrolling container
      expect(screen.getByTestId('alert-list-container')).toBeInTheDocument();
    });
  });
});