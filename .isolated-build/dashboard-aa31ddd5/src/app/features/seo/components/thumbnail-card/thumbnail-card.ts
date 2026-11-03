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
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';

import { LanguageService } from '../../../../core/services/language.service';
import { SEO_PAGES, THUMB_MAX_BYTES, THUMB_TYPES, type SeoLocale } from '../../models/seo.model';
import { SeoService } from '../../services/seo.service';
import { SeoPanel } from '../seo-panel/seo-panel';

@Component({
  selector: 'app-thumbnail-card',
  imports: [ReactiveFormsModule, SeoPanel, InputText],
  templateUrl: './thumbnail-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThumbnailCard {
  readonly pageId = input.required<string>();

  readonly editable = input(true);

  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  readonly locale = signal<SeoLocale>('ar');
  readonly errorKey = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    thumbTitle: '',
    thumbAlt: '',
  });

  constructor() {
    effect(() => {
      if (this.editable()) {
        this.form.enable({ emitEvent: false });
      } else {
        this.form.disable({ emitEvent: false });
      }
    });

    effect(() => {
      const pageId = this.pageId();
      const locale = this.locale();
      this.seo.revision();
      const content = untracked(() => this.seo.content(pageId, locale));
      untracked(() => {
        this.errorKey.set('');
        this.form.reset(
          { thumbTitle: content.thumbTitle, thumbAlt: content.thumbAlt },
          { emitEvent: false },
        );
      });
    });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.seo.patch(this.pageId(), this.locale(), {
        thumbTitle: value.thumbTitle ?? '',
        thumbAlt: value.thumbAlt ?? '',
      });
    });
  }

  text(key: string): string {
    const page = SEO_PAGES.find((item) => item.id === this.pageId());
    const name = page ? (this.lang.lookup(page.labelKey, this.locale()) ?? '') : '';
    return (this.lang.lookup(key, this.locale()) ?? key).replaceAll('{page}', name);
  }

  fileName(): string {
    return this.seo.content(this.pageId(), this.locale()).thumbName;
  }

  previewUrl(): string {
    return this.seo.content(this.pageId(), this.locale()).thumbUrl;
  }

  onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.take(input.files?.[0]);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.take(event.dataTransfer?.files?.[0]);
  }

  private take(file: File | undefined): void {
    if (!this.editable() || !file) {
      return;
    }
    if (!THUMB_TYPES.includes(file.type)) {
      this.errorKey.set('seo.fileType');
      return;
    }
    if (file.size > THUMB_MAX_BYTES) {
      this.errorKey.set('seo.fileSize');
      return;
    }
    this.errorKey.set('');
    // Service owns blob lifecycle and mirrors the thumbnail across locales.
    this.seo.setThumbnail(this.pageId(), file, URL.createObjectURL(file));
  }
}
