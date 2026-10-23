import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Attaches `Authorization: Bearer <token>` and handles expired sessions:
 * a 401 (other than from the login call) clears the token and goes to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const request = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !req.url.endsWith('/auth/login')
      ) {
        auth.clearSession();
        // During app start-up the guards handle the redirect.
        if (router.navigated && !router.url.startsWith('/login')) {
          void router.navigateByUrl('/login');
        }
      }
      return throwError(() => err);
    }),
  );
};
