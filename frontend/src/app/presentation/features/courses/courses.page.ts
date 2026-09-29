import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { PageHeader } from '../../../shared/ui/page-header';
import { TabLink, TabNav } from '../../../shared/ui/tab-nav';

@Component({
  selector: 'app-courses-page',
  imports: [RouterOutlet, PageHeader, TabNav],
  host: { class: 'block page-enter' },
  template: `
    <app-page-header
      [title]="isMentor() ? 'My batches' : 'Courses & Batches'"
      [subtitle]="
        isMentor()
          ? 'Batches you mentor, with timing and strength.'
          : 'Course catalogue, fees and batch schedules.'
      "
    />
    @if (!isMentor()) {
      <app-tab-nav [tabs]="tabs" label="Courses sections" />
    }
    <router-outlet />
  `,
})
export class CoursesPage {
  private readonly auth = inject(AuthService);
  protected readonly isMentor = computed(() => this.auth.role() === 'Mentor');
  protected readonly tabs: TabLink[] = [
    { label: 'Courses', route: 'catalog', icon: 'book-open' },
    { label: 'Batches', route: 'batches', icon: 'layers' },
  ];
}
