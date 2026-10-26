import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Popover } from 'primeng/popover';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { AppPaginator } from '../../../../shared/components/app-paginator/app-paginator';
import {
  DataTable,
  DataTableCellTemplate,
} from '../../../../shared/components/data-table/data-table';
import type {
  DataTableBadgeValue,
  DataTableColumn,
  DataTableDateValue,
  DataTableFilterOption,
} from '../../../../shared/components/data-table/data-table.model';
import { StatisticsCards } from '../../../../shared/components/statistics-cards/statistics-cards';
import type { StatisticsCard } from '../../../../shared/components/statistics-cards/statistics-card.model';
import {
  ARTICLE_STATUSES,
  type Article,
  type ArticleCategory,
  type ArticleStatus,
} from '../../models/knowledge.model';
import {
  articleExcerpt,
  articleTitle,
  categoryName,
  formatStampDate,
  formatStampTime,
} from '../../utils/knowledge-format';

interface ArticleRow {
  id: string;
  article: { title: string; excerpt: string; thumbnailUrl: string; featured: boolean };
  category: string;
  reading: string;
  status: DataTableBadgeValue & { value: ArticleStatus };
  when: DataTableDateValue;
  source: Article;
}

/** Badge tones come from the shared table: published → new, draft → progress, unpublished → closed. */
const STATUS_TONE: Record<ArticleStatus, DataTableBadgeValue['tone']> = {
  published: 'new',
  draft: 'progress',
  unpublished: 'closed',
};

export interface ArticleStatusChange {
  article: Article;
  status: ArticleStatus;
}

/**
 * Articles tab: KPI cards plus the shared data table with its own search, status filter and
 * pagination state. The board owns the data and every write.
 */
