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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { FieldError } from '../../../../shared/components/field-error/field-error';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { formatIsoDate } from '../../../../shared/utils/date';
import { formatFileSize } from '../../../../shared/utils/file-size';
import { IMAGE_UPLOAD_ACCEPT, parseUploadedImage } from '../../../../shared/utils/image-upload';
import {
  LEGAL_QUILL_FONT_REGISTRAR,
  applyQuillDirection,
  hasVisibleHtml,
  wireLegalToolbarHandlers,
  type LegalQuill,
} from '../../../sections/components/legal-document-board/legal-quill';
import {
  blankArticle,
  type Article,
  type ArticleCategory,
  type ArticleDraft,
  type ArticleStatus,
} from '../../models/knowledge.model';
import { KnowledgeActions } from '../../services/knowledge-actions.service';
import { KnowledgeService } from '../../services/knowledge.service';
import {
  categoryName,
  joinKeywords,
  nowStamp,
  splitKeywords,
} from '../../utils/knowledge-format';

type LoadStatus = 'loading' | 'ready' | 'missing' | 'error';
type ImageSlot = 'avatar' | 'thumbnail' | 'cover';
type Strictness = 'strict' | 'lenient';

interface SlotImage {
  url: string;
  name: string;
  size: number;
  /** ISO date, already shown through `formatIsoDate`. */
  date: string;
}

/** Fields the user edits as text. Images and status live outside the form. */
type FormKey = Exclude<
  keyof ArticleDraft,
  'status' | 'featured' | 'publishedAt' | 'authorAvatarUrl' | 'thumbnailUrl' | 'coverUrl'
>;

const EMPTY_IMAGES: Record<ImageSlot, SlotImage | null> = {
  avatar: null,
  thumbnail: null,
  cover: null,
};

