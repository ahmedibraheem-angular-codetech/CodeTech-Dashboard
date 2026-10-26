import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Popover } from 'primeng/popover';
import { forkJoin } from 'rxjs';

import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { InfoField } from '../../../../shared/components/info-field/info-field';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import {
  ARTICLE_STATUSES,
  type Article,
  type ArticleCategory,
  type ArticleStatus,
} from '../../models/knowledge.model';
import { KnowledgeActions } from '../../services/knowledge-actions.service';
import { KnowledgeService } from '../../services/knowledge.service';
import {
  articleDisplayId,
  categoryName,
  formatStampDate,
  formatStampTime,
  pick,
  splitKeywords,
} from '../../utils/knowledge-format';
import { hasVisibleHtml } from '../../../sections/components/legal-document-board/legal-quill';

type LoadStatus = 'loading' | 'ready' | 'missing' | 'error';

/** Read-only preview of one article with the quick actions (edit, feature, status, delete). */
@Component({
  selector: 'app-article-detail',
  imports: [AppButton, ConfirmDialog, InfoField, PageHeader, Popover, StateView],
  templateUrl: './article-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleDetail {
  private readonly api = inject(KnowledgeService);
  private readonly actions = inject(KnowledgeActions);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly statusMenu = viewChild.required(Popover);
  readonly lang = inject(LanguageService);

  readonly id = input.required<string>();
  readonly status = signal<LoadStatus>('loading');
  readonly article = signal<Article | null>(null);
  readonly category = signal<ArticleCategory | null>(null);
  /** Content language follows the UI language (Figma detail has no content locale switch). */
  readonly locale = computed(() => this.lang.language());

  readonly title = computed(() => this.text('titleAr', 'titleEn'));
  readonly excerpt = computed(() => this.text('excerptAr', 'excerptEn'));
  readonly author = computed(() => this.text('authorNameAr', 'authorNameEn'));
  readonly categoryLabel = computed(() => categoryName(this.category(), this.locale()) || '—');
  readonly dir = computed(() => (this.locale() === 'ar' ? 'rtl' : 'ltr'));
  readonly displayId = computed(() => articleDisplayId(this.article()?.id ?? this.id()));

  readonly content = computed(() => {
    const article = this.article();
    if (!article) {
      return '';
    }
    const html = this.locale() === 'ar' ? article.contentAr : article.contentEn;
    return hasVisibleHtml(html) ? html : '';
  });

  readonly published = computed(() => {
    const stamp = this.article()?.publishedAt ?? '';
    const date = formatStampDate(stamp, this.locale());
    const time = formatStampTime(stamp, this.locale());
    return [date, time].filter(Boolean).join(' | ') || '—';
  });

  readonly headerDate = computed(() => {
    const stamp = this.article()?.publishedAt ?? '';
    return formatStampDate(stamp, this.locale()) || '—';
  });

  readonly headerTime = computed(() => {
    const stamp = this.article()?.publishedAt ?? '';
    return formatStampTime(stamp, this.locale()) || '—';
  });

  readonly reading = computed(() =>
    this.lang.t('knowledge.minutes').replace('{count}', `${this.article()?.readingMinutes ?? 0}`),
  );

  readonly keywordTags = computed(() => {
    const article = this.article();
    if (!article) {
      return [];
    }
    return splitKeywords(pick(article.seoKeywordsAr, article.seoKeywordsEn, this.locale()));
  });

  readonly otherStatuses = computed<ArticleStatus[]>(() =>
    ARTICLE_STATUSES.filter((status) => status !== this.article()?.status),
  );

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });

    // The last breadcrumb shows the article title instead of its numeric id.
    effect(() => {
      const url = `/knowledge/${this.id()}`;
      const title = this.title();
      if (title) {
        untracked(() => this.breadcrumbs.setLabel(url, title));
      }
    });
    this.destroyRef.onDestroy(() => this.breadcrumbs.clearLabel(`/knowledge/${this.id()}`));
  }

  protected readStatusKey(status: ArticleStatus): string {
    return `knowledge.status.${status}`;
  }

  protected statusActionKey(status: ArticleStatus): string {
    if (status === 'published') {
      return 'knowledge.publish';
    }
    return status === 'draft' ? 'knowledge.moveToDraft' : 'knowledge.unpublish';
  }

  protected seoText(base: 'seoTitle' | 'seoDescription' | 'seoKeywords'): string {
    const article = this.article();
    return article ? pick(article[`${base}Ar`], article[`${base}En`], this.locale()) || '—' : '—';
  }

  protected imageText(base: 'thumbnailTitle' | 'thumbnailAlt' | 'coverTitle' | 'coverAlt'): string {
    const article = this.article();
    return article ? pick(article[`${base}Ar`], article[`${base}En`], this.locale()) || '—' : '—';
  }

  protected retry(): void {
    this.load(this.id());
  }

  protected back(): void {
    void this.router.navigate(['/knowledge']);
  }

  protected edit(): void {
    void this.router.navigate(['/knowledge', this.id(), 'edit']);
  }

  protected async copyId(): Promise<void> {
    const value = this.displayId();
    if (!(await this.writeClipboard(value))) {
      return;
    }
    this.messages.add({
      severity: 'success',
      summary: this.lang.t('knowledge.idCopied'),
    });
  }

  protected async copyLink(): Promise<void> {
    if (!(await this.writeClipboard(this.shareUrl()))) {
      return;
    }
    this.messages.add({
      severity: 'success',
      summary: this.lang.t('knowledge.linkCopied'),
    });
  }

  protected shareWhatsapp(): void {
    const url = encodeURIComponent(this.shareUrl());
    const text = encodeURIComponent(this.title());
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank', 'noopener,noreferrer');
  }

  protected shareLinkedin(): void {
    const url = encodeURIComponent(this.shareUrl());
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  protected shareX(): void {
    const url = encodeURIComponent(this.shareUrl());
    const text = encodeURIComponent(this.title());
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  protected async toggleFeatured(): Promise<void> {
    const current = this.article();
    const next = current ? await this.actions.toggleFeatured(current, this.confirm()) : null;
    if (next) {
      this.article.set(next);
    }
  }

  protected async changeStatus(status: ArticleStatus): Promise<void> {
    this.statusMenu().hide();
    const current = this.article();
    const next = current ? await this.actions.changeStatus(current, status, this.confirm()) : null;
    if (next) {
      this.article.set(next);
    }
  }

  protected toggleStatusMenu(event: Event): void {
    this.statusMenu().toggle(event);
  }

  protected async remove(): Promise<void> {
    const current = this.article();
    if (current && (await this.actions.remove(current, this.confirm()))) {
      this.back();
    }
  }

  private shareUrl(): string {
    return typeof window === 'undefined' ? '' : window.location.href;
  }

  private async writeClipboard(value: string): Promise<boolean> {
    if (!value || !navigator.clipboard?.writeText) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  private text(
    ar: 'titleAr' | 'excerptAr' | 'authorNameAr',
    en: 'titleEn' | 'excerptEn' | 'authorNameEn',
  ): string {
    const article = this.article();
    return article ? pick(article[ar], article[en], this.locale()) : '';
  }

  private load(id: string): void {
    this.status.set('loading');
    forkJoin([this.api.get(id), this.api.listCategories()])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([article, categories]) => {
          if (!article) {
            this.article.set(null);
            this.status.set('missing');
            return;
          }
          this.article.set(article);
          this.category.set(categories.find((item) => item.id === article.categoryId) ?? null);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }
}
