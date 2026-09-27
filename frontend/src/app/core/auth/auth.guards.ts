import { inject } from '@angular/core';
import { CanActivateFn, RedirectFunction, Router } from '@angular/router';
import { Role } from '../../models';
import { AuthService } from './auth.service';

/** Blocks unauthenticated users and sends them to login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || inject(Router).createUrlTree(['/login']);
};

/** Keeps signed-in users away from the login screens. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isAuthenticated() || inject(Router).createUrlTree([auth.homeFor(auth.role())]);
};

/** Staff shell: students are sent to their portal. */
export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) return inject(Router).createUrlTree(['/login']);
  return !auth.isStudent() || inject(Router).createUrlTree(['/portal']);
};

/** Student portal: staff are sent to their dashboard. */
export const studentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) return inject(Router).createUrlTree(['/login']);
  return auth.isStudent() || inject(Router).createUrlTree(['/dashboard']);
};

/**
 * Allows the route only for `data.roles`. Routes without `data.roles` are
 * open to any signed-in user.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = route.data['roles'] as readonly Role[] | undefined;
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (!allowed || auth.hasRole(...allowed)) return true;
  return router.createUrlTree(['/forbidden']);
};

/** `/` → the right home for the current role (or login). */
export const homeRedirect: RedirectFunction = () => {
  const auth = inject(AuthService);
  return auth.homeFor(auth.role());
};
