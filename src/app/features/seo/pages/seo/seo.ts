import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../core/auth/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageTabs } from '../../../../shared/components/page-tabs/page-tabs';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { MetaCard } from '../../components/meta-card/meta-card';
import { ThumbnailCard } from '../../components/thumbnail-card/thumbnail-card';
import { SEO_PAGES, type SeoTabId } from '../../models/seo.model';
import { SeoService } from '../../services/seo.service';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-seo-page',
  imports: [
    PageHeader,
    AppButton,
    PageTabs,
    ThumbnailCard,
    MetaCard,
    HasPermissionDirective,
    StateView,
  ],
  templateUrl: './seo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeoPage {
  readonly pages = SEO_PAGES;
  readonly lang = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly active = signal<SeoTabId>(SEO_PAGES[0].id);
  readonly loadState = signal<LoadState>('loading');
  readonly saving = signal(false);

  readonly loading = computed(() => this.loadState() === 'loading');
  readonly loadFailed = computed(() => this.loadState() === 'error');

  readonly title = computed(() => {
    const page = this.pages.find((item) => item.id === this.active());
    const base = this.lang.t('seo.title');
    return !page || page.id === 'seo' ? base : `${base} ${this.lang.t(page.labelKey)}`;
  });
  readonly dirty = computed(() => {
    this.seo.revision();
    return this.seo.dirty(this.active());
  });
  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('seo.update');
  });

  constructor() {
    this.reload();
  }

  /** PrimeNG emits `string | number | undefined`; these tabs only use string ids. */
  select(value: string | number | undefined): void {
    if (typeof value === 'string' && this.pages.some((page) => page.id === value)) {
      this.active.set(value as SeoTabId);
    }
  }

  reload(): void {
    this.loadState.set('loading');
    this.seo
      .loadAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadState.set('ready'),
        error: () => {
          this.loadState.set('error');
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  save(): void {
    if (this.saving() || !this.canUpdate()) {
      return;
    }
    this.saving.set(true);
    this.seo
      .save(this.active())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'success', summary: this.lang.t('seo.save') });
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  revert(): void {
    this.seo.revert(this.active());
  }
}
