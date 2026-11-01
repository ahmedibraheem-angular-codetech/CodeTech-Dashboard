import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';

import { AuthService } from '../../../../core/auth/auth.service';
import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { readLocale, type LocaleText, type Product } from '../../models/product.model';
import type { ProductDetailRemoveEvent } from '../../pages/product-detail/product-detail.types';

@Component({
  selector: 'app-product-detail-info',
  templateUrl: './product-detail-info.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailInfo {
  private readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);

  readonly product = input.required<Product>();
  readonly locale = input.required<AppLanguage>();

  readonly statIndex = model(0);
  readonly removeItem = output<ProductDetailRemoveEvent>();
  readonly copyCode = output<string>();

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('products.update');
  });

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }

  protected iconClass(url: string): string {
    return url.startsWith('icon:') ? `pi ${url.slice(5)}` : '';
  }
}
