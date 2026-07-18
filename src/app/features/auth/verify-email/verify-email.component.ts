import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly username = signal(this.route.snapshot.queryParamMap.get('username') ?? '');
  readonly loading = signal(false);
  readonly resending = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
  });

  submit(): void {
    if (this.form.invalid || !this.username() || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.auth.verifyEmail({ username: this.username(), code: this.form.getRawValue().code }).subscribe({
      next: () => {
        this.loading.set(false);
        this.infoMessage.set('Correo verificado. Ya puedes iniciar sesión.');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Código inválido o expirado.');
      }
    });
  }

  resend(): void {
    if (!this.username() || this.resending()) return;

    this.resending.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.auth.resendVerification({ username: this.username() }).subscribe({
      next: () => {
        this.resending.set(false);
        this.infoMessage.set('Te enviamos un nuevo código.');
      },
      error: (err: HttpErrorResponse) => {
        this.resending.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo reenviar el código.');
      }
    });
  }
}
