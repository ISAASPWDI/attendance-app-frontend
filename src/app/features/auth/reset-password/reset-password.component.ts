import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { passwordMatchValidator } from '../../../core/utils/password-match.validator';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly username = signal(this.route.snapshot.queryParamMap.get('username') ?? '');
  readonly loading = signal(false);
  readonly resending = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      code: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') }
  );

  submit(): void {
    if (this.form.invalid || !this.username() || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    const { code, newPassword } = this.form.getRawValue();

    this.auth.resetPassword({ username: this.username(), code, newPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.infoMessage.set('Contraseña actualizada. Ya puedes iniciar sesión.');
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

    this.auth.forgotPassword({ username: this.username() }).subscribe({
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
