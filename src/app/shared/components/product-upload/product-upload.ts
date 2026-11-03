import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

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
  readonly actions = input(true);
  readonly locale = input<AppLanguage | null>(null);

  readonly keyPrefix = input('product');

  readonly clearable = input(false);
  readonly picked = output<{ name: string; url: string }>();
  readonly cleared = output<void>();
  protected readonly source = signal<'upload' | 'library'>('upload');
  protected readonly sizeError = signal(false);
  protected readonly dragging = signal(false);

  protected readonly icons = ICON_LIBRARY_IDS;

  /** Blob URL this control currently owns for the bound media slot. */
  private ownedByControl = '';

  constructor() {
    effect(() => {
      const bound = this.url();
      // Parent rebound this control (locale switch / list reuse). Retarget
      // ownership without releasing — the draft still holds those blobs.
      if (bound !== this.ownedByControl) {
        this.ownedByControl = bound.startsWith('blob:') ? bound : '';
        // Show library tab as primary when rebound media is a library icon.
        if (bound.startsWith('icon:')) {
          this.source.set('library');
        }
      }
    });
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
    this.replaceOwned('');
    this.source.set('upload');
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
    this.replaceOwned(url);
    this.picked.emit({ name: file.name, url });
  }

  private replaceOwned(next: string): void {
    const previous = new Set<string>();
    if (this.ownedByControl) {
      previous.add(this.ownedByControl);
    }
    const current = this.url();
    if (current.startsWith('blob:')) {
      previous.add(current);
    }
    for (const url of previous) {
      if (url !== next) {
        this.objectUrls.release(url);
      }
    }
    this.ownedByControl = next;
  }

  protected open(input: HTMLInputElement): void {
    input.click();
  }

  protected pickIcon(icon: string): void {
    this.sizeError.set(false);
    this.replaceOwned('');
    this.source.set('library');
    this.picked.emit({ name: icon, url: `icon:${icon}` });
  }

  protected iconSelected(icon: string): boolean {
    return this.url() === `icon:${icon}`;
  }
}
