import { ApplicationMonitor } from './applicationMonitor';

export interface ErrorEvent {
  id: string;
  timestamp: number;
  type: 'javascript' | 'api' | 'authentication' | 'validation' | 'system' | 'content' | 'pwa';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  
  // API-specific fields
  endpoint?: string;
  method?: string;
  statusCode?: number;
  
  // Auth-specific fields
  userId?: string;
  authErrorType?: string;
  
  // Validation-specific fields
  validationErrors?: Record<string, string>;
  
  // System-specific fields
  systemComponent?: string;
  
  // Context and metadata
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
  sessionId?: string;
  
  // Resolution tracking
  resolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  resolution?: string;
}

export interface ErrorAnalysis {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  topErrors: Array<{
    message: string;
    count: number;
    percentage: number;
    lastOccurrence: number;
  }>;
  errorTrends: {
    hourly: number[];
    daily: number[];
  };
  affectedUsers: string[];
  errorRate: number; // errors per minute
  mttr: number; // mean time to resolution in minutes
}

export interface Incident {
  id: string;
  type: 'high_error_rate' | 'critical_error' | 'system_failure' | 'security_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  errorCount: number;
  affectedUsers: string[];
  component: string;
  resolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  resolution?: string;
}

export interface IncidentResponse {
  incidentId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: Array<{
    action: string;
    priority: number;
    assignee?: string;
    deadline?: number;
  }>;
  escalation: {
    required: boolean;
    level: 'none' | 'team_lead' | 'manager' | 'immediate';
    contacts: string[];
  };
  communication: {
    internal: string;
    external?: string;
    statusPage?: boolean;
  };
}

export interface ErrorReport {
  timestamp: number;
  summary: {
    totalErrors: number;
    errorRate: number;
    criticalErrors: number;
    resolvedErrors: number;
    mttr: number;
  };
  analysis: ErrorAnalysis;
  incidents: Incident[];
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high';
    category: string;
    description: string;
    action: string;
  }>;
}

export interface ErrorStatistics {
  totalErrors: number;
  errorRate: number;
  mttr: number;
  topErrorTypes: Array<{ type: string; count: number; percentage: number }>;
  criticalIncidents: number;
  resolvedIncidents: number;
  averageResolutionTime: number;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: ErrorEvent[] = [];
  private incidents: Incident[] = [];
  private resolvedIncidents: Incident[] = [];
  private monitor: ApplicationMonitor;
  private criticalErrorCallbacks: Array<(error: ErrorEvent) => void> = [];
  private lastNotificationTime = 0;
  private notificationCooldown = 60000; // 1 minute

  // Thresholds for incident detection
  private readonly thresholds = {
    errorRate: 10, // errors per minute
    criticalErrorCount: 5, // critical errors in 5 minutes
    systemErrorCount: 10, // system errors in 10 minutes
  };

