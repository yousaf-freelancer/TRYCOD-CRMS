import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import { AppNotification } from '../../domain/models';

/**
 * Notifications for the signed-in user. Holds a signal cache so the header
 * bell and the notifications page stay in sync.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(ApiClient);

  private readonly _items = signal<AppNotification[]>([]);
  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((n) => !n.read).length);

  getNotifications(): Observable<AppNotification[]> {
    return this.api
      .get<AppNotification[]>('notifications', [])
      .pipe(tap((items) => this._items.set(items)));
  }

  /** Optimistic: the local state updates immediately; a failed sync is ignored. */
  markRead(id: string): Observable<void> {
    this.setRead((n) => n.id === id);
    return this.api.patch<void>(`notifications/${id}/read`).pipe(catchError(() => of(undefined)));
  }

  markAllRead(): Observable<void> {
    this.setRead(() => true);
    return this.api.post<void>('notifications/read-all').pipe(catchError(() => of(undefined)));
  }

  private setRead(match: (n: AppNotification) => boolean): void {
    this._items.update((items) => items.map((n) => (match(n) ? { ...n, read: true } : n)));
  }
}
