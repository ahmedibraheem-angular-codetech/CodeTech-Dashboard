import { ChangeDetectionStrategy, Component, inject, model, output } from '@angular/core';
import { Dialog } from 'primeng/dialog';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';

@Component({
  selector: 'app-login-reset-success',
  imports: [Dialog, AppButton],
  templateUrl: './login-reset-success.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginResetSuccess {
  readonly lang = inject(LanguageService);

  readonly visible = model(false);
  readonly confirmed = output<void>();

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
