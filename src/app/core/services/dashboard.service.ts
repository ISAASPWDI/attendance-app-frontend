import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummary, PurgeWarning } from '../models/attendance.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${environment.apiUrl}/dashboard/summary`);
  }

  getPurgeWarning(): Observable<PurgeWarning> {
    return this.http.get<PurgeWarning>(`${environment.apiUrl}/dashboard/purge-warning`);
  }
}
