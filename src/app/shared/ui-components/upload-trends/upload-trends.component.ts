import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardStats } from 'src/app/services/dashboard.service';

interface UploadTrendsChart {
  series: any[];
  chart: any;
  xaxis: any;
  yaxis: any;
  colors: string[];
  dataLabels: any;
  grid: any;
  stroke: any;
  fill: any;
}

@Component({
  selector: 'app-upload-trends',
  imports: [NgApexchartsModule, MaterialModule, TablerIconsModule, CommonModule, RouterModule],
  templateUrl: './upload-trends.component.html',
})
export class AppUploadTrendsComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);

  public uploadTrendsChart!: Partial<UploadTrendsChart> | any;
  dashboardStats: DashboardStats | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadUploadTrends();
  }

  private loadUploadTrends(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getDashboardStats().subscribe({
      next: (stats: DashboardStats) => {
        this.dashboardStats = stats;
        this.initializeChart();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading upload trends:', error);
        this.error = 'Failed to load upload trends';
        this.isLoading = false;
        this.initializeEmptyChart();
      }
    });
  }

  private initializeChart(): void {
    if (!this.dashboardStats) return;

    // Generate sample data for the last 7 days
    const days = this.generateLast7Days();
    const uploadData = this.generateUploadData();

    this.uploadTrendsChart = {
      series: [
        {
          name: 'Files Uploaded',
          data: uploadData,
        },
      ],
      chart: {
        type: 'area',
        height: 200,
        fontFamily: 'inherit',
        foreColor: '#adb0bb',
        toolbar: {
          show: false,
        },
        sparkline: {
          enabled: true,
        },
      },
      colors: ['#2196F3'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 90, 100],
        },
      },
      xaxis: {
        categories: days,
        labels: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        show: false,
      },
      grid: {
        show: false,
      },
      tooltip: {
        theme: 'dark',
        x: {
          format: 'dd MMM',
        },
      },
    };
  }

  private initializeEmptyChart(): void {
    const days = this.generateLast7Days();
    const emptyData = new Array(7).fill(0);

    this.uploadTrendsChart = {
      series: [
        {
          name: 'Files Uploaded',
          data: emptyData,
        },
      ],
      chart: {
        type: 'area',
        height: 200,
        fontFamily: 'inherit',
        foreColor: '#adb0bb',
        toolbar: {
          show: false,
        },
        sparkline: {
          enabled: true,
        },
      },
      colors: ['#9E9E9E'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      xaxis: {
        categories: days,
        labels: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        show: false,
      },
      grid: {
        show: false,
      },
    };
  }

  private generateLast7Days(): string[] {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
  }

  private generateUploadData(): number[] {
    // Generate realistic upload data based on total files
    const baseValue = this.dashboardStats ? Math.floor(this.dashboardStats.totalFiles / 30) : 10;
    return Array.from({ length: 7 }, () =>
      Math.floor(baseValue * (0.5 + Math.random() * 1.5))
    );
  }

  refreshTrends(): void {
    this.loadUploadTrends();
  }

  getProcessingEfficiency(): number {
    if (!this.dashboardStats || this.dashboardStats.totalFiles === 0) return 0;
    return Math.round((this.dashboardStats.processedFiles / this.dashboardStats.totalFiles) * 100);
  }

  getAverageFilesPerDay(): number {
    if (!this.dashboardStats) return 0;
    return Math.floor(this.dashboardStats.totalFiles / 30); // Assuming 30 days
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
