import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { LanguageService } from '../../../../core/services/language.service';
import { StateView } from '../../../../shared/components/state-view/state-view';

@Component({
  selector: 'app-forbidden',
  imports: [StateView],
  templateUrl: './forbidden.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenPage {
  readonly lang = inject(LanguageService);
  private readonly router = inject(Router);

  goHome(): void {
    void this.router.navigate(['/']);
  }
}
