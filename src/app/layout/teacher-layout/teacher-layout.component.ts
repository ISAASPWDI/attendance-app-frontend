import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { PurgeWarning } from '../../core/models/attendance.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

const ENTRY_WINDOW_START_MINUTES = 7 * 60 + 30; // 7:30 am
const ENTRY_WINDOW_END_MINUTES = 9 * 60; // 9:00 am
const EXIT_WINDOW_START_MINUTES = 13 * 60; // 1:00 pm
const EXIT_WINDOW_END_MINUTES = 14 * 60; // 2:00 pm

@Component({
  selector: 'app-teacher-layout',
  imports: [RouterOutlet, RouterLink, ConfirmDialogComponent],
  templateUrl: './teacher-layout.component.html',
  styleUrl: './teacher-layout.component.css'
})
export class TeacherLayoutComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  private clockHandle?: ReturnType<typeof setInterval>;

  readonly user = this.auth.currentUser;
  readonly confirmingSignOut = signal(false);
  readonly purgeWarning = signal<PurgeWarning | null>(null);
  readonly purgeWarningDismissed = signal(false);
  readonly now = signal(new Date());

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });

  /** Only nudge teachers during the entrada/salida windows — not all day. */
  readonly withinRegistrationWindow = computed(() => {
    const minutes = this.now().getHours() * 60 + this.now().getMinutes();
    const inEntryWindow = minutes >= ENTRY_WINDOW_START_MINUTES && minutes <= ENTRY_WINDOW_END_MINUTES;
    const inExitWindow = minutes >= EXIT_WINDOW_START_MINUTES && minutes <= EXIT_WINDOW_END_MINUTES;
    return inEntryWindow || inExitWindow;
  });

  readonly showPurgeWarning = computed(
    () => !!this.purgeWarning()?.active && this.withinRegistrationWindow() && !this.purgeWarningDismissed()
  );

  ngOnInit(): void {
    this.dashboardService.getPurgeWarning().subscribe(warning => this.purgeWarning.set(warning));
    this.clockHandle = setInterval(() => this.now.set(new Date()), 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.clockHandle) clearInterval(this.clockHandle);
  }

  confirmSignOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
