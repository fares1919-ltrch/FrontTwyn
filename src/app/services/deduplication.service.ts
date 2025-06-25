import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ConflictService } from './conflict.service';
import { DuplicateRecordService } from './duplicate-record.service';
import { FileService } from './file.service';
import { AuthService } from './auth.service';

export interface Process {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    username: string;
    totalFiles: number;
    processedFiles: number;
    processStartDate?: string;
    processEndDate?: string;
    completedAt?: string;
    startDate?: string;
    endDate?: string;
    cleanupDate?: string;
    cleanupUsername?: string;
    steps?: ProcessStep[];
    completionNotes?: string;
    currentStage?: string;
    duplicateRecordsCount?: number;
    exceptionsCount?: number;
    errorCount?: number;
    warningCount?: number;
    createdBy?: string;
    fileCount?: number;
}

export interface ProcessStep {
    id: string;
    name: string;
    processId: string;
    startDate: string;
    endDate?: string;
    status: string;
    processedFiles: string[];
    errorCount?: number;
    warningCount?: number;
    notes?: string;
    duration?: number;  // Duration in seconds
}

export interface DeduplicationResponse {
    success: boolean;
    message: string;
    processId?: string;
}

export interface DuplicateRecord {
    id: string;
    processId: string;
    originalFileId: string;
    originalFileName: string;
    detectedDate: string;
    status: string;
    confirmationUser?: string;
    confirmationDate?: string;
    notes?: string;
    duplicates: Duplicate[];
}

export interface Duplicate {
    name: string;
    id: number;
    similarity: string;
}

export interface FileDetails {
    id: string;
    fileName: string;
    filePath: string;
    base64String: string;
    status: string;
    createdAt: string;
    faceId?: string | null;
    processStartDate?: string | null;
    processStatus?: string;
    photodeduplique?: boolean;
    processId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class DeduplicationService {
    private apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private conflictService: ConflictService,
        private duplicateRecordService: DuplicateRecordService,
        private fileService: FileService
    ) { }

