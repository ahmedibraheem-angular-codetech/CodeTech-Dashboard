import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { AuthService } from '../../../../core/auth/auth.service';
import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { SectorCard } from '../../../../shared/components/sector-card/sector-card';
import { DetailPoints } from '../detail-points/detail-points';
import { readLocale, type LocaleText, type Product } from '../../models/product.model';
import type { ProductDetailRemoveEvent } from '../../pages/product-detail/product-detail.types';

@Component({
  selector: 'app-product-detail-sectors',
  imports: [SectorCard, DetailPoints],
  templateUrl: './product-detail-sectors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailSectors {
  private readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);

  readonly product = input.required<Product>();
  readonly locale = input.required<AppLanguage>();
  readonly removeItem = output<ProductDetailRemoveEvent>();
  readonly openEditor = output<void>();

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('products.update');
  });
  readonly canDelete = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('products.delete');
  });

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }
}
