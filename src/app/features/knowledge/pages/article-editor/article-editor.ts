import { NgTemplateOutlet } from '@angular/common';
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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, SharedModule } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { Editor } from 'primeng/editor';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import type { EditorInitEvent } from 'primeng/types/editor';
import { firstValueFrom } from 'rxjs';

import type { AppLanguage } from '../../../../core/i18n/language';
import { MediaService } from '../../../../core/media/media.service';
import { isApiError, loadFailureStatus } from '../../../../core/http/api-error';
import { LanguageService } from '../../../../core/services/language.service';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { FieldError } from '../../../../shared/components/field-error/field-error';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import {
  QUILL_FONT_REGISTRAR,
  applyQuillDirection,
  hasVisibleHtml,
  readQuillHtml,
  wireQuillToolbarHandlers,
  type AppQuill,
} from '../../../../shared/editor/quill';
import { formatIsoDate } from '../../../../shared/utils/date';
import { formatFileSize } from '../../../../shared/utils/file-size';
import { IMAGE_UPLOAD_ACCEPT, parseUploadedImage } from '../../../../shared/utils/image-upload';
import {
  type Article,
  type ArticleCategory,
  type ArticleDraft,
  type ArticleStatus,
} from '../../models/knowledge.model';
import { KnowledgeActions } from '../../services/knowledge-actions.service';
import { KnowledgeService } from '../../services/knowledge.service';
import {
  ARTICLE_IMAGE_SLOTS,
  type ArticleImageSlot,
  articleSlotMedia,
} from '../../utils/article-editor-images';
import { type SlotImage, LocalizedImageSlots } from '../../../../core/media/localized-slots';

import {
  collectArticleValidationIssues,
  isValidArticleSlug,
  type ArticleValidationStrictness,
} from '../../utils/article-editor-validation';
import { articleFormValueFromArticle, fieldsFromArticleForm } from '../../utils/article-form-map';
import { categoryName, joinKeywords, splitKeywords } from '../../utils/knowledge-format';

type LoadStatus = 'loading' | 'ready' | 'missing' | 'error' | 'offline';
type ImageSlot = ArticleImageSlot;
type Strictness = ArticleValidationStrictness;

type FormKey = Exclude<
  keyof ArticleDraft,
  'status' | 'featured' | 'publishedAt' | 'authorAvatarUrl' | 'thumbnailUrl' | 'coverUrl'
>;

