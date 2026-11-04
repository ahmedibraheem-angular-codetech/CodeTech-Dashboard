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
import { PROJECT_STEPS } from '../../constants/project-steps';
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
  nameErrorMessage,
  pointTitleBodyErrorMessage,
  slugErrorMessage,
  summaryErrorMessage,
} from '../../utils/project-errors';
import {
  isValidMetaKeywords,
  isValidProjectSlug,
  isValidProjectSummary,
  longestProjectKeywordLength,
} from '../../utils/project-field-rules';
import {
  createModeEditorState,
  editLoadSuccessState,
  type ProjectEditorLoadState,
} from '../../utils/project-editor-load';
import {
  decideNextStep,
  decidePreviousStep,
  decideSelectStep,
  type ProjectEditorNavDecision,
  type ProjectEditorNavInput,
} from '../../utils/project-editor-navigation';
import {
  evaluateProjectPersist,
  resolveServerErrorFocus,
} from '../../utils/project-editor-persist';
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
        this.applyLoadState(createModeEditorState());
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
        this.applyLoadState(editLoadSuccessState(result.project));
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
    this.applyNavDecision(decideSelectStep(this.navInput(), index));
  }

  next(): void {
    this.applyNavDecision(decideNextStep(this.navInput()));
  }

  previous(): void {
    this.applyNavDecision(decidePreviousStep(this.navInput()));
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
    const evaluation = evaluateProjectPersist(this.draft(), published, {
      saving: this.saving(),
      status: this.status(),
    });
    switch (evaluation.kind) {
      case 'busy':
        return;
      case 'nameError':
        this.nameError.set(true);
        this.step.set(evaluation.step);
        return;
      case 'summaryInvalid':
        if (evaluation.locale) {
          this.useLocale(evaluation.locale);
        }
        this.step.set(evaluation.step);
        return;
      case 'repeaterInvalid':
        if (evaluation.preferAr) {
          this.useLocale('ar');
        }
        this.step.set(evaluation.step);
        return;
      case 'seoInvalid':
        if (evaluation.locale) {
          this.useLocale(evaluation.locale);
        }
        this.step.set(evaluation.step);
        return;
      case 'ready':
        break;
    }

    const previous = this.draft();
    const current = evaluation.project;
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
            void this.router.navigate(['/projects']);
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
    const focus = resolveServerErrorFocus(fieldErrors);
    if (focus.language) {
      this.useLocale(focus.language);
    }
    if (focus.stepIndex >= 0) {
      this.step.set(focus.stepIndex);
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

  private navInput(): ProjectEditorNavInput {
    return {
      mode: this.mode() === 'edit' ? 'edit' : 'create',
      saving: this.saving(),
      step: this.step(),
      draft: this.draft(),
    };
  }

  private applyNavDecision(decision: ProjectEditorNavDecision): void {
    switch (decision.kind) {
      case 'noop':
        return;
      case 'nameError':
        this.nameError.set(true);
        return;
      case 'blocked':
        if (decision.locale) {
          this.useLocale(decision.locale);
        }
        return;
      case 'navigateList':
        void this.router.navigate(['/projects']);
        return;
      case 'setStep':
        this.step.set(decision.step);
        return;
      case 'advance':
        this.passed.update((current) => Math.max(current, decision.from));
        this.step.set(decision.from + 1);
        return;
    }
  }

  private applyLoadState(state: ProjectEditorLoadState): void {
    this.draft.set(state.draft);
    this.step.set(state.step);
    this.passed.set(state.passed);
    this.nameError.set(state.nameError);
    this.serverErrors.set(state.serverErrors);
    this.status.set(state.status);
  }

  private read(event: Event): string | undefined {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return undefined;
  }
}
