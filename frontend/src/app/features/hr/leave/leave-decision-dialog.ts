import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { AuthService } from '../../../core/auth/auth.service';
import { LeaveRequestView } from '../../../models';
import { AppDatePipe } from '../../../shared/pipes/format.pipes';
import { ToastService } from '../../../shared/ui/toast.service';
import { LeaveService } from '../data-access/leave.service';

@Component({
  selector: 'app-leave-decision-dialog',
  imports: [DialogModule, FormsModule, TextareaModule, AppDatePipe],
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="decision() === 'Approved' ? 'Approve leave' : 'Reject leave'"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '30rem' }"
      [breakpoints]="{ '640px': '96vw' }"
    >
      @if (request(); as r) {
        <dl class="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-surface-muted p-3 text-[13px]">
          <div>
            <dt class="text-xs text-muted">Employee</dt>
            <dd class="font-medium">{{ r.employeeName }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">Type</dt>
            <dd class="font-medium">{{ r.leaveTypeName }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">Dates</dt>
            <dd>{{ r.from | appDate: 'dayMonth' }} – {{ r.to | appDate }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">Days</dt>
            <dd>{{ r.days }}</dd>
          </div>
          <div class="col-span-2">
            <dt class="text-xs text-muted">Reason</dt>
            <dd>{{ r.reason }}</dd>
          </div>
        </dl>
      }
      <label class="field">
        <span class="field-label"
          >Note {{ decision() === 'Rejected' ? '(required)' : '(optional)' }}</span
        >
        <textarea
          pTextarea
          rows="3"
          [(ngModel)]="note"
          [placeholder]="
            decision() === 'Rejected' ? 'Let them know why' : 'Optional note for the employee'
          "
        ></textarea>
      </label>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button
          type="button"
          class="btn"
          [class]="decision() === 'Approved' ? 'btn-primary' : 'btn-danger'"
          [disabled]="saving() || (decision() === 'Rejected' && !note().trim())"
          (click)="save()"
        >
          {{ decision() === 'Approved' ? 'Approve' : 'Reject' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class LeaveDecisionDialog {
  private readonly service = inject(LeaveService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly visible = model(false);
  readonly request = input<LeaveRequestView | null>(null);
  readonly decision = input<'Approved' | 'Rejected'>('Approved');
  readonly done = output<void>();

  protected readonly note = signal('');
  protected readonly saving = signal(false);

  constructor() {
    effect(() => {
      if (this.visible()) this.note.set('');
    });
  }

  protected save(): void {
    const r = this.request();
    if (!r) return;
    this.saving.set(true);
    this.service
      .decide(r.id, this.decision(), this.auth.user()?.employeeId ?? '', this.note().trim())
      .subscribe(() => {
        this.saving.set(false);
        this.visible.set(false);
        this.toast.success(
          `Leave ${this.decision().toLowerCase()}`,
          `${r.employeeName} · ${r.days} day(s)`,
        );
        this.done.emit();
      });
  }
}
