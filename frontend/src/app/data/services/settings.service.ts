import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockDb } from '../mock/mock-db';
import { mockCompute } from '../mock/mock-response';
import { AppSettings } from '../../domain/models';

/** Institute settings. Later: `GET /api/settings`, `PATCH /api/settings/:section`. */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly db = inject(MockDb);

  getSettings(): Observable<AppSettings> {
    return mockCompute(() => this.db.settings);
  }

  save<K extends keyof AppSettings>(section: K, value: AppSettings[K]): Observable<AppSettings[K]> {
    return mockCompute(() => {
      this.db.settings = { ...this.db.settings, [section]: structuredClone(value) };
      return this.db.settings[section];
    }, 500);
  }
}
