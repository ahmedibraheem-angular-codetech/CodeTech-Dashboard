import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Button } from 'primeng/button';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageTabs } from '../../../../shared/components/page-tabs/page-tabs';
import { MetaCard } from '../../components/meta-card/meta-card';
import { ThumbnailCard } from '../../components/thumbnail-card/thumbnail-card';
import { SEO_PAGES } from '../../models/seo.model';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-seo-page',
  imports: [PageHeader, Button, PageTabs, ThumbnailCard, MetaCard],
  templateUrl: './seo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeoPage {
  readonly pages = SEO_PAGES;
  readonly lang = inject(LanguageService);
  private readonly seo = inject(SeoService);
  readonly active = signal(SEO_PAGES[0].id);
  readonly title = computed(() => {
    const page = this.pages.find((item) => item.id === this.active());
    const base = this.lang.t('seo.title');
    return !page || page.id === 'seo' ? base : `${base} ${this.lang.t(page.labelKey)}`;
  });
  readonly dirty = computed(() => {
    this.seo.revision();
    return this.seo.dirty(this.active());
  });

  /** PrimeNG emits `string | number | undefined`; these tabs only use string ids. */
  select(value: string | number | undefined): void {
    if (typeof value === 'string') {
      this.active.set(value);
    }
  }

  save(): void {
    this.seo.save(this.active());
  }

  revert(): void {
    this.seo.revert(this.active());
  }
}
