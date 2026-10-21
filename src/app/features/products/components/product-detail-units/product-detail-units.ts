import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { DetailPoints } from '../detail-points/detail-points';
import { readLocale, type LocaleText, type Product } from '../../models/product.model';
import type { ProductDetailRemoveEvent } from '../../pages/product-detail/product-detail.types';

/** Units tab: unit carousel and product benefits. */
@Component({
  selector: 'app-product-detail-units',
  imports: [DetailPoints],
  templateUrl: './product-detail-units.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailUnits {
  readonly lang = inject(LanguageService);

  readonly product = input.required<Product>();
  readonly locale = input.required<AppLanguage>();
  readonly unitIndex = model(0);
  readonly removeItem = output<ProductDetailRemoveEvent>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }
}
