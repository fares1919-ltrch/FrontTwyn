import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { DuplicateRecordService, DuplicateRecord, DuplicateMatch } from '../../../services/duplicate-record.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UploadService } from 'src/app/services/upload.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-duplicate-record-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './duplicate-record-dialog.component.html',
  styleUrls: ['./duplicate-record-dialog.component.scss']
})
export class DuplicateRecordDialogComponent implements OnInit {
  record: DuplicateRecord | null = null;
  isLoading = true;
  error: string | null = null;
  originalImagePreview: string | null = null;
  duplicateImagePreviews: Map<string, string> = new Map();

  constructor(
    public dialogRef: MatDialogRef<DuplicateRecordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { recordId: string },
    private duplicateRecordService: DuplicateRecordService,
    private uploadService: UploadService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRecordDetails();
  }

  /**
   * Load the duplicate record details
   */
  loadRecordDetails(): void {
    this.isLoading = true;
    this.error = null;

    // Validate record ID
    if (!this.data || !this.data.recordId) {
      this.error = 'Invalid record ID provided.';
      this.isLoading = false;
      return;
    }

    this.duplicateRecordService.getDuplicateRecord(this.data.recordId).subscribe({
      next: (record) => {
        if (!record) {
          this.error = 'No record data returned from server.';
          this.isLoading = false;
          return;
        }

        this.record = record;
        this.isLoading = false;

        // Create default values for missing properties to prevent errors
        if (!this.record.status) {
          this.record.status = 'Unknown';
        }

        if (!this.record.duplicates) {
          this.record.duplicates = [];
        }

        // Load image previews
        this.loadImagePreviews();
      },
      error: (error) => {
        console.error('Error loading duplicate record:', error);
        this.error = 'Failed to load record details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Load image previews for the original file and duplicates
   */
  loadImagePreviews(): void {
    if (!this.record) return;

    // Only try to load the original file preview if we have a valid originalFileId
    if (this.record.originalFileId) {
      this.uploadService.getFilePreview(this.record.originalFileId).subscribe({
        next: (preview) => {
          if (preview) {
            this.originalImagePreview = preview;
          }
        },
        error: (error) => {
          console.error('Error loading original file preview:', error);
          // We'll just leave originalImagePreview as null, which will show the "No preview available" message
        }
      });
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleString();
  }

  /**
   * Close the dialog
   */
  close(): void {
    this.dialogRef.close();
  }

  deletePhoto(photoId: number): void {
    if (!this.record) return;
    
    this.isLoading = true;
    this.duplicateRecordService.deletePhoto(this.record.id, photoId).subscribe({
      next: () => {
        // After successful deletion, reload the entire record
        this.duplicateRecordService.getDuplicateRecord(this.record!.id).subscribe({
          next: (updatedRecord) => {
            this.record = updatedRecord;
            this.isLoading = false;
            this.showNotification('Photo deleted successfully', 'success');
            
            // Reload image previews if needed
            this.loadImagePreviews();
          },
          error: (error) => {
            console.error('Error reloading record:', error);
            this.isLoading = false;
            this.showNotification('Photo deleted but failed to refresh data. Please close and reopen the dialog.', 'error');
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.showNotification('Failed to delete photo. Please try again.', 'error');
        console.error('Error deleting photo:', error);
      }
    });
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification-${type}`]
    });
  }
}
