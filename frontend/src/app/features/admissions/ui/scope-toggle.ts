import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';

export type Scope = 'mine' | 'all';

/** "Assigned to me / Everyone" switch used across admissions tabs. */
@Component({
  selector: 'app-scope-toggle',
  imports: [SelectButtonModule, FormsModule],
  template: `
    <p-selectbutton
      [options]="options"
      optionLabel="label"
      optionValue="value"
      [(ngModel)]="value"
      [allowEmpty]="false"
      size="small"
      ariaLabelledBy="scope-label"
    />
    <span id="scope-label" class="sr-only">Show records</span>
  `,
})
export class ScopeToggle {
  readonly value = model<Scope>('all');
  protected readonly options = [
    { label: 'Mine', value: 'mine' },
    { label: 'Everyone', value: 'all' },
  ];
}
