import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { MockDb } from '../mock/mock-db';
import { mockCompute } from '../mock/mock-response';
import { AppNotification } from '../../domain/models';

/**
 * Notifications for the signed-in user. Holds a signal cache so the header
 * bell and the notifications page stay in sync.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly db = inject(MockDb);
  private readonly auth = inject(AuthService);

  private readonly _items = signal<AppNotification[]>([]);
  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((n) => !n.read).length);

  getNotifications(): Observable<AppNotification[]> {
    return mockCompute(() => {
      const role = this.auth.role();
      return this.db.notifications
        .filter((n) => role !== null && n.audience.includes(role))
        .sort((a, b) => b.at.localeCompare(a.at));
    }).pipe(tap((items) => this._items.set(items)));
  }

  markRead(id: string): Observable<void> {
    this.setRead((n) => n.id === id);
    return mockCompute(() => undefined, 150);
  }

  markAllRead(): Observable<void> {
    this.setRead(() => true);
    return mockCompute(() => undefined, 150);
  }

  private setRead(match: (n: AppNotification) => boolean): void {
    this.db.notifications.forEach((n) => {
      if (match(n)) n.read = true;
    });
    this._items.update((items) => items.map((n) => (match(n) ? { ...n, read: true } : n)));
  }
}
