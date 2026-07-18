import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    const username = this.form.getRawValue().username;

    this.auth.forgotPassword({ username }).subscribe({
      next: () => {
        this.loading.set(false);
        this.infoMessage.set('Si el usuario existe, recibirás un código en tu correo.');
        setTimeout(() => this.router.navigate(['/reset-password'], { queryParams: { username } }), 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo procesar la solicitud.');
      }
    });
  }
}
