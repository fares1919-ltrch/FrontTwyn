import { Component, ViewChild, OnInit } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
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
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  ApexMarkers,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { DashboardService, MonthlyProcessingData } from 'src/app/services/dashboard.service';

interface TimeRange {
  value: string;
  viewValue: string;
}

export interface ProcessOverviewChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  grid: ApexGrid;
  marker: ApexMarkers;
}

@Component({
  selector: 'app-process-overview',
  imports: [MaterialModule, TablerIconsModule, NgApexchartsModule, CommonModule, RouterModule],
  templateUrl: './process-overview.component.html',
})
export class AppProcessOverviewComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);

  public processOverviewChart!: Partial<ProcessOverviewChart> | any;
  isLoading = true;
  error: string | null = null;

  timeRanges: TimeRange[] = [
    { value: '6months', viewValue: 'Last 6 Months' },
    { value: '3months', viewValue: 'Last 3 Months' },
    { value: '1month', viewValue: 'Last Month' },
  ];

  selectedTimeRange = '6months';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadProcessOverviewData();
  }

  onTimeRangeChange(timeRange: string): void {
    this.selectedTimeRange = timeRange;
    this.loadProcessOverviewData();
  }

  loadProcessOverviewData(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getMonthlyProcessingData().subscribe({
      next: (data: MonthlyProcessingData[]) => {
        this.updateChart(data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading process overview data:', error);
        this.error = 'Failed to load process data';
        this.isLoading = false;
        this.initializeEmptyChart();
      }
    });
  }

  private updateChart(data: MonthlyProcessingData[]): void {
    // Filter data based on selected time range
    const filteredData = this.filterDataByTimeRange(data);

    const categories = filteredData.map(item => item.month);
    const processesData = filteredData.map(item => item.processesCreated);
    const filesData = filteredData.map(item => item.filesProcessed);

    this.processOverviewChart = {
      series: [
        {
          name: 'Processes Created',
          data: processesData,
          color: '#5D87FF',
        },
        {
          name: 'Files Processed',
          data: filesData,
          color: '#49BEFF',
        },
      ],
      grid: {
        borderColor: 'rgba(0,0,0,0.1)',
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '35%',
          borderRadius: [4],
          dataLabels: {
            position: 'top',
          },
        },
      },
      chart: {
        type: 'bar',
        height: 390,
        offsetX: -15,
        toolbar: { show: false },
        foreColor: '#adb0bb',
        fontFamily: 'inherit',
        sparkline: { enabled: false },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        fontFamily: 'inherit',
        markers: {
          width: 9,
          height: 9,
          strokeWidth: 0,
          radius: 20,
        },
      },
      xaxis: {
        type: 'category',
        categories: categories,
        labels: {
          style: { fontSize: '13px', colors: '#adb0bb', fontFamily: 'inherit' },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: '13px', colors: '#adb0bb', fontFamily: 'inherit' },
        },
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false,
        x: {
          show: true,
        },
        y: {
          formatter: function (val: number, opts: any) {
            const seriesName = opts.w.config.series[opts.seriesIndex].name;
            if (seriesName === 'Processes Created') {
              return val + ' processes';
            } else {
              return val + ' files';
            }
          },
        },
      },
      stroke: {
        show: true,
        width: 3,
        lineCap: 'butt',
        colors: ['transparent'],
      },
    };
  }

  private filterDataByTimeRange(data: MonthlyProcessingData[]): MonthlyProcessingData[] {
    const now = new Date();
    let monthsToShow = 6;

    switch (this.selectedTimeRange) {
      case '1month':
        monthsToShow = 1;
        break;
      case '3months':
        monthsToShow = 3;
        break;
      case '6months':
      default:
        monthsToShow = 6;
        break;
    }

    return data.slice(-monthsToShow);
  }

  private initializeEmptyChart(): void {
    this.processOverviewChart = {
      series: [
        {
          name: 'Processes Created',
          data: [],
          color: '#5D87FF',
        },
        {
          name: 'Files Processed',
          data: [],
          color: '#49BEFF',
        },
      ],
      grid: {
        borderColor: 'rgba(0,0,0,0.1)',
        strokeDashArray: 3,
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '35%', borderRadius: [4] },
      },
      chart: {
        type: 'bar',
        height: 390,
        offsetX: -15,
        toolbar: { show: false },
        foreColor: '#adb0bb',
        fontFamily: 'inherit',
        sparkline: { enabled: false },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
      },
      xaxis: {
        type: 'category',
        categories: [],
        labels: {
          style: { fontSize: '13px', colors: '#adb0bb', fontFamily: 'inherit' },
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: '13px', colors: '#adb0bb', fontFamily: 'inherit' },
        },
      },
      tooltip: {
        theme: 'dark',
      },
      stroke: {
        show: true,
        width: 3,
        colors: ['transparent'],
      },
    };
  }
}