@Component({
  selector: 'app-article-editor',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    SharedModule,
    AppButton,
    ConfirmDialog,
    DatePickerModule,
    Editor,
    FieldError,
    IconField,
    InputIcon,
    InputText,
    LocaleSwitch,
    PageHeader,
    Select,
    StateView,
    Textarea,
    HasPermissionDirective,
  ],
  templateUrl: './article-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleEditor {
  private readonly api = inject(KnowledgeService);
  private readonly media = inject(MediaService);
  private readonly actions = inject(KnowledgeActions);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly network = inject(NetworkStatusService);
  private readonly fb = inject(FormBuilder);
  private readonly registerQuillFont = inject(QUILL_FONT_REGISTRAR);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  readonly id = input('');
  readonly mode: 'create' | 'edit' =
    this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create';

  readonly imageAccept = IMAGE_UPLOAD_ACCEPT;
  readonly status = signal<LoadStatus>(this.mode === 'edit' ? 'loading' : 'ready');
  readonly saving = signal(false);
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly article = signal<Article | null>(null);
  readonly categories = signal<ArticleCategory[]>([]);
  readonly slots = new LocalizedImageSlots<ImageSlot>(ARTICLE_IMAGE_SLOTS, () => this.locale());

  readonly flagged = signal<ReadonlySet<string>>(new Set());
  readonly quillReady = signal(false);
  readonly justSaved = signal(false);

  readonly keywordDraft = signal('');

  private readonly keywordRevision = signal(0);

  readonly form = this.fb.nonNullable.group({
    titleAr: '',
    titleEn: '',
    excerptAr: '',
    excerptEn: '',
    categoryId: '',
    readingMinutes: 5,
    publishedDate: '',
    authorNameAr: '',
    authorNameEn: '',
    slug: '',
    seoTitleAr: '',
    seoTitleEn: '',
    seoDescriptionAr: '',
    seoDescriptionEn: '',
    seoKeywordsAr: '',
    seoKeywordsEn: '',
    thumbnailTitleAr: '',
    thumbnailTitleEn: '',
    thumbnailAltAr: '',
    thumbnailAltEn: '',
    coverTitleAr: '',
    coverTitleEn: '',
    coverAltAr: '',
    coverAltEn: '',
    contentAr: '',
    contentEn: '',
  });

  private readonly slugText = toSignal(this.form.controls.slug.valueChanges, { initialValue: '' });
  private readonly slugChecked = signal(false);
  protected readonly slugInvalid = computed(
    () => this.slugChecked() && !isValidArticleSlug(this.slugText()),
  );

  readonly suffix = computed(() => (this.locale() === 'ar' ? 'Ar' : 'En'));
  readonly dir = computed(() => (this.locale() === 'ar' ? 'rtl' : 'ltr'));

  readonly title = computed(() =>
    this.ct(this.mode === 'edit' ? 'knowledge.edit' : 'knowledge.add'),
  );

  readonly categoryOptions = computed(() => {
    const locale = this.lang.language();
    const current = this.article()?.categoryId;
    return this.categories()
      .filter((item) => item.published || item.id === current)
      .map((item) => ({ value: item.id, label: categoryName(item, locale) }));
  });

  readonly readingOptions = computed(() => {
    const locale = this.locale();
    const current = Number(this.form.controls.readingMinutes.value) || 5;
    const base = [3, 5, 6, 8, 10, 12, 15, 20];
    const values = [...new Set([...base, current].filter((n) => n > 0))].sort((a, b) => a - b);
    const template =
      this.lang.lookup('knowledge.minutes', locale) ?? this.lang.t('knowledge.minutes');
    return values.map((value) => ({
      value,
      label: template.replace('{count}', `${value}`),
    }));
  });

  readonly keywordTags = computed(() => {
    this.locale();
    this.keywordRevision();
    return splitKeywords(String(this.form.get(this.key('seoKeywords'))?.value ?? ''));
  });

  constructor() {
    this.registerQuillFont().then(
      () => this.quillReady.set(true),
      () => this.quillReady.set(true),
    );

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.justSaved.set(false));

    this.api
      .listCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => this.categories.set(list));

    effect(() => {
      const id = this.id();
      if (this.mode === 'edit' && id) {
        untracked(() => this.load(id));
      }
    });
  }

  protected key(base: string): FormKey {
    return `${base}${this.suffix()}` as FormKey;
  }

  protected ct(key: string): string {
    return this.lang.lookup(key, this.locale()) ?? this.lang.t(key);
  }

  protected seoDescriptionLength(): number {
    return String(this.form.get(this.key('seoDescription'))?.value ?? '').length;
  }

  protected onKeywordDraft(event: Event): void {
    this.keywordDraft.set((event.target as HTMLInputElement).value);
  }

  protected onKeywordKey(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ',') {
      return;
    }
    event.preventDefault();
    this.commitKeyword(this.keywordDraft());
  }

  protected removeKeyword(tag: string): void {
    const next = this.keywordTags().filter((item) => item !== tag);
    this.writeKeywords(next);
  }

  private commitKeyword(raw: string): void {
    const tag = raw.replace(/[,،]/g, '').trim();
    if (!tag) {
      this.keywordDraft.set('');
      return;
    }
    const next = [...this.keywordTags()];
    if (!next.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      next.push(tag);
    }
    this.writeKeywords(next);
    this.keywordDraft.set('');
  }

  private writeKeywords(tags: readonly string[]): void {
    this.form.get(this.key('seoKeywords'))?.setValue(joinKeywords(tags, this.locale()));
    this.form.get(this.key('seoKeywords'))?.markAsDirty();
    this.keywordRevision.update((n) => n + 1);
  }

  protected showError(base: string): boolean {
    const name = this.key(base);
    return this.flagged().has(name) && !this.blank(name);
  }

  protected isInvalid(base: string): boolean {
    const name = this.key(base);
    return this.flagged().has(name) && this.blank(name);
  }

  protected setLocale(value: AppLanguage): void {
    this.locale.set(value);
    this.keywordDraft.set('');
    this.keywordRevision.update((n) => n + 1);
  }

  protected onEditorInit(event: EditorInitEvent, field: 'contentAr' | 'contentEn'): void {
    const quill = event.editor as AppQuill;
    quill.on?.('text-change', (_delta, _old, source) => {
      if (source !== 'user') {
        return;
      }
      const html = readQuillHtml(quill);
      this.form.controls[field].setValue(html === '<p><br></p>' ? '' : html, {
        emitModelToViewChange: false,
      });
    });
    wireQuillToolbarHandlers(quill, {
      uploadImage: (file) =>
        firstValueFrom(this.media.uploadEditorImage(file)).then((uploaded) => uploaded.url),
      onImageUploadError: () => {
        this.messages.add({
          severity: 'error',
          summary: this.lang.t('common.error'),
        });
      },
    });
    applyQuillDirection(quill, this.locale());
  }

  protected retry(): void {
    const id = this.id();
    if (this.mode === 'edit' && id) {
      this.load(id);
    }
  }

  protected cancel(): void {
    void this.router.navigate(['/knowledge']);
  }

  protected publish(): void {
    if (this.validate('strict')) {
      this.persist('published');
    }
  }

  protected async saveDraft(): Promise<void> {
    if (!this.validate('lenient')) {
      return;
    }
    if (await this.actions.confirmDraft(this.confirm())) {
      this.persist('draft');
    }
  }

  protected save(): void {
    if (this.justSaved()) {
      this.openEdit();
      return;
    }
    const status = this.article()?.status ?? 'draft';
    if (this.validate(status === 'published' ? 'strict' : 'lenient')) {
      this.persist(status);
    }
  }

  /** After a save the button reads "Edit article": go to the edit page of this article. */
  private openEdit(): void {
    const id = this.article()?.id ?? this.id();
    if (!id) {
      return;
    }
    const target = ['/knowledge', id, 'edit'];
    if (this.router.url.split('?')[0] === this.router.createUrlTree(target).toString()) {
      // Already on this edit page: reload the saved article so the form starts clean.
      this.justSaved.set(false);
      this.load(String(id));
      window.scrollTo({ top: 0 });
      return;
    }
    void this.router.navigate(target);
  }

  protected undo(): void {
    const current = this.article();
    if (current) {
      this.apply(current);
    }
  }

  protected async toggleFeatured(): Promise<void> {
    const current = this.article();
    if (!current) {
      return;
    }
    const next = await this.actions.toggleFeatured(current, this.confirm());
    if (next) {
      this.article.update((value) => (value ? { ...value, featured: next.featured } : value));
    }
  }

  protected async remove(): Promise<void> {
    const current = this.article();
    if (current && (await this.actions.remove(current, this.confirm()))) {
      void this.router.navigate(['/knowledge']);
    }
  }

  protected onPick(event: Event, slot: ImageSlot): void {
    const input = event.target as HTMLInputElement;
    this.take(slot, input.files?.[0]);
    input.value = '';
  }

  protected onDrop(event: DragEvent, slot: ImageSlot): void {
    event.preventDefault();
    this.take(slot, event.dataTransfer?.files?.[0]);
  }

  protected removeImage(slot: ImageSlot): void {
    this.slots.remove(slot);
  }

  protected imageOf(slot: ImageSlot): SlotImage | null {
    return this.slots.imageOf(slot);
  }

  protected errorOf(slot: ImageSlot): string {
    return this.slots.errorOf(slot);
  }

  protected size(file: SlotImage): string {
    return file.size ? formatFileSize(file.size) : '';
  }

  protected date(file: SlotImage): string {
    return formatIsoDate(file.date, this.lang.language());
  }

  private take(slot: ImageSlot, file: File | undefined): void {
    this.slots.take(slot, file);
  }

  private load(id: string): void {
    this.status.set('loading');
    this.api
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (article) => {
          if (!article) {
            this.status.set('missing');
            return;
          }
          this.apply(article);
          this.status.set('ready');
        },
        error: (error: unknown) => this.status.set(loadFailureStatus(error, this.network.online())),
      });
  }

  private apply(article: Article): void {
    this.article.set(article);
    this.flagged.set(new Set());
    this.form.reset(articleFormValueFromArticle(article));
    this.slots.reset(articleSlotMedia(article), article.createdAt);
    this.keywordDraft.set('');
    this.keywordRevision.update((n) => n + 1);
  }

  private validate(strictness: Strictness): boolean {
    const value = this.form.getRawValue();
    const result = collectArticleValidationIssues(
      {
        titleAr: value.titleAr,
        titleEn: value.titleEn,
        contentAr: value.contentAr,
        contentEn: value.contentEn,
        categoryId: value.categoryId,
      },
      strictness,
      this.suffix(),
      hasVisibleHtml,
    );
    this.flagged.set(result.missing);
    if (result.missing.size === 0) {
      this.slugChecked.set(true);
      if (!isValidArticleSlug(value.slug)) {
        this.messages.add({ severity: 'warn', summary: this.lang.t('knowledge.slugError') });
        return false;
      }
      return true;
    }
    if (result.switchTo) {
      this.locale.set(result.switchTo);
    }
    this.messages.add({ severity: 'warn', summary: this.lang.t('knowledge.required') });
    return false;
  }

  private persist(status: ArticleStatus): void {
    if (this.saving()) {
      return;
    }
    const fields = this.fieldsFromForm(status);
    const drafts = this.slots.draft();
    const media = { cover: drafts.cover, thumbnail: drafts.thumbnail, authorPhoto: drafts.avatar };
    const current = this.article();
    this.saving.set(true);
    const request =
      this.mode === 'edit' && current
        ? this.api.update(current.id, fields, media)
        : this.api.create(fields, media);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.saving.set(false);
        if (this.mode === 'edit') {
          this.messages.add({ severity: 'success', summary: this.lang.t('knowledge.saved') });
          void this.router.navigate(['/knowledge'], {
            state: { highlightedArticleId: saved.id },
          });
          return;
        }
        this.messages.add({
          severity: 'success',
          summary: this.lang.t(
            status === 'published' ? 'knowledge.created' : 'knowledge.draftSaved',
          ),
        });
        void this.router.navigate(['/knowledge']);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const reason =
          isApiError(error) && error.kind === 'validation' ? error.serverMessage : null;
        this.messages.add({ severity: 'error', summary: reason || this.lang.t('common.error') });
      },
    });
  }

  private fieldsFromForm(status: ArticleStatus): ArticleDraft {
    return fieldsFromArticleForm(this.form.getRawValue(), status, {
      previousPublishedAt: this.article()?.publishedAt ?? '',
      featured: this.article()?.featured ?? false,
    });
  }

  private blank(name: FormKey): boolean {
    const value = this.form.controls[name].value;
    if (name === 'contentAr' || name === 'contentEn') {
      return !hasVisibleHtml(`${value}`);
    }
    return `${value}`.trim() === '';
  }
}
