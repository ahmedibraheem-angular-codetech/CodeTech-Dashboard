import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { DetailPoints } from '../detail-points/detail-points';
import { readLocale, type LocaleText, type Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail-faq',
  imports: [DetailPoints],
  templateUrl: './product-detail-faq.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailFaq {
  readonly lang = inject(LanguageService);

  readonly product = input.required<Product>();
  readonly locale = input.required<AppLanguage>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }
}
