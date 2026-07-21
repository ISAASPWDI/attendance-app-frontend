import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AttendanceFilter,
  AttendanceRecord,
  AttendanceRecordInput,
  AttendanceRecordWithUser
} from '../models/attendance.model';
import { Page } from '../models/api.model';
import { toHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/attendances`;

  getToday(): Observable<AttendanceRecord | null> {
    return this.http
      .get<AttendanceRecord>(`${this.base}/today`, { observe: 'response' })
      .pipe(map(res => (res.status === 204 ? null : res.body)));
  }

  create(record: AttendanceRecordInput): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(this.base, record);
  }

  quickCheckIn(): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.base}/quick-checkin`, {});
  }

  quickCheckOut(): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.base}/quick-checkout`, {});
  }

  patch(id: number, record: Partial<AttendanceRecordInput>): Observable<AttendanceRecord> {
    return this.http.patch<AttendanceRecord>(`${this.base}/${id}`, record);
  }

  list(filter: AttendanceFilter): Observable<Page<AttendanceRecordWithUser>> {
    return this.http.get<Page<AttendanceRecordWithUser>>(this.base, { params: toHttpParams(filter) });
  }

  listMine(filter: AttendanceFilter): Observable<Page<AttendanceRecord>> {
    return this.http.get<Page<AttendanceRecord>>(`${this.base}/me`, { params: toHttpParams(filter) });
  }

  deleteByDate(date: string): Observable<{ deletedCount: number; date: string }> {
    return this.http.delete<{ deletedCount: number; date: string }>(`${this.base}/by-date/${date}`);
  }
}
