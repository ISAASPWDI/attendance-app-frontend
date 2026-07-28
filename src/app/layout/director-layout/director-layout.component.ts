import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { PurgeWarning } from '../../core/models/attendance.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-director-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialogComponent],
  templateUrl: './director-layout.component.html',
  styleUrl: './director-layout.component.css'
})
export class DirectorLayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private dashboardService = inject(DashboardService);

  readonly user = this.auth.currentUser;
  readonly confirmingSignOut = signal(false);
  readonly purgeWarning = signal<PurgeWarning | null>(null);
  readonly purgeWarningDismissed = signal(false);

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });

  ngOnInit(): void {
    this.dashboardService.getPurgeWarning().subscribe(warning => this.purgeWarning.set(warning));
  }

  confirmSignOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
