import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardStats } from 'src/app/services/dashboard.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserRole } from 'src/app/services/admin.service';

interface UserStatsChart {
  series: number[];
  chart: any;
  labels: string[];
  colors: string[];
  legend: any;
  dataLabels: any;
}

@Component({
  selector: 'app-user-management-overview',
  imports: [NgApexchartsModule, MaterialModule, TablerIconsModule, CommonModule, RouterModule],
  templateUrl: './user-management-overview.component.html',
})
export class AppUserManagementOverviewComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);

  public userStatsChart!: Partial<UserStatsChart> | any;
  dashboardStats: DashboardStats | null = null;
  isLoading = true;
  error: string | null = null;
  isAdmin = false;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkAdminAccess();
    if (this.isAdmin) {
      this.loadUserStats();
    } else {
      this.isLoading = false;
    }
  }

  private checkAdminAccess(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Handle both string and numeric role types
      const userRole = currentUser.role;
      if (typeof userRole === 'string') {
        this.isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';
      } else if (typeof userRole === 'number') {
        this.isAdmin = userRole === UserRole.Admin || userRole === UserRole.SuperAdmin;
      } else {
        this.isAdmin = false;
      }
    }
  }

  private loadUserStats(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getDashboardStats().subscribe({
      next: (stats: DashboardStats) => {
        this.dashboardStats = stats;
        this.initializeChart();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user stats:', error);
        this.error = 'Failed to load user statistics';
        this.isLoading = false;
      }
    });
  }

  private initializeChart(): void {
    if (!this.dashboardStats) return;

    const validatedUsers = this.dashboardStats.totalUsers - this.dashboardStats.pendingUsers;

    this.userStatsChart = {
      series: [validatedUsers, this.dashboardStats.pendingUsers],
      chart: {
        type: 'donut',
        height: 200,
        fontFamily: 'inherit',
        foreColor: '#adb0bb',
      },
      colors: ['#4CAF50', '#FF9800'],
      labels: ['Validated Users', 'Pending Validation'],
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            background: 'transparent',
          },
        },
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false,
      },
    };
  }

  refreshStats(): void {
    if (this.isAdmin) {
      this.loadUserStats();
    }
  }

  getValidationRate(): number {
    if (!this.dashboardStats || this.dashboardStats.totalUsers === 0) return 0;
    const validatedUsers = this.dashboardStats.totalUsers - this.dashboardStats.pendingUsers;
    return Math.round((validatedUsers / this.dashboardStats.totalUsers) * 100);
  }

  getValidatedUsers(): number {
    if (!this.dashboardStats) return 0;
    return this.dashboardStats.totalUsers - this.dashboardStats.pendingUsers;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
