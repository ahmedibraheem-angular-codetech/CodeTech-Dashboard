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

import { isApiError, loadFailureStatus, type FieldErrors } from '../../../../core/http/api-error';
import type { AppLanguage } from '../../../../core/i18n/translations';
import { LanguageService } from '../../../../core/services/language.service';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import {
  EditorShell,
  type EditorShellLabels,
} from '../../../../shared/components/editor-shell/editor-shell';
import { ObjectUrls } from '../../../../shared/components/product-upload/object-urls';
import {
  PROJECT_META_KEYWORD_MAX,
  PROJECT_SEO_DESCRIPTION_MAX,
  PROJECT_SUMMARY_MAX,
} from '../../constants/project-limits';
import { PROJECT_STEPS, SEO_STEP_INDEX } from '../../constants/project-steps';
import {
  blankProject,
  readLocale,
  type LocaleText,
  type Project,
} from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';
import {
  draftAddGallery,
  draftAddIdentityButton,
  draftAddMedia,
  draftAddPoint,
  draftClearCover,
  draftClearGalleryImage,
  draftClearIdentityButtonImage,
  draftClearMediaImage,
  draftClearPointImage,
  draftClearSolutionsImage,
  draftRemoveGallery,
  draftRemoveIdentityButton,
  draftRemoveMedia,
  draftRemovePoint,
  draftSetCover,
  draftSetCoverText,
  draftSetGalleryImage,
  draftSetIdentityButtonImage,
  draftSetIdentityButtonText,
  draftSetLocaleField,
  draftSetMediaImage,
  draftSetPointField,
  draftSetPointImage,
  draftSetSeo,
  draftSetSolutionsImage,
  draftSetSolutionsImageText,
  type ProjectMediaList,
  type ProjectPointList,
} from '../../utils/project-draft';
import {
  clearServerErrorPaths,
  clearServerErrorPrefix,
  firstFieldErrorMessage,
  identityBodyErrorMessage,
  identityTitleErrorMessage,
  keywordsErrorMessage,
  localeFromServerPath,
  nameErrorMessage,
  pointTitleBodyErrorMessage,
  projectStepIndexForServerPath,
  slugErrorMessage,
  summaryErrorMessage,
} from '../../utils/project-errors';
import {
  isValidMetaKeywords,
  isValidProjectSlug,
  isValidProjectSummary,
  longestProjectKeywordLength,
  projectNamesValid,
} from '../../utils/project-field-rules';
import {
  firstRepeaterValidationIssue,
  projectRepeatersValid,
} from '../../utils/project-repeater-validation';
import {
  ChallengesStep,
  FeaturesStep,
  IdentityStep,
  InfoStep,
  ResultsStep,
  SeoStep,
  SolutionsStep,
} from './steps/project-steps';

