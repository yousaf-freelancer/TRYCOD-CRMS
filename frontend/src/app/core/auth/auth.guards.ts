import { inject } from '@angular/core';
import { CanActivateFn, RedirectFunction, Router } from '@angular/router';
import { Role } from '../../domain/models';
import { AuthService } from './auth.service';

/** Blocks unauthenticated users and sends them to login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || inject(Router).createUrlTree(['/login']);
};

/** Keeps signed-in users away from the login screen. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isAuthenticated() || inject(Router).createUrlTree([auth.homeUrl()]);
};

/** Staff shell: students are sent to their portal. */
export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) return inject(Router).createUrlTree(['/login']);
  return !auth.isStudent() || inject(Router).createUrlTree(['/portal']);
};

/** Allows the route only when the user holds the given permission code. */
export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
    return auth.hasPermission(permission) || router.createUrlTree(['/forbidden']);
  };
}

/**
 * Narrows a section to specific roles for role-specific views (e.g. the
 * admissions list is not shown to sales staff). Prefer `permissionGuard`.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = route.data['roles'] as readonly Role[] | undefined;
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (!allowed || auth.hasRole(...allowed)) return true;
  return router.createUrlTree(['/forbidden']);
};

/** `/` → the right home for the current user (or login). */
export const homeRedirect: RedirectFunction = () => inject(AuthService).homeUrl();
