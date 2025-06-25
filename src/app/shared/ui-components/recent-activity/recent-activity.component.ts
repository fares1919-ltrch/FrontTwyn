import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterModule } from '@angular/router';
import { DashboardService, RecentActivity } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-recent-activity',
  imports: [CommonModule, MaterialModule, TablerIconsModule, RouterModule],
  templateUrl: './recent-activity.component.html',
})
export class AppRecentActivityComponent implements OnInit {
  recentActivities: RecentActivity[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadRecentActivity();
  }

  private loadRecentActivity(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getRecentActivity(8).subscribe({
      next: (activities: RecentActivity[]) => {
        this.recentActivities = activities;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading recent activity:', error);
        this.error = 'Failed to load recent activity';
        this.isLoading = false;
      }
    });
  }

  getActivityRoute(activity: RecentActivity): string[] {
    switch (activity.type) {
      case 'process':
        return ['/features/deduplication'];
      case 'conflict':
        return ['/features/conflicts'];
      case 'exception':
        return ['/features/exceptions'];
      case 'duplicate':
        return ['/features/deduplication'];
      default:
        return ['/dashboard'];
    }
  }

  getActivityRouteParams(activity: RecentActivity): any {
    switch (activity.type) {
      case 'process':
        return { processId: this.getShortId(activity.id) };
      case 'conflict':
        return { conflictId: this.getShortId(activity.id) };
      case 'exception':
        return { exceptionId: this.getShortId(activity.id) };
      case 'duplicate':
        return { duplicateId: this.getShortId(activity.id) };
      default:
        return {};
    }
  }

  private getShortId(fullId: string): string {
    if (fullId && fullId.includes('/')) {
      return fullId.split('/')[1];
    }
    return fullId || 'Unknown';
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses = {
      'Completed': 'bg-light-success text-success',
      'In Processing': 'bg-light-primary text-primary',
      'Ready to Start': 'bg-light-warning text-warning',
      'Error': 'bg-light-error text-error',
      'Paused': 'bg-light-secondary text-secondary',
      'ConflictDetected': 'bg-light-error text-error',
      'Pending': 'bg-light-warning text-warning',
      'Resolved': 'bg-light-success text-success',
      'Confirmed': 'bg-light-success text-success',
      'Rejected': 'bg-light-secondary text-secondary',
      'Unresolved': 'bg-light-error text-error'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-light-secondary text-secondary';
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityTime.toLocaleDateString();
  }

  refreshActivity(): void {
    this.loadRecentActivity();
  }

  getActivityTypeLabel(type: string): string {
    const typeLabels = {
      'process': 'Process',
      'conflict': 'Conflict',
      'exception': 'Exception',
      'duplicate': 'Duplicate'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  }

  getActivityIcon(type: string): string {
    const typeIcons = {
      'process': 'settings',
      'conflict': 'alert-triangle',
      'exception': 'alert-circle',
      'duplicate': 'copy'
    };
    return typeIcons[type as keyof typeof typeIcons] || 'circle';
  }
}
