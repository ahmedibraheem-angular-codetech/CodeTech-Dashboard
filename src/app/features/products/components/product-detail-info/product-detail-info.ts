import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { readLocale, type LocaleText, type Product } from '../../models/product.model';
import type { ProductDetailRemoveEvent } from '../../pages/product-detail/product-detail.types';

/** Info tab: overview fields, cover, stats carousel, and feature list. */
@Component({
  selector: 'app-product-detail-info',
  templateUrl: './product-detail-info.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailInfo {
  readonly lang = inject(LanguageService);

  readonly product = input.required<Product>();
  readonly locale = input.required<AppLanguage>();
  /** Selected stats tab; owned by the detail page so remove-index adjustments stay correct. */
  readonly statIndex = model(0);
  readonly removeItem = output<ProductDetailRemoveEvent>();
  readonly copyCode = output<string>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }

  protected iconClass(url: string): string {
    return url.startsWith('icon:') ? `pi ${url.slice(5)}` : '';
  }
}
