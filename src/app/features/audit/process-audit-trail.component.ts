import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuditService, AuditLog } from '../../services/audit.service';
import { DeduplicationService } from '../../services/deduplication.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-process-audit-trail',
  templateUrl: './process-audit-trail.component.html',
  styleUrls: ['./process-audit-trail.component.scss'],
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule, FormsModule]
})
export class ProcessAuditTrailComponent implements OnInit {
  processId: string | null = null;
  auditLogs: AuditLog[] = [];
  isLoading = false;
  processDetails: any = null;
  displayedColumns: string[] = ['timestamp', 'action', 'username', 'details', 'result'];
  selectedLog: AuditLog | null = null;

  // Define the Process interface to match what's returned from the service
  process: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    username: string;
    totalFiles?: number;
    processedFiles?: number;
    currentStage?: string;
  } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auditService: AuditService,
    private deduplicationService: DeduplicationService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.processId = params['processId'] || null;
      if (this.processId) {
        this.loadProcessDetails();
        this.loadAuditTrail();
      } else {
        this.showNotification('No process ID provided', 'error');
      }
    });
  }

  loadProcessDetails(): void {
    if (!this.processId) return;

    this.deduplicationService.getProcessDetails(this.processId).subscribe({
      next: (process) => {
        this.processDetails = process;
      },
      error: (error: Error) => {
        console.error('Error loading process details:', error);
        this.showNotification('Error loading process details', 'error');
      }
    });
  }

  loadAuditTrail(): void {
    if (!this.processId) return;

    this.isLoading = true;
    console.log('Loading audit trail for process:', this.processId);

    this.auditService.getProcessAuditTrail(this.processId).subscribe({
      next: (response) => {
        console.log('Process audit trail API response:', response);

        if (response && response.data) {
          this.auditLogs = response.data;
          console.log(`Loaded ${this.auditLogs.length} audit logs`);

          if (this.auditLogs.length === 0) {
            this.showNotification('No audit logs found for this process', 'info');
          }
        } else {
          console.warn('Unexpected API response format:', response);
          this.auditLogs = [];
          this.showNotification('Received unexpected response format from server', 'warning');
        }
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error loading audit trail:', error);
        this.showNotification('Error loading audit trail: ' + error.message, 'error');
        this.isLoading = false;
      }
    });
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

  goToProcess(): void {
    if (this.processId) {
      this.router.navigate(['/features/deduplication'], {
        queryParams: { processId: this.processId }
      });
    }
  }

  goToProcesses(): void {
    this.router.navigate(['/features/processes']);
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: type === 'error' ? ['error-snackbar'] :
                  type === 'success' ? ['success-snackbar'] :
                  type === 'warning' ? ['warning-snackbar'] : ['info-snackbar']
    });
  }
}
