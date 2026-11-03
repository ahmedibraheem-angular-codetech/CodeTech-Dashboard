import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { SeoLocale } from '../../models/seo.model';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';

@Component({
  selector: 'app-seo-panel',
  imports: [LocaleSwitch],
  templateUrl: './seo-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeoPanel {
  readonly title = input.required<string>();
  readonly icon = input.required<string>();
  readonly locale = input.required<SeoLocale>();
  readonly picked = output<SeoLocale>();
}
