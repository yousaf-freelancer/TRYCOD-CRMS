import { DestroyRef, effect, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { AppSettings } from '../../../models';
import { ToastService } from '../../../shared/ui/toast.service';
import { SettingsService } from '../data-access/settings.service';

/**
 * Wires a reactive form to one settings section: loads it, tracks dirty state
 * and saves through SettingsService. Call from a component constructor/field.
 */
export function settingsForm<K extends keyof AppSettings>(
  section: K,
  form: FormGroup,
  toValue: () => AppSettings[K],
  fromValue: (v: AppSettings[K]) => void = (v) => form.reset(v as object),
) {
  const service = inject(SettingsService);
  const toast = inject(ToastService);
  const saving = signal(false);
  const dirty = signal(false);
  const settings = rxResource({ stream: () => service.getSettings() });

  effect(() => {
    const s = settings.hasValue() ? settings.value() : undefined;
    if (!s) return;
    fromValue(s[section]);
    form.markAsPristine();
    dirty.set(false);
  });
  form.valueChanges
    .pipe(takeUntilDestroyed(inject(DestroyRef)))
    .subscribe(() => dirty.set(form.dirty));

  const save = () => {
    form.markAllAsTouched();
    if (form.invalid) {
      toast.error('Check the highlighted fields');
      return;
    }
    saving.set(true);
    service.save(section, toValue()).subscribe(() => {
      saving.set(false);
      form.markAsPristine();
      dirty.set(false);
      toast.success('Settings saved');
    });
  };

  return { settings, saving, dirty, save };
}
