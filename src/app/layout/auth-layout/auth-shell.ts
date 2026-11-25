import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LanguageService } from '../../core/services/language.service';
import { BrandLogo } from '../../shared/components/brand-logo/brand-logo';

@Component({
  selector: 'app-auth-shell',
  imports: [BrandLogo],
  templateUrl: './auth-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShell {
  readonly lang = inject(LanguageService);

  protected swapLanguage(): void {
    const reduceMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as Document & {
      startViewTransition?: (update: () => void) => unknown;
    };

    if (reduceMotion || typeof doc.startViewTransition !== 'function') {
      this.lang.toggle();
      return;
    }

    doc.startViewTransition(() => {
      this.lang.toggle();
    });
  }
}
