import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { LeaveType } from '../../../../domain/models';
import { EmptyState } from '../../../../shared/ui/empty-state';
import { LeaveService } from '../../../../data/services/leave.service';
import { LeaveTypeDialog } from '../../hr/leave/leave-type-dialog';
import { SettingsSection } from '../ui/settings-section';

@Component({
  selector: 'app-leave-type-settings',
  imports: [LucideDynamicIcon, EmptyState, SettingsSection, LeaveTypeDialog],
  template: `
    <app-settings-section
      title="Leave types"
      description="Annual quotas per employee. Balances reset at the start of the academic year."
      [showSave]="false"
    >
      <div class="mb-4 flex justify-end">
        <button type="button" class="btn btn-primary btn-sm" (click)="open(null)">
          <svg lucideIcon="plus" size="14" /> Add leave type
        </button>
      </div>
      <ul class="divide-y divide-neutral-100 rounded-xl border border-line">
        @for (t of types.value(); track t.id) {
          <li class="flex items-center gap-4 px-4 py-3">
            <span
              class="mono grid size-10 place-items-center rounded-lg bg-surface-muted text-[12px] font-semibold"
              >{{ t.code }}</span
            >
            <div class="min-w-0 flex-1">
              <p class="text-[13.5px] font-medium">{{ t.name }}</p>
              <p class="truncate text-xs text-muted">{{ t.description }}</p>
            </div>
            <div class="hidden text-right text-xs text-muted sm:block">
              <p class="text-[13px] font-semibold text-ink">
                {{ t.annualQuota ? t.annualQuota + ' days / yr' : 'No quota' }}
              </p>
              <p>{{ t.paid ? 'Paid' : 'Unpaid' }}{{ t.carryForward ? ' · carry forward' : '' }}</p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" (click)="open(t)">Edit</button>
          </li>
        } @empty {
          <li><app-empty-state icon="plane" title="No leave types" /></li>
        }
      </ul>
    </app-settings-section>
    <app-leave-type-dialog [(visible)]="dialogOpen" [type]="editing()" (saved)="types.reload()" />
  `,
})
export class LeaveTypeSettings {
  private readonly service = inject(LeaveService);
  protected readonly types = rxResource({
    stream: () => this.service.getLeaveTypes(),
    defaultValue: [],
  });
  protected readonly dialogOpen = signal(false);
  protected readonly editing = signal<LeaveType | null>(null);

  protected open(t: LeaveType | null): void {
    this.editing.set(t);
    this.dialogOpen.set(true);
  }
}
