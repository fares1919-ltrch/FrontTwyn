import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeduplicationService, Process } from './deduplication.service';
import { ConflictService, Conflict } from './conflict.service';
import { ExceptionService, Exception } from './exception.service';
import { DuplicateRecordService, DuplicateRecord } from './duplicate-record.service';
import { UserService, UserDTO } from './admin.service';
import { AuthService } from './auth.service';

export interface DashboardStats {
  totalProcesses: number;
  activeProcesses: number;
  completedProcesses: number;
  totalFiles: number;
  processedFiles: number;
  duplicatesFound: number;
  conflictsDetected: number;
  exceptionsRaised: number;
  totalUsers: number;
  pendingUsers: number;
  processingRate: number; // files per hour
  successRate: number; // percentage
}

export interface ProcessStatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  type: 'process' | 'duplicate' | 'conflict' | 'exception';
  title: string;
  description: string;
  timestamp: string;
  status: string;
  icon: string;
  color: string;
}

export interface MonthlyProcessingData {
  month: string;
  processesCreated: number;
  filesProcessed: number;
  duplicatesFound: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private deduplicationService: DeduplicationService,
    private conflictService: ConflictService,
    private exceptionService: ExceptionService,
    private duplicateRecordService: DuplicateRecordService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  /**
   * Get comprehensive dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      processes: this.deduplicationService.getAllProcesses(),
      conflicts: this.conflictService.getAllConflicts(),
      exceptions: this.exceptionService.getAllExceptions(),
      duplicates: this.duplicateRecordService.getAllDuplicateRecords(),
      users: this.getUserStats()
    }).pipe(
      map(data => {
        const processes = data.processes || [];
        const conflicts = data.conflicts || [];
        const exceptions = data.exceptions || [];
        const duplicates = data.duplicates || [];
        const users = data.users || [];

        // Calculate process statistics
        const activeProcesses = processes.filter(p =>
          p.status === 'In Processing' || p.status === 'Ready to Start'
        ).length;

        const completedProcesses = processes.filter(p =>
          p.status === 'Completed' || p.status === 'Cleaned'
        ).length;

        // Calculate file statistics
        const totalFiles = processes.reduce((sum, p) => sum + (p.totalFiles || 0), 0);
        const processedFiles = processes.reduce((sum, p) => sum + (p.processedFiles || 0), 0);

        // Calculate user statistics
        const pendingUsers = users.filter(u => !u.isValidated).length;

        // Calculate processing rate (files per hour) - simplified calculation
        const processingRate = this.calculateProcessingRate(processes);

        // Calculate success rate
        const successRate = totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0;

        return {
          totalProcesses: processes.length,
          activeProcesses,
          completedProcesses,
          totalFiles,
          processedFiles,
          duplicatesFound: duplicates.length,
          conflictsDetected: conflicts.length,
          exceptionsRaised: exceptions.length,
          totalUsers: users.length,
          pendingUsers,
          processingRate: Math.round(processingRate),
          successRate: Math.round(successRate * 100) / 100
        };
      }),
      catchError(error => {
        console.error('Error fetching dashboard stats:', error);
        return of({
          totalProcesses: 0,
          activeProcesses: 0,
          completedProcesses: 0,
          totalFiles: 0,
          processedFiles: 0,
          duplicatesFound: 0,
          conflictsDetected: 0,
          exceptionsRaised: 0,
          totalUsers: 0,
          pendingUsers: 0,
          processingRate: 0,
          successRate: 0
        });
      })
    );
  }

  /**
   * Get process status distribution for charts
   */
  getProcessStatusDistribution(): Observable<ProcessStatusDistribution[]> {
    return this.deduplicationService.getAllProcesses().pipe(
      map(processes => {
        const statusCounts = new Map<string, number>();
        const total = processes.length;

        // Count processes by status
        processes.forEach(process => {
          const status = process.status || 'Unknown';
          statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
        });

        // Convert to array with percentages and colors
        const distribution: ProcessStatusDistribution[] = [];
        const statusColors = {
          'Completed': '#4CAF50',
          'In Processing': '#2196F3',
          'Ready to Start': '#FF9800',
          'Error': '#F44336',
          'Paused': '#9E9E9E',
          'ConflictDetected': '#E91E63',
          'Cleaning': '#00BCD4',
          'Cleaned': '#8BC34A'
        };

        statusCounts.forEach((count, status) => {
          distribution.push({
            status,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            color: statusColors[status as keyof typeof statusColors] || '#607D8B'
          });
        });

        return distribution.sort((a, b) => b.count - a.count);
      }),
      catchError(error => {
        console.error('Error fetching process status distribution:', error);
        return of([]);
      })
    );
  }

