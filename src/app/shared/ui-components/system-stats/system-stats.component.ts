import { Component, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
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
import { MaterialModule } from 'src/app/material.module';
import { DashboardService, DashboardStats, ProcessStatusDistribution } from 'src/app/services/dashboard.service';

export interface SystemStatsChart {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    tooltip: ApexTooltip;
    stroke: ApexStroke;
    legend: ApexLegend;
    responsive: ApexResponsive;
    labels: string[];
    colors: string[];
}

@Component({
    selector: 'app-system-stats',
    templateUrl: './system-stats.component.html',
    imports: [MaterialModule, NgApexchartsModule, TablerIconsModule, CommonModule, RouterModule],
    encapsulation: ViewEncapsulation.None,
})
export class AppSystemStatsComponent implements OnInit {
    @ViewChild('chart') chart: ChartComponent = Object.create(null);

    public systemStatsChart!: Partial<SystemStatsChart> | any;
    dashboardStats: DashboardStats | null = null;
    isLoading = true;
    error: string | null = null;

    constructor(private dashboardService: DashboardService) {}

    ngOnInit(): void {
        this.loadSystemStats();
    }

    private loadSystemStats(): void {
        this.isLoading = true;
        this.error = null;

        this.dashboardService.getDashboardStats().subscribe({
            next: (stats: DashboardStats) => {
                this.dashboardStats = stats;
                this.loadProcessStatusDistribution();
            },
            error: (error) => {
                console.error('Error loading system stats:', error);
                this.error = 'Failed to load system statistics';
                this.isLoading = false;
                this.initializeEmptyChart();
            }
        });
    }

    private loadProcessStatusDistribution(): void {
        this.dashboardService.getProcessStatusDistribution().subscribe({
            next: (distribution: ProcessStatusDistribution[]) => {
                this.updateChart(distribution);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading process status distribution:', error);
                this.error = 'Failed to load process distribution';
                this.isLoading = false;
                this.initializeEmptyChart();
            }
        });
    }

    private updateChart(distribution: ProcessStatusDistribution[]): void {
        const series = distribution.map(item => item.count);
        const labels = distribution.map(item => item.status);
        const colors = distribution.map(item => item.color);

        this.systemStatsChart = {
            color: "#adb5bd",
            series: series,
            labels: labels,
            chart: {
                width: 125,
                type: "donut",
                fontFamily: "inherit",
                foreColor: "#adb0bb",
            },
            plotOptions: {
                pie: {
                    startAngle: 0,
                    endAngle: 360,
                    donut: {
                        size: "75%",
                    },
                },
            },
            stroke: {
                show: false,
            },
            dataLabels: {
                enabled: false,
            },
            legend: {
                show: false,
            },
            colors: colors,
            responsive: [
                {
                    breakpoint: 991,
                    options: {
                        chart: {
                            width: 120,
                        },
                    },
                },
            ],
            tooltip: {
                theme: "dark",
                fillSeriesColor: false,
                y: {
                    formatter: function (val: number) {
                        return val + " processes";
                    },
                },
            },
        };
    }

    private initializeEmptyChart(): void {
        this.systemStatsChart = {
            color: "#adb5bd",
            series: [1],
            labels: ["No Data"],
            chart: {
                width: 125,
                type: "donut",
                fontFamily: "inherit",
                foreColor: "#adb0bb",
            },
            plotOptions: {
                pie: {
                    startAngle: 0,
                    endAngle: 360,
                    donut: {
                        size: "75%",
                    },
                },
            },
            stroke: {
                show: false,
            },
            dataLabels: {
                enabled: false,
            },
            legend: {
                show: false,
            },
            colors: ['#E0E0E0'],
            responsive: [
                {
                    breakpoint: 991,
                    options: {
                        chart: {
                            width: 120,
                        },
                    },
                },
            ],
            tooltip: {
                theme: "dark",
                fillSeriesColor: false,
            },
        };
    }

    getSuccessRateColor(): string {
        if (!this.dashboardStats) return 'text-muted';

        const rate = this.dashboardStats.successRate;
        if (rate >= 90) return 'text-success';
        if (rate >= 70) return 'text-warning';
        return 'text-error';
    }

    getSuccessRateIcon(): string {
        if (!this.dashboardStats) return 'minus';

        const rate = this.dashboardStats.successRate;
        if (rate >= 90) return 'arrow-up-right';
        if (rate >= 70) return 'arrow-right';
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

    refreshStats(): void {
        this.loadSystemStats();
    }
}