@Component({
  selector: 'app-project-editor',
  imports: [
    EditorShell,
    InfoStep,
    ChallengesStep,
    SolutionsStep,
    FeaturesStep,
    ResultsStep,
    IdentityStep,
    SeoStep,
  ],
  templateUrl: './project-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectEditor {
  private readonly api = inject(ProjectsService);
  private readonly objectUrls = inject(ObjectUrls);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly network = inject(NetworkStatusService);
  readonly lang = inject(LanguageService);

  readonly id = input('');
  readonly steps = PROJECT_STEPS;
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly step = signal(0);
  readonly passed = signal(-1);
  readonly draft = signal<Project>(blankProject());
  readonly status = signal<'loading' | 'ready' | 'missing' | 'error' | 'offline'>(
    this.route.snapshot.data['mode'] === 'edit' ? 'loading' : 'ready',
  );
  readonly saving = signal(false);
  readonly nameError = signal(false);
  readonly summaryMax = PROJECT_SUMMARY_MAX;
  readonly keywordsMax = PROJECT_META_KEYWORD_MAX;
  readonly descriptionMax = PROJECT_SEO_DESCRIPTION_MAX;
  readonly slugInvalid = computed(
    () => !isValidProjectSlug(readLocale(this.draft().seo.slug, this.locale())),
  );
  readonly summaryInvalid = computed(
    () => !isValidProjectSummary(readLocale(this.draft().summary, this.locale())),
  );
  readonly keywordsLongest = computed(() =>
    longestProjectKeywordLength(readLocale(this.draft().seo.keywords, this.locale())),
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
  readonly stepId = computed(() => PROJECT_STEPS[this.step()].id);
  readonly wizardSteps = computed(() =>
    this.steps.map((item) => ({
      id: item.id,
      label: this.lang.t(item.labelKey),
      labelKey: item.labelKey,
    })),
  );
  readonly shellLabels = computed<EditorShellLabels>(() => ({
    saveDraft: this.lang.t('project.saveDraft'),
    publish: this.lang.t('project.publish'),
    unpublish: this.lang.t('project.unpublish'),
    save: this.lang.t('common.save'),
    next: this.lang.t('project.next'),
    previous: this.lang.t('project.previous'),
    finish: this.lang.t('project.finish'),
    loading: this.lang.t('common.loading'),
    missing: this.lang.t('project.notFound'),
    error: this.lang.t('common.error'),
  }));
  readonly lastStep = computed(() => this.step() === PROJECT_STEPS.length - 1);

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
        this.draft.set(blankProject());
        this.step.set(0);
        this.passed.set(-1);
        this.nameError.set(false);
        this.serverErrors.set({});
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
            map((project) => ({ failed: false as const, project })),
            catchError((error: unknown) => of({ failed: true as const, project: null, error })),
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
        if (!result.project) {
          this.status.set('missing');
          return;
        }
        this.draft.set(result.project);
        this.step.set(0);
        this.passed.set(-1);
        this.nameError.set(false);
        this.serverErrors.set({});
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
    if (this.mode() === 'create' && this.step() === 0 && !projectNamesValid(this.draft())) {
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
      void this.router.navigate(['/projects']);
      return;
    }
    if (!this.canLeaveEditorStep(this.step() - 1)) {
      return;
    }
    this.step.update((current) => current - 1);
  }

  saveDraft(): void {
    this.persist(false, 'project.draftSaved', false);
  }

  finish(): void {
    if (this.mode() === 'edit') {
      this.persist(this.draft().published, 'project.saved', true);
      return;
    }
    this.persist(true, 'project.saved', true);
  }

  updatePublished(published: boolean): void {
    this.persist(published, published ? 'project.saved' : 'project.draftSaved', false);
  }

  nameErrorText(): string {
    return nameErrorMessage(this.nameError(), this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  summaryErrorText(): string {
    return summaryErrorMessage(this.summaryInvalid(), this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  slugErrorText(): string {
    return slugErrorMessage(this.slugInvalid(), this.serverErrors(), (key) => this.copy(key));
  }

  keywordsErrorText(): string {
    return keywordsErrorMessage(this.keywordsInvalid(), this.locale(), this.serverErrors(), (key) =>
      this.copy(key),
    );
  }

  categoryTitleError(index: number): string {
    return this.pointError('categories', index, 'title');
  }

  categoryBodyError(index: number): string {
    return this.pointError('categories', index, 'body');
  }

  aboutTitleError(index: number): string {
    return this.pointError('aboutCards', index, 'title');
  }

  aboutBodyError(index: number): string {
    return this.pointError('aboutCards', index, 'body');
  }

  challengeTitleError(index: number): string {
    return this.pointError('challenges', index, 'title');
  }

  challengeBodyError(index: number): string {
    return this.pointError('challenges', index, 'body');
  }

  solutionTitleError(index: number): string {
    return this.pointError('solutions', index, 'title');
  }

  solutionBodyError(index: number): string {
    return this.pointError('solutions', index, 'body');
  }

  featureTitleError(index: number): string {
    return this.pointError('features', index, 'title');
  }

  featureBodyError(index: number): string {
    return this.pointError('features', index, 'body');
  }

  resultTitleError(index: number): string {
    return this.pointError('results', index, 'title');
  }

  resultBodyError(index: number): string {
    return this.pointError('results', index, 'body');
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

  identityBodyError(index: number): string {
    return identityBodyErrorMessage(
      this.draft(),
      index,
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
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
      this.dropServerErrors(`description.${language}`);
    }
  }

  setPoint(list: ProjectPointList, index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) =>
      draftSetPointField(current, list, index, field, language, value),
    );
    const apiList =
      list === 'categories' ? 'tags' : list === 'aboutCards' ? 'overview_cards' : list;
    const apiField =
      field === 'title' ? 'title' : list === 'results' ? 'value' : 'short_description';
    this.dropServerErrors(`${apiList}.${index}.${apiField}.${language}`);
  }

  addPoint(list: ProjectPointList): void {
    this.draft.update((current) => draftAddPoint(current, list));
  }

  removePoint(list: ProjectPointList, index: number): void {
    this.draft.update((current) => draftRemovePoint(current, list, index));
  }

  setPointImage(list: ProjectPointList, index: number, file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetPointImage(current, list, index, language, file));
  }

  setMediaImage(list: ProjectMediaList, index: number, file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetMediaImage(current, list, index, language, file));
  }

  addMedia(list: ProjectMediaList): void {
    this.draft.update((current) => draftAddMedia(current, list));
  }

  removeMedia(list: ProjectMediaList, index: number): void {
    this.draft.update((current) => draftRemoveMedia(current, list, index));
  }

  setCover(kind: 'cover' | 'thumb', file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetCover(current, kind, language, file));
  }

  clearCover(kind: 'cover' | 'thumb'): void {
    const language = this.locale();
    this.draft.update((current) => draftClearCover(current, kind, language));
  }

  clearPointImage(list: ProjectPointList, index: number): void {
    const language = this.locale();
    this.draft.update((current) => draftClearPointImage(current, list, index, language));
  }

  clearMediaImage(list: ProjectMediaList, index: number): void {
    const language = this.locale();
    this.draft.update((current) => draftClearMediaImage(current, list, index, language));
  }

  clearSolutionsImage(): void {
    const language = this.locale();
    this.draft.update((current) => draftClearSolutionsImage(current, language));
  }

  clearGalleryImage(index: number): void {
    const language = this.locale();
    this.draft.update((current) => draftClearGalleryImage(current, index, language));
  }

  setCoverText(key: 'coverTitle' | 'coverAlt' | 'thumbTitle' | 'thumbAlt', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) => draftSetCoverText(current, key, language, value));
    const path =
      key === 'coverTitle'
        ? `cover_title.${language}`
        : key === 'coverAlt'
          ? `cover_alt.${language}`
          : key === 'thumbTitle'
            ? `thumbnail_title.${language}`
            : `thumbnail_alt.${language}`;
    this.dropServerErrors(path);
  }

  setSolutionsImage(file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetSolutionsImage(current, language, file));
  }

  setSolutionsImageText(field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) => draftSetSolutionsImageText(current, field, language, value));
    const path =
      field === 'title' ? `solutions_image_title.${language}` : `solutions_image_alt.${language}`;
    this.dropServerErrors(path);
  }

  setGalleryImage(index: number, file: { name: string; url: string }): void {
    const language = this.locale();
    this.draft.update((current) => draftSetGalleryImage(current, index, language, file));
  }

  addGallery(): void {
    this.draft.update((current) => draftAddGallery(current));
  }

  removeGallery(index: number): void {
    this.draft.update((current) => draftRemoveGallery(current, index));
  }

  identityButtonLabel(index: number): string {
    const order = index + 1;
    const ordinalKey = `project.identityButtonOrder.${order}`;
    const ordinal = this.copy(ordinalKey);
    const suffix = ordinal === ordinalKey ? String(order) : ordinal;
    return `${this.copy('project.identityButton')} ${suffix}`.trim();
  }

  setIdentityButtonText(index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    const language = this.locale();
    this.draft.update((current) =>
      draftSetIdentityButtonText(current, index, field, language, value),
    );
    const apiField = field === 'title' ? 'title' : 'short_description';
    this.dropServerErrors(`identity_items.${index}.${apiField}.${language}`);
  }

  addIdentityButton(): void {
    this.draft.update((current) => draftAddIdentityButton(current));
  }

  removeIdentityButton(index: number): void {
    this.draft.update((current) => draftRemoveIdentityButton(current, index));
  }

  setIdentityButtonImage(
    buttonIndex: number,
    imageIndex: number,
    file: { name: string; url: string },
  ): void {
    const language = this.locale();
    this.draft.update((current) =>
      draftSetIdentityButtonImage(current, buttonIndex, imageIndex, language, file),
    );
  }

  clearIdentityButtonImage(buttonIndex: number, imageIndex: number): void {
    const language = this.locale();
    this.draft.update((current) =>
      draftClearIdentityButtonImage(current, buttonIndex, imageIndex, language),
    );
  }

  setSeo(field: keyof Project['seo'], event: Event): void {
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

  private pointError(
    list: 'categories' | 'aboutCards' | 'challenges' | 'solutions' | 'features' | 'results',
    index: number,
    field: 'title' | 'body',
  ): string {
    return pointTitleBodyErrorMessage(
      this.draft(),
      list,
      index,
      field,
      this.locale(),
      this.serverErrors(),
      (key) => this.copy(key),
    );
  }

  private persist(
    published: boolean,
    message: 'project.saved' | 'project.draftSaved',
    leave: boolean,
  ): void {
    if (this.saving() || this.status() !== 'ready') {
      return;
    }
    const previous = this.draft();
    const current = { ...previous, published };
    if (published && !projectNamesValid(current)) {
      this.nameError.set(true);
      this.step.set(0);
      return;
    }
    if (!this.summaryLocalesValid()) {
      this.focusInvalidSummaryLocale();
      this.step.set(0);
      return;
    }
    if (!projectRepeatersValid(current)) {
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
            void this.router.navigate(['/projects', saved.id]);
          }
        },
        error: (error: unknown) => {
          if (isApiError(error) && error.kind === 'validation') {
            this.applyServerErrors(error.fieldErrors);
            this.messages.add({
              severity: 'error',
              summary:
                firstFieldErrorMessage(error.fieldErrors) ||
                error.serverMessage ||
                this.lang.t('common.error'),
            });
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
    const stepIndex = projectStepIndexForServerPath(firstPath);
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

  private summaryLocalesValid(): boolean {
    const { summary } = this.draft();
    return isValidProjectSummary(summary.ar) && isValidProjectSummary(summary.en);
  }

  private focusInvalidSummaryLocale(): void {
    const { summary } = this.draft();
    if (!isValidProjectSummary(summary.ar)) {
      this.useLocale('ar');
      return;
    }
    if (!isValidProjectSummary(summary.en)) {
      this.useLocale('en');
    }
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
    return this.canLeaveSeoStep(target);
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
    return isValidProjectSlug(slug.ar) && isValidProjectSlug(slug.en);
  }

  private metaKeywordsLocalesValid(): boolean {
    const { keywords } = this.draft().seo;
    return isValidMetaKeywords(keywords.ar) && isValidMetaKeywords(keywords.en);
  }

  private focusInvalidSeoLocale(): void {
    const { slug, keywords } = this.draft().seo;
    if (!isValidProjectSlug(slug.ar)) {
      this.useLocale('ar');
      return;
    }
    if (!isValidProjectSlug(slug.en)) {
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
