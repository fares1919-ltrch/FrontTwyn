import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  entityType: string;
  entityId: string;
  processId: string;
  previousState: any;
  newState: any;
  metadata: any;
  ipAddress: string;
  userAgent: string;
  result: string;
  details: string;
}

export interface AuditLogFilter {
  userId?: string;
  entityType?: string;
  entityId?: string;
  processId?: string;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private apiUrl = `${environment.apiUrl}/Audit`;

  constructor(private http: HttpClient) { }

  /**
   * Get audit logs with optional filtering
   * @param filter Optional filter parameters
   * @returns Observable of audit logs
   */
  getAuditLogs(filter: AuditLogFilter = {}): Observable<any> {
    let params = new HttpParams();

    // Add all filter parameters
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.entityType) params = params.set('entityType', filter.entityType);
    if (filter.entityId) params = params.set('entityId', filter.entityId);
    if (filter.processId) params = params.set('processId', filter.processId);
    if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
    if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());

    // Always include pagination parameters
    params = params.set('skip', (filter.skip || 0).toString());
    params = params.set('take', (filter.take || 100).toString());

    console.log('Calling Audit API with URL:', this.apiUrl);
    console.log('Params:', params.toString());
    console.log('Environment API URL:', environment.apiUrl);

    return this.http.get<any>(this.apiUrl, { params })
      .pipe(
        tap(response => console.log('Audit API response:', response)),
        catchError(error => {
          console.error('Audit API error:', error);
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          console.error('Error details:', error.error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get the audit trail for a specific process
   * @param processId The process ID
   * @returns Observable of audit logs for the process
   */
  getProcessAuditTrail(processId: string): Observable<any> {
    const url = `${this.apiUrl}/process/${processId}`;
    console.log('Calling Process Audit API with URL:', url);
    return this.http.get<any>(url)
      .pipe(
        tap(response => console.log('Process Audit API response:', response)),
        catchError(error => {
          console.error('Process Audit API error:', error);
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          console.error('Error details:', error.error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get the audit trail for a specific entity
   * @param entityType The entity type
   * @param entityId The entity ID
   * @returns Observable of audit logs for the entity
   */
  getEntityAuditTrail(entityType: string, entityId: string): Observable<any> {
    const url = `${this.apiUrl}/entity/${entityType}/${entityId}`;
    console.log('Calling Entity Audit API with URL:', url);
    return this.http.get<any>(url)
      .pipe(
        tap(response => console.log('Entity Audit API response:', response)),
        catchError(error => {
          console.error('Entity Audit API error:', error);
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          console.error('Error details:', error.error);
          return throwError(() => error);
        })
      );
  }
}
