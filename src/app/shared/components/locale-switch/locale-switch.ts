import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { AppLanguage } from '../../../core/i18n/language';

@Component({
  selector: 'app-locale-switch',
  templateUrl: './locale-switch.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocaleSwitch {
  readonly value = input.required<AppLanguage>();
  /** Languages whose tab holds a field with an error. */
  readonly invalid = input<readonly AppLanguage[]>([]);
  readonly picked = output<AppLanguage>();
}
