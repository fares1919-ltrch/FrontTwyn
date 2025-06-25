import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuditService, AuditLog, AuditLogFilter } from '../../services/audit.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule, FormsModule, ReactiveFormsModule]
})
export class AuditComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  dataSource = new MatTableDataSource<AuditLog>([]);
  isLoading = false;
  totalLogs = 0;
  displayedColumns: string[] = ['timestamp', 'action', 'username', 'entityType', 'entityId', 'processId', 'details', 'result'];
  selectedLog: AuditLog | null = null;
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private auditService: AuditService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      userId: [''],
      entityType: [''],
      entityId: [''],
      processId: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadAuditLogs();

    // Apply filters when form values change
    this.filterForm.valueChanges
      .pipe(debounceTime(500))
      .subscribe(() => {
        this.paginator.firstPage();
        this.loadAuditLogs();
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Reload data when paginator changes
    if (this.paginator) {
      this.paginator.page.subscribe(() => {
        this.loadAuditLogs();
      });
    }
  }

  loadAuditLogs(): void {
    this.isLoading = true;

    const filter: AuditLogFilter = {
      ...this.filterForm.value,
      skip: this.paginator ? this.paginator.pageIndex * this.paginator.pageSize : 0,
      take: this.paginator ? this.paginator.pageSize : 100
    };

    // Remove empty filters
    Object.keys(filter).forEach(key => {
      if (filter[key as keyof AuditLogFilter] === '' || filter[key as keyof AuditLogFilter] === null) {
        delete filter[key as keyof AuditLogFilter];
      }
    });

    console.log('Fetching audit logs with filter:', filter);

    this.auditService.getAuditLogs(filter).subscribe({
      next: (response) => {
        console.log('Audit logs API response:', response);

        if (response && response.data) {
          this.auditLogs = response.data;
          this.dataSource.data = this.auditLogs;
          this.totalLogs = response.count || this.auditLogs.length;

          if (this.auditLogs.length === 0) {
            this.showNotification('No audit logs found matching the current filters', 'info');
          }
        } else {
          console.warn('Unexpected API response format:', response);
          this.auditLogs = [];
          this.dataSource.data = [];
          this.totalLogs = 0;
          this.showNotification('Received unexpected response format from server', 'warning');
        }
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error loading audit logs:', error);
        this.showNotification('Error loading audit logs: ' + error.message, 'error');
        this.isLoading = false;
        this.auditLogs = [];
        this.dataSource.data = [];
      }
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadAuditLogs();
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  viewDetails(log: AuditLog): void {
    this.selectedLog = log;
  }

  closeDetails(): void {
    this.selectedLog = null;
  }

  viewProcessAuditTrail(processId: string): void {
    if (!processId) return;

    // Navigate to process audit trail
    this.router.navigate(['/features/process-audit-trail'], {
      queryParams: { processId: processId }
    });
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: type === 'error' ? ['error-snackbar'] :
                  type === 'success' ? ['success-snackbar'] :
                  type === 'warning' ? ['warning-snackbar'] : ['info-snackbar']
    });
  }

  /**
   * Test function to query for a known process ID from RavenDB
   * This helps diagnose issues with the API
   */
  testWithKnownProcess(): void {
    // Use the process ID from the RavenDB example
    const knownProcessId = 'processes/2bdbb6d1-3088-4804-9d85-e6f710f00a5d';

    this.filterForm.patchValue({
      processId: knownProcessId,
      userId: '',
      entityType: '',
      entityId: '',
      startDate: null,
      endDate: null
    });

    this.showNotification(`Testing with known process ID: ${knownProcessId}`, 'info');
    this.loadAuditLogs();

    // Also test the process-specific endpoint
    console.log('Testing process-specific endpoint...');
    this.auditService.getProcessAuditTrail(knownProcessId).subscribe({
      next: (response) => {
        console.log('Process-specific endpoint response:', response);
        if (response && response.data && response.data.length > 0) {
          this.showNotification(`Process-specific endpoint found ${response.data.length} logs`, 'success');
        } else {
          this.showNotification('Process-specific endpoint returned no logs', 'warning');
        }
      },
      error: (error) => {
        console.error('Error testing process-specific endpoint:', error);
        this.showNotification(`Process-specific endpoint error: ${error.message}`, 'error');
      }
    });
  }

  /**
   * Test function to query for a known user ID from RavenDB
   * This helps diagnose issues with the API
   */
  testWithKnownUser(): void {
    // Use the user ID from the RavenDB example
    const knownUserId = 'SuperAdminFares';

    this.filterForm.patchValue({
      processId: '',
      userId: knownUserId,
      entityType: '',
      entityId: '',
      startDate: null,
      endDate: null
    });

    this.showNotification(`Testing with known user ID: ${knownUserId}`, 'info');
    this.loadAuditLogs();
  }

  /**
   * Test function to query for a known entity from RavenDB
   * This helps diagnose issues with the API
   */
  testWithKnownEntity(): void {
    // Use the entity type and ID from the RavenDB example
    const knownEntityType = 'DeduplicationProcess';
    const knownEntityId = 'processes/2bdbb6d1-3088-4804-9d85-e6f710f00a5d';

    this.filterForm.patchValue({
      processId: '',
      userId: '',
      entityType: knownEntityType,
      entityId: knownEntityId,
      startDate: null,
      endDate: null
    });

    this.showNotification(`Testing with known entity: ${knownEntityType}/${knownEntityId}`, 'info');
    this.loadAuditLogs();

    // Also test the entity-specific endpoint
    console.log('Testing entity-specific endpoint...');
    this.auditService.getEntityAuditTrail(knownEntityType, knownEntityId).subscribe({
      next: (response) => {
        console.log('Entity-specific endpoint response:', response);
        if (response && response.data && response.data.length > 0) {
          this.showNotification(`Entity-specific endpoint found ${response.data.length} logs`, 'success');
        } else {
          this.showNotification('Entity-specific endpoint returned no logs', 'warning');
        }
      },
      error: (error) => {
        console.error('Error testing entity-specific endpoint:', error);
        this.showNotification(`Entity-specific endpoint error: ${error.message}`, 'error');
      }
    });
  }

  /**
   * Test function to make a direct API call to the audit endpoint
   * This helps diagnose issues with the API by bypassing the service layer
   */
  testDirectApiCall(): void {
    const token = localStorage.getItem('token');
    const apiUrl = 'https://localhost:7294/api/Audit';

    this.showNotification('Making direct API call to ' + apiUrl, 'info');

    // Make a direct fetch request to the API
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('Direct API call response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Direct API call response data:', data);
      this.showNotification(`Direct API call succeeded with ${data.count || 0} logs`, 'success');
    })
    .catch(error => {
      console.error('Direct API call error:', error);
      this.showNotification(`Direct API call failed: ${error.message}`, 'error');
    });

    // Also test the process-specific endpoint
    const processId = 'processes/2bdbb6d1-3088-4804-9d85-e6f710f00a5d';
    const processUrl = `${apiUrl}/process/${processId}`;

    this.showNotification('Making direct API call to ' + processUrl, 'info');

    fetch(processUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('Direct process API call response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Direct process API call response data:', data);
      this.showNotification(`Direct process API call succeeded with ${data.count || 0} logs`, 'success');
    })
    .catch(error => {
      console.error('Direct process API call error:', error);
      this.showNotification(`Direct process API call failed: ${error.message}`, 'error');
    });
  }
}
