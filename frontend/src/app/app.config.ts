import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { apiInterceptor } from './core/http/api.interceptor';
import { PageTitleStrategy } from './core/navigation/page-title.strategy';
import { provideAppIcons } from './core/theme/icons';
import { TrycodPreset } from './core/theme/trycod-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    { provide: TitleStrategy, useExisting: PageTitleStrategy },
    // Configured for the future NestJS API; no requests are made yet.
    provideHttpClient(withFetch(), withInterceptors([apiInterceptor])),
    providePrimeNG({
      ripple: false,
      license: environment.primeLicenseKey || undefined,
      theme: {
        preset: TrycodPreset,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: { name: 'primeng', order: 'theme, base, primeng, components, utilities' },
        },
      },
    }),
    MessageService,
    ConfirmationService,
    provideAppIcons(),
  ],
};
