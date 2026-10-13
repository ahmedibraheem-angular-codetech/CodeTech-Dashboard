import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { AppLanguage } from '../../../core/i18n/language';

/** The عربي / English switch used by every bilingual card. English stays on the left, as in the design. */
@Component({
  selector: 'app-locale-switch',
  templateUrl: './locale-switch.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocaleSwitch {
  readonly value = input.required<AppLanguage>();
  readonly picked = output<AppLanguage>();
}
