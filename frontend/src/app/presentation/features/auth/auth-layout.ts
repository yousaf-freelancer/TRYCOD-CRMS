import { Component } from '@angular/core';
import { Logo } from '../../../shared/ui/logo';

/** Split auth layout: black brand panel (desktop) + form panel. */
@Component({
  selector: 'app-auth-layout',
  imports: [Logo],
  template: `
    <div class="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside
        class="relative hidden overflow-hidden bg-neutral-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12"
        aria-label="Trycod Tech School"
      >
        <!-- dot grid -->
        <div
          class="pointer-events-none absolute inset-0 opacity-[0.22]"
          style="background-image: radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px); background-size: 22px 22px; mask-image: radial-gradient(ellipse 80% 70% at 30% 40%, #000 30%, transparent 75%);"
          aria-hidden="true"
        ></div>
        <!-- soft monochrome shapes -->
        <div
          class="pointer-events-none absolute -right-32 -bottom-40 size-[520px] rounded-full border border-white/10"
          aria-hidden="true"
        ></div>
        <div
          class="pointer-events-none absolute -right-10 -bottom-16 size-[300px] rounded-full border border-white/10"
          aria-hidden="true"
        ></div>
        <div
          class="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-white/[0.04] blur-3xl"
          aria-hidden="true"
        ></div>

        <div class="relative">
          <span class="inline-flex items-center rounded-xl bg-white px-3.5 py-2.5 shadow-sm">
            <app-logo [height]="28" />
          </span>
        </div>

        <div class="relative max-w-md">
          <!-- code motif -->
          <div
            class="mb-10 font-mono text-[12.5px] leading-6 text-white/35 select-none"
            aria-hidden="true"
          >
            <p>
              <span class="text-white/55">const</span> developer =
              <span class="text-white/55">await</span> trycod.train(you);
            </p>
            <p>developer.ship(<span class="text-white/60">'production'</span>);</p>
            <p class="text-white/20">// learn → build → deploy</p>
          </div>
          <h1 class="text-[40px] leading-[1.08] font-semibold tracking-[-0.03em]">
            Crafting future-ready developers.
          </h1>
          <p class="mt-4 text-[15px] text-white/60">
            Trycod Tech School — industry-led software training.
          </p>
        </div>

        <p class="relative text-xs text-white/40">© 2026 Trycod Tech School</p>
      </aside>

      <main class="flex flex-col px-6 py-8 sm:px-10">
        <div class="mb-10 lg:hidden">
          <app-logo [height]="28" />
        </div>
        <div class="flex flex-1 items-center justify-center">
          <div class="page-enter w-full max-w-[380px]">
            <ng-content />
          </div>
        </div>
        <p class="mt-8 text-center text-xs text-muted lg:hidden">© 2026 Trycod Tech School</p>
      </main>
    </div>
  `,
})
export class AuthLayout {}
