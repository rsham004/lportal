import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MonitoringDashboard } from './MonitoringDashboard';

// Mock the monitoring services
jest.mock('../../lib/monitoring/applicationMonitor', () => ({
  ApplicationMonitor: {
    getInstance: jest.fn(() => ({
      getSystemMetrics: jest.fn().mockResolvedValue({
        timestamp: Date.now(),
        memory: { used: 500, total: 1000, percentage: 50 },
        cpu: { usage: 30 },
        uptime: 3600
      }),
      getApplicationMetrics: jest.fn().mockReturnValue({
        apiResponseTime: { average: 150, min: 50, max: 300, count: 100, total: 15000, values: [] },
        userLogins: { total: 50, average: 50, min: 50, max: 50, count: 1, values: [50] },
        courseViews: { total: 200, average: 200, min: 200, max: 200, count: 1, values: [200] }
      }),
      getHealthStatus: jest.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: Date.now(),
        services: {
          database: { status: 'healthy', responseTime: 10 },
          cache: { status: 'healthy', responseTime: 5 },
          storage: { status: 'healthy', responseTime: 15 },
          video: { status: 'healthy', responseTime: 20 }
        },
        metrics: { memoryUsage: 50, cpuUsage: 30, responseTime: 150 }
      }),
      getActiveAlerts: jest.fn().mockReturnValue([]),
      startMonitoring: jest.fn(),
      stop: jest.fn(),
      isMonitoring: jest.fn().mockReturnValue(false)
    }))
  }
}));

jest.mock('../../lib/monitoring/performanceTracker', () => ({
  PerformanceTracker: {
    getInstance: jest.fn(() => ({
      getKPIDashboard: jest.fn().mockResolvedValue({
        timestamp: Date.now(),
        kpis: {
          uptime: { value: 99.9, target: 99.9, status: 'good', trend: 'stable', change: 0 },
          responseTime: { value: 150, target: 200, status: 'good', trend: 'stable', change: 0 },
          throughput: { value: 1200, target: 1000, status: 'good', trend: 'up', change: 5 },
          errorRate: { value: 0.5, target: 1, status: 'good', trend: 'down', change: -2 },
          userSatisfaction: { value: 85, target: 80, status: 'good', trend: 'up', change: 3 },
          memoryUsage: { value: 50, target: 80, status: 'good', trend: 'stable', change: 0 },
          cpuUsage: { value: 30, target: 80, status: 'good', trend: 'stable', change: 0 }
        },
        charts: {
          responseTime: { labels: ['1h', '2h', '3h'], data: [150, 160, 140], type: 'line', color: '#3B82F6' },
          throughput: { labels: ['1h', '2h', '3h'], data: [1000, 1100, 1200], type: 'area', color: '#10B981' },
          memoryUsage: { labels: ['1h', '2h', '3h'], data: [45, 50, 48], type: 'line', color: '#F59E0B' },
          cpuUsage: { labels: ['1h', '2h', '3h'], data: [25, 30, 28], type: 'line', color: '#EF4444' },
          errorRate: { labels: ['1h', '2h', '3h'], data: [0.8, 0.6, 0.5], type: 'bar', color: '#DC2626' }
        },
        alerts: []
      }),
      calculatePerformanceScore: jest.fn().mockResolvedValue({
        overall: 85,
        breakdown: { system: 80, application: 90, user: 85 }
      }),
      startRealTimeTracking: jest.fn(),
      stop: jest.fn(),
      isTracking: jest.fn().mockReturnValue(false)
    }))
  }
}));

jest.mock('../../lib/monitoring/errorTracker', () => ({
  ErrorTracker: {
    getInstance: jest.fn(() => ({
      getErrors: jest.fn().mockReturnValue([
        {
          id: 'error1',
          timestamp: Date.now() - 1000,
          type: 'javascript',
          severity: 'medium',
          message: 'Test error 1'
        },
        {
          id: 'error2',
          timestamp: Date.now() - 2000,
          type: 'api',
          severity: 'low',
          message: 'Test error 2'
        }
      ]),
      analyzeErrors: jest.fn().mockReturnValue({
        totalErrors: 2,
        errorsByType: { javascript: 1, api: 1 },
        errorsBySeverity: { medium: 1, low: 1 },
        topErrors: [
          { message: 'Test error 1', count: 1, percentage: 50, lastOccurrence: Date.now() - 1000 }
        ],
        errorTrends: { hourly: [0, 1, 1], daily: [2, 0, 0, 0, 0, 0, 0] },
        affectedUsers: [],
        errorRate: 0.1,
        mttr: 5
      }),
      detectIncidents: jest.fn().mockReturnValue([])
    }))
  }
}));

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Line Chart
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Bar Chart
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Doughnut Chart
    </div>
  ),
}));

