import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { LeaveType } from '../../../../domain/models';
import { ToastService } from '../../../../shared/ui/toast.service';
import { LeaveService } from '../../../../data/services/leave.service';

@Component({
  selector: 'app-leave-type-dialog',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ToggleSwitchModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="type() ? 'Edit leave type' : 'Add leave type'"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '32rem' }"
      [breakpoints]="{ '640px': '96vw' }"
    >
      <form id="lt-form" class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        <div class="field">
          <label class="field-label" for="lt-name">Name</label>
          <input
            pInputText
            id="lt-name"
            formControlName="name"
            [invalid]="form.controls.name.invalid && form.controls.name.touched"
          />
        </div>
        <div class="field">
          <label class="field-label" for="lt-code">Code</label>
          <input
            pInputText
            id="lt-code"
            formControlName="code"
            class="uppercase"
            maxlength="4"
            [readonly]="!!type()"
            [invalid]="form.controls.code.invalid && form.controls.code.touched"
          />
        </div>
        <div class="field">
          <label class="field-label" for="lt-quota">Days per year</label>
          <p-inputnumber
            inputId="lt-quota"
            formControlName="annualQuota"
            [min]="0"
            [max]="60"
            [showButtons]="true"
          />
        </div>
        <div class="flex flex-col justify-end gap-3 pb-1">
          <label class="flex items-center justify-between gap-3 text-[13px]"
            ><span>Paid leave</span><p-toggleswitch formControlName="paid"
          /></label>
          <label class="flex items-center justify-between gap-3 text-[13px]"
            ><span>Carry forward</span><p-toggleswitch formControlName="carryForward"
          /></label>
        </div>
        <div class="field sm:col-span-2">
          <label class="field-label" for="lt-desc">Policy note</label>
          <input pInputText id="lt-desc" formControlName="description" />
        </div>
      </form>
      <ng-template #footer>
        <button type="button" class="btn btn-secondary" (click)="visible.set(false)">Cancel</button>
        <button type="submit" form="lt-form" class="btn btn-primary" [disabled]="saving()">
          Save
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class LeaveTypeDialog {
  private readonly service = inject(LeaveService);
  private readonly toast = inject(ToastService);
  readonly visible = model(false);
  readonly type = input<LeaveType | null>(null);
  readonly saved = output<void>();
  protected readonly saving = signal(false);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(4)],
    }),
    annualQuota: new FormControl(6, { nonNullable: true }),
    paid: new FormControl(true, { nonNullable: true }),
    carryForward: new FormControl(false, { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const t = this.type();
      this.form.reset(
        t
          ? {
              name: t.name,
              code: t.code,
              annualQuota: t.annualQuota,
              paid: t.paid,
              carryForward: t.carryForward,
              description: t.description,
            }
          : undefined,
      );
    });
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = { ...this.form.getRawValue(), code: this.form.getRawValue().code.toUpperCase() };
    this.saving.set(true);
    this.service.saveLeaveType(v, this.type()?.id).subscribe(() => {
      this.saving.set(false);
      this.visible.set(false);
      this.toast.success('Leave type saved', v.name);
      this.saved.emit();
    });
  }
}
