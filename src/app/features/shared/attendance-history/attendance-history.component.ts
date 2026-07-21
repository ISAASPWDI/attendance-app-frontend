import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { AttendanceService } from '../../../core/services/attendance.service';
import { AttendanceFilter, AttendanceRecord } from '../../../core/models/attendance.model';
import { Page } from '../../../core/models/api.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

const DEFAULT_PAGE_SIZE = 10;

const EMPTY_PAGE: Page<AttendanceRecord> = {
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
  selector: 'app-attendance-history',
  imports: [ReactiveFormsModule, StatusBadgeComponent],
  templateUrl: './attendance-history.component.html',
  styleUrl: './attendance-history.component.css'
})
export class AttendanceHistoryComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  readonly recordsPage = signal<Page<AttendanceRecord>>(EMPTY_PAGE);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly filterForm = this.fb.nonNullable.group({
    status: [''],
    fromDate: [''],
    toDate: [''],
    dayOfWeek: [''],
    sortBy: ['date'],
    order: ['desc']
  });

  ngOnInit(): void {
    this.loadRecords();

    this.filterForm.valueChanges.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page.set(0);
      this.loadRecords();
    });
  }

  private loadRecords(): void {
    this.loading.set(true);
    this.attendanceService.listMine(this.currentFilter()).subscribe({
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
    this.filterForm.reset({ status: '', fromDate: '', toDate: '', dayOfWeek: '', sortBy: 'date', order: 'desc' });
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

  formatTime(value: string | null): string {
    return value ? value.slice(0, 5) : '';
  }
}