  private constructor() {
    this.monitor = ApplicationMonitor.getInstance();
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Handle unhandled JavaScript errors
      window.addEventListener('error', (event) => {
        this.trackError(
          new Error(event.message),
          'javascript',
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            url: window.location.href,
          }
        );
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(
          new Error(event.reason?.message || 'Unhandled Promise Rejection'),
          'javascript',
          {
            reason: event.reason,
            url: window.location.href,
          }
        );
      });
    }
  }

  public trackError(
    error: Error,
    type: ErrorEvent['type'] = 'javascript',
    context?: Record<string, any>
  ): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type,
      severity: this.determineSeverity(error, type),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.getSessionId(),
    };

    this.addError(errorEvent);
  }

  public trackAPIError(
    endpoint: string,
    statusCode: number,
    message: string,
    context?: Record<string, any>
  ): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: 'api',
      severity: this.determineAPISeverity(statusCode),
      message,
      endpoint,
      statusCode,
      method: context?.method || 'GET',
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.getSessionId(),
    };

    this.addError(errorEvent);
  }

  public trackAuthError(
    authErrorType: string,
    userId?: string,
    context?: Record<string, any>
  ): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: 'authentication',
      severity: this.determineAuthSeverity(authErrorType),
      message: `Authentication error: ${authErrorType}`,
      userId,
      authErrorType,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.getSessionId(),
    };

    this.addError(errorEvent);
    this.monitor.recordMetric('auth_failure', 1);
  }

  public trackValidationError(
    form: string,
    validationErrors: Record<string, string>,
    context?: Record<string, any>
  ): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: 'validation',
      severity: 'low',
      message: `Validation errors in ${form}`,
      validationErrors,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.getSessionId(),
    };

    this.addError(errorEvent);
  }

  public trackSystemError(
    component: string,
    message: string,
    context?: Record<string, any>
  ): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: 'system',
      severity: 'high',
      message,
      systemComponent: component,
      context,
      sessionId: this.getSessionId(),
    };

    this.addError(errorEvent);
  }

  private addError(errorEvent: ErrorEvent): void {
    this.errors.push(errorEvent);
    
    // Keep only last 10000 errors to prevent memory issues
    if (this.errors.length > 10000) {
      this.errors.shift();
    }

    // Check for incidents
    this.checkForIncidents();

    // Trigger notifications for critical errors
    if (errorEvent.severity === 'critical') {
      this.triggerCriticalErrorNotification(errorEvent);
    }

    // Record metric in ApplicationMonitor
    this.monitor.recordMetric('error_tracked', 1);
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(error: Error, type: ErrorEvent['type']): ErrorEvent['severity'] {
    // Determine severity based on error type and message
    if (type === 'system') return 'high';
    if (error.message.toLowerCase().includes('critical')) return 'critical';
    if (error.message.toLowerCase().includes('fatal')) return 'critical';
    if (type === 'authentication') return 'medium';
    if (type === 'validation') return 'low';
    return 'medium';
  }

  private determineAPISeverity(statusCode: number): ErrorEvent['severity'] {
    if (statusCode >= 500) return 'high';
    if (statusCode === 401 || statusCode === 403) return 'medium';
    if (statusCode >= 400) return 'low';
    return 'low';
  }

  private determineAuthSeverity(authErrorType: string): ErrorEvent['severity'] {
    const criticalAuthErrors = ['account_locked', 'security_breach', 'unauthorized_access'];
    const highAuthErrors = ['invalid_credentials', 'session_expired'];
    
    if (criticalAuthErrors.includes(authErrorType)) return 'critical';
    if (highAuthErrors.includes(authErrorType)) return 'medium';
    return 'low';
  }

  private getSessionId(): string {
    // In a real app, this would get the actual session ID
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  public getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  public getErrorsByType(type: ErrorEvent['type']): ErrorEvent[] {
    return this.errors.filter(error => error.type === type);
  }

  public getErrorsByTimeRange(startTime: number, endTime: number): ErrorEvent[] {
    return this.errors.filter(error => 
      error.timestamp >= startTime && error.timestamp <= endTime
    );
  }

  public getErrorsByUser(userId: string): ErrorEvent[] {
    return this.errors.filter(error => 
      error.userId === userId || error.context?.userId === userId
    );
  }

  public searchErrors(query: string): ErrorEvent[] {
    const lowerQuery = query.toLowerCase();
    return this.errors.filter(error =>
      error.message.toLowerCase().includes(lowerQuery) ||
      error.stack?.toLowerCase().includes(lowerQuery) ||
      error.endpoint?.toLowerCase().includes(lowerQuery)
    );
  }

  public analyzeErrors(): ErrorAnalysis {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Count errors by type
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorCounts: Record<string, number> = {};
    const affectedUsersSet = new Set<string>();

    this.errors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
      
      if (error.userId) affectedUsersSet.add(error.userId);
      if (error.context?.userId) affectedUsersSet.add(error.context.userId);
    });

    // Top errors by frequency
    const topErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({
        message,
        count,
        percentage: (count / this.errors.length) * 100,
        lastOccurrence: Math.max(...this.errors
          .filter(e => e.message === message)
          .map(e => e.timestamp)
        ),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Error trends
    const hourlyErrors = this.calculateHourlyTrend(oneHourAgo, now);
    const dailyErrors = this.calculateDailyTrend(oneDayAgo, now);

    // Error rate (errors per minute)
    const recentErrors = this.errors.filter(e => e.timestamp >= oneHourAgo);
    const errorRate = recentErrors.length / 60; // per minute

    // MTTR calculation
    const resolvedErrors = this.errors.filter(e => e.resolved && e.resolvedAt);
    const mttr = resolvedErrors.length > 0
      ? resolvedErrors.reduce((sum, e) => sum + (e.resolvedAt! - e.timestamp), 0) / resolvedErrors.length / (60 * 1000)
      : 0;

    return {
      totalErrors: this.errors.length,
      errorsByType,
      errorsBySeverity,
      topErrors,
      errorTrends: {
        hourly: hourlyErrors,
        daily: dailyErrors,
      },
      affectedUsers: Array.from(affectedUsersSet),
      errorRate,
      mttr,
    };
  }

  private calculateHourlyTrend(startTime: number, endTime: number): number[] {
    const hourlyBuckets = new Array(24).fill(0);
    const hourMs = 60 * 60 * 1000;
    
    this.errors
      .filter(e => e.timestamp >= startTime && e.timestamp <= endTime)
      .forEach(error => {
        const hourIndex = Math.floor((error.timestamp - startTime) / hourMs);
        if (hourIndex >= 0 && hourIndex < 24) {
          hourlyBuckets[hourIndex]++;
        }
      });
    
    return hourlyBuckets;
  }

  private calculateDailyTrend(startTime: number, endTime: number): number[] {
    const dailyBuckets = new Array(7).fill(0);
    const dayMs = 24 * 60 * 60 * 1000;
    
    this.errors
      .filter(e => e.timestamp >= startTime && e.timestamp <= endTime)
      .forEach(error => {
        const dayIndex = Math.floor((error.timestamp - startTime) / dayMs);
        if (dayIndex >= 0 && dayIndex < 7) {
          dailyBuckets[dayIndex]++;
        }
      });
    
    return dailyBuckets;
  }

  public detectIncidents(): Incident[] {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const tenMinutesAgo = now - (10 * 60 * 1000);
    
    const incidents: Incident[] = [];
    
    // Check for high error rate
    const recentErrors = this.errors.filter(e => e.timestamp >= fiveMinutesAgo);
    if (recentErrors.length >= this.thresholds.errorRate * 5) {
      incidents.push({
        id: `incident_${Date.now()}_high_error_rate`,
        type: 'high_error_rate',
        severity: 'high',
        message: `High error rate detected: ${recentErrors.length} errors in 5 minutes`,
        timestamp: now,
        errorCount: recentErrors.length,
        affectedUsers: this.getAffectedUsers(recentErrors),
        component: 'application',
      });
    }

    // Check for critical errors
    const criticalErrors = this.errors.filter(e => 
      e.timestamp >= fiveMinutesAgo && e.severity === 'critical'
    );
    if (criticalErrors.length >= this.thresholds.criticalErrorCount) {
      incidents.push({
        id: `incident_${Date.now()}_critical_errors`,
        type: 'critical_error',
        severity: 'critical',
        message: `Multiple critical errors detected: ${criticalErrors.length} in 5 minutes`,
        timestamp: now,
        errorCount: criticalErrors.length,
        affectedUsers: this.getAffectedUsers(criticalErrors),
        component: 'system',
      });
    }

    // Check for system failures
    const systemErrors = this.errors.filter(e => 
      e.timestamp >= tenMinutesAgo && e.type === 'system'
    );
    if (systemErrors.length >= this.thresholds.systemErrorCount) {
      incidents.push({
        id: `incident_${Date.now()}_system_failure`,
        type: 'system_failure',
        severity: 'critical',
        message: `System failure detected: ${systemErrors.length} system errors in 10 minutes`,
        timestamp: now,
        errorCount: systemErrors.length,
        affectedUsers: this.getAffectedUsers(systemErrors),
        component: systemErrors[0].systemComponent || 'unknown',
      });
    }

    // Add new incidents
    incidents.forEach(incident => {
      if (!this.incidents.find(i => i.type === incident.type && !i.resolved)) {
        this.incidents.push(incident);
      }
    });

    return incidents;
  }

  private getAffectedUsers(errors: ErrorEvent[]): string[] {
    const users = new Set<string>();
    errors.forEach(error => {
      if (error.userId) users.add(error.userId);
      if (error.context?.userId) users.add(error.context.userId);
    });
    return Array.from(users);
  }

  private checkForIncidents(): void {
    this.detectIncidents();
  }

  public createIncidentResponse(incident: Incident): IncidentResponse {
    const actions: IncidentResponse['actions'] = [];
    const escalation: IncidentResponse['escalation'] = {
      required: false,
      level: 'none',
      contacts: [],
    };

    // Define actions based on incident type and severity
    switch (incident.type) {
      case 'high_error_rate':
        actions.push(
          { action: 'Investigate error patterns', priority: 1 },
          { action: 'Check system resources', priority: 2 },
          { action: 'Review recent deployments', priority: 3 }
        );
        break;
      
      case 'critical_error':
        actions.push(
          { action: 'Immediate investigation', priority: 1 },
          { action: 'Check affected users', priority: 2 },
          { action: 'Prepare rollback if needed', priority: 3 }
        );
        escalation.required = true;
        escalation.level = 'team_lead';
        break;
      
      case 'system_failure':
        actions.push(
          { action: 'Emergency system check', priority: 1 },
          { action: 'Activate backup systems', priority: 2 },
          { action: 'Notify stakeholders', priority: 3 }
        );
        escalation.required = true;
        escalation.level = 'immediate';
        break;
    }

    // Set escalation based on severity
    if (incident.severity === 'critical') {
      escalation.required = true;
      escalation.level = 'immediate';
      escalation.contacts = ['on-call-engineer', 'team-lead', 'manager'];
    }

    return {
      incidentId: incident.id,
      severity: incident.severity,
      actions,
      escalation,
      communication: {
        internal: `Incident ${incident.id}: ${incident.message}`,
        external: incident.severity === 'critical' ? 'Service disruption detected. Investigating.' : undefined,
        statusPage: incident.severity === 'critical',
      },
    };
  }

  public resolveIncident(incidentId: string, resolution: string, resolvedBy: string): void {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (incident) {
      incident.resolved = true;
      incident.resolvedAt = Date.now();
      incident.resolvedBy = resolvedBy;
      incident.resolution = resolution;
      
      this.resolvedIncidents.push(incident);
      this.incidents = this.incidents.filter(i => i.id !== incidentId);
    }
  }

  public getResolvedIncidents(): Incident[] {
    return [...this.resolvedIncidents];
  }

  public onCriticalError(callback: (error: ErrorEvent) => void): void {
    this.criticalErrorCallbacks.push(callback);
  }

  private triggerCriticalErrorNotification(error: ErrorEvent): void {
    const now = Date.now();
    
    // Implement cooldown to prevent notification spam
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      return;
    }
    
    this.lastNotificationTime = now;
    this.criticalErrorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in critical error callback:', err);
      }
    });
  }

  public generateErrorReport(): ErrorReport {
    const analysis = this.analyzeErrors();
    const activeIncidents = this.incidents.filter(i => !i.resolved);
    
    const recommendations = this.generateRecommendations(analysis);
    
    return {
      timestamp: Date.now(),
      summary: {
        totalErrors: analysis.totalErrors,
        errorRate: analysis.errorRate,
        criticalErrors: analysis.errorsBySeverity.critical || 0,
        resolvedErrors: this.errors.filter(e => e.resolved).length,
        mttr: analysis.mttr,
      },
      analysis,
      incidents: activeIncidents,
      recommendations,
    };
  }

  private generateRecommendations(analysis: ErrorAnalysis): ErrorReport['recommendations'] {
    const recommendations: ErrorReport['recommendations'] = [];
    
    if (analysis.errorRate > 5) {
      recommendations.push({
        priority: 'high',
        category: 'Performance',
        description: 'High error rate detected',
        action: 'Investigate and optimize error-prone components',
      });
    }
    
    if (analysis.errorsByType.authentication > 10) {
      recommendations.push({
        priority: 'medium',
        category: 'Security',
        description: 'High authentication error rate',
        action: 'Review authentication flow and security measures',
      });
    }
    
    if (analysis.mttr > 60) {
      recommendations.push({
        priority: 'medium',
        category: 'Process',
        description: 'High mean time to resolution',
        action: 'Improve incident response procedures and monitoring',
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  public exportErrors(format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify({
        timestamp: Date.now(),
        errors: this.errors,
        analysis: this.analyzeErrors(),
        incidents: this.incidents,
      }, null, 2);
    }
    
    if (format === 'csv') {
      const lines = ['timestamp,type,message,severity,userId,endpoint,statusCode'];
      
      this.errors.forEach(error => {
        lines.push([
          error.timestamp,
          error.type,
          `"${error.message.replace(/"/g, '""')}"`,
          error.severity,
          error.userId || '',
          error.endpoint || '',
          error.statusCode || '',
        ].join(','));
      });
      
      return lines.join('\n');
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }

  public getErrorStatistics(): ErrorStatistics {
    const analysis = this.analyzeErrors();
    const resolvedIncidents = this.resolvedIncidents.length;
    const totalIncidents = this.incidents.length + resolvedIncidents;
    
    const avgResolutionTime = resolvedIncidents > 0
      ? this.resolvedIncidents.reduce((sum, incident) => 
          sum + (incident.resolvedAt! - incident.timestamp), 0
        ) / resolvedIncidents / (60 * 1000)
      : 0;
    
    const topErrorTypes = Object.entries(analysis.errorsByType)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / analysis.totalErrors) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalErrors: analysis.totalErrors,
      errorRate: analysis.errorRate,
      mttr: analysis.mttr,
      topErrorTypes,
      criticalIncidents: this.incidents.filter(i => i.severity === 'critical').length,
      resolvedIncidents,
      averageResolutionTime: avgResolutionTime,
    };
  }

  public stop(): void {
    // Clean up any intervals or listeners if needed
    this.criticalErrorCallbacks = [];
  }
}