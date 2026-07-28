import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUserRequest, UpdateUserRequest, UserDetail, UserRole } from '../models/user.model';
import { Page } from '../models/api.model';
import { toHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  list(username: string | undefined, page: number, size: number, role?: UserRole): Observable<Page<UserDetail>> {
    return this.http.get<Page<UserDetail>>(this.base, { params: toHttpParams({ username, page, size, role }) });
  }

  getById(id: number): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${this.base}/${id}`);
  }

  create(payload: CreateUserRequest): Observable<UserDetail> {
    return this.http.post<UserDetail>(this.base, payload);
  }

  update(userId: number, payload: UpdateUserRequest): Observable<UserDetail> {
    return this.http.patch<UserDetail>(`${this.base}/${userId}`, payload);
  }

  delete(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${userId}`);
  }

  uploadPhoto(userId: number, file: File): Observable<{ url: string }> {
    return this.uploadFile(`${this.base}/${userId}/photo`, file);
  }

  uploadSignature(userId: number, file: File): Observable<{ url: string }> {
    return this.uploadFile(`${this.base}/${userId}/signature`, file);
  }

  private uploadFile(url: string, file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(url, form);
  }
}
