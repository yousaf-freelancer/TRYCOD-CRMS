import { Component, computed, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-dashboard-skeleton',
  imports: [SkeletonModule],
  host: { class: 'block', 'aria-busy': 'true', 'aria-label': 'Loading dashboard' },
  template: `
    <div
      class="grid gap-4 sm:grid-cols-2"
      [class]="cards() > 4 ? 'xl:grid-cols-3 2xl:grid-cols-6' : 'xl:grid-cols-4'"
    >
      @for (i of cardList(); track i) {
        <div class="card card-pad space-y-4">
          <p-skeleton width="60%" height="0.75rem" />
          <p-skeleton width="45%" height="1.6rem" />
          <p-skeleton width="35%" height="0.7rem" />
        </div>
      }
    </div>
    <div class="mt-4 grid gap-4 lg:grid-cols-3">
      <div class="card card-pad lg:col-span-2"><p-skeleton height="260px" /></div>
      <div class="card card-pad"><p-skeleton height="260px" /></div>
    </div>
  `,
})
export class DashboardSkeleton {
  readonly cards = input(6);
  protected readonly cardList = computed(() => Array.from({ length: this.cards() }, (_, i) => i));
}