/**
 * Create / edit article page. One form holds both languages. The locale switch only chooses
 * which side of every bilingual field is shown, and each language has its own Quill instance.
 */
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
  ],
  templateUrl: './article-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleEditor {
  private readonly api = inject(KnowledgeService);
  private readonly actions = inject(KnowledgeActions);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly registerQuillFont = inject(LEGAL_QUILL_FONT_REGISTRAR);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  /** Bound from `/knowledge/:id/edit`. Empty while creating. */
  readonly id = input('');
  readonly mode: 'create' | 'edit' =
    this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create';

  readonly imageAccept = IMAGE_UPLOAD_ACCEPT;
  readonly status = signal<LoadStatus>(this.mode === 'edit' ? 'loading' : 'ready');
  readonly saving = signal(false);
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly article = signal<Article | null>(null);
  readonly categories = signal<ArticleCategory[]>([]);
  readonly images = signal<Record<ImageSlot, SlotImage | null>>({ ...EMPTY_IMAGES });
  readonly imageErrors = signal<Partial<Record<ImageSlot, string>>>({});
  /** Control names flagged by the last failed validation. Cleared per field as it is filled. */
  readonly flagged = signal<ReadonlySet<string>>(new Set());
  readonly quillReady = signal(false);
  /** In-progress text for the SEO keyword chip input. */
  readonly keywordDraft = signal('');
  /** Bumped when keyword chips are rewritten so the template recomputes. */
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

  readonly suffix = computed(() => (this.locale() === 'ar' ? 'Ar' : 'En'));
  readonly dir = computed(() => (this.locale() === 'ar' ? 'rtl' : 'ltr'));

  readonly title = computed(() => {
    this.lang.language();
    return this.lang.t(this.mode === 'edit' ? 'knowledge.edit' : 'knowledge.add');
  });

  readonly categoryOptions = computed(() => {
    const locale = this.lang.language();
    const current = this.article()?.categoryId;
    return this.categories()
      .filter((item) => item.published || item.id === current)
      .map((item) => ({ value: item.id, label: categoryName(item, locale) }));
  });

  /** Figma reading-time dropdown; values stay as `readingMinutes` numbers. */
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

  /** `title` → `titleAr` / `titleEn`, following the locale switch. */
  protected key(base: string): FormKey {
    return `${base}${this.suffix()}` as FormKey;
  }

  /**
   * Field chrome (labels / placeholders) follows the content locale switch,
   * so Arabic ↔ English actually changes the visible form text.
   */
  protected ct(key: string): string {
    return this.lang.lookup(key, this.locale()) ?? this.lang.t(key);
  }

  /** Figma meta-description counter (`0/160`); presentation-only. */
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

  protected onEditorInit(event: EditorInitEvent): void {
    const quill = event.editor as LegalQuill;
    wireLegalToolbarHandlers(quill);
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

  // ----- Create actions -----------------------------------------------------------------

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

  // ----- Edit actions -------------------------------------------------------------------

  protected save(): void {
    const status = this.article()?.status ?? 'draft';
    if (this.validate(status === 'published' ? 'strict' : 'lenient')) {
      this.persist(status);
    }
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

  // ----- Images -------------------------------------------------------------------------

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
    this.setImage(slot, null);
    this.imageErrors.update((errors) => ({ ...errors, [slot]: '' }));
  }

  protected imageOf(slot: ImageSlot): SlotImage | null {
    return this.images()[slot];
  }

  protected errorOf(slot: ImageSlot): string {
    return this.imageErrors()[slot] ?? '';
  }

  protected size(file: SlotImage): string {
    return file.size ? formatFileSize(file.size) : '';
  }

  protected date(file: SlotImage): string {
    return formatIsoDate(file.date, this.lang.language());
  }

  // ----- Internals ----------------------------------------------------------------------

  private take(slot: ImageSlot, file: File | undefined): void {
    const parsed = parseUploadedImage(file);
    if (!parsed || !file) {
      return;
    }
    if (!parsed.ok) {
      this.imageErrors.update((errors) => ({ ...errors, [slot]: parsed.errorKey }));
      return;
    }
    this.imageErrors.update((errors) => ({ ...errors, [slot]: '' }));
    this.setImage(slot, {
      url: URL.createObjectURL(file),
      name: parsed.image.name,
      size: parsed.image.size,
      date: parsed.image.uploadedAt,
    });
  }

  private setImage(slot: ImageSlot, image: SlotImage | null): void {
    this.images.update((current) => ({ ...current, [slot]: image }));
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
        error: () => this.status.set('error'),
      });
  }

  private apply(article: Article): void {
    this.article.set(article);
    this.flagged.set(new Set());
    this.imageErrors.set({});
    this.form.reset({
      titleAr: article.titleAr,
      titleEn: article.titleEn,
      excerptAr: article.excerptAr,
      excerptEn: article.excerptEn,
      categoryId: article.categoryId,
      readingMinutes: article.readingMinutes,
      publishedDate: article.publishedAt.slice(0, 10),
      authorNameAr: article.authorNameAr,
      authorNameEn: article.authorNameEn,
      slug: article.slug,
      seoTitleAr: article.seoTitleAr,
      seoTitleEn: article.seoTitleEn,
      seoDescriptionAr: article.seoDescriptionAr,
      seoDescriptionEn: article.seoDescriptionEn,
      seoKeywordsAr: article.seoKeywordsAr,
      seoKeywordsEn: article.seoKeywordsEn,
      thumbnailTitleAr: article.thumbnailTitleAr,
      thumbnailTitleEn: article.thumbnailTitleEn,
      thumbnailAltAr: article.thumbnailAltAr,
      thumbnailAltEn: article.thumbnailAltEn,
      coverTitleAr: article.coverTitleAr,
      coverTitleEn: article.coverTitleEn,
      coverAltAr: article.coverAltAr,
      coverAltEn: article.coverAltEn,
      contentAr: article.contentAr,
      contentEn: article.contentEn,
    });
    this.images.set({
      avatar: this.slotFrom(article.authorAvatarUrl, article.createdAt),
      thumbnail: this.slotFrom(article.thumbnailUrl, article.createdAt),
      cover: this.slotFrom(article.coverUrl, article.createdAt),
    });
    this.keywordDraft.set('');
    this.keywordRevision.update((n) => n + 1);
  }

  private slotFrom(url: string, date: string): SlotImage | null {
    return url ? { url, name: url.split('/').pop() ?? url, size: 0, date } : null;
  }

  /**
   * Flags what is missing and, when the visible language is fine but the other one is not,
   * switches to the other language so the user lands on the problem.
   */
  private validate(strictness: Strictness): boolean {
    const missing = new Set<string>();
    const value = this.form.getRawValue();

    if (strictness === 'strict') {
      for (const suffix of ['Ar', 'En'] as const) {
        if (!value[`title${suffix}`].trim()) {
          missing.add(`title${suffix}`);
        }
        if (!hasVisibleHtml(value[`content${suffix}`])) {
          missing.add(`content${suffix}`);
        }
      }
      if (!value.categoryId) {
        missing.add('categoryId');
      }
    } else if (!value.titleAr.trim() && !value.titleEn.trim()) {
      missing.add(this.key('title'));
    }

    this.flagged.set(missing);
    if (missing.size === 0) {
      return true;
    }
    const here = this.suffix();
    const hereHasIssue = [...missing].some((name) => name.endsWith(here) || name === 'categoryId');
    if (!hereHasIssue) {
      this.locale.set(here === 'Ar' ? 'en' : 'ar');
    }
    this.messages.add({ severity: 'warn', summary: this.lang.t('knowledge.required') });
    return false;
  }

  private persist(status: ArticleStatus): void {
    if (this.saving()) {
      return;
    }
    const fields = this.fieldsFromForm(status);
    const current = this.article();
    this.saving.set(true);
    const request =
      this.mode === 'edit' && current
        ? this.api.update({ ...current, ...fields })
        : this.api.create({ ...blankArticle(), ...fields });
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.saving.set(false);
        if (this.mode === 'edit') {
          this.apply(saved);
          this.messages.add({ severity: 'success', summary: this.lang.t('knowledge.saved') });
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
      error: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
      },
    });
  }

  private fieldsFromForm(status: ArticleStatus): ArticleDraft {
    const raw = this.form.getRawValue();
    const images = this.images();
    const now = nowStamp();
    const time = this.article()?.publishedAt.slice(11, 16) || now.slice(11, 16);
    const { publishedDate, ...text } = raw;
    return {
      ...blankArticle(),
      ...this.article(),
      ...text,
      titleAr: text.titleAr.trim(),
      titleEn: text.titleEn.trim(),
      readingMinutes: Math.max(1, Math.round(Number(text.readingMinutes) || 1)),
      status,
      publishedAt: `${publishedDate || now.slice(0, 10)}T${time}`,
      authorAvatarUrl: images.avatar?.url ?? '',
      thumbnailUrl: images.thumbnail?.url ?? '',
      coverUrl: images.cover?.url ?? '',
    };
  }

  private blank(name: FormKey): boolean {
    const value = this.form.controls[name].value;
    if (name === 'contentAr' || name === 'contentEn') {
      return !hasVisibleHtml(`${value}`);
    }
    return `${value}`.trim() === '';
  }
}
