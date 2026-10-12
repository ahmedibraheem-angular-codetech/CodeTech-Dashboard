import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { SeoLocale } from '../../models/seo.model';

/** The عربي / English switch shared by every card. English stays on the left, as in the design. */
@Component({
  selector: 'app-locale-switch',
  templateUrl: './locale-switch.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocaleSwitch {
  readonly value = input.required<SeoLocale>();
  readonly picked = output<SeoLocale>();
}
