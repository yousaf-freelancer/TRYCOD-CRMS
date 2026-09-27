import { Routes } from '@angular/router';

export const FEES_ROUTES: Routes = [
  {
    path: 'receipt/:id',
    title: 'Fee receipt',
    loadComponent: () => import('./receipt/receipt.page').then((m) => m.ReceiptPage),
  },
  {
    path: '',
    loadComponent: () => import('./fees.page').then((m) => m.FeesPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        title: 'Fee overview',
        loadComponent: () => import('./overview/fees-overview').then((m) => m.FeesOverview),
      },
      {
        path: 'collect',
        title: 'Collect fee',
        loadComponent: () => import('./collect/collect-fee').then((m) => m.CollectFee),
      },
      {
        path: 'payments',
        title: 'Payments',
        loadComponent: () => import('./payments/payments-list').then((m) => m.PaymentsList),
      },
      {
        path: 'dues',
        title: 'Pending & overdue',
        loadComponent: () => import('./dues/dues-list').then((m) => m.DuesList),
      },
    ],
  },
];
