import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import { AppSettings } from '../../domain/models';

/** Blank settings shown until the API returns the institute's configuration. */
const EMPTY_SETTINGS: AppSettings = {
  institute: {
    name: '',
    legalName: '',
    tagline: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
  },
  academicYear: { label: '', startDate: '', endDate: '', weeklyOff: '', holidays: [] },
  fees: {
    allowInstallments: false,
    maxInstallments: 0,
    minDownPaymentPct: 0,
    installmentGapDays: 0,
    lateFeeType: 'Flat',
    lateFeeValue: 0,
    graceDays: 0,
    receiptPrefix: '',
    reminderDaysBefore: 0,
  },
  attendance: {
    officeStart: '',
    officeEnd: '',
    staffLateAfterMin: 0,
    halfDayBelowHours: 0,
    fullDayHours: 0,
    studentLateAfterMin: 0,
    lowAttendanceAlertPct: 0,
    autoMarkAbsentAfter: '',
  },
  permissions: [],
  notificationPrefs: [],
};

/** Institute settings: `GET /settings`, `PATCH /settings/:section`. */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ApiClient);

  getSettings(): Observable<AppSettings> {
    return this.api.get<AppSettings>('settings', structuredClone(EMPTY_SETTINGS));
  }

  save<K extends keyof AppSettings>(section: K, value: AppSettings[K]): Observable<AppSettings[K]> {
    return this.api.patch<AppSettings[K]>(`settings/${section}`, value);
  }
}
