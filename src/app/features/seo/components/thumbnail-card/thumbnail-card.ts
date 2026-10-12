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

import { TRANSLATIONS } from '../../../../core/i18n/translations';
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

  /** Field copy follows the card's language, not the application language. */
  text(key: string): string {
    const page = SEO_PAGES.find((item) => item.id === this.pageId());
    const name = page ? (TRANSLATIONS[page.labelKey]?.[this.locale()] ?? '') : '';
    return (TRANSLATIONS[key]?.[this.locale()] ?? key).replaceAll('{page}', name);
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
    if (!file) {
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
    const previous = this.previewUrl();
    if (previous.startsWith('blob:')) {
      URL.revokeObjectURL(previous);
    }
    this.errorKey.set('');
    this.seo.patch(this.pageId(), this.locale(), {
      thumbName: file.name,
      thumbUrl: URL.createObjectURL(file),
    });
  }
}
