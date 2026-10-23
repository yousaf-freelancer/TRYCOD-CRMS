import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { AuthUser, LoginCredentials, LoginResponse, Role } from '../../domain/models';
import { apiUrl, toApiError } from '../http/api-client';

export const TOKEN_KEY = 'trycod_token';

/** Role codes from the API mapped to the UI role used for role-specific views. */
const ROLE_CODES: readonly [string, Role][] = [
  ['ADMIN', 'Admin'],
  ['ADVISOR', 'Advisor'],
  ['MENTOR', 'Mentor'],
  ['SALES', 'Sales'],
  ['STUDENT', 'Student'],
];

/**
 * JWT authentication against the NestJS API. The token lives in localStorage
 * (`trycod_token`); the user is kept in a signal and restored on page load via
 * `restoreSession()` (see `provideAppInitializer` in `app.config.ts`).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly roles = computed(() => this._user()?.roles ?? []);
  private readonly permissionSet = computed(() => new Set(this._user()?.permissions ?? []));
  /** UI roles derived from the user's role codes. */
  private readonly uiRoles = computed(() =>
    ROLE_CODES.filter(([code]) => this.roles().some((r) => r.toUpperCase().includes(code))).map(
      ([, role]) => role,
    ),
  );
  /** Primary UI role (highest first), used to pick role-specific views. */
  readonly role = computed<Role | null>(() => this.uiRoles()[0] ?? null);
  readonly isStudent = computed(() => this.roles().some((r) => r.toUpperCase() === 'STUDENT'));
  /** Human-readable role names, e.g. "Admin, Mentor". */
  readonly roleLabel = computed(() => this.roles().map(humanize).join(', '));

  token(): string | null {
    return safeStorage(() => localStorage.getItem(TOKEN_KEY)) ?? null;
  }

  login(credentials: LoginCredentials): Observable<AuthUser> {
    return this.http
      .post<LoginResponse>(apiUrl('auth/login'), {
        identifier: credentials.identifier.trim(),
        password: credentials.password,
      })
      .pipe(
        tap((res) => {
          safeStorage(() => localStorage.setItem(TOKEN_KEY, res.token));
          this._user.set(res.user);
        }),
        map((res) => res.user),
        catchError((err) => throwError(() => toApiError(err))),
      );
  }

  /** Restores the session from a stored token. Never errors. */
  restoreSession(): Observable<AuthUser | null> {
    if (!this.token()) return of(null);
    return this.http.get<AuthUser>(apiUrl('auth/me')).pipe(
      tap((user) => this._user.set(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  /** Revokes the session on the server, then clears it locally. Never errors. */
  logout(): Observable<void> {
    if (!this.token()) {
      this.clearSession();
      return of(undefined);
    }
    return this.http.post<void>(apiUrl('auth/logout'), {}).pipe(
      catchError(() => of(undefined)),
      map(() => this.clearSession()),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(apiUrl('auth/change-password'), { currentPassword, newPassword })
      .pipe(catchError((err) => throwError(() => toApiError(err))));
  }

  clearSession(): void {
    this._user.set(null);
    safeStorage(() => localStorage.removeItem(TOKEN_KEY));
  }

  hasPermission(...permissions: string[]): boolean {
    const granted = this.permissionSet();
    return permissions.some((p) => granted.has(p));
  }

  hasRole(...roles: Role[]): boolean {
    return this.uiRoles().some((r) => roles.includes(r));
  }

  /** Landing route after login. */
  homeUrl(): string {
    if (!this.isAuthenticated()) return '/login';
    return this.isStudent() ? '/portal' : '/dashboard';
  }
}

function humanize(code: string): string {
  return code
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function safeStorage<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}
