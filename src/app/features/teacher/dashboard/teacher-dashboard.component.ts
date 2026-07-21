import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AttendanceService } from '../../../core/services/attendance.service';
import { AttendanceRecord, AttendanceStatus } from '../../../core/models/attendance.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { AttendanceHistoryComponent } from '../../shared/attendance-history/attendance-history.component';

const ENTRY_WINDOW_START_MINUTES = 7 * 60 + 30; // 7:30 am
const ENTRY_LATE_CUTOFF_MINUTES = 8 * 60 + 20; // 8:20 am
const ENTRY_WINDOW_END_MINUTES = 9 * 60; // 9:00 am
const EXIT_WINDOW_START_MINUTES = 13 * 60; // 1:00 pm
const EXIT_ON_TIME_CUTOFF_MINUTES = 13 * 60 + 32; // 1:32 pm (informational only, doesn't close anything)
const EXIT_WINDOW_END_MINUTES = 14 * 60; // 2:00 pm

type AttendanceMode = 'create' | 'exit' | 'done';
type WindowStatus = 'too-early' | 'open' | 'closed' | null;

@Component({
  selector: 'app-teacher-dashboard',
  imports: [ReactiveFormsModule, StatusBadgeComponent, AttendanceHistoryComponent],
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

  readonly todayLabel = computed(() =>
    new Intl.DateTimeFormat('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(
      this.today()
    )
  );

  readonly currentTimeLabel = computed(() =>
    new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(this.today())
  );

  private readonly minutesNow = computed(() => this.today().getHours() * 60 + this.today().getMinutes());

  readonly mode = computed<AttendanceMode>(() => {
    const record = this.todayRecord();
    if (!record) return 'create';
    return record.timeOut ? 'done' : 'exit';
  });

  readonly entryWindowStatus = computed<WindowStatus>(() => {
    if (this.mode() !== 'create') return null;
    const minutes = this.minutesNow();
    if (minutes < ENTRY_WINDOW_START_MINUTES) return 'too-early';
    if (minutes > ENTRY_WINDOW_END_MINUTES) return 'closed';
    return 'open';
  });

  readonly canCheckIn = computed(() => this.entryWindowStatus() === 'open');

  readonly exitWindowStatus = computed<WindowStatus>(() => {
    if (this.mode() !== 'exit') return null;
    const minutes = this.minutesNow();
    if (minutes < EXIT_WINDOW_START_MINUTES) return 'too-early';
    if (minutes > EXIT_WINDOW_END_MINUTES) return 'closed';
    return 'open';
  });

  readonly canCheckOut = computed(() => this.exitWindowStatus() === 'open');

  readonly exitInTolerance = computed(
    () => this.exitWindowStatus() === 'open' && this.minutesNow() > EXIT_ON_TIME_CUTOFF_MINUTES
  );

  readonly showNoCheckoutNotice = computed(() => this.exitWindowStatus() === 'closed');

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
        this.syncFormToRecord(record);
        this.loadingToday.set(false);
      },
      error: () => this.loadingToday.set(false)
    });
  }

  /** Stages the current time into the manual form; does not submit anything. */
  stageCheckIn(): void {
    if (!this.canCheckIn()) return;
    const minutes = this.minutesNow();
    this.form.patchValue({
      timeIn: this.currentHHmm(),
      status: minutes <= ENTRY_LATE_CUTOFF_MINUTES ? 'Present' : 'Late'
    });
  }

  /** Stages the current time into the manual form; does not submit anything. */
  stageCheckOut(): void {
    if (!this.canCheckOut()) return;
    this.form.patchValue({ timeOut: this.currentHHmm() });
  }

  submitManual(): void {
    if (this.form.invalid || this.actionLoading()) return;
    const raw = this.form.getRawValue();
    const record = this.todayRecord();

    this.actionLoading.set(true);

    const request$ = record
      ? this.attendanceService.patch(record.id, {
          timeOut: this.toSeconds(raw.timeOut),
          notes: raw.notes || null
        })
      : this.attendanceService.create({
          date: this.isoDate(this.today()),
          timeIn: this.toSeconds(raw.timeIn),
          timeOut: raw.timeOut ? this.toSeconds(raw.timeOut) : null,
          status: raw.status,
          notes: raw.notes || null
        });

    request$.subscribe({
      next: updated => {
        this.todayRecord.set(updated);
        this.syncFormToRecord(updated);
        this.actionLoading.set(false);
      },
      error: () => this.actionLoading.set(false)
    });
  }

  private syncFormToRecord(record: AttendanceRecord | null): void {
    if (!record) {
      this.form.reset({ timeIn: '', timeOut: '', status: 'Present', notes: '' });
      this.form.controls.timeIn.enable();
      this.form.controls.status.enable();
      this.form.controls.timeOut.clearValidators();
      this.form.controls.timeOut.updateValueAndValidity();
      return;
    }

    if (!record.timeOut) {
      this.form.setValue({
        timeIn: record.timeIn.slice(0, 5),
        timeOut: '',
        status: record.status,
        notes: record.notes ?? ''
      });
      this.form.controls.timeIn.disable();
      this.form.controls.status.disable();
      this.form.controls.timeOut.setValidators(Validators.required);
      this.form.controls.timeOut.updateValueAndValidity();
      return;
    }

    this.form.disable();
  }

  private currentHHmm(): string {
    const d = this.today();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
}
