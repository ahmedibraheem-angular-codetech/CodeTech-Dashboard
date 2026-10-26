import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-product-upload',
  templateUrl: './product-upload.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductUpload {
  readonly lang = inject(LanguageService);
  readonly name = input('');
  readonly url = input('');
  readonly actions = input(false);
  readonly locale = input<AppLanguage | null>(null);
  /**
   * Translation key prefix for upload chrome (`product` by default).
   * Projects pass `project` so the drop zone stays domain-correct without forking this component.
   */
  readonly keyPrefix = input('product');
  /**
   * When true, a clear control appears for the current image/icon and emits `cleared`.
   * Products leave this off so their existing UX is unchanged.
   */
  readonly clearable = input(false);
  readonly picked = output<{ name: string; url: string }>();
  readonly cleared = output<void>();
  protected readonly source = signal<'upload' | 'library'>('upload');
  protected readonly sizeError = signal(false);
  protected readonly dragging = signal(false);
  protected readonly icons = [
    'pi-star',
    'pi-heart',
    'pi-bolt',
    'pi-check-circle',
    'pi-shield',
    'pi-cog',
    'pi-users',
    'pi-chart-line',
    'pi-globe',
    'pi-lock',
    'pi-bell',
    'pi-calendar',
    'pi-image',
    'pi-send',
    'pi-wifi',
    'pi-mobile',
    'pi-desktop',
    'pi-database',
    'pi-cloud',
    'pi-shopping-cart',
    'pi-wallet',
    'pi-map-marker',
    'pi-thumbs-up',
    'pi-flag',
    'pi-bookmark',
    'pi-compass',
    'pi-box',
  ];
  private previewUrl = '';

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

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
    this.revokePreview();
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
    this.revokePreview();
    this.previewUrl = URL.createObjectURL(file);
    this.picked.emit({ name: file.name, url: this.previewUrl });
  }

  private revokePreview(): void {
    if (!this.previewUrl.startsWith('blob:')) {
      return;
    }
    URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = '';
  }

  protected open(input: HTMLInputElement): void {
    input.click();
  }

  protected pickIcon(icon: string): void {
    this.sizeError.set(false);
    this.revokePreview();
    this.source.set('library');
    this.picked.emit({ name: icon, url: `icon:${icon}` });
  }

  protected iconSelected(icon: string): boolean {
    return this.url() === `icon:${icon}`;
  }
}
