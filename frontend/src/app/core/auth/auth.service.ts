import { Injectable, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUser, DemoAccount, LoginCredentials, Role } from '../../domain/models';
import { DEMO_ACCOUNTS, DEMO_USERS } from '../../data/mock-data/users.mock';
import { mockCompute, mockError } from '../../data/mock/mock-response';

const STORAGE_KEY = 'trycod.session';

/**
 * Mock authentication. Holds the current user as a signal. To switch to real
 * JWT auth, replace `login()` with an HttpClient call, store the token, and
 * keep the same public surface (`user`, `role`, `isAuthenticated`, `logout`).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AppUser | null>(this.restore());

  readonly user = this._user.asReadonly();
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isStudent = computed(() => this._user()?.role === 'Student');

  readonly demoAccounts: readonly DemoAccount[] = DEMO_ACCOUNTS;

  login(credentials: LoginCredentials): Observable<AppUser> {
    const email = credentials.email.trim().toLowerCase();
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email === email && a.password === credentials.password,
    );
    if (!account) {
      return mockError('Invalid email or password. Use one of the demo accounts below.', 500);
    }
    return mockCompute(() => {
      const user = DEMO_USERS[account.email];
      this._user.set(user);
      this.persist(user, credentials.remember);
      return user;
    }, 500);
  }

  logout(): void {
    this._user.set(null);
    this.safeStorage(() => {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    });
  }

  requestPasswordReset(email: string): Observable<{ email: string }> {
    return mockCompute(() => ({ email: email.trim() }), 700);
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.role();
    return role !== null && roles.includes(role);
  }

  /** Landing route after login for a role. */
  homeFor(role: Role | null): string {
    return role === 'Student' ? '/portal' : role ? '/dashboard' : '/login';
  }

  private persist(user: AppUser, remember: boolean): void {
    this.safeStorage(() =>
      (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(user)),
    );
  }

  private restore(): AppUser | null {
    return (
      this.safeStorage(() => {
        const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as AppUser) : null;
      }) ?? null
    );
  }

  private safeStorage<T>(fn: () => T): T | undefined {
    try {
      return fn();
    } catch {
      return undefined;
    }
  }
}
