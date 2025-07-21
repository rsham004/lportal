'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ApplicationMonitor, type SystemMetrics, type ApplicationMetrics, type HealthStatus, type Alert } from '../../lib/monitoring/applicationMonitor';
import { PerformanceTracker, type KPIDashboard, type PerformanceMetrics } from '../../lib/monitoring/performanceTracker';
import { ErrorTracker, type ErrorAnalysis } from '../../lib/monitoring/errorTracker';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonitoringDashboardProps {
  className?: string;
  refreshInterval?: number;
}

type TabType = 'overview' | 'performance' | 'errors' | 'system';

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  className = '',
  refreshInterval = 30000, // 30 seconds
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRealTime, setIsRealTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Data state
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [applicationMetrics, setApplicationMetrics] = useState<ApplicationMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [kpiDashboard, setKpiDashboard] = useState<KPIDashboard | null>(null);
  const [performanceScore, setPerformanceScore] = useState<{ overall: number; breakdown: any } | null>(null);
  const [errorAnalysis, setErrorAnalysis] = useState<ErrorAnalysis | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Service instances
  const monitor = ApplicationMonitor.getInstance();
  const performanceTracker = PerformanceTracker.getInstance();
  const errorTracker = ErrorTracker.getInstance();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [
        systemData,
        appData,
        healthData,
        kpiData,
        scoreData,
        errorData,
        alertData,
      ] = await Promise.all([
        monitor.getSystemMetrics(),
        Promise.resolve(monitor.getApplicationMetrics()),
        monitor.getHealthStatus(),
        performanceTracker.getKPIDashboard(),
        performanceTracker.calculatePerformanceScore(),
        Promise.resolve(errorTracker.analyzeErrors()),
        Promise.resolve(monitor.getActiveAlerts()),
      ]);

      setSystemMetrics(systemData);
      setApplicationMetrics(appData);
      setHealthStatus(healthData);
      setKpiDashboard(kpiData);
      setPerformanceScore(scoreData);
      setErrorAnalysis(errorData);
      setAlerts(alertData);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [monitor, performanceTracker, errorTracker]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time monitoring
  useEffect(() => {
    if (isRealTime) {
      monitor.startMonitoring((data) => {
        setSystemMetrics(data.system);
        setApplicationMetrics(data.application);
        setHealthStatus(data.health);
        setAlerts(data.alerts);
      }, 5000);

      performanceTracker.startRealTimeTracking((data) => {
        setKpiDashboard(data.dashboard);
        setPerformanceScore(data.score);
      }, 5000);

      return () => {
        monitor.stop();
        performanceTracker.stop();
      };
    }
  }, [isRealTime, monitor, performanceTracker]);

  // Periodic refresh when not in real-time mode
  useEffect(() => {
    if (!isRealTime) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [isRealTime, refreshInterval, loadData]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleRealTimeToggle = () => {
    setIsRealTime(!isRealTime);
  };

  const handleRefresh = () => {
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
        return '→';
      default:
        return '→';
    }
  };

  const formatNumber = (num: number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div 
      className={`monitoring-dashboard ${isMobile ? 'mobile-layout' : ''} ${className}`}
      data-testid="monitoring-dashboard"
    >
      <main role="main" aria-label="Monitoring Dashboard">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                System Monitoring Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Real-time system health and performance monitoring
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              {/* Real-time toggle */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isRealTime}
                  onChange={handleRealTimeToggle}
                  className="sr-only"
                  aria-label="Real-time updates"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isRealTime ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isRealTime ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Real-time updates
                </span>
              </label>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                aria-label="Refresh data"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* System Health */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">System Health</h3>
            <div className="mt-2 flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                getStatusColor(healthStatus?.status || 'unknown')
              }`}>
                {healthStatus?.status === 'healthy' ? 'Healthy' : 
                 healthStatus?.status === 'degraded' ? 'Degraded' : 
                 healthStatus?.status === 'unhealthy' ? 'Unhealthy' : 'Unknown'}
              </span>
            </div>
          </div>

          {/* Performance Score */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Performance Score</h3>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {performanceScore?.overall || 0}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Alerts</h3>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {alerts.length}
              </span>
              {alerts.length === 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">No active alerts</p>
              )}
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</h3>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {kpiDashboard?.kpis.uptime.value || 0}%
              </span>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {systemMetrics && formatDuration(systemMetrics.uptime)}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" role="tablist">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'performance', label: 'Performance' },
              { id: 'errors', label: 'Errors' },
              { id: 'system', label: 'System' },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* KPI Metrics */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Key Performance Indicators</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {kpiDashboard && Object.entries(kpiDashboard.kpis).map(([key, kpi]) => (
                      <div key={key} className="text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {key === 'uptime' ? `${kpi.value}%` :
                           key === 'responseTime' ? `${kpi.value}ms` :
                           key === 'throughput' ? formatNumber(kpi.value) :
                           key === 'errorRate' ? `${kpi.value}%` :
                           key === 'memoryUsage' || key === 'cpuUsage' ? `${kpi.value}%` :
                           formatNumber(kpi.value)}
                        </div>
                        <div className="flex items-center justify-center text-sm">
                          <span className={getStatusColor(kpi.status).split(' ')[0]}>
                            {getTrendIcon(kpi.trend)} {kpi.change > 0 ? '+' : ''}{kpi.change}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Status */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Service Status</h3>
                  <div className="space-y-3">
                    {healthStatus && Object.entries(healthStatus.services).map(([service, status]) => (
                      <div key={service} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            status.status === 'healthy' ? 'bg-green-400' :
                            status.status === 'degraded' ? 'bg-yellow-400' :
                            'bg-red-400'
                          }`} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {service}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {status.responseTime}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Metrics */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Application Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {applicationMetrics && (
                      <>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">User Logins</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {applicationMetrics.userLogins.total}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Course Views</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {applicationMetrics.courseViews.total}
                          </div>
                        </div>
                        {applicationMetrics.pwaInstalls && (
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">PWA Installs</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {applicationMetrics.pwaInstalls.total}
                            </div>
                          </div>
                        )}
                        {applicationMetrics.videoStarts && (
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Video Starts</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {applicationMetrics.videoStarts.total}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Alerts */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Alerts</h3>
                  {alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className={`p-3 rounded-md ${
                          alert.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                          alert.severity === 'high' ? 'bg-orange-50 border border-orange-200' :
                          alert.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                          'bg-blue-50 border border-blue-200'
                        }`}>
                          <div className="flex items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {alert.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No active alerts</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div id="performance-panel" role="tabpanel" aria-labelledby="performance-tab">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {kpiDashboard && (
                  <>
                    {/* Response Time Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Response Time</h4>
                      <Line
                        data={{
                          labels: kpiDashboard.charts.responseTime.labels,
                          datasets: [{
                            label: 'Response Time (ms)',
                            data: kpiDashboard.charts.responseTime.data,
                            borderColor: kpiDashboard.charts.responseTime.color,
                            backgroundColor: `${kpiDashboard.charts.responseTime.color}20`,
                            tension: 0.4,
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true },
                          },
                        }}
                      />
                    </div>

                    {/* Throughput Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Throughput</h4>
                      <Line
                        data={{
                          labels: kpiDashboard.charts.throughput.labels,
                          datasets: [{
                            label: 'Requests/sec',
                            data: kpiDashboard.charts.throughput.data,
                            borderColor: kpiDashboard.charts.throughput.color,
                            backgroundColor: `${kpiDashboard.charts.throughput.color}20`,
                            fill: true,
                            tension: 0.4,
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true },
                          },
                        }}
                      />
                    </div>

                    {/* Memory Usage Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Memory Usage</h4>
                      <Line
                        data={{
                          labels: kpiDashboard.charts.memoryUsage.labels,
                          datasets: [{
                            label: 'Memory %',
                            data: kpiDashboard.charts.memoryUsage.data,
                            borderColor: kpiDashboard.charts.memoryUsage.color,
                            backgroundColor: `${kpiDashboard.charts.memoryUsage.color}20`,
                            tension: 0.4,
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true, max: 100 },
                          },
                        }}
                      />
                    </div>

                    {/* CPU Usage Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">CPU Usage</h4>
                      <Line
                        data={{
                          labels: kpiDashboard.charts.cpuUsage.labels,
                          datasets: [{
                            label: 'CPU %',
                            data: kpiDashboard.charts.cpuUsage.data,
                            borderColor: kpiDashboard.charts.cpuUsage.color,
                            backgroundColor: `${kpiDashboard.charts.cpuUsage.color}20`,
                            tension: 0.4,
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true, max: 100 },
                          },
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Errors Tab */}
          {activeTab === 'errors' && (
            <div id="errors-panel" role="tabpanel" aria-labelledby="errors-tab">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Error Analysis</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {errorAnalysis && (
                  <>
                    {/* Error Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Error Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Total Errors:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{errorAnalysis.totalErrors}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Error Rate:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{errorAnalysis.errorRate.toFixed(2)}/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">MTTR:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{errorAnalysis.mttr.toFixed(1)} min</span>
                        </div>
                      </div>
                    </div>

                    {/* Error Types */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Errors by Type</h4>
                      <Bar
                        data={{
                          labels: Object.keys(errorAnalysis.errorsByType),
                          datasets: [{
                            label: 'Error Count',
                            data: Object.values(errorAnalysis.errorsByType),
                            backgroundColor: [
                              '#EF4444',
                              '#F59E0B',
                              '#10B981',
                              '#3B82F6',
                              '#8B5CF6',
                            ],
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true },
                          },
                        }}
                      />
                    </div>

                    {/* Top Errors */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Top Errors</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Error Message
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Count
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Percentage
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Last Occurrence
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {errorAnalysis.topErrors.slice(0, 5).map((error, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {error.message}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {error.count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {error.percentage.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(error.lastOccurrence).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div id="system-panel" role="tabpanel" aria-labelledby="system-tab">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Resources</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {systemMetrics && (
                  <>
                    {/* Memory Usage */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Memory Usage</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Used:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatNumber(systemMetrics.memory.used)} MB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Total:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatNumber(systemMetrics.memory.total)} MB
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${systemMetrics.memory.percentage}%` }}
                          />
                        </div>
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                          {systemMetrics.memory.percentage.toFixed(1)}% used
                        </div>
                      </div>
                    </div>

                    {/* CPU Usage */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">CPU Usage</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Current:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {systemMetrics.cpu.usage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${systemMetrics.cpu.usage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* System Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">System Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Uptime</div>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {formatDuration(systemMetrics.uptime)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Last Updated</div>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {new Date(systemMetrics.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};