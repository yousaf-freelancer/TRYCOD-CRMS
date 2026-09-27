import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { PageHeader } from '../../shared/ui/page-header';
import { TabLink, TabNav } from '../../shared/ui/tab-nav';

@Component({
  selector: 'app-fees-page',
  imports: [RouterOutlet, RouterLink, LucideDynamicIcon, PageHeader, TabNav],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header title="Fees" subtitle="Collections, installments, receipts and dues.">
      <a routerLink="/fees/collect" class="btn btn-primary"
        ><svg lucideIcon="indian-rupee" size="16" /> Collect fee</a
      >
    </app-page-header>
    <app-tab-nav [tabs]="tabs" label="Fees sections" />
    <router-outlet />
  `,
})
export class FeesPage {
  protected readonly tabs: TabLink[] = [
    { label: 'Overview', route: 'overview', icon: 'chart-pie' },
    { label: 'Collect fee', route: 'collect', icon: 'hand-coins' },
    { label: 'Payments', route: 'payments', icon: 'receipt' },
    { label: 'Pending & overdue', route: 'dues', icon: 'hourglass' },
  ];
}
