import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { SectorCard } from '../../../../shared/components/sector-card/sector-card';
import { readLocale, type LocaleText } from '../../models/product.model';
import type { ProductsPageSector } from '../../models/products-page.model';

/**
 * Sectors section on the products landing-page manager. Parent owns CRUD and content state.
 */
@Component({
  selector: 'app-products-page-sectors',
  imports: [FormsModule, AppButton, SectorCard, ToggleSwitch],
  templateUrl: './products-page-sectors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageSectors {
  readonly lang = inject(LanguageService);

  readonly sectors = input.required<readonly ProductsPageSector[]>();
  readonly enabled = input.required<boolean>();
  readonly displayLocale = input.required<AppLanguage>();

  readonly enabledChange = output<boolean>();
  readonly add = output<void>();
  readonly edit = output<ProductsPageSector>();
  readonly remove = output<ProductsPageSector>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.displayLocale());
  }
}
