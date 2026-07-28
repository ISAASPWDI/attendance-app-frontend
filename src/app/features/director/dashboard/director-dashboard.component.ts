import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { AttendanceService } from '../../../core/services/attendance.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ReportService } from '../../../core/services/report.service';
import { UserService } from '../../../core/services/user.service';
import {
  AttendanceFilter,
  AttendanceRecordWithUser,
  AttendanceStatus,
  DashboardSummary
} from '../../../core/models/attendance.model';
import { Page } from '../../../core/models/api.model';
import { UserDetail } from '../../../core/models/user.model';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

const DEFAULT_PAGE_SIZE = 10;

const EMPTY_PAGE: Page<AttendanceRecordWithUser> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: DEFAULT_PAGE_SIZE,
  first: true,
  last: true,
  numberOfElements: 0,
  empty: true
};

@Component({
  selector: 'app-director-dashboard',
  imports: [ReactiveFormsModule, StatCardComponent, StatusBadgeComponent],
  templateUrl: './director-dashboard.component.html',
  styleUrl: './director-dashboard.component.css'
})
export class DirectorDashboardComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private dashboardService = inject(DashboardService);
  private reportService = inject(ReportService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly recordsPage = signal<Page<AttendanceRecordWithUser>>(EMPTY_PAGE);
  readonly loading = signal(true);
  readonly downloading = signal<'excel' | 'pdf' | null>(null);
  readonly page = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly teachers = signal<UserDetail[]>([]);
  readonly showCreateForm = signal(false);
  readonly creating = signal(false);
  readonly maxDate = this.isoDate(new Date());

  readonly filterForm = this.fb.nonNullable.group({
    teacherName: [''],
    status: [''],
    fromDate: [''],
    toDate: [''],
    dayOfWeek: [''],
    sortBy: ['date'],
    order: ['desc']
  });

  readonly createForm = this.fb.nonNullable.group({
    teacherId: ['', Validators.required],
    date: ['', Validators.required],
    timeIn: ['', Validators.required],
    timeOut: [''],
    status: ['Present', Validators.required],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadSummary();
    this.loadRecords();
    this.loadTeachers();

    this.filterForm.valueChanges.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page.set(0);
      this.loadRecords();
    });
  }

  private loadTeachers(): void {
    this.userService.list(undefined, 0, 1000, 'TEACHER').subscribe(page => this.teachers.set(page.content));
  }

  teacherLabel(teacher: UserDetail): string {
    const name = [teacher.firstName, teacher.lastName].filter(Boolean).join(' ');
    return name || teacher.username;
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(open => !open);
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.creating()) return;
    const raw = this.createForm.getRawValue();
    if (!raw.teacherId || !raw.date || !raw.timeIn) return;

    this.creating.set(true);
    this.attendanceService
      .createForUser(+raw.teacherId, {
        date: raw.date,
        timeIn: raw.timeIn,
        timeOut: raw.timeOut || null,
        status: raw.status as AttendanceStatus,
        notes: raw.notes || null
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateForm.set(false);
          this.createForm.reset({ teacherId: '', date: '', timeIn: '', timeOut: '', status: 'Present', notes: '' });
          this.toast.show('Asistencia registrada correctamente.', 'success');
          this.loadRecords();
          this.loadSummary();
        },
        error: () => this.creating.set(false)
      });
  }

  private loadSummary(): void {
    this.dashboardService.getSummary().subscribe(summary => this.summary.set(summary));
  }

  private loadRecords(): void {
    this.loading.set(true);
    const filter = this.currentFilter();
    this.attendanceService.list(filter).subscribe({
      next: page => {
        this.recordsPage.set(page);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private currentFilter(): AttendanceFilter {
    const raw = this.filterForm.getRawValue();
    return {
      teacherName: raw.teacherName || undefined,
      status: (raw.status || undefined) as AttendanceFilter['status'],
      fromDate: raw.fromDate || undefined,
      toDate: raw.toDate || undefined,
      dayOfWeek: (raw.dayOfWeek || undefined) as AttendanceFilter['dayOfWeek'],
      sortBy: raw.sortBy as AttendanceFilter['sortBy'],
      order: raw.order as AttendanceFilter['order'],
      page: this.page(),
      size: this.pageSize()
    };
  }

  clearFilters(): void {
    this.filterForm.reset({
      teacherName: '',
      status: '',
      fromDate: '',
      toDate: '',
      dayOfWeek: '',
      sortBy: 'date',
      order: 'desc'
    });
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(0);
    this.loadRecords();
  }

  goToPage(next: number): void {
    if (next < 0 || next >= this.recordsPage().totalPages) return;
    this.page.set(next);
    this.loadRecords();
  }

  download(kind: 'excel' | 'pdf'): void {
    if (this.downloading()) return;
    this.downloading.set(kind);
    const filter = this.currentFilter();
    const request$ = kind === 'excel' ? this.reportService.downloadExcel(filter) : this.reportService.downloadPdf(filter);

    request$.subscribe({
      next: blob => {
        this.triggerDownload(blob, kind === 'excel' ? 'asistencias.xlsx' : 'asistencias.pdf');
        this.downloading.set(null);
      },
      error: () => this.downloading.set(null)
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  formatTime(value: string | null): string {
    return value ? value.slice(0, 5) : '';
  }

  private isoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
