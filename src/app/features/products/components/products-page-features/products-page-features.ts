import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { readLocale, type LocaleText } from '../../models/product.model';
import type { ProductsPageFeature } from '../../models/products-page.model';

/**
 * Features section on the products landing-page manager: enable toggle, add control,
 * and feature cards. Parent owns CRUD and content state.
 */
@Component({
  selector: 'app-products-page-features',
  imports: [FormsModule, AppButton, ToggleSwitch],
  templateUrl: './products-page-features.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageFeatures {
  readonly lang = inject(LanguageService);

  readonly features = input.required<readonly ProductsPageFeature[]>();
  readonly enabled = input.required<boolean>();
  /** Page language used for card labels (not the editor modal locale). */
  readonly displayLocale = input.required<AppLanguage>();

  readonly enabledChange = output<boolean>();
  readonly add = output<void>();
  readonly edit = output<ProductsPageFeature>();
  readonly remove = output<ProductsPageFeature>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.displayLocale());
  }
}
