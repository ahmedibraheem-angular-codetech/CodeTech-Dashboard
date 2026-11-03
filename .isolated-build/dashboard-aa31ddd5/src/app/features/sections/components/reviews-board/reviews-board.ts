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

import { AuthService } from '../../../../core/auth/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ReviewCard } from '../../../../shared/components/review-card/review-card';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { formatIsoDate } from '../../../../shared/utils/date';
import {
  REVIEW_AVATAR_PLACEHOLDER,
  type Review,
  type ReviewContentDraft,
  type ReviewMediaDraft,
  type ReviewStatusFilter,
} from '../../models/review.model';
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
type LoadState = 'loading' | 'ready' | 'error';

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
    HasPermissionDirective,
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
  private readonly auth = inject(AuthService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly editorForm = viewChild(ReviewEditorForm);
  readonly lang = inject(LanguageService);

  private readonly source = signal<Review[]>([]);
  readonly statusFilter = signal<ReviewStatusFilter>('all');
  readonly filterOpen = signal(false);
  readonly loadState = signal<LoadState>('loading');
  readonly saving = signal(false);
  readonly exporting = signal(false);
  readonly editor = signal<EditorMode>(null);
  readonly selected = signal<Review | null>(null);

  readonly form = this.fb.nonNullable.group({
    nameAr: ['', Validators.required],
    nameEn: ['', Validators.required],
    roleAr: ['', Validators.required],
    roleEn: ['', Validators.required],
    quoteAr: ['', Validators.required],
    quoteEn: ['', Validators.required],
    rating: this.fb.nonNullable.control(5, [
      Validators.required,
      Validators.min(1),
      Validators.max(5),
    ]),
    published: this.fb.nonNullable.control(false),
  });

  constructor() {
    this.reload();
  }

  readonly loading = computed(() => this.loadState() === 'loading');
  readonly loadFailed = computed(() => this.loadState() === 'error');

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
    return this.editor() === 'edit'
      ? this.lang.t('review.editTitle')
      : this.lang.t('review.createTitle');
  });

  readonly editorSaveLabel = computed(() => {
    this.lang.language();
    return this.editor() === 'edit'
      ? this.lang.t('common.saveChanges')
      : this.lang.t('review.addSubmit');
  });

  readonly editorSaveIcon = computed(() =>
    this.editor() === 'edit' ? 'pi pi-save' : 'pi pi-plus',
  );

  readonly editorMode = computed<ReviewEditorMode>(() => this.editor() ?? 'create');

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('testimonials.update');
  });
  readonly canDelete = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('testimonials.delete');
  });

  protected text(review: Review): Review['texts'][keyof Review['texts']] {
    return review.texts[this.lang.language()];
  }

  protected avatarUrl(review: Review): string {
    return review.photo?.url || REVIEW_AVATAR_PLACEHOLDER;
  }

  protected mediaUrl(review: Review): string {
    return review.photo?.url || '';
  }

  protected mediaKind(review: Review): 'video' | 'image' {
    return review.video ? 'video' : 'image';
  }

  protected displayDate(iso: string): string {
    const day = iso.includes('T') ? iso.slice(0, 10) : iso;
    return formatIsoDate(day, this.lang.language());
  }

  protected displayTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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

  protected reload(): void {
    this.loadState.set('loading');
    this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.source.set(rows);
          this.loadState.set('ready');
        },
        error: () => {
          this.loadState.set('error');
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  protected exportRows(): void {
    if (this.exporting()) {
      return;
    }
    this.exporting.set(true);
    this.api
      .exportCsv()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.exporting.set(false);
          const href = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = href;
          link.download = `testimonials-${new Date().toISOString().slice(0, 10)}.csv`;
          link.click();
          URL.revokeObjectURL(href);
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('review.export'),
          });
        },
        error: () => {
          this.exporting.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
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
    queueMicrotask(() => this.editorForm()?.resetMedia({ photo: review.photo }));
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
    const draft: ReviewContentDraft = {
      rating: value.rating,
      published: value.published,
      texts: {
        ar: { name: value.nameAr, role: value.roleAr, quote: value.quoteAr },
        en: { name: value.nameEn, role: value.roleEn, quote: value.quoteEn },
      },
    };
    const media: ReviewMediaDraft = this.editorForm()?.mediaDraft() ?? {
      photo: { kind: 'omit' },
      video: { kind: 'omit' },
    };

    this.saving.set(true);
    const mode = this.editor();
    const selected = this.selected();

    if (mode === 'edit' && selected) {
      this.api
        .update(selected.id, draft, media)
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
      .create(draft, media)
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
        next: (saved) => {
          this.source.update((rows) => rows.map((row) => (row.id === saved.id ? saved : row)));
          this.messages.add({ severity: 'success', summary: this.lang.t('review.updated') });
        },
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