    /**
     * Get all processes for the current user
     */
    getAllProcesses(): Observable<Process[]> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            return throwError(() => new Error('No authenticated user'));
        }
        return this.http.get<Process[]>(`${this.apiUrl}/Deduplication/processes`).pipe(
            map(processes => {
                // Filter processes to only show the current user's processes
                return processes.filter(process =>
                    process.username === currentUser.userName ||
                    process.createdBy === currentUser.userName
                );
            })
        );
    }

    /**
     * Start deduplication for a specific process
     * @param processId The ID of the process to start deduplication for
     */
    startDeduplication(processId: string): Observable<DeduplicationResponse> {
        return this.http.post<DeduplicationResponse>(
            `${this.apiUrl}/Deduplication/process/${processId}`,
            {}
        );
    }

    /**
     * Pause deduplication for a specific process
     * @param processId The ID of the process to pause deduplication for
     */
    pauseDeduplication(processId: string): Observable<DeduplicationResponse> {
        return this.http.post<DeduplicationResponse>(
            `${this.apiUrl}/Deduplication/pause/${processId}`,
            {}
        );
    }

    /**
     * Resume deduplication for a specific process
     * @param processId The ID of the process to resume deduplication for
     */
    resumeDeduplication(processId: string): Observable<DeduplicationResponse> {
        return this.http.post<DeduplicationResponse>(
            `${this.apiUrl}/Deduplication/resume/${processId}`,
            {}
        );
    }

    /**
     * Get process details
     */
    getProcessDetails(processId: string): Observable<Process> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            return throwError(() => new Error('No authenticated user'));
        }

        // Remove any existing prefix and use the clean ID
        const cleanProcessId = processId.replace('processes/', '');

        return this.http.get<Process>(`${this.apiUrl}/Deduplication/process/${cleanProcessId}`).pipe(
            map(process => {
                // Verify the user has access to this process
                if (process.username !== currentUser.userName && process.createdBy !== currentUser.userName) {
                    throw new Error('You do not have permission to view this process');
                }

                // Calculate duration for each step if not provided
                if (process.steps) {
                    process.steps.forEach(step => {
                        if (!step.duration && step.startDate && step.endDate) {
                            const start = new Date(step.startDate).getTime();
                            const end = new Date(step.endDate).getTime();
                            step.duration = Math.round((end - start) / 1000); // Duration in seconds
                        }
                    });
                }

                // Ensure all date fields are properly set for completed processes
                if (process.status === 'Completed') {
                    if (!process.completedAt && process.processEndDate) {
                        process.completedAt = process.processEndDate;
                    }
                    if (!process.startDate && process.processStartDate) {
                        process.startDate = process.processStartDate;
                    }
                    if (!process.endDate && process.processEndDate) {
                        process.endDate = process.processEndDate;
                    }
                    if ((!process.fileCount || process.fileCount === 0) && process.totalFiles > 0) {
                        process.fileCount = process.totalFiles;
                    }
                }

                return process;
            }),
            catchError(error => {
                console.error('Error fetching process details:', error);
                return throwError(() => new Error('Failed to fetch process details. Please try again later.'));
            })
        );
    }

    /**
     * Get duplicate records for a specific process
     * @param processId The ID of the process to get duplicates for
     */
    getDuplicateRecords(processId: string): Observable<DuplicateRecord[]> {
        // Use the dedicated DuplicateRecordService
        return this.duplicateRecordService.getDuplicateRecordsByProcess(processId);
    }

    /**
     * Get file details for a specific file
     * @param fileId The ID of the file to get details for
     */
    getFileDetails(fileId: string): Observable<FileDetails> {
        // Use the dedicated FileService
        return this.fileService.getFile(fileId) as Observable<FileDetails>;
    }

    /**
     * Get all files for a specific process
     * @param processId The ID of the process to get files for
     */
    getProcessFiles(processId: string): Observable<FileDetails[]> {
        // Use the dedicated FileService
        return this.fileService.getFilesByProcess(processId) as Observable<FileDetails[]>;
    }

    /**
     * Normalize a duplicate record ID to ensure it works with the backend
     * @param duplicateId The ID of the duplicate record
     * @returns The normalized ID
     */
    private normalizeDuplicateId(duplicateId: string): string {
        // If the ID already has the prefix, return it as is
        if (duplicateId.startsWith('DuplicatedRecords/')) {
            return duplicateId;
        }

        // Otherwise, add the prefix
        return `DuplicatedRecords/${duplicateId}`;
    }

    /**
     * Normalize a process ID to ensure it works with the backend
     * @param processId The ID of the process
     * @returns The normalized ID
     */
    private normalizeProcessId(processId: string): string {
        if (!processId) return processId;

        // Remove any existing prefix and return just the ID
        return processId.replace('processes/', '');
    }

    /**
     * Get a specific duplicate record by ID
     * @param duplicateId The ID of the duplicate record to retrieve
     */
    getDuplicateRecord(duplicateId: string): Observable<DuplicateRecord> {
        // Use the dedicated DuplicateRecordService
        return this.duplicateRecordService.getDuplicateRecord(duplicateId).pipe(
            map(record => {
                // Convert DuplicateMatch to Duplicate
                return {
                    ...record,
                    duplicates: record.duplicates.map(dup => ({
                        name: dup.name,
                        id: dup.id,
                        similarity: dup.similarity
                    }))
                };
            })
        );
    }

    /**
     * Confirm a duplicate record
     * @param duplicateId The ID of the duplicate record to confirm
     * @param notes Optional notes about the confirmation
     */
    confirmDuplicate(duplicateId: string, notes?: string): Observable<any> {
        // Use the dedicated DuplicateRecordService
        return this.duplicateRecordService.confirmDuplicateRecord(duplicateId, notes).pipe(
            map(response => {
                // Convert DuplicateMatch to Duplicate if needed
                if (response && response.duplicates) {
                    response.duplicates = response.duplicates.map(dup => ({
                        name: dup.name,
                        id: dup.id,
                        similarity: dup.similarity
                    }));
                }
                return response;
            })
        );
    }

    /**
     * Reject a duplicate record
     * @param duplicateId The ID of the duplicate record to reject
     * @param notes Optional notes about the rejection
     */
    rejectDuplicate(duplicateId: string, notes?: string): Observable<any> {
        // Use the dedicated DuplicateRecordService
        return this.duplicateRecordService.rejectDuplicateRecord(duplicateId, notes);
    }

    /**
     * Clean up a process
     * @param processId The ID of the process to clean up
     */
    cleanupProcess(processId: string): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}/Deduplication/cleanup/${processId}`,
            {}
        );
    }

    /**
     * Check if a process has conflicts
     * @param processId The ID of the process to check
     * @returns Observable with boolean indicating if conflicts exist
     */
    hasConflicts(processId: string): Observable<boolean> {
        return this.conflictService.hasConflicts(processId);
    }

    /**
     * Get conflicts for a specific process
     * @param processId The ID of the process to get conflicts for
     * @returns Observable with array of conflicts
     */
    getProcessConflicts(processId: string): Observable<any[]> {
        return this.conflictService.getConflictsByProcess(processId);
    }

    /**
     * Auto-resolve high-confidence conflicts for a process
     * @param processId The ID of the process to auto-resolve conflicts for
     * @param threshold Confidence threshold for auto-resolution (default: 0.95)
     * @returns Observable with summary of auto-resolved conflicts
     */
    autoResolveConflicts(processId: string, threshold: number = 0.95): Observable<any> {
        return this.conflictService.autoResolveConflicts(processId, threshold);
    }

    /**
     * Get duplicate records by process
     * @param processId The ID of the process
     */
    getDuplicatesByProcess(processId: string): Observable<DuplicateRecord[]> {
        return this.duplicateRecordService.getDuplicateRecordsByProcess(processId).pipe(
            map(records => {
                // Convert DuplicateMatch to Duplicate for each record
                return records.map(record => ({
                    ...record,
                    duplicates: record.duplicates.map(dup => ({
                        name: dup.name,
                        id: dup.id,
                        similarity: dup.similarity
                    }))
                }));
            })
        );
    }

    /**
     * Get all duplicate records for a process
     * @param processId The ID of the process to get duplicates for
     */
    getDuplicateRecordsForProcess(processId: string): Observable<DuplicateRecord[]> {
        return this.getDuplicatesByProcess(processId);
    }
}
