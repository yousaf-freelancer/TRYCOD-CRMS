import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PermissionLevel, PermissionRow, Role, ALL_ROLES } from '../../../models';
import { ToastService } from '../../../shared/ui/toast.service';
import { SettingsService } from '../data-access/settings.service';
import { SettingsSection } from '../ui/settings-section';

const NEXT: Record<PermissionLevel, PermissionLevel> = { Full: 'View', View: 'None', None: 'Full' };
const STYLE: Record<PermissionLevel, string> = {
  Full: 'bg-neutral-950 text-white border-neutral-950',
  View: 'bg-white text-ink border-neutral-400',
  None: 'bg-neutral-50 text-neutral-400 border-dashed border-neutral-300',
};

@Component({
  selector: 'app-roles-settings',
  imports: [SettingsSection],
  template: `
    <app-settings-section
      title="Roles & permissions"
      description="Click a cell to cycle Full → View → None. Admin always keeps full access."
      [saving]="saving()"
      [dirty]="dirty()"
      (save)="save()"
    >
      <div class="-mx-6 overflow-x-auto px-6">
        <table class="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr class="text-left text-xs text-muted">
              <th class="py-2 pr-4 font-medium">Module</th>
              @for (r of roles; track r) {
                <th class="px-2 py-2 text-center font-medium">{{ r }}</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            @for (row of rows(); track row.module; let i = $index) {
              <tr>
                <th scope="row" class="py-2.5 pr-4 text-left font-medium">{{ row.module }}</th>
                @for (r of roles; track r) {
                  <td class="px-2 py-2 text-center">
                    <button
                      type="button"
                      class="h-7 w-16 rounded-md border text-xs font-medium transition-colors disabled:cursor-not-allowed"
                      [class]="style[row.levels[r]]"
                      [disabled]="r === 'Admin'"
                      [attr.aria-label]="row.module + ' for ' + r + ': ' + row.levels[r]"
                      (click)="cycle(i, r)"
                    >
                      {{ row.levels[r] }}
                    </button>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="mt-4 text-xs text-muted">
        The frontend role guard and sidebar use a matching config today; the backend will enforce
        this matrix per API route.
      </p>
    </app-settings-section>
  `,
})
export class RolesSettings {
  private readonly service = inject(SettingsService);
  private readonly toast = inject(ToastService);

  protected readonly roles: readonly Role[] = ALL_ROLES;
  protected readonly style = STYLE;
  protected readonly rows = signal<PermissionRow[]>([]);
  protected readonly dirty = signal(false);
  protected readonly saving = signal(false);
  private readonly settings = rxResource({ stream: () => this.service.getSettings() });

  constructor() {
    effect(() => {
      const s = this.settings.hasValue() ? this.settings.value() : undefined;
      if (s) this.rows.set(s.permissions);
    });
  }

  protected cycle(index: number, role: Role): void {
    this.rows.update((rows) =>
      rows.map((row, i) =>
        i === index ? { ...row, levels: { ...row.levels, [role]: NEXT[row.levels[role]] } } : row,
      ),
    );
    this.dirty.set(true);
  }

  protected save(): void {
    this.saving.set(true);
    this.service.save('permissions', this.rows()).subscribe(() => {
      this.saving.set(false);
      this.dirty.set(false);
      this.toast.success('Permissions saved');
    });
  }
}
