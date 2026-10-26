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
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageTabs, type PageTab } from '../../../../shared/components/page-tabs/page-tabs';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { FaqCategoryForm } from '../../../sections/components/faq-board/components/faq-category-form/faq-category-form';
import {
  ArticlesPanel,
  type ArticleStatusChange,
} from '../../components/articles-panel/articles-panel';
import { CategoriesPanel } from '../../components/categories-panel/categories-panel';
import type { Article, ArticleCategory } from '../../models/knowledge.model';
import { CategoryInUseError, KnowledgeService } from '../../services/knowledge.service';
import { KnowledgeActions } from '../../services/knowledge-actions.service';

type LoadState = 'loading' | 'ready' | 'error';
type BoardTab = 'articles' | 'categories';
type CategoryEditor = 'create' | 'edit' | null;

/** Knowledge Center list page: header, tabs, load/error state and category modal. */
@Component({
  selector: 'app-knowledge-board',
  imports: [
    AppButton,
    ArticlesPanel,
    CategoriesPanel,
    ConfirmDialog,
    FaqCategoryForm,
    Modal,
    PageHeader,
    PageTabs,
    StateView,
  ],
  templateUrl: './knowledge-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoard {
  private readonly api = inject(KnowledgeService);
  private readonly actions = inject(KnowledgeActions);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  readonly state = signal<LoadState>('loading');
  readonly saving = signal(false);
  readonly tab = signal<BoardTab>('articles');
  readonly articles = signal<Article[]>([]);
  private readonly rawCategories = signal<ArticleCategory[]>([]);
  readonly editor = signal<CategoryEditor>(null);
  readonly selectedCategory = signal<ArticleCategory | null>(null);

  readonly categoryForm = this.fb.nonNullable.group({
    nameAr: ['', Validators.required],
    nameEn: ['', Validators.required],
    published: this.fb.nonNullable.control(true),
  });

  /** Counts follow the live article list, so deleting an article updates its category card. */
  readonly categories = computed(() => {
    const articles = this.articles();
    return this.rawCategories().map((category) => ({
      ...category,
      articleCount: articles.filter((item) => item.categoryId === category.id).length,
    }));
  });

  readonly tabs = computed<readonly PageTab[]>(() => [
    { id: 'articles', labelKey: 'knowledge.articlesTab', icon: 'pi pi-file' },
    { id: 'categories', labelKey: 'knowledge.categoriesTab', icon: 'pi pi-th-large' },
  ]);

  readonly subtitle = computed(() => {
    this.lang.language();
    return this.lang.t(
      this.tab() === 'categories' ? 'knowledge.categoriesSubtitle' : 'knowledge.subtitle',
    );
  });

  readonly addLabel = computed(() => {
    this.lang.language();
    return this.lang.t(this.tab() === 'categories' ? 'knowledge.addCategory' : 'knowledge.add');
  });

  readonly editorTitle = computed(() => {
    this.lang.language();
    return this.lang.t(
      this.editor() === 'edit' ? 'knowledge.editCategoryTitle' : 'knowledge.createCategoryTitle',
    );
  });

  readonly editorSaveLabel = computed(() => {
    this.lang.language();
    return this.lang.t(
      this.editor() === 'edit' ? 'knowledge.saveCategory' : 'knowledge.addCategoryAction',
    );
  });

  constructor() {
    this.load();
  }

  protected setTab(value: string | number | undefined): void {
    if (value === 'articles' || value === 'categories') {
      this.tab.set(value);
    }
  }

  protected add(): void {
    if (this.tab() === 'categories') {
      this.openCreateCategory();
      return;
    }
    void this.router.navigate(['/knowledge', 'new']);
  }

  protected reload(): void {
    this.load();
  }

  protected view(article: Article): void {
    void this.router.navigate(['/knowledge', article.id]);
  }

  protected openEditor(article: Article): void {
    void this.router.navigate(['/knowledge', article.id, 'edit']);
  }

  protected exported(count: number): void {
    this.messages.add({
      severity: 'success',
      summary: this.lang.t('knowledge.exported').replace('{count}', `${count}`),
    });
  }

  protected async removeArticle(article: Article): Promise<void> {
    if (await this.actions.remove(article, this.confirm())) {
      this.articles.update((list) => list.filter((item) => item.id !== article.id));
    }
  }

  protected async toggleFeatured(article: Article): Promise<void> {
    const next = await this.actions.toggleFeatured(article, this.confirm());
    if (next) {
      this.replace(next);
    }
  }

  protected async changeStatus(change: ArticleStatusChange): Promise<void> {
    const next = await this.actions.changeStatus(change.article, change.status, this.confirm());
    if (next) {
      this.replace(next);
    }
  }

  protected openCreateCategory(): void {
    this.selectedCategory.set(null);
    this.categoryForm.reset({ nameAr: '', nameEn: '', published: true });
    this.editor.set('create');
  }

  protected openEditCategory(category: ArticleCategory): void {
    this.selectedCategory.set(category);
    this.categoryForm.reset({
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      published: category.published,
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
    this.selectedCategory.set(null);
  }

  protected saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    if (this.saving()) {
      return;
    }
    const raw = this.categoryForm.getRawValue();
    const draft = {
      nameAr: raw.nameAr.trim(),
      nameEn: raw.nameEn.trim(),
      published: raw.published,
    };
    const current = this.selectedCategory();
    const request = current
      ? this.api.updateCategory(current.id, draft)
      : this.api.createCategory(draft);
    this.saving.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.rawCategories.update((list) =>
          list.some((item) => item.id === saved.id)
            ? list.map((item) => (item.id === saved.id ? saved : item))
            : [...list, saved],
        );
        this.closeEditor();
        this.messages.add({
          severity: 'success',
          summary: this.lang.t(current ? 'knowledge.categoryUpdated' : 'knowledge.categoryCreated'),
        });
      },
      error: () => this.fail(),
    });
  }

  protected async removeCategory(category: ArticleCategory): Promise<void> {
    if (category.articleCount > 0) {
      this.messages.add({ severity: 'warn', summary: this.lang.t('knowledge.categoryInUse') });
      return;
    }
    const accepted = await this.confirm().ask({
      title: this.lang.t('knowledge.deleteCategoryTitle'),
      message: this.lang.t('knowledge.deleteCategoryMessage'),
      confirmLabel: this.lang.t('knowledge.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .removeCategory(category.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.rawCategories.update((list) => list.filter((item) => item.id !== category.id));
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('knowledge.categoryDeleted'),
          });
        },
        error: (error: unknown) => {
          if (error instanceof CategoryInUseError) {
            this.messages.add({
              severity: 'warn',
              summary: this.lang.t('knowledge.categoryInUse'),
            });
            return;
          }
          this.fail();
        },
      });
  }

  private replace(next: Article): void {
    this.articles.update((list) => list.map((item) => (item.id === next.id ? next : item)));
  }

  private load(): void {
    this.state.set('loading');
    forkJoin([this.api.list(), this.api.listCategories()])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([articles, categories]) => {
          this.articles.set(articles);
          this.rawCategories.set(categories);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  private fail(): void {
    this.saving.set(false);
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }
}
