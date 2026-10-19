import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';

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
  readonly picked = output<{ name: string; url: string }>();
  private previewUrl = '';

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  protected copy(key: string): string {
    return this.lang.lookup(key, this.locale() ?? this.lang.language()) ?? key;
  }

  protected choose(event: Event): void {
    const target = event.target;
    const file = target instanceof HTMLInputElement ? target.files?.[0] : undefined;
    if (!file?.type.startsWith('image/')) {
      return;
    }
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
}
