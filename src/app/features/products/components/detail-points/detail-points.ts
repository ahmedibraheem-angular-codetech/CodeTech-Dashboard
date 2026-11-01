import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { readLocale, type ProductPoint } from '../../models/product.model';

@Component({
  selector: 'app-detail-points',
  templateUrl: './detail-points.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPoints {
  readonly items = input.required<readonly ProductPoint[]>();
  readonly locale = input.required<AppLanguage>();
  readonly fallback = input('pi-star');

  protected text(value: ProductPoint['title']): string {
    return readLocale(value, this.locale());
  }

  protected iconClass(url: string): string {
    return url.startsWith('icon:') ? `pi ${url.slice(5)}` : '';
  }
}
