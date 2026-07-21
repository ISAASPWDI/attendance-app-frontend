import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { extractErrorMessage } from '../utils/http-error.util';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.isAuthenticated()) {
        toast.show('Tu sesión expiró, inicia sesión de nuevo.', 'error');
        auth.logout();
        router.navigate(['/login']);
      } else {
        toast.show(extractErrorMessage(error, 'Ocurrió un error inesperado.'), 'error');
      }
      return throwError(() => error);
    })
  );
};
