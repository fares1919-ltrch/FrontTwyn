import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { NavItem } from '../layouts/full/sidebar/nav-item/nav-item';
import { UserRole } from './admin.service';

/**
 * Service to manage sidebar navigation items based on user roles
 * Integrates with backend role-based permissions
 *
 * Backend roles:
 * - User (0): Standard access to personal features
 * - Admin (1): Manage users and content
 * - SuperAdmin (2): Full system access and configuration
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarItemsService {
  private sidebarItemsSubject = new BehaviorSubject<NavItem[]>([]);
  public sidebarItems$ = this.sidebarItemsSubject.asObservable();

  constructor(public authService: AuthService) {
    // Subscribe to user changes to update sidebar items
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.updateSidebarItems(user.role);
      } else {
        // If no user, show empty sidebar
        this.sidebarItemsSubject.next([]);
      }
    });

    // Initial load - if user is already logged in
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.updateSidebarItems(currentUser.role);
    }
  }

  /**
   * Update sidebar items based on user role
   * Maps backend roles to frontend permissions
   *
   * @param userRole The user's role (string or number)
   */
  private updateSidebarItems(userRole: string | number): void {
    // Convert string role to number if needed
    let roleValue: UserRole;

    if (typeof userRole === 'string') {
      switch (userRole.toLowerCase()) {
        case 'superadmin':
          roleValue = UserRole.SuperAdmin;
          break;
        case 'admin':
          roleValue = UserRole.Admin;
          break;
        default:
          roleValue = UserRole.User;
      }
    } else {
      roleValue = userRole as UserRole;
    }

    // Get current user to check validation status
    const currentUser = this.authService.getCurrentUser();
    const isValidated = currentUser?.isValidated || false;

    // Start with User section which should always be visible
    let filteredItems: NavItem[] = [
      {
        navCap: 'User'
      },
      {
        displayName: 'Profile',
        iconName: 'user-circle',
        route: '/features/profile'
      }
    ];

    // Only add other sections if user is validated
    if (isValidated) {
      // Add Dashboard for all validated users
      filteredItems = [
        {
          navCap: 'Dashboard'
        },
        {
          displayName: 'Dashboard',
          iconName: 'dashboard',
          route: '/features/dashboard'
        },
        ...filteredItems // Add User section after Dashboard
      ];

      // For Admin and SuperAdmin, add Process Management
      if (roleValue === UserRole.Admin || roleValue === UserRole.SuperAdmin) {
        // Insert Process Management after Dashboard but before User section
        filteredItems.splice(filteredItems.length - 2, 0,
          {
            navCap: 'Process Management'
          },
          {
            displayName: 'Upload',
            iconName: 'upload',
            route: '/features/upload'
          },
          {
            displayName: 'Processes',
            iconName: 'list',
            route: '/features/processes'
          },
          {
            displayName: 'Deduplication',
            iconName: 'copy',
            route: '/features/deduplication'
          },
          {
            displayName: 'Conflicts',
            iconName: 'alert-triangle',
            route: '/features/conflicts'
          },
          {
            displayName: 'Exceptions',
            iconName: 'alert-circle',
            route: '/features/exceptions'
          },
          {
            displayName: 'Upload History',
            iconName: 'history',
            route: '/features/upload-history'
          }
        );

        // Add Administration section for SuperAdmin only
        if (roleValue === UserRole.SuperAdmin) {
          filteredItems.splice(filteredItems.length - 2, 0,
            {
              navCap: 'Administration'
            },
            {
              displayName: 'User Management',
              iconName: 'users',
              route: '/features/admin'
            }
          );

          // Add System Configuration for SuperAdmin only
          filteredItems.splice(filteredItems.length - 2, 0,
            {
              navCap: 'System Configuration'
            },
            {
              displayName: 'Blacklist',
              iconName: 'ban',
              route: '/features/blacklist'
            },
            {
              displayName: 'Audit',
              iconName: 'history',
              route: '/features/audit'
            }
          );
        }
      }
    }

    this.sidebarItemsSubject.next(filteredItems);
  }

  /**
   * Get current sidebar items
   *
   * @returns Current sidebar items
   */
  getSidebarItems(): NavItem[] {
    return this.sidebarItemsSubject.value;
  }
}
