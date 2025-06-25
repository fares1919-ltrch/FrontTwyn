import { Routes } from '@angular/router';

// ui
import { AppBadgeComponent } from 'src/app/shared/ui-components/badge/badge.component';
import { AppChipsComponent } from 'src/app/shared/ui-components/chips/chips.component';
import { AppListsComponent } from 'src/app/shared/ui-components/lists/lists.component';
import { AppTooltipsComponent } from 'src/app/shared/ui-components/tooltips/tooltips.component';
import { AppFormsComponent } from 'src/app/shared/ui-components/forms/forms.component';
import { UploadComponent } from 'src/app/features/upload/upload.component';
import { UserProfileComponent } from 'src/app/features/profile/user-profile.component';
import { AppHistoryComponent } from 'src/app/shared/ui-components/history/history.component';
import { AdminsComponent } from 'src/app/features/admin/admins.component';

// Guards
import { AuthGuard } from '../../guards/auth.guard';
import { RoleGuard } from '../../guards/role.guard';
import { UserRole } from '../../services/admin.service';


export const UiComponentsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'badge',
        component: AppBadgeComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'chips',
        component: AppChipsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'lists',
        component: AppListsComponent,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.SuperAdmin] }
      },
      {
        path: 'tooltips',
        component: AppTooltipsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'forms',
        component: AppFormsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'Upload',
        component: UploadComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'User-Profile',
        component: UserProfileComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'history',
        component: AppHistoryComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'Admins',
        component: AdminsComponent,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.Admin, UserRole.SuperAdmin] }
      }
    ],
  },
];
