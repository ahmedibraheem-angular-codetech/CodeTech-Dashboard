import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-product-upload',
  templateUrl: './product-upload.html',
  styleUrl: '../../products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductUpload {
  readonly lang = inject(LanguageService);
  readonly name = input('');
  readonly url = input('');
  readonly picked = output<{ name: string; url: string }>();

  protected choose(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file?.type.startsWith('image/')) {
      return;
    }
    this.picked.emit({ name: file.name, url: URL.createObjectURL(file) });
  }

  protected open(input: HTMLInputElement): void {
    input.click();
  }
}
