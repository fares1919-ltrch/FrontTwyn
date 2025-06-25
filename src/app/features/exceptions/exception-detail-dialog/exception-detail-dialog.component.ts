import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { Exception } from '../../../services/exception.service';

export interface ExceptionDetailDialogData {
  exception: Exception;
}

@Component({
  selector: 'app-exception-detail-dialog',
  templateUrl: './exception-detail-dialog.component.html',
  styleUrls: ['./exception-detail-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, MaterialModule, MatDialogModule]
})
export class ExceptionDetailDialogComponent implements OnInit {
  exception: Exception;
  isLoading = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ExceptionDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExceptionDetailDialogData
  ) {
    this.exception = data.exception;
  }

  ngOnInit(): void {
    // No need to load data as it's passed directly to the component
  }

  /**
   * Close the dialog
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Format a date for display
   * @param dateString The date string to format
   * @returns Formatted date string
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleString();
  }

  /**
   * Format process ID for display
   * @param processId The full process ID
   * @returns The shortened process ID
   */
  formatProcessId(processId: string): string {
    if (!processId) return 'N/A';
    return processId.includes('/') ? processId.split('/')[1] : processId;
  }
}
