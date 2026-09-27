import { Component, computed, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

/** Loading placeholder shaped like a data table. */
@Component({
  selector: 'app-table-skeleton',
  imports: [SkeletonModule],
  host: { class: 'block', 'aria-busy': 'true', 'aria-label': 'Loading' },
  template: `
    <div class="divide-y divide-neutral-100">
      <div class="flex gap-6 bg-neutral-50 px-4 py-3">
        @for (c of colList(); track $index) {
          <p-skeleton [width]="$first ? '9rem' : '5rem'" height="0.7rem" />
        }
      </div>
      @for (r of rowList(); track $index) {
        <div class="flex items-center gap-6 px-4 py-3.5">
          @for (c of colList(); track $index) {
            @if ($first) {
              <div class="flex items-center gap-3">
                <p-skeleton shape="circle" size="2rem" />
                <div class="space-y-1.5">
                  <p-skeleton width="8rem" height="0.7rem" />
                  <p-skeleton width="5rem" height="0.6rem" />
                </div>
              </div>
            } @else {
              <p-skeleton [width]="widths[($index + r) % widths.length]" height="0.7rem" />
            }
          }
        </div>
      }
    </div>
  `,
})
export class TableSkeleton {
  readonly rows = input(6);
  readonly cols = input(5);
  protected readonly widths = ['4rem', '6rem', '5rem', '7rem', '3.5rem'];
  protected readonly rowList = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
  protected readonly colList = computed(() => Array.from({ length: this.cols() }, (_, i) => i));
}
