import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

export interface PageContext {
  title: string;
  section: string | null;
}

/**
 * Sets the document title and exposes the current page title + section as a
 * signal for the header breadcrumb.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  readonly context = signal<PageContext>({ title: '', section: null });

  override updateTitle(state: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(state) ?? '';
    let section: string | null = null;
    let node: ActivatedRouteSnapshot | null = state.root;
    while (node) {
      const s = node.data['section'] as string | undefined;
      if (s) section = s;
      node = node.firstChild;
    }
    this.context.set({ title: pageTitle, section: section === pageTitle ? null : section });
    this.title.setTitle(pageTitle ? `${pageTitle} · Trycod Tech School` : 'Trycod Tech School');
  }
}
