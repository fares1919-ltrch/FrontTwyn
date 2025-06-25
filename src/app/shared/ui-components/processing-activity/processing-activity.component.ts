import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
    ApexChart,
    ChartComponent,
    ApexDataLabels,
    ApexLegend,
    ApexStroke,
    ApexTooltip,
    ApexAxisChartSeries,
    ApexPlotOptions,
    ApexResponsive,
    NgApexchartsModule,
} from 'ng-apexcharts';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { DashboardService, DashboardStats } from 'src/app/services/dashboard.service';

export interface ProcessingActivityChart {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    tooltip: ApexTooltip;
    stroke: ApexStroke;
    legend: ApexLegend;
    responsive: ApexResponsive;
}

@Component({
    selector: 'app-processing-activity',
    imports: [NgApexchartsModule, MaterialModule, TablerIconsModule, CommonModule, RouterModule],
    templateUrl: './processing-activity.component.html',
})
export class AppProcessingActivityComponent implements OnInit {
    @ViewChild('chart') chart: ChartComponent = Object.create(null);

    public processingActivityChart!: Partial<ProcessingActivityChart> | any;
    dashboardStats: DashboardStats | null = null;
    isLoading = true;
    error: string | null = null;

    constructor(private dashboardService: DashboardService) {}

    ngOnInit(): void {
        this.loadProcessingActivity();
    }

    private loadProcessingActivity(): void {
        this.isLoading = true;
        this.error = null;

        this.dashboardService.getDashboardStats().subscribe({
            next: (stats: DashboardStats) => {
                this.dashboardStats = stats;
                this.updateChart();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading processing activity:', error);
                this.error = 'Failed to load processing data';
                this.isLoading = false;
                this.initializeEmptyChart();
            }
        });
    }

    private updateChart(): void {
        if (!this.dashboardStats) {
            this.initializeEmptyChart();
            return;
        }

        // Generate sample activity data for the last 7 days
        const activityData = this.generateActivityData();

        this.processingActivityChart = {
            series: [
                {
                    name: 'Files Processed',
                    color: '#49BEFF',
                    data: activityData,
                },
            ],
            chart: {
                type: 'area',
                fontFamily: "'Plus Jakarta Sans', sans-serif;",
                foreColor: '#adb0bb',
                toolbar: {
                    show: false,
                },
                height: 85,
                sparkline: {
                    enabled: true,
                },
                group: 'sparklines',
            },
            stroke: {
                curve: 'smooth',
                width: 2,
            },
            fill: {
                colors: ['#E8F7FF'],
                type: 'solid',
                opacity: 0.05,
            },
            markers: {
                size: 0,
            },
            tooltip: {
                theme: 'dark',
                x: {
                    show: false,
                },
                y: {
                    formatter: function (val: number) {
                        return val + ' files';
                    },
                },
            },
        };
    }

    private generateActivityData(): number[] {
        if (!this.dashboardStats) return [0, 0, 0, 0, 0, 0, 0];

        // Generate realistic activity data based on total processed files
        const baseActivity = Math.floor(this.dashboardStats.processedFiles / 7);
        const variation = Math.floor(baseActivity * 0.3);

        return Array.from({ length: 7 }, () => {
            const randomVariation = Math.floor(Math.random() * variation * 2) - variation;
            return Math.max(0, baseActivity + randomVariation);
        });
    }

    private initializeEmptyChart(): void {
        this.processingActivityChart = {
            series: [
                {
                    name: 'Files Processed',
                    color: '#49BEFF',
                    data: [0, 0, 0, 0, 0, 0, 0],
                },
            ],
            chart: {
                type: 'area',
                fontFamily: "'Plus Jakarta Sans', sans-serif;",
                foreColor: '#adb0bb',
                toolbar: {
                    show: false,
                },
                height: 85,
                sparkline: {
                    enabled: true,
                },
                group: 'sparklines',
            },
            stroke: {
                curve: 'smooth',
                width: 2,
            },
            fill: {
                colors: ['#E8F7FF'],
                type: 'solid',
                opacity: 0.05,
            },
            markers: {
                size: 0,
            },
            tooltip: {
                theme: 'dark',
                x: {
                    show: false,
                },
            },
        };
    }

    getProcessingRateColor(): string {
        if (!this.dashboardStats) return 'text-muted';

        const rate = this.dashboardStats.processingRate;
        if (rate >= 100) return 'text-success';
        if (rate >= 50) return 'text-warning';
        return 'text-error';
    }

    getProcessingRateIcon(): string {
        if (!this.dashboardStats) return 'minus';

        const rate = this.dashboardStats.processingRate;
        if (rate >= 100) return 'arrow-up-right';
        if (rate >= 50) return 'arrow-right';
        return 'arrow-down-right';
    }

    formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    refreshActivity(): void {
        this.loadProcessingActivity();
    }
}
