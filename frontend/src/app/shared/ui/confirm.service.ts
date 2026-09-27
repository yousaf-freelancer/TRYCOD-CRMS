import { Injectable, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

export interface ConfirmOptions {
  header: string;
  message: string;
  acceptLabel?: string;
  rejectLabel?: string;
  danger?: boolean;
}

/** Promise-based wrapper around PrimeNG's ConfirmationService. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly confirmation = inject(ConfirmationService);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmation.confirm({
        header: options.header,
        message: options.message,
        closable: true,
        closeOnEscape: true,
        dismissableMask: true,
        rejectButtonProps: {
          label: options.rejectLabel ?? 'Cancel',
          severity: 'secondary',
          outlined: true,
        },
        acceptButtonProps: {
          label: options.acceptLabel ?? 'Confirm',
          severity: options.danger ? 'danger' : undefined,
        },
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }
}
