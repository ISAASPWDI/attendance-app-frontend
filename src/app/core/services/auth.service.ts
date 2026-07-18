import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UsernameOnlyRequest,
  VerifyEmailRequest
} from '../models/auth.model';
import { User } from '../models/user.model';

const TOKEN_KEY = 'attendance_token';
const USER_KEY = 'attendance_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<User | null>(this.readStoredUser());

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<LoginResponse>(`${this.base}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        this.setUser(res.user);
      }),
      switchMap(() => this.refreshProfile())
    );
  }

  register(payload: RegisterRequest): Observable<unknown> {
    return this.http.post(`${this.base}/register`, payload);
  }

  verifyEmail(payload: VerifyEmailRequest): Observable<unknown> {
    return this.http.post(`${this.base}/verify-email`, payload);
  }

  resendVerification(payload: UsernameOnlyRequest): Observable<unknown> {
    return this.http.post(`${this.base}/resend-verification`, payload);
  }

  forgotPassword(payload: UsernameOnlyRequest): Observable<unknown> {
    return this.http.post(`${this.base}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<unknown> {
    return this.http.post(`${this.base}/reset-password`, payload);
  }

  /** Re-fetches /auth/me (includes photoUrl, which the login response omits) and updates the cached user. */
  refreshProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/me`).pipe(
      tap(user => this.setUser(user))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isDirector(): boolean {
    return this.currentUser()?.role === 'DIRECTOR';
  }

  isTeacher(): boolean {
    return this.currentUser()?.role === 'TEACHER';
  }

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
