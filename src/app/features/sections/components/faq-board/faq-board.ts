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
import { FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageTabs, type PageTab } from '../../../../shared/components/page-tabs/page-tabs';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { toIsoDate } from '../../../../shared/utils/date';
import type { FaqCategory, FaqCategoryId, FaqItem } from '../../models/faq.model';
import { FaqService } from '../../services/faq.service';
import { FaqCategoriesPanel } from './components/faq-categories-panel/faq-categories-panel';
import { FaqEditorForm } from './components/faq-editor-form/faq-editor-form';
import { FaqQuestionsPanel } from './components/faq-questions-panel/faq-questions-panel';

type LoadState = 'loading' | 'ready' | 'error';
type BoardTab = 'questions' | 'categories';

/**
 * FAQ page container: header, tabs, load/error, API orchestration, and editor modal.
 * Tab bodies and the form live in focused child components.
 */
@Component({
  selector: 'app-faq-board',
  imports: [
    AppButton,
    ConfirmDialog,
    FaqCategoriesPanel,
    FaqEditorForm,
    FaqQuestionsPanel,
    Modal,
    PageHeader,
    PageTabs,
    StateView,
  ],
  templateUrl: './faq-board.html',
  styleUrl: './faq-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqBoard {
  private readonly api = inject(FaqService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  readonly state = signal<LoadState>('loading');
  readonly saving = signal(false);
  readonly items = signal<FaqItem[]>([]);
  readonly categories = signal<FaqCategory[]>([]);
  readonly tab = signal<BoardTab>('questions');
  readonly editor = signal<'create' | 'edit' | null>(null);
  readonly selected = signal<FaqItem | null>(null);

  readonly form = this.fb.nonNullable.group({
    questionAr: ['', Validators.required],
    questionEn: ['', Validators.required],
    answerAr: ['', Validators.required],
    answerEn: ['', Validators.required],
    categoryId: this.fb.nonNullable.control<FaqCategoryId>('services', Validators.required),
    order: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    published: this.fb.nonNullable.control(true),
  });

  readonly tabs = computed<readonly PageTab[]>(() => {
    this.lang.language();
    return [
      { id: 'questions', labelKey: 'faq.questionsTab', icon: 'pi pi-question-circle' },
      { id: 'categories', labelKey: 'faq.categoriesTab', icon: 'pi pi-th-large' },
    ];
  });

  readonly categoryOptions = computed(() => {
    this.lang.language();
    const locale = this.lang.language();
    return this.categories().map((category) => ({
      value: category.id,
      label: category.name[locale] || category.name.ar || category.name.en,
    }));
  });

  readonly editorTitle = computed(() => {
    this.lang.language();
    return this.lang.t(this.editor() === 'create' ? 'faq.createTitle' : 'faq.editTitle');
  });

  constructor() {
    this.load();
  }

  protected setTab(value: string | number | undefined): void {
    if (value === 'questions' || value === 'categories') {
      this.tab.set(value);
    }
  }

  protected openCreate(): void {
    this.selected.set(null);
    this.form.reset({
      questionAr: '',
      questionEn: '',
      answerAr: '',
      answerEn: '',
      categoryId: 'services',
      order: this.items().length + 1,
      published: true,
    });
    this.editor.set('create');
  }

  protected openEdit(item: FaqItem): void {
    this.selected.set(item);
    this.form.reset({
      questionAr: item.question.ar,
      questionEn: item.question.en,
      answerAr: item.answer.ar,
      answerEn: item.answer.en,
      categoryId: item.categoryId,
      order: item.order,
      published: item.published,
    });
    this.editor.set('edit');
  }

  protected setEditorVisible(open: boolean): void {
    if (!open) {
      this.closeEditor();
    }
  }

  protected closeEditor(): void {
    this.editor.set(null);
    this.selected.set(null);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) {
      return;
    }
    const raw = this.form.getRawValue();
    const draft = {
      question: { ar: raw.questionAr.trim(), en: raw.questionEn.trim() },
      answer: { ar: raw.answerAr.trim(), en: raw.answerEn.trim() },
      categoryId: raw.categoryId,
      order: raw.order,
      published: raw.published,
      updatedAt: toIsoDate(new Date()),
    };
    const current = this.selected();
    const request = current ? this.api.update(current.id, draft) : this.api.create(draft);
    this.saving.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (item) => {
        this.saving.set(false);
        this.items.update((list) => {
          const exists = list.some((row) => row.id === item.id);
          return exists ? list.map((row) => (row.id === item.id ? item : row)) : [item, ...list];
        });
        this.closeEditor();
        this.messages.add({
          severity: 'success',
          summary: this.lang.t(current ? 'faq.updated' : 'faq.created'),
        });
      },
      error: () => this.fail(),
    });
  }

  protected setPublished(item: FaqItem, published: boolean): void {
    if (item.published === published || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.api
      .setPublished(item.id, published)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (next) => {
          this.saving.set(false);
          this.items.update((list) => list.map((row) => (row.id === next.id ? next : row)));
        },
        error: () => this.fail(),
      });
  }

  protected setCategoryPublished(category: FaqCategory, published: boolean): void {
    if (category.published === published || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.api
      .setCategoryPublished(category.id, published)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (next) => {
          this.saving.set(false);
          this.categories.update((list) => list.map((row) => (row.id === next.id ? next : row)));
        },
        error: () => this.fail(),
      });
  }

  protected async remove(item: FaqItem): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('faq.deleteTitle'),
      message: this.lang.t('faq.deleteMessage'),
      confirmLabel: this.lang.t('faq.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .remove(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.items.update((list) => list.filter((row) => row.id !== item.id));
          this.messages.add({ severity: 'success', summary: this.lang.t('faq.deleted') });
        },
        error: () => this.fail(),
      });
  }

  protected reload(): void {
    this.load();
  }

  private load(): void {
    this.state.set('loading');
    this.api
      .listCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.api
            .list()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (items) => {
                this.items.set(items);
                this.state.set('ready');
              },
              error: () => this.state.set('error'),
            });
        },
        error: () => this.state.set('error'),
      });
  }

  private fail(): void {
    this.saving.set(false);
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }
}