describe('MonitoringDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the monitoring dashboard', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('System Monitoring Dashboard')).toBeInTheDocument();
      });
    });

    it('should display system health status', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
        expect(screen.getByText('Healthy')).toBeInTheDocument();
      });
    });

    it('should display KPI metrics', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Uptime')).toBeInTheDocument();
        expect(screen.getByText('99.9%')).toBeInTheDocument();
        expect(screen.getByText('Response Time')).toBeInTheDocument();
        expect(screen.getByText('150ms')).toBeInTheDocument();
      });
    });

    it('should display performance score', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Score')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
      });
    });

    it('should display error summary', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Summary')).toBeInTheDocument();
        expect(screen.getByText('Total Errors: 2')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should start real-time monitoring when enabled', async () => {
      const mockStartMonitoring = jest.fn();
      const mockStartTracking = jest.fn();
      
      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        startMonitoring: mockStartMonitoring,
      });
      
      require('../../lib/monitoring/performanceTracker').PerformanceTracker.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/performanceTracker').PerformanceTracker.getInstance(),
        startRealTimeTracking: mockStartTracking,
      });

      render(<MonitoringDashboard />);
      
      const realTimeToggle = screen.getByRole('checkbox', { name: /real-time updates/i });
      fireEvent.click(realTimeToggle);
      
      await waitFor(() => {
        expect(mockStartMonitoring).toHaveBeenCalled();
        expect(mockStartTracking).toHaveBeenCalled();
      });
    });

    it('should stop monitoring when disabled', async () => {
      const mockStop = jest.fn();
      
      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        stop: mockStop,
        isMonitoring: jest.fn().mockReturnValue(true),
      });

      render(<MonitoringDashboard />);
      
      const realTimeToggle = screen.getByRole('checkbox', { name: /real-time updates/i });
      fireEvent.click(realTimeToggle); // Enable first
      fireEvent.click(realTimeToggle); // Then disable
      
      await waitFor(() => {
        expect(mockStop).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between dashboard tabs', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      // Click on Performance tab
      fireEvent.click(screen.getByText('Performance'));
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();

      // Click on Errors tab
      fireEvent.click(screen.getByText('Errors'));
      expect(screen.getByText('Error Analysis')).toBeInTheDocument();

      // Click on System tab
      fireEvent.click(screen.getByText('System'));
      expect(screen.getByText('System Resources')).toBeInTheDocument();
    });
  });

  describe('Charts', () => {
    it('should render performance charts', async () => {
      render(<MonitoringDashboard />);
      
      // Switch to Performance tab
      fireEvent.click(screen.getByText('Performance'));
      
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should render error charts', async () => {
      render(<MonitoringDashboard />);
      
      // Switch to Errors tab
      fireEvent.click(screen.getByText('Errors'));
      
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Service Status', () => {
    it('should display service health indicators', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Cache')).toBeInTheDocument();
        expect(screen.getByText('Storage')).toBeInTheDocument();
        expect(screen.getByText('Video')).toBeInTheDocument();
      });
    });

    it('should show service response times', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('10ms')).toBeInTheDocument(); // Database response time
        expect(screen.getByText('5ms')).toBeInTheDocument();  // Cache response time
      });
    });
  });

  describe('Alerts', () => {
    it('should display active alerts when present', async () => {
      // Mock alerts
      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        getActiveAlerts: jest.fn().mockReturnValue([
          {
            id: 'alert1',
            type: 'high_memory',
            severity: 'high',
            message: 'High memory usage detected',
            timestamp: Date.now(),
            resolved: false
          }
        ])
      });

      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Alerts')).toBeInTheDocument();
        expect(screen.getByText('High memory usage detected')).toBeInTheDocument();
      });
    });

    it('should show no alerts message when no alerts are active', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('No active alerts')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data when refresh button is clicked', async () => {
      const mockGetSystemMetrics = jest.fn().mockResolvedValue({
        timestamp: Date.now(),
        memory: { used: 600, total: 1000, percentage: 60 },
        cpu: { usage: 40 },
        uptime: 3700
      });

      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        getSystemMetrics: mockGetSystemMetrics,
      });

      render(<MonitoringDashboard />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(mockGetSystemMetrics).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        const dashboard = screen.getByTestId('monitoring-dashboard');
        expect(dashboard).toHaveClass('mobile-layout');
      });
    });
  });

  describe('Integration with Previous Phases', () => {
    it('should display authentication metrics', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('User Logins')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
      });
    });

    it('should display content metrics', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Course Views')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
      });
    });

    it('should show PWA-specific metrics when available', async () => {
      // Mock PWA metrics
      require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance.mockReturnValue({
        ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance(),
        getApplicationMetrics: jest.fn().mockReturnValue({
          ...require('../../lib/monitoring/applicationMonitor').ApplicationMonitor.getInstance().getApplicationMetrics(),
          pwaInstalls: { total: 25, average: 25, min: 25, max: 25, count: 1, values: [25] },
          offlineUsage: { total: 15, average: 15, min: 15, max: 15, count: 1, values: [15] }
        })
      });

      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('PWA Installs')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Monitoring Dashboard');
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<MonitoringDashboard />);
      
      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      
      overviewTab.focus();
      fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
      
      expect(performanceTab).toHaveFocus();
    });
  });
});