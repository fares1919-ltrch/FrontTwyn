import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { UploadService, ExtractedFile } from '../../services/upload.service';
import { ConflictService, Conflict } from '../../services/conflict.service';

interface UploadResponse {
  success: boolean;
  processId?: string;
  message?: string;
  fileCount?: number;
  warning?: boolean;
  conflictId?: string;
  extractedFiles?: ExtractedFile[];
  response?: any;
}

/**
 * Upload component for handling tar.gz file uploads for deduplication
 *
 * This component allows users to:
 * 1. Select a tar.gz file containing images
 * 2. Upload the file to the backend
 * 3. Receive a process ID for deduplication
 * 4. Navigate to the deduplication component with the process ID
 */
@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressBarModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatGridListModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  selectedFiles: File[] = [];
  uploadProgress: number = 0;
  uploadInProgress: boolean = false;
  uploadComplete: boolean = false;
  processId: string = '';
  fileCount: number = 0;
  uploadedFiles: ExtractedFile[] = [];
  loadingFiles: boolean = false;
  hasConflicts: boolean = false;
  conflicts: Conflict[] = [];
  errorMessage: string = '';
  isMultipleImagesSelected: boolean = false;

  constructor(
    private uploadService: UploadService,
    private router: Router,
    private conflictService: ConflictService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Handle single tar.gz file selection
   */
  onFileSelected(event: any): void {
    this.resetState();

    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      // Validate file type
      if (!this.isTarGzFile(file)) {
        this.showNotification('Please select a valid tar.gz file', 'error');
        return;
      }

      this.selectedFiles = [file];
      this.isMultipleImagesSelected = false;
      this.showNotification('File selected: ' + file.name, 'info');
    }
  }

  /**
   * Handle multiple image files selection
   */
  onMultipleFilesSelected(event: any): void {
    this.resetState();

    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files) as File[];

      // Validate file types
      const invalidFiles = files.filter(file => !this.isImageFile(file));
      if (invalidFiles.length > 0) {
        // Get the names of invalid files to show in the error message
        const invalidFileNames = invalidFiles.map(file => file.name).join(', ');

        // Create a more specific error message
        let errorMessage = 'Unsupported file format(s) detected: ' + invalidFileNames;
        errorMessage += '\nOnly JPEG, PNG, and GIF images are supported.';

        this.showNotification(errorMessage, 'error');
        return;
      }

      this.selectedFiles = files;
      this.isMultipleImagesSelected = true;
      this.showNotification(`${files.length} images selected`, 'info');
    }
  }

  /**
   * Check if file is a supported image type
   */
  private isImageFile(file: File): boolean {
    // List of supported MIME types (only those supported by the backend)
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];

    // Check if the file type is in our supported list
    return supportedTypes.includes(file.type);
  }

  /**
   * Get file extension from file name
   */
  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Reset component state
   */
  private resetState(): void {
    this.selectedFiles = [];
    this.uploadComplete = false;
    this.processId = '';
    this.fileCount = 0;
    this.uploadedFiles = [];
    this.hasConflicts = false;
    this.conflicts = [];
    this.errorMessage = '';
    this.isMultipleImagesSelected = false;
  }

  /**
   * Trigger the file input click for tar.gz
   */
  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  /**
   * Trigger the file input click for multiple images
   */
  triggerMultipleFileInput(): void {
    const fileInput = document.getElementById('multipleFileInput') as HTMLInputElement;
    fileInput.click();
  }

  /**
   * Compose selected images into tar.gz and upload
   */
  async composeAndUpload(): Promise<void> {
    if (this.selectedFiles.length === 0) {
      this.showNotification('Please select image files', 'error');
      return;
    }

    // Double-check file types before sending to backend
    const invalidFiles = this.selectedFiles.filter(file => !this.isImageFile(file));
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map(file => file.name).join(', ');
      const errorMessage = `Cannot upload unsupported file format(s): ${invalidFileNames}\nOnly JPEG, PNG, and GIF images are supported.`;
      this.showNotification(errorMessage, 'error');
      return;
    }

    this.uploadInProgress = true;
    this.uploadProgress = 0;

    try {
      // First, compose the tar.gz file
      const tarFile = await this.uploadService.composeImagesIntoTarGz(this.selectedFiles);

      // Then upload it
      this.uploadService.uploadTarGzFile(tarFile).subscribe({
        next: (event) => {
          if (event.type === 'progress' && event.progress !== undefined) {
            this.uploadProgress = event.progress;
          } else if (event.response) {
            this.handleUploadResponse(event.response);
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.uploadInProgress = false;
          this.errorMessage = error.message || 'Unknown error';
          this.showNotification(`Upload failed: ${this.errorMessage}`, 'error');
        }
      });
    } catch (error: any) {
      console.error('Composition error:', error);
      this.uploadInProgress = false;

      // Check if the error response contains a more specific message from the backend
      if (error.error && typeof error.error === 'object') {
        // Try to extract the specific error message from the backend response
        if (error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = error instanceof Error ? error.message : 'Failed to compose tar.gz file';
        }
      } else if (typeof error.error === 'string') {
        // Sometimes the error might be a string
        try {
          // Try to parse it as JSON
          const errorObj = JSON.parse(error.error);
          this.errorMessage = errorObj.message || 'Failed to compose tar.gz file';
        } catch {
          // If it's not valid JSON, use the error message
          this.errorMessage = error.error;
        }
      } else {
        // Fallback to the error message or a default
        this.errorMessage = error instanceof Error ? error.message : 'Failed to compose tar.gz file';
      }

      // Show a more user-friendly error message
      if (this.errorMessage.includes('Invalid file type')) {
        // Extract the filename from the error message if possible
        const match = this.errorMessage.match(/Invalid file type: (.+?)\./);
        const fileName = match ? match[1] : 'one or more files';

        this.showNotification(`Cannot process unsupported file format: ${fileName}. Only JPEG, PNG, and GIF images are supported.`, 'error');
      } else {
        this.showNotification(`Composition failed: ${this.errorMessage}`, 'error');
      }
    }
  }

  /**
   * Handle upload response
   */
  private handleUploadResponse(response: UploadResponse): void {
    if (response.success) {
      this.processId = response.processId || '';
      this.fileCount = response.fileCount || 0;
      this.uploadComplete = true;

      // Check for conflicts
      if (response.warning && response.conflictId) {
        this.hasConflicts = true;
        this.showNotification('Upload completed with potential conflicts. Please review.', 'warning');
        if (this.processId) {
          this.fetchConflicts(this.processId);
        }
      } else {
        this.showNotification('Upload successful!', 'success');
      }

      // Handle extracted files
      if (response.extractedFiles) {
        this.uploadedFiles = response.extractedFiles;
        this.loadImagePreviews();
      } else if (this.processId) {
        this.fetchUploadedFiles(this.processId);
      }
    } else {
      this.errorMessage = response.message || 'Unknown error';
      this.showNotification(`Upload failed: ${this.errorMessage}`, 'error');
    }

    this.uploadInProgress = false;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    return this.uploadService.formatFileSize(bytes);
  }

  /**
   * Check if file is a tar.gz file
   */
  isTarGzFile(file: File): boolean {
    return this.uploadService.isTarGzFile(file);
  }

  /**
   * Fetch the uploaded files for a process
   */
  fetchUploadedFiles(processId: string): void {
    this.loadingFiles = true;
    console.log(`Fetching uploaded files for process: ${processId}`);

    // Use the upload service to get process images with previews
    this.uploadService.getProcessImagesWithPreviews(processId).subscribe({
      next: (files) => {
        console.log(`Received ${files.length} files from getProcessImagesWithPreviews`);
        this.uploadedFiles = files;

        // Now load the image previews for these files
        if (files.length > 0) {
          this.loadImagePreviews();
        } else {
          this.loadingFiles = false;
          console.log('No files to display');
        }
      },
      error: (error) => {
        console.error('Error fetching uploaded files:', error);
        this.loadingFiles = false;
        this.showNotification('Error loading file previews', 'error');
      }
    });
  }

  /**
   * Load image previews for the uploaded files
   */
  loadImagePreviews(): void {
    if (this.uploadedFiles.length === 0) {
      console.log('No files to load previews for');
      return;
    }

    this.loadingFiles = true;
    console.log(`Loading image previews for ${this.uploadedFiles.length} files`);

    // Use the upload service to load image previews
    // Limit to 20 files to avoid performance issues
    this.uploadService.loadImagePreviews(this.uploadedFiles, 20).subscribe({
      next: (files) => {
        console.log(`Received ${files.length} files with previews`);

        // Check if we have any previews
        const filesWithPreviews = files.filter(file => file.base64Preview && file.base64Preview.length > 0);
        console.log(`${filesWithPreviews.length} files have valid previews`);

        this.uploadedFiles = files;
        this.loadingFiles = false;
      },
      error: (error) => {
        console.error('Error loading image previews:', error);
        this.loadingFiles = false;
        this.showNotification('Error loading image previews', 'error');
      }
    });
  }

  /**
   * Fetch conflicts for a process
   */
  fetchConflicts(processId: string): void {
    this.conflictService.getConflictsByProcess(processId).subscribe({
      next: (conflicts) => {
        this.conflicts = conflicts;
        console.log('Fetched conflicts:', conflicts);

        if (conflicts.length > 0) {
          this.hasConflicts = true;
          this.showNotification(`Found ${conflicts.length} potential conflicts`, 'warning');
        }
      },
      error: (error) => {
        console.error('Error fetching conflicts:', error);
      }
    });
  }

  /**
   * Remove a single file from the selection
   * @param index The index of the file to remove
   */
  removeFile(index: number): void {
    if (index >= 0 && index < this.selectedFiles.length) {
      // Create a new array without the file at the specified index
      this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);

      // If no files left, reset the multiple images flag
      if (this.selectedFiles.length === 0) {
        this.isMultipleImagesSelected = false;
        this.showNotification('All files removed', 'info');
      } else {
        this.showNotification(`File removed. ${this.selectedFiles.length} files remaining.`, 'info');
      }
    }
  }

  /**
   * Clear the file selection and reset the component
   */
  clearSelection(): void {
    this.selectedFiles = [];
    this.uploadComplete = false;
    this.uploadProgress = 0;
    this.processId = '';
    this.fileCount = 0;
    this.uploadedFiles = [];
    this.hasConflicts = false;
    this.conflicts = [];
    this.errorMessage = '';

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';

    // Clear temp files on the server
    this.uploadService.clearTempFiles().subscribe({
      next: (response) => {
        console.log(response.message);
        this.showNotification('Ready for a new upload', 'info');
      },
      error: (error) => {
        console.error('Error clearing temp folder:', error);
        this.showNotification('Error clearing temporary files', 'error');
      }
    });
  }

  /**
   * Navigate to the deduplication component with the process ID
   */
  goToDeduplication(): void {
    if (this.processId) {
      this.router.navigate(['/features/deduplication'], {
        queryParams: { processId: this.processId }
      });
    }
  }

  /**
   * Navigate to the upload history component
   */
  viewHistory(): void {
    this.router.navigate(['/features/upload-history']);
  }

  /**
   * Navigate to the conflicts component with the process ID
   */
  goToConflicts(): void {
    if (this.processId) {
      this.router.navigate(['/features/conflicts'], {
        queryParams: { processId: this.processId }
      });
    }
  }

  /**
   * Handle image loading errors by displaying a fallback icon
   * @param event The error event from the image
   */
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.src) {
      console.log(`Image failed to load: ${imgElement.src}`);

      // Hide the image element that failed to load
      imgElement.style.display = 'none';

      // Find the parent container and add a class to show the fallback icon
      const container = imgElement.closest('.image-container');
      if (container) {
        // Check if the fallback is already added to avoid duplicates
        if (!container.querySelector('.no-image-container')) {
          console.log('Adding fallback image container');

          const fallbackDiv = document.createElement('div');
          fallbackDiv.className = 'no-image-container';

          const icon = document.createElement('mat-icon');
          icon.className = 'no-image-icon';
          icon.textContent = 'image_not_supported';

          const text = document.createElement('p');
          text.textContent = 'Image failed to load';

          fallbackDiv.appendChild(icon);
          fallbackDiv.appendChild(text);
          container.appendChild(fallbackDiv);
        }
      }
    }
  }

  /**
   * Show a notification message
   * @param message The message to display
   * @param type The type of notification (success, error, warning, info)
   */
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    let panelClass = ['notification'];

    switch (type) {
      case 'success':
        panelClass.push('notification-success');
        break;
      case 'error':
        panelClass.push('notification-error');
        break;
      case 'warning':
        panelClass.push('notification-warning');
        break;
      case 'info':
        panelClass.push('notification-info');
        break;
    }

    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: panelClass
    });
  }

  /**
   * Upload selected files
   */
  uploadFiles(): void {
    if (this.selectedFiles.length === 0) {
      this.showNotification('Please select a file to upload', 'error');
      return;
    }

    if (this.isMultipleImagesSelected) {
      this.composeAndUpload();
    } else {
      const file = this.selectedFiles[0];
      this.uploadInProgress = true;
      this.uploadProgress = 0;

      this.uploadService.uploadTarGzFile(file).subscribe({
        next: (event) => {
          if (event.type === 'progress' && event.progress !== undefined) {
            this.uploadProgress = event.progress;
          } else if (event.response) {
            this.handleUploadResponse(event.response);
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.uploadInProgress = false;
          this.errorMessage = error.message || 'Unknown error';
          this.showNotification(`Upload failed: ${this.errorMessage}`, 'error');
        }
      });
    }
  }
}
