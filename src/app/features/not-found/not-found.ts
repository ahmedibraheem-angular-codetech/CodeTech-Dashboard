import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { LanguageService } from '../../core/services/language.service';
import { AppButton } from '../../shared/components/app-button/app-button';
import { SectionEmpty } from '../../shared/components/section-empty/section-empty';

@Component({
  selector: 'app-not-found',
  imports: [AppButton, SectionEmpty],
  template: `
    <div class="state" role="alert">
      <app-section-empty [title]="lang.t('notFound.title')" [hint]="lang.t('notFound.hint')">
        <app-button icon="pi pi-home" [label]="lang.t('notFound.back')" (clicked)="goHome()" />
      </app-section-empty>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  readonly lang = inject(LanguageService);
  private readonly router = inject(Router);

  protected goHome(): void {
    void this.router.navigateByUrl('/');
  }
}
