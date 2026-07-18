import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AttendanceFilter } from '../models/attendance.model';
import { toHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reports`;

  downloadExcel(filter: AttendanceFilter): Observable<Blob> {
    return this.http.get(`${this.base}/excel`, { params: toHttpParams(filter), responseType: 'blob' });
  }

  downloadPdf(filter: AttendanceFilter): Observable<Blob> {
    return this.http.get(`${this.base}/pdf`, { params: toHttpParams(filter), responseType: 'blob' });
  }
}