  /**
   * Get recent activity for the dashboard
   */
  getRecentActivity(limit: number = 10): Observable<RecentActivity[]> {
    return forkJoin({
      processes: this.deduplicationService.getAllProcesses(),
      conflicts: this.conflictService.getAllConflicts(),
      exceptions: this.exceptionService.getAllExceptions(),
      duplicates: this.duplicateRecordService.getAllDuplicateRecords()
    }).pipe(
      map(data => {
        const activities: RecentActivity[] = [];

        // Add recent processes
        (data.processes || []).slice(0, 3).forEach(process => {
          activities.push({
            id: process.id,
            type: 'process',
            title: `Process ${this.getShortId(process.id)}`,
            description: `${process.status} - ${process.totalFiles} files`,
            timestamp: process.createdAt,
            status: process.status,
            icon: 'settings',
            color: this.getStatusColor(process.status)
          });
        });

        // Add recent conflicts
        (data.conflicts || []).slice(0, 2).forEach(conflict => {
          activities.push({
            id: conflict.id,
            type: 'conflict',
            title: 'Conflict Detected',
            description: `${conflict.fileName} - ${conflict.confidence}% confidence`,
            timestamp: conflict.createdAt,
            status: conflict.status,
            icon: 'alert-triangle',
            color: '#E91E63'
          });
        });

        // Add recent exceptions
        (data.exceptions || []).slice(0, 2).forEach(exception => {
          activities.push({
            id: exception.id,
            type: 'exception',
            title: 'Exception Raised',
            description: `${exception.fileName} - Processing error`,
            timestamp: exception.createdAt,
            status: exception.status,
            icon: 'alert-circle',
            color: '#F44336'
          });
        });

        // Sort by timestamp and limit
        return activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      }),
      catchError(error => {
        console.error('Error fetching recent activity:', error);
        return of([]);
      })
    );
  }

  /**
   * Get monthly processing data for trends
   */
  getMonthlyProcessingData(): Observable<MonthlyProcessingData[]> {
    return this.deduplicationService.getAllProcesses().pipe(
      map(processes => {
        const monthlyData = new Map<string, MonthlyProcessingData>();

        processes.forEach(process => {
          const date = new Date(process.createdAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
              month: monthName,
              processesCreated: 0,
              filesProcessed: 0,
              duplicatesFound: 0
            });
          }

          const data = monthlyData.get(monthKey)!;
          data.processesCreated++;
          data.filesProcessed += process.processedFiles || 0;
          data.duplicatesFound += process.duplicateRecordsCount || 0;
        });

        return Array.from(monthlyData.values())
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6); // Last 6 months
      }),
      catchError(error => {
        console.error('Error fetching monthly processing data:', error);
        return of([]);
      })
    );
  }

  /**
   * Get user statistics (only for admins)
   */
  private getUserStats(): Observable<UserDTO[]> {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && this.hasAdminRole(currentUser.role)) {
      return this.userService.getAllUsers();
    }
    return of([]);
  }

  /**
   * Check if the user has Admin or SuperAdmin role
   */
  private hasAdminRole(role: string | number): boolean {
    if (typeof role === 'string') {
      return role === 'Admin' || role === 'SuperAdmin';
    } else {
      return role === 1 || role === 2; // 1 = Admin, 2 = SuperAdmin
    }
  }

  /**
   * Calculate processing rate in files per hour
   */
  private calculateProcessingRate(processes: Process[]): number {
    const completedProcesses = processes.filter(p =>
      p.status === 'Completed' && p.processStartDate && p.processEndDate
    );

    if (completedProcesses.length === 0) return 0;

    let totalFiles = 0;
    let totalHours = 0;

    completedProcesses.forEach(process => {
      if (process.processStartDate && process.processEndDate) {
        const startTime = new Date(process.processStartDate).getTime();
        const endTime = new Date(process.processEndDate).getTime();
        const hours = (endTime - startTime) / (1000 * 60 * 60);

        if (hours > 0) {
          totalFiles += process.processedFiles || 0;
          totalHours += hours;
        }
      }
    });

    return totalHours > 0 ? totalFiles / totalHours : 0;
  }

  /**
   * Get short ID from full ID
   */
  private getShortId(fullId: string): string {
    if (fullId && fullId.includes('/')) {
      return fullId.split('/')[1];
    }
    return fullId || 'Unknown';
  }

  /**
   * Get color based on status
   */
  private getStatusColor(status: string): string {
    const colors = {
      'Completed': '#4CAF50',
      'In Processing': '#2196F3',
      'Ready to Start': '#FF9800',
      'Error': '#F44336',
      'Paused': '#9E9E9E',
      'ConflictDetected': '#E91E63',
      'Cleaning': '#00BCD4',
      'Cleaned': '#8BC34A'
    };
    return colors[status as keyof typeof colors] || '#607D8B';
  }
}
