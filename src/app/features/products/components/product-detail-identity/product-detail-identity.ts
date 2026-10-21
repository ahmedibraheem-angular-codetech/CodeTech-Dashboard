import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { readLocale, type LocaleText, type Product } from '../../models/product.model';
import type { ProductDetailRemoveEvent } from '../../pages/product-detail/product-detail.types';

/** Identity tab: process steps and identity carousel. */
@Component({
  selector: 'app-product-detail-identity',
  templateUrl: './product-detail-identity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailIdentity {
  readonly lang = inject(LanguageService);

  readonly product = input.required<Product>();
  readonly locale = input.required<AppLanguage>();
  readonly identityIndex = model(0);
  readonly removeItem = output<ProductDetailRemoveEvent>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }
}
