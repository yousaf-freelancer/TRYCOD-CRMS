import { Component, computed, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

export interface RowAction {
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  visible?: boolean;
  command: () => void;
}

/** Kebab button that opens a popup menu of row actions. */
@Component({
  selector: 'app-row-actions',
  imports: [MenuModule, LucideDynamicIcon],
  host: { class: 'inline-flex' },
  template: `
    <button
      type="button"
      class="btn btn-ghost btn-icon btn-sm"
      [attr.aria-label]="'Actions for ' + label()"
      aria-haspopup="menu"
      (click)="menu.toggle($event)"
    >
      <svg lucideIcon="ellipsis" size="16" />
    </button>
    <p-menu #menu [model]="items()" [popup]="true" appendTo="body" styleClass="min-w-44">
      <ng-template #item let-item>
        <span
          class="flex items-center gap-2.5 px-2.5 py-1.5 text-[13px]"
          [class.text-red-700]="item.state?.danger"
        >
          @if (item.icon) {
            <svg [lucideIcon]="item.icon" size="15" strokeWidth="1.75" />
          }
          {{ item.label }}
        </span>
      </ng-template>
    </p-menu>
  `,
})
export class RowActions {
  readonly actions = input.required<RowAction[]>();
  /** Accessible label for the row (e.g. the record name). */
  readonly label = input('row');

  protected readonly items = computed<MenuItem[]>(() =>
    this.actions()
      .filter((a) => a.visible !== false)
      .map((a) => ({
        label: a.label,
        icon: a.icon,
        disabled: a.disabled,
        state: { danger: a.danger ?? false },
        command: () => a.command(),
      })),
  );
}
