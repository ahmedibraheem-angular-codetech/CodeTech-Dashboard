import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';

import type { AppLanguage } from '../../../../core/i18n/translations';
import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageTabs, type PageTab } from '../../../../shared/components/page-tabs/page-tabs';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { readLocale, type LocaleText, type Product } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, PageHeader, PageTabs, StateView, ConfirmDialog],
  templateUrl: './product-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage {
  private readonly api = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);
  readonly id = input.required<string>();
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly item = signal<Product | null>(null);
  readonly status = signal<'loading' | 'ready' | 'missing'>('loading');
  readonly tab = signal('info');
  readonly statIndex = signal(0);
  readonly unitIndex = signal(0);
  readonly identityIndex = signal(0);
  readonly tabs: readonly PageTab[] = [
    { id: 'info', labelKey: 'product.step.info' },
    { id: 'sectors', labelKey: 'product.step.sectors' },
    { id: 'offer', labelKey: 'product.detail.offerTools' },
    { id: 'units', labelKey: 'product.detail.unitsFeatures' },
    { id: 'identity', labelKey: 'product.step.identity' },
    { id: 'faq', labelKey: 'product.step.faq' },
  ];

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }

  protected selectTab(value: string | number | undefined): void {
    if (typeof value === 'string') {
      this.tab.set(value);
    }
  }

  protected iconClass(url: string): string {
    return url.startsWith('icon:') ? `pi ${url.slice(5)}` : '';
  }

  protected async copyCode(code: string): Promise<void> {
    await navigator.clipboard.writeText(code);
  }

  protected removeIntegration(index: number): void {
    const product = this.item();
    if (!product || product.integrations.length < 2) {
      return;
    }
    const integrations = product.integrations.filter((_, itemIndex) => itemIndex !== index);
    const next = { ...product, integrations };
    this.item.set(next);
    this.api.save(next).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected removeSector(index: number): void {
    const product = this.item();
    if (!product || product.sectors.length < 2) {
      return;
    }
    const sectors = product.sectors.filter((_, itemIndex) => itemIndex !== index);
    const next = { ...product, sectors };
    this.item.set(next);
    this.api.save(next).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected removeIdentity(index: number): void {
    const product = this.item();
    if (!product || product.identity.length < 2) {
      return;
    }
    const identity = product.identity.filter((_, itemIndex) => itemIndex !== index);
    const next = { ...product, identity };
    this.item.set(next);
    if (this.identityIndex() >= identity.length) {
      this.identityIndex.set(Math.max(0, identity.length - 1));
    } else if (index < this.identityIndex()) {
      this.identityIndex.update((current) => current - 1);
    }
    this.api.save(next).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected removeUnit(index: number): void {
    const product = this.item();
    if (!product || product.units.length < 2) {
      return;
    }
    const units = product.units.filter((_, itemIndex) => itemIndex !== index);
    const next = { ...product, units };
    this.item.set(next);
    if (this.unitIndex() >= units.length) {
      this.unitIndex.set(Math.max(0, units.length - 1));
    } else if (index < this.unitIndex()) {
      this.unitIndex.update((current) => current - 1);
    }
    this.api.save(next).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected removeStat(index: number): void {
    const product = this.item();
    if (!product || product.stats.length < 2) {
      return;
    }
    const stats = product.stats.filter((_, itemIndex) => itemIndex !== index);
    const next = { ...product, stats };
    this.item.set(next);
    if (this.statIndex() >= stats.length) {
      this.statIndex.set(Math.max(0, stats.length - 1));
    } else if (index < this.statIndex()) {
      this.statIndex.update((current) => current - 1);
    }
    this.api.save(next).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected async removeProduct(): Promise<void> {
    const product = this.item();
    if (!product) {
      return;
    }
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
        this.messages.add({ severity: 'success', summary: this.lang.t('product.deleted') });
        void this.router.navigate(['/products']);
      });
  }

  private load(id: string): void {
    this.status.set('loading');
    this.statIndex.set(0);
    this.unitIndex.set(0);
    this.identityIndex.set(0);
    this.api
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((product) => {
        this.item.set(product);
        this.status.set(product ? 'ready' : 'missing');
      });
  }
}
