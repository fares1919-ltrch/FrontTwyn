import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { DashboardService, DashboardStats } from 'src/app/services/dashboard.service';
import { interval, Subscription } from 'rxjs';

interface SystemAlert {
  type: 'error' | 'warning' | 'info';
  message: string;
  icon: string;
  color: string;
}

interface HealthMetric {
  name: string;
  value: number;
  status: 'good' | 'warning' | 'critical';
  icon: string;
  unit: string;
}

@Component({
  selector: 'app-system-health',
  imports: [MaterialModule, TablerIconsModule, CommonModule],
  templateUrl: './system-health.component.html',
})
export class AppSystemHealthComponent implements OnInit, OnDestroy {
  dashboardStats: DashboardStats | null = null;
  isLoading = true;
  error: string | null = null;
  lastUpdated: Date = new Date();

  healthMetrics: HealthMetric[] = [];
  systemAlerts: SystemAlert[] = [];
  overallHealth: 'good' | 'warning' | 'critical' = 'good';

  private refreshSubscription?: Subscription;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadSystemHealth();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private startAutoRefresh(): void {
    // Refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadSystemHealth();
    });
  }

  private loadSystemHealth(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getDashboardStats().subscribe({
      next: (stats: DashboardStats) => {
        this.dashboardStats = stats;
        this.calculateHealthMetrics();
        this.generateSystemAlerts();
        this.determineOverallHealth();
        this.lastUpdated = new Date();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading system health:', error);
        this.error = 'Failed to load system health';
        this.isLoading = false;
      }
    });
  }

  private calculateHealthMetrics(): void {
    if (!this.dashboardStats) return;

    this.healthMetrics = [
      {
        name: 'Success Rate',
        value: this.dashboardStats.successRate,
        status: this.getSuccessRateStatus(this.dashboardStats.successRate),
        icon: 'check-circle',
        unit: '%'
      },
      {
        name: 'Processing Rate',
        value: this.dashboardStats.processingRate,
        status: this.getProcessingRateStatus(this.dashboardStats.processingRate),
        icon: 'activity',
        unit: '/hr'
      },
      {
        name: 'Active Processes',
        value: this.dashboardStats.activeProcesses,
        status: this.getActiveProcessesStatus(this.dashboardStats.activeProcesses),
        icon: 'cpu',
        unit: ''
      },
      {
        name: 'Error Rate',
        value: this.calculateErrorRate(),
        status: this.getErrorRateStatus(this.calculateErrorRate()),
        icon: 'alert-circle',
        unit: '%'
      }
    ];
  }

  private generateSystemAlerts(): void {
    if (!this.dashboardStats) return;

    this.systemAlerts = [];

    // Check for high error rate
    const errorRate = this.calculateErrorRate();
    if (errorRate > 10) {
      this.systemAlerts.push({
        type: 'error',
        message: `High error rate detected: ${errorRate.toFixed(1)}%`,
        icon: 'alert-circle',
        color: 'text-error'
      });
    }

    // Check for pending conflicts
    if (this.dashboardStats.conflictsDetected > 0) {
      this.systemAlerts.push({
        type: 'warning',
        message: `${this.dashboardStats.conflictsDetected} conflicts require attention`,
        icon: 'alert-triangle',
        color: 'text-warning'
      });
    }

    // Check for low processing rate
    if (this.dashboardStats.processingRate < 10) {
      this.systemAlerts.push({
        type: 'warning',
        message: 'Processing rate is below optimal threshold',
        icon: 'trending-down',
        color: 'text-warning'
      });
    }

    // Check for pending user validations
    if (this.dashboardStats.pendingUsers > 5) {
      this.systemAlerts.push({
        type: 'info',
        message: `${this.dashboardStats.pendingUsers} users pending validation`,
        icon: 'users',
        color: 'text-info'
      });
    }

    // If no alerts, show system healthy message
    if (this.systemAlerts.length === 0) {
      this.systemAlerts.push({
        type: 'info',
        message: 'All systems operating normally',
        icon: 'check-circle',
        color: 'text-success'
      });
    }
  }

  private determineOverallHealth(): void {
    const criticalIssues = this.systemAlerts.filter(alert => alert.type === 'error').length;
    const warnings = this.systemAlerts.filter(alert => alert.type === 'warning').length;

    if (criticalIssues > 0) {
      this.overallHealth = 'critical';
    } else if (warnings > 0) {
      this.overallHealth = 'warning';
    } else {
      this.overallHealth = 'good';
    }
  }

  private calculateErrorRate(): number {
    if (!this.dashboardStats || this.dashboardStats.totalProcesses === 0) return 0;
    return (this.dashboardStats.exceptionsRaised / this.dashboardStats.totalProcesses) * 100;
  }

  private getSuccessRateStatus(rate: number): 'good' | 'warning' | 'critical' {
    if (rate >= 95) return 'good';
    if (rate >= 85) return 'warning';
    return 'critical';
  }

  private getProcessingRateStatus(rate: number): 'good' | 'warning' | 'critical' {
    if (rate >= 50) return 'good';
    if (rate >= 20) return 'warning';
    return 'critical';
  }

  private getActiveProcessesStatus(count: number): 'good' | 'warning' | 'critical' {
    if (count <= 10) return 'good';
    if (count <= 20) return 'warning';
    return 'critical';
  }

  private getErrorRateStatus(rate: number): 'good' | 'warning' | 'critical' {
    if (rate <= 5) return 'good';
    if (rate <= 15) return 'warning';
    return 'critical';
  }

  getHealthColor(): string {
    switch (this.overallHealth) {
      case 'good': return 'text-success';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-error';
      default: return 'text-muted';
    }
  }

  getHealthIcon(): string {
    switch (this.overallHealth) {
      case 'good': return 'check-circle';
      case 'warning': return 'alert-triangle';
      case 'critical': return 'alert-circle';
      default: return 'help-circle';
    }
  }

  getMetricColor(status: string): string {
    switch (status) {
      case 'good': return 'text-success';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-error';
      default: return 'text-muted';
    }
  }

  refreshHealth(): void {
    this.loadSystemHealth();
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getTimeSinceUpdate(): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - this.lastUpdated.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }
}
