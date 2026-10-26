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
import { FormBuilder, FormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Checkbox } from 'primeng/checkbox';
import { Popover } from 'primeng/popover';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ReviewCard } from '../../../../shared/components/review-card/review-card';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { formatIsoDate } from '../../../../shared/utils/date';
import type { Review, ReviewStatusFilter } from '../../models/review.model';
import { ReviewsService } from '../../services/reviews.service';
import {
  ReviewEditorForm,
  type ReviewEditorMode,
} from './components/review-editor-form/review-editor-form';

interface FilterOption {
  value: ReviewStatusFilter;
  label: string;
}

type EditorMode = ReviewEditorMode | null;

@Component({
  selector: 'app-reviews-board',
  imports: [
    FormsModule,
    PageHeader,
    AppButton,
    ReviewCard,
    StateView,
    ConfirmDialog,
    Modal,
    Popover,
    Checkbox,
    ReviewEditorForm,
  ],
  templateUrl: './reviews-board.html',
  styleUrl: './reviews-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsBoard {
  private readonly api = inject(ReviewsService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly editorForm = viewChild(ReviewEditorForm);
  readonly lang = inject(LanguageService);

  private readonly source = signal<Review[]>([]);
  readonly statusFilter = signal<ReviewStatusFilter>('all');
  readonly filterOpen = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editor = signal<EditorMode>(null);
  readonly selected = signal<Review | null>(null);

  readonly form = this.fb.nonNullable.group({
    nameAr: ['', Validators.required],
    nameEn: ['', Validators.required],
    roleAr: ['', Validators.required],
    roleEn: ['', Validators.required],
    quoteAr: ['', Validators.required],
    quoteEn: ['', Validators.required],
    rating: this.fb.nonNullable.control(5, [Validators.required, Validators.min(1), Validators.max(5)]),
    published: this.fb.nonNullable.control(false),
  });

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

  readonly editorTitle = computed(() => {
    this.lang.language();
    return this.editor() === 'edit' ? this.lang.t('review.editTitle') : this.lang.t('review.createTitle');
  });

  readonly editorSaveLabel = computed(() => {
    this.lang.language();
    return this.editor() === 'edit' ? this.lang.t('common.saveChanges') : this.lang.t('review.addSubmit');
  });

  readonly editorSaveIcon = computed(() => (this.editor() === 'edit' ? 'pi pi-save' : 'pi pi-plus'));

  readonly editorMode = computed<ReviewEditorMode>(() => this.editor() ?? 'create');

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
    this.selected.set(null);
    this.form.reset({
      nameAr: '',
      nameEn: '',
      roleAr: '',
      roleEn: '',
      quoteAr: '',
      quoteEn: '',
      rating: 5,
      published: false,
    });
    this.editor.set('create');
    queueMicrotask(() => this.editorForm()?.resetMedia());
  }

  protected editReview(review: Review): void {
    this.selected.set(review);
    this.form.reset({
      nameAr: review.texts.ar.name,
      nameEn: review.texts.en.name,
      roleAr: review.texts.ar.role,
      roleEn: review.texts.en.role,
      quoteAr: review.texts.ar.quote,
      quoteEn: review.texts.en.quote,
      rating: review.rating,
      published: review.published,
    });
    this.editor.set('edit');
    queueMicrotask(() =>
      this.editorForm()?.resetMedia({
        avatarUrl: review.avatarUrl,
        avatarName: this.lang.t('review.avatarFile'),
      }),
    );
  }

  protected setEditorVisible(open: boolean): void {
    if (!open) {
      this.closeEditor();
    }
  }

  protected closeEditor(): void {
    this.editor.set(null);
    this.selected.set(null);
    this.saving.set(false);
    this.editorForm()?.resetMedia();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) {
      return;
    }

    const value = this.form.getRawValue();
    const media = this.editorForm()?.mediaSnapshot() ?? {
      avatarUrl: 'images/avatar-placeholder.svg',
      mediaUrl: 'images/ceo.svg',
      mediaKind: 'video' as const,
    };
    const texts = {
      ar: { name: value.nameAr, role: value.roleAr, quote: value.quoteAr },
      en: { name: value.nameEn, role: value.roleEn, quote: value.quoteEn },
    };

    this.saving.set(true);
    const mode = this.editor();
    const selected = this.selected();

    if (mode === 'edit' && selected) {
      const next: Review = {
        ...selected,
        rating: value.rating,
        published: value.published,
        avatarUrl: media.avatarUrl || selected.avatarUrl,
        mediaUrl: selected.mediaUrl,
        mediaKind: selected.mediaKind,
        texts,
      };
      this.api
        .update(next)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (saved) => {
            this.source.update((rows) => rows.map((row) => (row.id === saved.id ? saved : row)));
            this.saving.set(false);
            this.closeEditor();
            this.messages.add({ severity: 'success', summary: this.lang.t('review.saved') });
          },
          error: () => {
            this.saving.set(false);
            this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
          },
        });
      return;
    }

    this.api
      .create({
        rating: value.rating,
        published: value.published,
        avatarUrl: media.avatarUrl,
        mediaUrl: media.mediaUrl,
        mediaKind: media.mediaKind,
        texts,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.source.update((rows) => [saved, ...rows.filter((row) => row.id !== saved.id)]);
          this.saving.set(false);
          this.closeEditor();
          this.messages.add({ severity: 'success', summary: this.lang.t('review.created') });
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
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
