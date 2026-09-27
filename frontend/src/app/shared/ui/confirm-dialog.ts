import { Component } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

/** App-wide confirm dialog host. Use `ConfirmService.ask()` to open it. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [ConfirmDialogModule],
  template: `<p-confirmdialog [style]="{ width: '26rem', maxWidth: 'calc(100vw - 2rem)' }" />`,
})
export class ConfirmDialog {}
