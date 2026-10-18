import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import type { AppLanguage } from '../../../../core/i18n/translations';
import { LanguageService } from '../../../../core/services/language.service';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { type LocaleText, type Product } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-detail',
  imports: [PageHeader, RouterLink, LocaleSwitch, StateView],
  templateUrl: './product-detail.html',
  styleUrl: '../../products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage {
  private readonly api = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  readonly id = input.required<string>();
  readonly locale = signal<AppLanguage>('ar');
  readonly item = signal<Product | null>(null);
  readonly status = signal<'loading' | 'ready' | 'missing'>('loading');

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  protected text(value: LocaleText): string {
    return value[this.locale()];
  }

  private load(id: string): void {
    this.status.set('loading');
    this.api
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((product) => {
        this.item.set(product);
        this.status.set(product ? 'ready' : 'missing');
      });
  }
}
