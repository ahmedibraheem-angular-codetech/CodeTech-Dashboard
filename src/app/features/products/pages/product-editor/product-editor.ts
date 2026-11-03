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
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, finalize, map, of, switchMap } from 'rxjs';

import type { AppLanguage } from '../../../../core/i18n/translations';
import { LanguageService } from '../../../../core/services/language.service';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import {
  EditorShell,
  type EditorShellLabels,
} from '../../../../shared/components/editor-shell/editor-shell';
import {
  FaqStep,
  IdentityStep,
  InfoStep,
  OfferStep,
  SeoStep,
  SectorsStep,
  ToolsStep,
  UnitsStep,
} from './steps/product-steps';
import { IDENTITY_STEP_INDEX, PRODUCT_STEPS, SEO_STEP_INDEX } from '../../constants/product-steps';
import {
  PRODUCT_META_KEYWORD_MAX,
  PRODUCT_SEO_DESCRIPTION_MAX,
  PRODUCT_SHORT_DESCRIPTION_MAX,
} from '../../constants/product-limits';
import {
  blankProduct,
  readLocale,
  type LocaleText,
  type Product,
} from '../../models/product.model';
import {
  draftAddFaq,
  draftAddMedia,
  draftAddPoint,
  draftAddSector,
  draftAddStat,
  draftAddUnit,
  draftAddUnitPoint,
  draftClearSectorImage,
  draftRemoveFaq,
  draftRemoveMedia,
  draftRemovePoint,
  draftRemoveSector,
  draftRemoveStat,
  draftRemoveUnit,
  draftRemoveUnitPoint,
  draftSetCover,
  draftSetCoverText,
  draftSetFaq,
  draftSetLocaleField,
  draftSetMediaImage,
  draftSetMediaText,
  draftSetPointField,
  draftSetPointImage,
  draftSetSectorImage,
  draftSetSeo,
  draftSetSolutionField,
  draftSetSolutionImage,
  draftSetStat,
  draftSetStatImage,
  draftSetUnit,
  draftSetUnitImage,
  draftSetUnitPoint,
  draftSetUnitPointImage,
  type ProductMediaList,
  type ProductPointList,
} from '../../utils/product-draft';
import {
  clearServerErrorPaths,
  clearServerErrorPrefix,
  faqAnswerErrorMessage,
  faqQuestionErrorMessage,
  highlightTitleErrorMessage,
  identityTitleErrorMessage,
  integrationImageErrorMessage,
  isSectorArabicImageInvalid,
  keywordsErrorMessage,
  localeFromServerPath,
  nameErrorMessage,
  pointTitleBodyErrorMessage,
  productStepIndexForServerPath,
  sectorImageErrorMessage,
  serverErrorMessage,
  serverErrorPrefixMessage,
  slugErrorMessage,
  statTitleErrorMessage,
  statValueErrorMessage,
  summaryErrorMessage,
  toolTitleBodyErrorMessage,
  unitTitleErrorMessage,
  workflowStepBodyErrorMessage,
  workflowStepTitleErrorMessage,
} from '../../utils/product-errors';
import {
  isValidMetaKeywords,
  isValidProductSlug,
  isValidShortDescription,
  longestProductKeywordLength,
} from '../../utils/product-field-rules';
import {
  firstRepeaterValidationIssue,
  isWorkflowStepArabicValid,
  productRepeatersValid,
} from '../../utils/product-repeater-validation';
import { isApiError, loadFailureStatus, type FieldErrors } from '../../../../core/http/api-error';
import { ObjectUrls } from '../../../../shared/components/product-upload/object-urls';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-editor',
  imports: [
    EditorShell,
    InfoStep,
    SectorsStep,
    OfferStep,
    ToolsStep,
    UnitsStep,
    IdentityStep,
    FaqStep,
    SeoStep,
  ],
  templateUrl: './product-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEditor {
  private readonly api = inject(ProductsService);
  private readonly objectUrls = inject(ObjectUrls);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly network = inject(NetworkStatusService);
  readonly lang = inject(LanguageService);

  readonly id = input('');
  readonly steps = PRODUCT_STEPS;
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly step = signal(0);

  readonly passed = signal(-1);
  readonly draft = signal<Product>(blankProduct());
  readonly status = signal<'loading' | 'ready' | 'missing' | 'error' | 'offline'>(
    this.route.snapshot.data['mode'] === 'edit' ? 'loading' : 'ready',
  );
  readonly saving = signal(false);
  readonly nameError = signal(false);
  readonly slugInvalid = computed(
    () => !isValidProductSlug(readLocale(this.draft().seo.slug, this.locale())),
  );
  readonly summaryMax = PRODUCT_SHORT_DESCRIPTION_MAX;
  readonly descriptionMax = PRODUCT_SEO_DESCRIPTION_MAX;
  readonly summaryInvalid = computed(
    () => !isValidShortDescription(readLocale(this.draft().summary, this.locale())),
  );
  readonly keywordsMax = PRODUCT_META_KEYWORD_MAX;
  readonly keywordsLongest = computed(() =>
    longestProductKeywordLength(readLocale(this.draft().seo.keywords, this.locale())),
  );
  readonly keywordsInvalid = computed(
    () => !isValidMetaKeywords(readLocale(this.draft().seo.keywords, this.locale())),
  );
  readonly serverErrors = signal<FieldErrors>({});
  private readonly reload = signal(0);

  readonly mode = toSignal(
    this.route.data.pipe(map((data) => (data['mode'] === 'edit' ? 'edit' : 'create'))),
    { initialValue: this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create' },
  );
  readonly stepId = computed(() => PRODUCT_STEPS[this.step()].id);
  readonly wizardSteps = computed(() =>
    this.steps.map((item) => ({
      id: item.id,
      label: this.lang.t(item.labelKey),
      labelKey: item.labelKey,
    })),
  );
  readonly shellLabels = computed<EditorShellLabels>(() => ({
    saveDraft: this.lang.t('product.saveDraft'),
    publish: this.lang.t('product.publish'),
    unpublish: this.lang.t('product.unpublish'),
    save: this.lang.t('common.save'),
    next: this.lang.t('product.next'),
    previous: this.lang.t('product.previous'),
    finish: this.lang.t('product.finish'),
    loading: this.lang.t('common.loading'),
    missing: this.lang.t('product.notFound'),
    error: this.lang.t('common.error'),
  }));
  readonly lastStep = computed(() => this.step() === PRODUCT_STEPS.length - 1);

  private readonly editRequest = computed(() =>
    this.mode() === 'edit' && this.id() ? { id: this.id(), reload: this.reload() } : null,
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.objectUrls.abandon(this.draft()));

    effect(() => {
      const editing = this.mode() === 'edit' && this.id();
      untracked(() => {
        if (editing) {
          return;
        }
        this.status.set('ready');
        this.draft.set(blankProduct());
        this.step.set(0);
        this.passed.set(-1);
        this.nameError.set(false);
      });
    });

    toObservable(this.editRequest)
      .pipe(
        switchMap((request) => {
          if (!request) {
            return of(null);
          }
          this.status.set('loading');
          return this.api.get(request.id).pipe(
            map((product) => ({ failed: false as const, product })),
            catchError((error: unknown) => of({ failed: true as const, product: null, error })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (!result) {
          return;
        }
        if (result.failed) {
          this.status.set(loadFailureStatus(result.error, this.network.online()));
          return;
        }
        if (!result.product) {
          this.status.set('missing');
          return;
        }
        this.draft.set(result.product);
        this.step.set(0);
        this.passed.set(-1);
        this.nameError.set(false);
        this.status.set('ready');
      });
  }

  text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }

  copy(key: string): string {
    return this.lang.lookup(key, this.locale()) ?? key;
  }

  useLocale(language: AppLanguage): void {
    this.locale.set(language);
  }

  unitName(index: number): string {
    return `${this.copy('product.unitItem')} ${this.ordinal('product.unitOrder', index)}`;
  }

  stepName(index: number): string {
    return `${this.copy('product.stepItem')} ${this.ordinal('product.stepOrder', index)}`;
  }

  private ordinal(prefix: 'product.unitOrder' | 'product.stepOrder', index: number): string {
    return this.lang.lookup(`${prefix}.${index + 1}`, this.locale()) ?? `${index + 1}`;
  }

  retry(): void {
    if (this.mode() === 'edit' && this.id()) {
      this.reload.update((value) => value + 1);
    }
  }

  select(index: number | undefined): void {
    if (this.saving() || index === undefined || (this.mode() === 'create' && index > this.step())) {
      return;
    }
    if (!this.canLeaveEditorStep(index)) {
      return;
    }
    this.step.set(index);
  }

  next(): void {
    if (this.saving() || this.lastStep()) {
      return;
    }
    if (this.mode() === 'create' && this.step() === 0 && !this.namesValid()) {
      this.nameError.set(true);
      return;
    }
    if (!this.canLeaveEditorStep(this.step() + 1)) {
      return;
    }
    const leaving = this.step();
    this.passed.update((current) => Math.max(current, leaving));
    this.step.set(leaving + 1);
  }

  previous(): void {
    if (this.saving()) {
      return;
    }
    if (this.step() === 0) {
      void this.router.navigate(['/products']);
      return;
    }
    if (!this.canLeaveEditorStep(this.step() - 1)) {
      return;
    }
    this.step.update((current) => current - 1);
  }

  saveDraft(): void {
    this.persist(false, 'product.draftSaved', false);
  }

  finish(): void {
    if (this.mode() === 'edit') {
      this.persist(this.draft().published, 'product.saved', true);
      return;
    }
    this.persist(true, 'product.saved', true);
  }

  updatePublished(published: boolean): void {
    this.persist(published, published ? 'product.saved' : 'product.draftSaved', false);
  }

  setField(key: 'name' | 'summary', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) => draftSetLocaleField(current, key, language, value));
    if (key === 'name') {
      this.nameError.set(false);
      this.dropServerErrors(`title.${language}`);
    }
    if (key === 'summary') {
      this.dropServerErrors(`short_description.${language}`, `description.${language}`);
    }
  }

  setPoint(list: ProductPointList, index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) =>
      draftSetPointField(current, list, index, field, language, value),
    );
    const apiField = field === 'body' ? 'short_description' : 'title';
    if (list === 'steps') {
      this.dropServerErrors(`workflow_steps.${index}.${apiField}.${language}`);
    } else if (list === 'challenges' || list === 'features') {
      this.dropServerErrors(`${list}.${index}.${apiField}.${language}`);
    }
  }

  addPoint(list: ProductPointList): void {
    this.draft.update((current) => draftAddPoint(current, list));
  }

  removePoint(list: ProductPointList, index: number): void {
    this.draft.update((current) => draftRemovePoint(current, list, index));
  }

  setPointImage(list: ProductPointList, index: number, file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetPointImage(current, list, index, language, file));
  }

  setMediaText(list: ProductMediaList, index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) => draftSetMediaText(current, list, index, field, language, value));
  }

  setMediaImage(list: ProductMediaList, index: number, file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetMediaImage(current, list, index, language, file));
  }

  addMedia(list: ProductMediaList): void {
    this.draft.update((current) => draftAddMedia(current, list));
  }

  removeMedia(list: ProductMediaList, index: number): void {
    this.draft.update((current) => draftRemoveMedia(current, list, index));
  }

  addSector(): void {
    this.draft.update((current) => draftAddSector(current));
  }

  removeSector(index: number): void {
    this.draft.update((current) => draftRemoveSector(current, index));
  }

  setSectorImage(
    index: number,
    file: { name: string; url: string },
    language: AppLanguage = this.locale(),
  ): void {
    this.draft.update((current) => draftSetSectorImage(current, index, language, file));
    this.dropServerErrors(`sectors.${index}.image.${language}`);
  }

  clearSectorImage(index: number, language: AppLanguage = this.locale()): void {
    this.draft.update((current) => draftClearSectorImage(current, index, language));
    this.dropServerErrors(`sectors.${index}.image.${language}`);
  }

  sectorArabicImageInvalid(index: number): boolean {
    return isSectorArabicImageInvalid(this.draft(), index);
  }

  sectorImageError(index: number): string {
    return sectorImageErrorMessage(this.draft(), index, this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  workflowStepTitleError(index: number): string {
    return workflowStepTitleErrorMessage(
      this.draft(),
      index,
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  workflowStepBodyError(index: number): string {
    return workflowStepBodyErrorMessage(
      this.draft(),
      index,
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  featureTitleError(index: number): string {
    return pointTitleBodyErrorMessage(
      this.draft(),
      'features',
      index,
      'title',
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  featureBodyError(index: number): string {
    return pointTitleBodyErrorMessage(
      this.draft(),
      'features',
      index,
      'body',
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  challengeTitleError(index: number): string {
    return pointTitleBodyErrorMessage(
      this.draft(),
      'challenges',
      index,
      'title',
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  challengeBodyError(index: number): string {
    return pointTitleBodyErrorMessage(
      this.draft(),
      'challenges',
      index,
      'body',
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  offerTitleError(index: number): string {
    return pointTitleBodyErrorMessage(
      this.draft(),
      'offer',
      index,
      'title',
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  offerBodyError(index: number): string {
    return pointTitleBodyErrorMessage(
      this.draft(),
      'offer',
      index,
      'body',
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  resultTitleError(index: number): string {
    return pointTitleBodyErrorMessage(
      this.draft(),
      'results',
      index,
      'title',
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  resultBodyError(index: number): string {
    return pointTitleBodyErrorMessage(
      this.draft(),
      'results',
      index,
      'body',
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  toolTitleError(index: number): string {
    return toolTitleBodyErrorMessage(
      this.draft(),
      index,
      'title',
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  toolBodyError(index: number): string {
    return toolTitleBodyErrorMessage(
      this.draft(),
      index,
      'body',
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  integrationImageError(index: number): string {
    return integrationImageErrorMessage(this.draft(), index, this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  unitTitleError(index: number): string {
    return unitTitleErrorMessage(this.draft(), index, this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  identityTitleError(index: number): string {
    return identityTitleErrorMessage(
      this.draft(),
      index,
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  highlightTitleError(index: number): string {
    return highlightTitleErrorMessage(
      this.draft(),
      index,
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  faqQuestionError(index: number): string {
    return faqQuestionErrorMessage(this.draft(), index, this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  faqAnswerError(index: number): string {
    return faqAnswerErrorMessage(this.draft(), index, this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  statTitleError(index: number): string {
    return statTitleErrorMessage(this.draft(), index, this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  statValueError(index: number): string {
    return statValueErrorMessage(this.draft(), index, this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  slugErrorText(): string {
    return slugErrorMessage(this.slugInvalid(), this.serverErrors(), (key) => this.copy(key));
  }

  summaryErrorText(): string {
    return summaryErrorMessage(this.summaryInvalid(), this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  keywordsErrorText(): string {
    return keywordsErrorMessage(this.keywordsInvalid(), this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  nameErrorText(): string {
    return nameErrorMessage(this.nameError(), this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  serverField(path: string): string {
    return serverErrorMessage(this.serverErrors(), path);
  }

  serverFieldPrefix(prefix: string): string {
    return serverErrorPrefixMessage(this.serverErrors(), prefix);
  }

  setSingle(_key: 'solution', field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) => draftSetSolutionField(current, field, language, value));
  }

  setSingleImage(_key: 'solution', file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetSolutionImage(current, language, file));
  }

  setCover(kind: 'cover' | 'thumb', file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetCover(current, kind, language, file));
  }

  setCoverText(key: 'coverTitle' | 'coverAlt' | 'thumbTitle' | 'thumbAlt', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) => draftSetCoverText(current, key, language, value));
  }

  setStat(index: number, field: 'value' | 'label' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    if (field === 'value') {
      this.dropServerErrors(`stats.${index}.value.${language}`);
    } else if (field === 'label') {
      this.dropServerErrors(`stats.${index}.title.${language}`);
    }
    this.draft.update((current) => draftSetStat(current, index, field, language, value));
  }

  setStatImage(index: number, file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetStatImage(current, index, language, file));
  }

  addStat(): void {
    this.draft.update((current) => draftAddStat(current));
  }

  removeStat(index: number): void {
    this.draft.update((current) => draftRemoveStat(current, index));
  }

  setUnit(index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) => draftSetUnit(current, index, field, language, value));
  }

  setUnitImage(index: number, file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetUnitImage(current, index, language, file));
  }

  setUnitPoint(unitIndex: number, pointIndex: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) =>
      draftSetUnitPoint(current, unitIndex, pointIndex, field, language, value),
    );
  }

  setUnitPointImage(
    unitIndex: number,
    pointIndex: number,
    file: { name: string; url: string },
  ): void {
    const language = this.locale();
    this.draft.update((current) =>
      draftSetUnitPointImage(current, unitIndex, pointIndex, language, file),
    );
  }

  addUnit(): void {
    this.draft.update((current) => draftAddUnit(current));
  }

  removeUnit(index: number): void {
    this.draft.update((current) => draftRemoveUnit(current, index));
  }

  removeUnitPoint(unitIndex: number, pointIndex: number): void {
    this.draft.update((current) => draftRemoveUnitPoint(current, unitIndex, pointIndex));
  }

  addUnitPoint(unitIndex: number): void {
    this.draft.update((current) => draftAddUnitPoint(current, unitIndex));
  }

  setFaq(index: number, field: 'question' | 'answer', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) => draftSetFaq(current, index, field, language, value));
  }

  addFaq(): void {
    this.draft.update((current) => draftAddFaq(current));
  }

  removeFaq(index: number): void {
    this.draft.update((current) => draftRemoveFaq(current, index));
  }

  setSeo(field: keyof Product['seo'], event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) => draftSetSeo(current, field, language, value));
    if (field === 'slug') {
      this.dropServerErrors('slug');
    } else if (field === 'keywords') {
      this.dropServerErrorPrefix(`meta_keywords.${language}`);
    } else if (field === 'title') {
      this.dropServerErrors(`meta_title.${language}`);
    } else if (field === 'description') {
      this.dropServerErrors(`meta_description.${language}`);
    }
  }

  private persist(
    published: boolean,
    message: 'product.saved' | 'product.draftSaved',
    leave: boolean,
  ): void {
    if (this.saving() || this.status() !== 'ready') {
      return;
    }
    const previous = this.draft();
    const current = { ...previous, published };
    if (published && !this.namesValid()) {
      this.nameError.set(true);
      this.step.set(0);
      return;
    }
    if (!this.summaryLocalesValid()) {
      this.focusInvalidSummaryLocale();
      this.step.set(0);
      return;
    }
    if (!this.productRepeatersValid()) {
      this.focusRepeaterValidation();
      return;
    }
    if (!this.seoStepValid()) {
      this.focusInvalidSeoLocale();
      this.step.set(SEO_STEP_INDEX);
      return;
    }
    this.saving.set(true);
    this.api
      .save(current)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.objectUrls.sync(previous, saved);
          this.draft.set(saved);
          this.nameError.set(false);
          this.serverErrors.set({});
          this.messages.add({ severity: 'success', summary: this.lang.t(message) });
          if (leave) {
            void this.router.navigate(['/products']);
          }
        },
        error: (error: unknown) => {
          if (isApiError(error) && error.kind === 'validation') {
            this.applyServerErrors(error.fieldErrors);
            if (Object.keys(error.fieldErrors).length === 0) {
              this.messages.add({
                severity: 'error',
                summary: error.serverMessage ?? this.lang.t('common.error'),
              });
            }
            return;
          }
          this.messages.add({
            severity: 'error',
            summary:
              isApiError(error) && error.serverMessage
                ? error.serverMessage
                : this.lang.t('common.error'),
          });
        },
      });
  }

  private applyServerErrors(fieldErrors: FieldErrors): void {
    this.serverErrors.set(fieldErrors);
    const firstPath = Object.keys(fieldErrors)[0];
    if (!firstPath) {
      return;
    }
    const language = localeFromServerPath(firstPath);
    if (language) {
      this.useLocale(language);
    }
    const stepIndex = productStepIndexForServerPath(firstPath);
    if (stepIndex >= 0) {
      this.step.set(stepIndex);
    }
  }

  private dropServerErrors(...paths: string[]): void {
    if (paths.length === 0 || Object.keys(this.serverErrors()).length === 0) {
      return;
    }
    this.serverErrors.update((current) => clearServerErrorPaths(current, paths));
  }

  private dropServerErrorPrefix(prefix: string): void {
    if (Object.keys(this.serverErrors()).length === 0) {
      return;
    }
    this.serverErrors.update((current) => clearServerErrorPrefix(current, prefix));
  }

  private namesValid(): boolean {
    const { name } = this.draft();
    return name.ar.trim().length > 0 && name.en.trim().length > 0;
  }

  private summaryLocalesValid(): boolean {
    const { summary } = this.draft();
    return isValidShortDescription(summary.ar) && isValidShortDescription(summary.en);
  }

  private focusInvalidSummaryLocale(): void {
    const { summary } = this.draft();
    if (!isValidShortDescription(summary.ar)) {
      this.useLocale('ar');
      return;
    }
    if (!isValidShortDescription(summary.en)) {
      this.useLocale('en');
    }
  }

  private productRepeatersValid(): boolean {
    return productRepeatersValid(this.draft());
  }

  private workflowStepsValid(): boolean {
    return this.draft().steps.every((step) => isWorkflowStepArabicValid(step));
  }

  private focusRepeaterValidation(): void {
    const issue = firstRepeaterValidationIssue(this.draft());
    if (!issue) {
      return;
    }
    if (issue.preferAr) {
      this.useLocale('ar');
    }
    this.step.set(issue.step);
  }

  private canLeaveEditorStep(target: number): boolean {
    return this.canLeaveWorkflowSteps(target) && this.canLeaveSeoStep(target);
  }

  private canLeaveWorkflowSteps(target: number): boolean {
    if (this.step() !== IDENTITY_STEP_INDEX || target === IDENTITY_STEP_INDEX) {
      return true;
    }
    if (this.workflowStepsValid()) {
      return true;
    }
    this.useLocale('ar');
    return false;
  }

  private canLeaveSeoStep(target: number): boolean {
    if (this.step() !== SEO_STEP_INDEX || target === SEO_STEP_INDEX) {
      return true;
    }
    if (this.seoStepValid()) {
      return true;
    }
    this.focusInvalidSeoLocale();
    return false;
  }

  private seoStepValid(): boolean {
    return this.slugLocalesValid() && this.metaKeywordsLocalesValid();
  }

  private slugLocalesValid(): boolean {
    const { slug } = this.draft().seo;
    return isValidProductSlug(slug.ar) && isValidProductSlug(slug.en);
  }

  private metaKeywordsLocalesValid(): boolean {
    const { keywords } = this.draft().seo;
    return isValidMetaKeywords(keywords.ar) && isValidMetaKeywords(keywords.en);
  }

  private focusInvalidSeoLocale(): void {
    const { slug, keywords } = this.draft().seo;
    if (!isValidProductSlug(slug.ar)) {
      this.useLocale('ar');
      return;
    }
    if (!isValidProductSlug(slug.en)) {
      this.useLocale('en');
      return;
    }
    if (!isValidMetaKeywords(keywords.ar)) {
      this.useLocale('ar');
      return;
    }
    if (!isValidMetaKeywords(keywords.en)) {
      this.useLocale('en');
    }
  }

  private read(event: Event): string | undefined {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return undefined;
  }
}
