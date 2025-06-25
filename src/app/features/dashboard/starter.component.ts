import { Component, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { AppProcessOverviewComponent } from 'src/app/shared/ui-components/process-overview/process-overview.component';
import { AppSystemStatsComponent } from 'src/app/shared/ui-components/system-stats/system-stats.component';
import { AppProcessingActivityComponent } from 'src/app/shared/ui-components/processing-activity/processing-activity.component';
import { AppRecentActivityComponent } from 'src/app/shared/ui-components/recent-activity/recent-activity.component';
import { AppUserManagementOverviewComponent } from 'src/app/shared/ui-components/user-management-overview/user-management-overview.component';
import { AppUploadTrendsComponent } from 'src/app/shared/ui-components/upload-trends/upload-trends.component';
import { AppSystemHealthComponent } from 'src/app/shared/ui-components/system-health/system-health.component';

@Component({
  selector: 'app-starter',
  imports: [
    MaterialModule,
    AppProcessOverviewComponent,
    AppSystemStatsComponent,
    AppProcessingActivityComponent,
    AppRecentActivityComponent,
    AppUserManagementOverviewComponent,
    AppUploadTrendsComponent,
    AppSystemHealthComponent
  ],
  templateUrl: './starter.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class StarterComponent { }
