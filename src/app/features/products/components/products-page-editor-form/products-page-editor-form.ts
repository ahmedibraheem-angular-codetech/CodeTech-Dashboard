import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { ProductUpload } from '../product-upload/product-upload';
import { readLocale, type LocaleText } from '../../models/product.model';
import type { ProductsPageFeature, ProductsPageSector } from '../../models/products-page.model';

export type ProductsPageEditorKind = 'feature' | 'sector';

/**
 * Modal body for create/edit of a feature or sector. Parent owns visibility,
 * save/cancel, and validation; this form mutates the draft models and locale.
 */
@Component({
  selector: 'app-products-page-editor-form',
  imports: [LocaleSwitch, ProductUpload, IconField, InputIcon, InputText, Textarea],
  templateUrl: './products-page-editor-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageEditorForm {
  readonly lang = inject(LanguageService);

  readonly kind = input.required<ProductsPageEditorKind>();
  readonly locale = model.required<AppLanguage>();
  readonly feature = model.required<ProductsPageFeature>();
  readonly sector = model.required<ProductsPageSector>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }

  protected setFeatureText(field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.feature.update((current) => ({
      ...current,
      [field]: { ...current[field], [language]: value } satisfies LocaleText,
    }));
  }

  protected setFeatureImage(file: { name: string; url: string }): void {
    this.feature.update((current) => ({
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
    this.sector.update((current) => ({
      ...current,
      title: { ...current.title, [language]: value },
    }));
  }

  protected setSectorImage(file: { name: string; url: string }): void {
    this.sector.update((current) => ({ ...current, imageUrl: file.url }));
  }

  private read(event: Event): string | undefined {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return undefined;
  }
}
