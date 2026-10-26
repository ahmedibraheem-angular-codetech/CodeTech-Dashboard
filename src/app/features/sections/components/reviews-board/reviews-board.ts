import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Checkbox } from 'primeng/checkbox';
import { Popover } from 'primeng/popover';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ReviewCard } from '../../../../shared/components/review-card/review-card';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { formatIsoDate } from '../../../../shared/utils/date';
import type { Review, ReviewStatusFilter } from '../../models/review.model';
import { ReviewsService } from '../../services/reviews.service';

interface FilterOption {
  value: ReviewStatusFilter;
  label: string;
}

@Component({
  selector: 'app-reviews-board',
  imports: [
    FormsModule,
    PageHeader,
    AppButton,
    ReviewCard,
    StateView,
    ConfirmDialog,
    Popover,
    Checkbox,
  ],
  templateUrl: './reviews-board.html',
  styleUrl: './reviews-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsBoard {
  private readonly api = inject(ReviewsService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  private readonly source = signal<Review[]>([]);
  readonly statusFilter = signal<ReviewStatusFilter>('all');
  readonly filterOpen = signal(false);
  readonly loading = signal(true);

  constructor() {
    this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.source.set(rows);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  readonly filterOptions = computed<FilterOption[]>(() => [
    { value: 'all', label: this.lang.t('review.filterAll') },
    { value: 'published', label: this.lang.t('review.filterPublished') },
    { value: 'unpublished', label: this.lang.t('review.filterUnpublished') },
  ]);

  readonly filterLabel = computed(() => {
    const current = this.statusFilter();
    return this.filterOptions().find((option) => option.value === current)?.label ?? '';
  });

  readonly visible = computed(() => {
    const filter = this.statusFilter();
    const rows = this.source();
    if (filter === 'all') {
      return rows;
    }
    const wantPublished = filter === 'published';
    return rows.filter((row) => row.published === wantPublished);
  });

  readonly countLabel = computed(() =>
    this.lang.t('review.count').replace('{count}', String(this.visible().length)),
  );

  protected text(review: Review): Review['texts'][keyof Review['texts']] {
    return review.texts[this.lang.language()];
  }

  protected displayDate(iso: string): string {
    return formatIsoDate(iso, this.lang.language());
  }

  protected displayTime(time: string): string {
    if (this.lang.language() !== 'ar') {
      return time;
    }
    return time.replace(/\bPM\b/i, 'م').replace(/\bAM\b/i, 'ص');
  }

  protected statusOf(review: Review): 'published' | 'unpublished' {
    return review.published ? 'published' : 'unpublished';
  }

  protected isFilterChecked(value: ReviewStatusFilter): boolean {
    return this.statusFilter() === value;
  }

  protected setFilter(value: ReviewStatusFilter, checked: boolean): void {
    if (checked) {
      this.statusFilter.set(value);
    }
  }

  protected exportRows(): void {
    this.messages.add({
      severity: 'success',
      summary: this.lang.t('review.export'),
    });
  }

  protected addReview(): void {
    this.messages.add({
      severity: 'info',
      summary: this.lang.t('review.add'),
    });
  }

  protected editReview(review: Review): void {
    this.messages.add({
      severity: 'info',
      summary: `${this.lang.t('review.edit')} · ${this.text(review).name}`,
    });
  }

  protected setPublished(review: Review, published: boolean): void {
    const previous = review.published;
    this.source.update((rows) =>
      rows.map((row) => (row.id === review.id ? { ...row, published } : row)),
    );
    this.api
      .setPublished(review.id, published)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.messages.add({ severity: 'success', summary: this.lang.t('review.updated') }),
        error: () => {
          this.source.update((rows) =>
            rows.map((row) => (row.id === review.id ? { ...row, published: previous } : row)),
          );
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  protected async remove(review: Review): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('review.deleteTitle'),
      message: this.lang.t('review.deleteMessage'),
      confirmLabel: this.lang.t('review.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .remove(review.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.source.update((rows) => rows.filter((row) => row.id !== review.id));
          this.messages.add({ severity: 'success', summary: this.lang.t('review.deleted') });
        },
        error: () => this.messages.add({ severity: 'error', summary: this.lang.t('common.error') }),
      });
  }
}
