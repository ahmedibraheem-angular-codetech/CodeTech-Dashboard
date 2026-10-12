import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { LanguageService } from './core/services/language.service';
import { LayoutService } from './core/services/layout.service';
import { AppTitleStrategy } from './core/services/title.strategy';
import { AppTheme } from './core/theme/app-theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: AppTheme,
        options: {
          // PrimeNG defaults to following the OS dark preference; the app is light only.
          darkModeSelector: false,
        },
      },
    }),
    MessageService,
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    // These services apply <html> attributes (lang, dir, density) from their
    // constructors, so create them up front instead of relying on a component to do it.
    provideAppInitializer(() => {
      inject(LanguageService);
      inject(LayoutService);
    }),
  ],
};
