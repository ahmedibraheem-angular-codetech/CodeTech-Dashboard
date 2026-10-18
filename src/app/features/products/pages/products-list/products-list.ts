import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Popover } from 'primeng/popover';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import {
  ProductCard,
  type ProductCardFeature,
} from '../../../../shared/components/product-card/product-card';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { type Product, type ProductPoint } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-products-page',
  imports: [
    FormsModule,
    PageHeader,
    ProductCard,
    RouterLink,
    StateView,
    ToggleSwitch,
    Paginator,
    Popover,
    ConfirmDialog,
  ],
  templateUrl: './products-list.html',
  styleUrl: '../../products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly menu = viewChild.required(Popover);
  readonly lang = inject(LanguageService);
  readonly api = inject(ProductsService);
  private readonly source = signal<Product[]>([]);
  readonly menuProduct = signal<Product | null>(null);
  readonly first = signal(0);
  readonly rows = signal(10);

  constructor() {
    this.api
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe((items) => this.source.set(items));
  }

  readonly total = computed(() => this.source().length);
  readonly visible = computed(() => this.source().slice(this.first(), this.first() + this.rows()));

  protected text(product: Product): string {
    const language = this.lang.language();
    return product.name[language] || product.name.ar;
  }

  protected summary(product: Product): string {
    const language = this.lang.language();
    return product.summary[language] || product.summary.ar;
  }

  protected features(product: Product): ProductPoint[] {
    return product.features.slice(0, 4);
  }

  protected featureText(point: ProductPoint, field: 'title' | 'body'): string {
    const language = this.lang.language();
    return point[field][language] || point[field].ar;
  }

  protected cardFeatures(product: Product): ProductCardFeature[] {
    return this.features(product).map((feature) => ({
      id: feature.id,
      title: this.featureText(feature, 'title'),
      body: this.featureText(feature, 'body'),
    }));
  }

  protected openDetails(product: Product): void {
    void this.router.navigate(['/products', product.id]);
  }

  protected openEditor(product: Product): void {
    void this.router.navigate(['/products', product.id, 'edit']);
  }

  protected page(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? this.rows());
  }

  protected closeMenu(): void {
    this.menu().hide();
  }

  protected openMenu(event: Event, product: Product): void {
    this.menuProduct.set(product);
    this.menu().toggle(event);
  }

  protected async remove(product: Product): Promise<void> {
    this.menu().hide();
    const accepted = await this.confirm().ask({
      title: this.lang.t('product.deleteTitle'),
      message: this.lang.t('product.deleteMessage'),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .remove(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.source.update((items) => items.filter((item) => item.id !== product.id));
        this.messages.add({ severity: 'success', summary: this.lang.t('product.deleted') });
      });
  }
}
