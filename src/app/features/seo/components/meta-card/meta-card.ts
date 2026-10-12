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
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import { LanguageService } from '../../../../core/services/language.service';
import { DESCRIPTION_MAX, SEO_PAGES, type SeoLocale } from '../../models/seo.model';
import { SeoService } from '../../services/seo.service';
import { SeoPanel } from '../seo-panel/seo-panel';

@Component({
  selector: 'app-meta-card',
  imports: [ReactiveFormsModule, SeoPanel, InputText, IconField, InputIcon, Textarea],
  templateUrl: './meta-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetaCard {
  readonly pageId = input.required<string>();
  readonly max = DESCRIPTION_MAX;

  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  readonly locale = signal<SeoLocale>('ar');
  readonly form = inject(FormBuilder).nonNullable.group({
    metaTitle: '',
    slug: '',
    keywords: '',
    description: '',
  });

  constructor() {
    effect(() => {
      const pageId = this.pageId();
      const locale = this.locale();
      this.seo.revision();
      const content = untracked(() => this.seo.content(pageId, locale));
      untracked(() => {
        this.form.reset(
          {
            metaTitle: content.metaTitle,
            slug: content.slug,
            keywords: content.keywords,
            description: content.description,
          },
          { emitEvent: false },
        );
      });
    });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.seo.patch(this.pageId(), this.locale(), {
        metaTitle: value.metaTitle ?? '',
        slug: value.slug ?? '',
        keywords: value.keywords ?? '',
        description: (value.description ?? '').slice(0, DESCRIPTION_MAX),
      });
    });
  }

  text(key: string): string {
    const page = SEO_PAGES.find((item) => item.id === this.pageId());
    const name = page ? (this.lang.lookup(page.labelKey, this.locale()) ?? '') : '';
    return (this.lang.lookup(key, this.locale()) ?? key).replaceAll('{page}', name);
  }

  count(): number {
    return this.seo.content(this.pageId(), this.locale()).description.length;
  }
}
