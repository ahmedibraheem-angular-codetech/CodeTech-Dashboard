import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { SectorCard } from '../../../../shared/components/sector-card/sector-card';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { ProductUpload } from '../../components/product-upload/product-upload';
import { readLocale, type LocaleText } from '../../models/product.model';
import {
  productsPageFeature,
  productsPageSector,
  type ProductsPageContent,
  type ProductsPageFeature,
  type ProductsPageSector,
} from '../../models/products-page.model';
import { ProductsPageService } from '../../services/products-page.service';

type EditorKind = 'feature' | 'sector';

@Component({
  selector: 'app-products-page-manage',
  imports: [
    FormsModule,
    AppButton,
    SectorCard,
    PageHeader,
    ToggleSwitch,
    StateView,
    ConfirmDialog,
    Modal,
    LocaleSwitch,
    ProductUpload,
    IconField,
    InputIcon,
    InputText,
    Textarea,
  ],
  templateUrl: './products-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageManage {
  private readonly api = inject(ProductsPageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);
  readonly status = signal<'loading' | 'ready'>('loading');
  readonly content = signal<ProductsPageContent | null>(null);
  readonly editorOpen = signal(false);
  readonly editorKind = signal<EditorKind>('feature');
  readonly editorMode = signal<'create' | 'edit'>('create');
  readonly editorTitle = signal('');
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly draftFeature = signal<ProductsPageFeature>(productsPageFeature());
  readonly draftSector = signal<ProductsPageSector>(productsPageSector());
  readonly saving = signal(false);

  constructor() {
    effect(() => {
      untracked(() => this.load());
    });
  }

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }

  protected display(value: LocaleText): string {
    return readLocale(value, this.lang.language());
  }

  protected openFeature(feature?: ProductsPageFeature): void {
    this.editorKind.set('feature');
    this.editorMode.set(feature ? 'edit' : 'create');
    this.locale.set(this.lang.language());
    this.draftFeature.set(feature ? structuredClone(feature) : productsPageFeature());
    this.editorTitle.set(
      feature ? this.lang.t('product.page.editFeature') : this.lang.t('product.page.addFeature'),
    );
    this.editorOpen.set(true);
  }

  protected openSector(sector?: ProductsPageSector): void {
    this.editorKind.set('sector');
    this.editorMode.set(sector ? 'edit' : 'create');
    this.locale.set(this.lang.language());
    this.draftSector.set(sector ? structuredClone(sector) : productsPageSector());
    this.editorTitle.set(
      sector ? this.lang.t('product.page.editSector') : this.lang.t('product.page.addSector'),
    );
    this.editorOpen.set(true);
  }

  protected setFeatureText(field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draftFeature.update((current) => ({
      ...current,
      [field]: { ...current[field], [language]: value } satisfies LocaleText,
    }));
  }

  protected setFeatureImage(file: { name: string; url: string }): void {
    this.draftFeature.update((current) => ({
      ...current,
      imageName: file.name,
      imageUrl: file.url,
      icon: file.url.startsWith('icon:') ? file.url.slice(5) : current.icon,
    }));
  }

  protected setSectorTitle(event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draftSector.update((current) => ({
      ...current,
      title: { ...current.title, [language]: value },
    }));
  }

  protected setSectorImage(file: { name: string; url: string }): void {
    this.draftSector.update((current) => ({ ...current, imageUrl: file.url }));
  }

  protected saveLabel(): string {
    if (this.editorKind() === 'feature' && this.editorMode() === 'create') {
      return this.lang.t('product.page.addFeatureAction');
    }
    return this.lang.t('common.saveChanges');
  }

  protected saveEditor(): void {
    if (this.editorKind() === 'feature') {
      this.saveFeature();
      return;
    }
    this.saveSector();
  }

  protected async removeFeature(feature: ProductsPageFeature): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('product.page.deleteFeatureTitle'),
      message: this.lang.t('product.page.deleteFeatureMessage'),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .removeFeature(feature.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.content.update((current) =>
          current
            ? { ...current, features: current.features.filter((item) => item.id !== feature.id) }
            : current,
        );
        this.messages.add({
          severity: 'success',
          summary: this.lang.t('product.page.featureDeleted'),
        });
      });
  }

  protected async removeSector(sector: ProductsPageSector): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('product.page.deleteSectorTitle'),
      message: this.lang.t('product.page.deleteSectorMessage'),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .removeSector(sector.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.content.update((current) =>
          current
            ? { ...current, sectors: current.sectors.filter((item) => item.id !== sector.id) }
            : current,
        );
        this.messages.add({
          severity: 'success',
          summary: this.lang.t('product.page.sectorDeleted'),
        });
      });
  }

  protected toggleFeatures(enabled: boolean): void {
    this.api.toggleFeatures(enabled);
    this.content.update((current) =>
      current ? { ...current, featuresEnabled: enabled } : current,
    );
  }

  protected toggleSectors(enabled: boolean): void {
    this.api.toggleSectors(enabled);
    this.content.update((current) => (current ? { ...current, sectorsEnabled: enabled } : current));
  }

  private saveFeature(): void {
    const draft = this.draftFeature();
    if (!readLocale(draft.title, this.locale()).trim()) {
      return;
    }
    this.saving.set(true);
    this.api
      .saveFeature(draft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.content.update((current) => {
            if (!current) {
              return current;
            }
            const exists = current.features.some((item) => item.id === saved.id);
            return {
              ...current,
              features: exists
                ? current.features.map((item) => (item.id === saved.id ? saved : item))
                : [...current.features, saved],
            };
          });
          this.editorOpen.set(false);
          this.saving.set(false);
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('product.page.featureSaved'),
          });
        },
        error: () => this.saving.set(false),
      });
  }

  private saveSector(): void {
    const draft = this.draftSector();
    if (!readLocale(draft.title, this.locale()).trim() || !draft.imageUrl) {
      return;
    }
    this.saving.set(true);
    this.api
      .saveSector(draft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.content.update((current) => {
            if (!current) {
              return current;
            }
            const exists = current.sectors.some((item) => item.id === saved.id);
            return {
              ...current,
              sectors: exists
                ? current.sectors.map((item) => (item.id === saved.id ? saved : item))
                : [...current.sectors, saved],
            };
          });
          this.editorOpen.set(false);
          this.saving.set(false);
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('product.page.sectorSaved'),
          });
        },
        error: () => this.saving.set(false),
      });
  }

  private load(): void {
    this.status.set('loading');
    this.api
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((content) => {
        this.content.set(content);
        this.status.set('ready');
      });
  }

  private read(event: Event): string | undefined {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return undefined;
  }
}