@Component({
  selector: 'app-knowledge-articles-panel',
  imports: [AppButton, AppPaginator, DataTable, DataTableCellTemplate, Popover, StatisticsCards],
  templateUrl: './articles-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesPanel {
  readonly lang = inject(LanguageService);
  private readonly menu = viewChild.required(Popover);

  readonly articles = input.required<readonly Article[]>();
  readonly categories = input.required<readonly ArticleCategory[]>();

  readonly view = output<Article>();
  readonly edit = output<Article>();
  readonly remove = output<Article>();
  readonly toggleFeatured = output<Article>();
  readonly statusChange = output<ArticleStatusChange>();
  readonly exported = output<number>();

  readonly query = signal('');
  readonly selectedFilters = signal<readonly string[]>([]);
  readonly first = signal(0);
  readonly pageSize = signal(10);
  readonly menuArticle = signal<Article | null>(null);

  readonly cards = computed<StatisticsCard[]>(() => {
    this.lang.language();
    const all = this.articles();
    const caption = this.lang.t('knowledge.compared');
    const count = (status: ArticleStatus): number =>
      all.filter((item) => item.status === status).length;
    return [
      this.card(
        'total',
        'knowledge.stat.total',
        all.length,
        'pi pi-file',
        '#e11d48',
        '#ffe4e6',
        caption,
      ),
      this.card(
        'published',
        'knowledge.stat.published',
        count('published'),
        'pi pi-check-circle',
        '#f59e0b',
        '#ffedd5',
        caption,
      ),
      this.card(
        'draft',
        'knowledge.stat.draft',
        count('draft'),
        'pi pi-file-edit',
        '#3b82f6',
        '#dbeafe',
        caption,
      ),
      this.card(
        'unpublished',
        'knowledge.stat.unpublished',
        count('unpublished'),
        'pi pi-eye-slash',
        '#16a34a',
        '#dcfce7',
        caption,
      ),
    ];
  });

  readonly filters = computed<DataTableFilterOption[]>(() => {
    this.lang.language();
    return [
      { value: 'all', label: this.lang.t('knowledge.allStatuses'), selectAll: true },
      ...ARTICLE_STATUSES.map((status) => ({
        value: status,
        label: this.lang.t(`knowledge.status.${status}`),
      })),
    ];
  });

  readonly columns = computed<DataTableColumn<ArticleRow>[]>(() => {
    this.lang.language();
    return [
      { key: 'id', header: 'ID', field: 'id', width: '110px' },
      { key: 'article', header: this.lang.t('knowledge.col.article'), width: '380px' },
      { key: 'category', header: this.lang.t('knowledge.col.category'), field: 'category' },
      { key: 'reading', header: this.lang.t('knowledge.col.reading'), field: 'reading' },
      {
        key: 'status',
        header: this.lang.t('knowledge.col.status'),
        field: 'status',
        kind: 'badge',
        width: '140px',
      },
      {
        key: 'when',
        header: this.lang.t('knowledge.col.date'),
        field: 'when',
        kind: 'datetime',
        width: '240px',
      },
      { key: 'actions', header: this.lang.t('knowledge.col.actions'), width: '90px' },
    ];
  });

  private readonly filtered = computed(() => {
    const locale = this.lang.language();
    const query = this.query().trim().toLowerCase();
    const selected = this.selectedFilters();
    const categories = this.categories();
    return this.articles()
      .filter((item) => selected.length === 0 || selected.includes(item.status))
      .filter((item) => {
        if (!query) {
          return true;
        }
        const category = categories.find((entry) => entry.id === item.categoryId);
        const haystack = [
          item.id,
          item.titleAr,
          item.titleEn,
          item.excerptAr,
          item.excerptEn,
          categoryName(category, locale),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
  });

  readonly total = computed(() => this.filtered().length);

  readonly rows = computed<ArticleRow[]>(() => {
    const locale = this.lang.language();
    const categories = this.categories();
    return this.filtered()
      .slice(this.first(), this.first() + this.pageSize())
      .map((item) => ({
        id: item.id,
        article: {
          title: articleTitle(item, locale),
          excerpt: articleExcerpt(item, locale),
          thumbnailUrl: item.thumbnailUrl,
          featured: item.featured,
        },
        category:
          categoryName(
            categories.find((entry) => entry.id === item.categoryId),
            locale,
          ) || '—',
        reading: this.lang.t('knowledge.minutes').replace('{count}', `${item.readingMinutes}`),
        status: {
          value: item.status,
          label: this.lang.t(`knowledge.status.${item.status}`),
          tone: STATUS_TONE[item.status],
        },
        when: {
          date: formatStampDate(item.publishedAt, locale),
          time: formatStampTime(item.publishedAt, locale),
        },
        source: item,
      }));
  });

  readonly title = computed(() => {
    this.lang.language();
    return this.lang.t('knowledge.articlesTitle').replace('{count}', `${this.total()}`);
  });

  protected setQuery(value: string): void {
    this.query.set(value);
    this.first.set(0);
  }

  protected setFilters(values: readonly string[]): void {
    this.selectedFilters.set(values);
    this.first.set(0);
  }

  protected page(event: { first?: number; rows?: number }): void {
    this.first.set(event.first ?? 0);
    this.pageSize.set(event.rows ?? this.pageSize());
  }

  protected openRow(row: ArticleRow): void {
    this.view.emit(row.source);
  }

  protected openMenu(event: Event, row: ArticleRow): void {
    this.menuArticle.set(row.source);
    this.menu().toggle(event);
  }

  protected choose(action: 'open' | 'edit' | 'remove' | 'feature'): void {
    const article = this.menuArticle();
    this.menu().hide();
    if (!article) {
      return;
    }
    if (action === 'open') {
      this.view.emit(article);
    } else if (action === 'edit') {
      this.edit.emit(article);
    } else if (action === 'remove') {
      this.remove.emit(article);
    } else {
      this.toggleFeatured.emit(article);
    }
  }

  protected changeStatus(status: ArticleStatus): void {
    const article = this.menuArticle();
    this.menu().hide();
    if (article) {
      this.statusChange.emit({ article, status });
    }
  }

  protected otherStatuses(article: Article): ArticleStatus[] {
    return ARTICLE_STATUSES.filter((status) => status !== article.status);
  }

  protected statusActionKey(status: ArticleStatus): string {
    if (status === 'published') {
      return 'knowledge.publish';
    }
    return status === 'draft' ? 'knowledge.moveToDraft' : 'knowledge.unpublish';
  }

  private card(
    id: string,
    titleKey: string,
    value: number,
    icon: string,
    iconColor: string,
    iconBackground: string,
    caption: string,
  ): StatisticsCard {
    return {
      id,
      title: this.lang.t(titleKey),
      value: value.toLocaleString('en-US'),
      icon,
      iconColor,
      iconBackground,
      trend: 12.5,
      caption,
    };
  }
}
