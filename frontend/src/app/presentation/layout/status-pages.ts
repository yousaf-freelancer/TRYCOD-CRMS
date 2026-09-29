import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { EmptyState } from '../../shared/ui/empty-state';

@Component({
  selector: 'app-forbidden-page',
  imports: [EmptyState],
  template: `
    <div class="card page-enter mx-auto mt-10 max-w-xl">
      <app-empty-state
        icon="shield-x"
        title="You don't have access to this page"
        message="Your role doesn't include this section. If you think this is a mistake, ask an administrator to update your permissions."
        actionLabel="Back to dashboard"
        actionIcon="arrow-left"
        (action)="home()"
      />
    </div>
  `,
})
export class ForbiddenPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected home(): void {
    void this.router.navigateByUrl(this.auth.homeFor(this.auth.role()));
  }
}

@Component({
  selector: 'app-not-found-page',
  imports: [EmptyState],
  template: `
    <div class="card page-enter mx-auto mt-10 max-w-xl">
      <app-empty-state
        icon="map-pin-off"
        title="Page not found"
        message="The page you're looking for doesn't exist or has moved."
        actionLabel="Go to dashboard"
        actionIcon="arrow-left"
        (action)="home()"
      />
    </div>
  `,
})
export class NotFoundPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected home(): void {
    void this.router.navigateByUrl(this.auth.homeFor(this.auth.role()));
  }
}
