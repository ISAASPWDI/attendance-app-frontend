import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    const username = this.form.getRawValue().username;

    this.auth.login(this.form.getRawValue()).subscribe({
      next: user => {
        this.loading.set(false);
        this.router.navigate([user.role === 'DIRECTOR' ? '/director' : '/teacher']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 403) {
          this.router.navigate(['/verify-email'], { queryParams: { username } });
          return;
        }
        this.errorMessage.set(
          err.status === 401
            ? 'Usuario o contraseña incorrectos.'
            : 'No se pudo iniciar sesión. Intenta nuevamente.'
        );
      }
    });
  }
}
