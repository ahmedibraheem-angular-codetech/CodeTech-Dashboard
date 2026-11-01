import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { AuthService } from '../../../../core/auth/auth.service';
import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { SectorCard } from '../../../../shared/components/sector-card/sector-card';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { readLocale, type LocaleText } from '../../models/product.model';
import type { ProductsPageSector } from '../../models/products-page.model';

@Component({
  selector: 'app-products-page-sectors',
  imports: [FormsModule, AppButton, SectorCard, ToggleSwitch, HasPermissionDirective],
  templateUrl: './products-page-sectors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageSectors {
  private readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);

  readonly sectors = input.required<readonly ProductsPageSector[]>();
  readonly enabled = input.required<boolean>();
  readonly displayLocale = input.required<AppLanguage>();

  readonly enabledChange = output<boolean>();
  readonly add = output<void>();
  readonly edit = output<ProductsPageSector>();
  readonly remove = output<ProductsPageSector>();

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('products.update');
  });
  readonly canDelete = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('products.delete');
  });

  protected text(value: LocaleText): string {
    return readLocale(value, this.displayLocale());
  }
}
