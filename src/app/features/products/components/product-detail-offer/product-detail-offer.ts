import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { DetailPoints } from '../detail-points/detail-points';
import { readLocale, type LocaleText, type Product } from '../../models/product.model';
import type { ProductDetailRemoveEvent } from '../../pages/product-detail/product-detail.types';

/** Offer tab: offer points, results, and integration logos. */
@Component({
  selector: 'app-product-detail-offer',
  imports: [RouterLink, DetailPoints],
  templateUrl: './product-detail-offer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailOffer {
  readonly lang = inject(LanguageService);

  readonly product = input.required<Product>();
  readonly locale = input.required<AppLanguage>();
  readonly removeItem = output<ProductDetailRemoveEvent>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }

  protected iconClass(url: string): string {
    return url.startsWith('icon:') ? `pi ${url.slice(5)}` : '';
  }
}
