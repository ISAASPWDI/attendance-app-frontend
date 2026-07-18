import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-teacher-layout',
  imports: [RouterOutlet, RouterLink, ConfirmDialogComponent],
  templateUrl: './teacher-layout.component.html',
  styleUrl: './teacher-layout.component.css'
})
export class TeacherLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly confirmingSignOut = signal(false);

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });

  confirmSignOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
