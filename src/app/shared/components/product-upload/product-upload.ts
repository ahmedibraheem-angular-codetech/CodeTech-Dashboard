import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';

import type { AppLanguage } from '../../../core/i18n/language';
import { LanguageService } from '../../../core/services/language.service';
import { ICON_LIBRARY_IDS, iconLibrarySrc } from './icon-library';
import { ObjectUrls } from './object-urls';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-product-upload',
  templateUrl: './product-upload.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductUpload {
  readonly lang = inject(LanguageService);
  private readonly objectUrls = inject(ObjectUrls);
  readonly name = input('');
  readonly url = input('');
  readonly actions = input(false);
  readonly locale = input<AppLanguage | null>(null);

  readonly keyPrefix = input('product');

  readonly clearable = input(false);
  readonly picked = output<{ name: string; url: string }>();
  readonly cleared = output<void>();
  protected readonly source = signal<'upload' | 'library'>('upload');
  protected readonly sizeError = signal(false);
  protected readonly dragging = signal(false);

  protected readonly icons = ICON_LIBRARY_IDS;

  private lastPicked = '';

  protected copy(suffix: string): string {
    const key = `${this.keyPrefix()}.${suffix}`;
    return this.lang.lookup(key, this.locale() ?? this.lang.language()) ?? key;
  }

  protected hasMedia(): boolean {
    return this.url().length > 0;
  }

  protected iconName(): string | null {
    const url = this.url();
    return url.startsWith('icon:') ? url.slice(5) : null;
  }

  protected iconSrc(id: string): string {
    return iconLibrarySrc(id);
  }

  protected choose(event: Event): void {
    const target = event.target;
    const file = target instanceof HTMLInputElement ? target.files?.[0] : undefined;
    if (target instanceof HTMLInputElement) {
      target.value = '';
    }
    this.acceptFile(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.acceptFile(event.dataTransfer?.files?.[0]);
  }

  protected clear(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.sizeError.set(false);
    this.release();
    this.cleared.emit();
  }

  private acceptFile(file: File | undefined): void {
    if (!file?.type.startsWith('image/')) {
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.sizeError.set(true);
      return;
    }
    this.sizeError.set(false);
    const url = this.objectUrls.create(file);
    this.release(url);
    this.picked.emit({ name: file.name, url });
  }

  private release(keep = ''): void {
    for (const url of new Set([this.url(), this.lastPicked])) {
      if (url !== keep) {
        this.objectUrls.release(url);
      }
    }
    this.lastPicked = keep;
  }

  protected open(input: HTMLInputElement): void {
    input.click();
  }

  protected pickIcon(icon: string): void {
    this.sizeError.set(false);
    this.release();
    this.source.set('library');
    this.picked.emit({ name: icon, url: `icon:${icon}` });
  }

  protected iconSelected(icon: string): boolean {
    return this.url() === `icon:${icon}`;
  }
}
