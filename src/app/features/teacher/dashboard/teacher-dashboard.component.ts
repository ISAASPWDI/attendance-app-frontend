import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AttendanceService } from '../../../core/services/attendance.service';
import { AttendanceRecord, AttendanceStatus } from '../../../core/models/attendance.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

const CHECK_IN_CUTOFF_MINUTES = 7 * 60 + 30;
const CHECK_OUT_MIN_MINUTES = 13 * 60;

@Component({
  selector: 'app-teacher-dashboard',
  imports: [ReactiveFormsModule, StatusBadgeComponent],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.css'
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private fb = inject(FormBuilder);
  private clockHandle?: ReturnType<typeof setInterval>;

  readonly today = signal(new Date());
  readonly todayRecord = signal<AttendanceRecord | null>(null);
  readonly loadingToday = signal(true);
  readonly actionLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly todayLabel = computed(() =>
    new Intl.DateTimeFormat('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(
      this.today()
    )
  );

  readonly currentTimeLabel = computed(() =>
    new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(this.today())
  );

  readonly canCheckIn = computed(() => !this.todayRecord());
  readonly canCheckOut = computed(() => {
    const record = this.todayRecord();
    if (!record || record.timeOut) return false;
    const minutes = this.today().getHours() * 60 + this.today().getMinutes();
    return minutes >= CHECK_OUT_MIN_MINUTES;
  });

  readonly form = this.fb.nonNullable.group({
    timeIn: ['', Validators.required],
    timeOut: [''],
    status: ['Present' as AttendanceStatus, Validators.required],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadToday();
    this.clockHandle = setInterval(() => this.today.set(new Date()), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockHandle) clearInterval(this.clockHandle);
  }

  private loadToday(): void {
    this.loadingToday.set(true);
    this.attendanceService.getToday().subscribe({
      next: record => {
        this.todayRecord.set(record);
        this.loadingToday.set(false);
      },
      error: () => this.loadingToday.set(false)
    });
  }

  quickCheckIn(): void {
    if (!this.canCheckIn() || this.actionLoading()) return;
    this.actionLoading.set(true);
    this.errorMessage.set(null);
    this.attendanceService.quickCheckIn().subscribe({
      next: record => {
        this.todayRecord.set(record);
        this.actionLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.errorMessage.set(this.extractMessage(err, 'No se pudo registrar la entrada.'));
      }
    });
  }

  quickCheckOut(): void {
    if (!this.canCheckOut() || this.actionLoading()) return;
    this.actionLoading.set(true);
    this.errorMessage.set(null);
    this.attendanceService.quickCheckOut().subscribe({
      next: record => {
        this.todayRecord.set(record);
        this.actionLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.errorMessage.set(this.extractMessage(err, 'No se pudo registrar la salida.'));
      }
    });
  }

  submitManual(): void {
    if (this.form.invalid || this.actionLoading()) return;
    const raw = this.form.getRawValue();

    this.actionLoading.set(true);
    this.errorMessage.set(null);

    this.attendanceService
      .create({
        date: this.isoDate(this.today()),
        timeIn: this.toSeconds(raw.timeIn),
        timeOut: raw.timeOut ? this.toSeconds(raw.timeOut) : null,
        status: raw.status,
        notes: raw.notes || null
      })
      .subscribe({
        next: record => {
          this.todayRecord.set(record);
          this.actionLoading.set(false);
          this.form.reset({ timeIn: '', timeOut: '', status: 'Present', notes: '' });
        },
        error: (err: HttpErrorResponse) => {
          this.actionLoading.set(false);
          this.errorMessage.set(this.extractMessage(err, 'No se pudo guardar el registro de asistencia.'));
        }
      });
  }

  private toSeconds(value: string): string {
    return value.length === 5 ? `${value}:00` : value;
  }

  private isoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private extractMessage(err: HttpErrorResponse, fallback: string): string {
    const body = err.error as { message?: string } | null;
    return body?.message ?? fallback;
  }
}
