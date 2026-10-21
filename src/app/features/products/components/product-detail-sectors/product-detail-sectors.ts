import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { SectorCard } from '../../../../shared/components/sector-card/sector-card';
import { DetailPoints } from '../detail-points/detail-points';
import { readLocale, type LocaleText, type Product } from '../../models/product.model';
import type { ProductDetailRemoveEvent } from '../../pages/product-detail/product-detail.types';

/** Sectors tab: sector cards, challenges, and solution. */
@Component({
  selector: 'app-product-detail-sectors',
  imports: [SectorCard, DetailPoints],
  templateUrl: './product-detail-sectors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailSectors {
  readonly lang = inject(LanguageService);

  readonly product = input.required<Product>();
  readonly locale = input.required<AppLanguage>();
  readonly removeItem = output<ProductDetailRemoveEvent>();
  readonly openEditor = output<void>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }
}
