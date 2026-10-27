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
import {
  EditorShell,
  type EditorShellLabels,
} from '../../../../shared/components/editor-shell/editor-shell';
import {
  PROJECT_STEPS,
  blankProject,
  projectGalleryImage,
  projectIdentityButton,
  projectMedia,
  projectPoint,
  readLocale,
  type LocaleText,
  type Project,
} from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';
import {
  AboutStep,
  ChallengesStep,
  FeaturesStep,
  IdentityStep,
  ResultsStep,
  SeoStep,
  SolutionsStep,
} from './steps/project-steps';

type PointList = 'categories' | 'aboutCards' | 'challenges' | 'solutions' | 'features' | 'results';
type MediaList = 'tools';

@Component({
  selector: 'app-project-editor',
  imports: [
    EditorShell,
    AboutStep,
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly id = input('');
  readonly steps = PROJECT_STEPS;
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly step = signal(0);
  readonly passed = signal(-1);
  readonly draft = signal<Project>(blankProject());
  readonly status = signal<'loading' | 'ready' | 'missing' | 'error'>(
    this.route.snapshot.data['mode'] === 'edit' ? 'loading' : 'ready',
  );
  readonly saving = signal(false);
  readonly nameError = signal(false);
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
            catchError(() => of({ failed: true as const, project: null })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (!result) {
          return;
        }
        if (result.failed) {
          this.status.set('error');
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

  setField(key: 'name' | 'summary', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      [key]: this.writeLocale(current[key], value),
    }));
    if (key === 'name') {
      this.nameError.set(false);
    }
  }

  setPoint(list: PointList, index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      [list]: this.patchLocaleField(current[list], index, field, value),
    }));
  }

  addPoint(list: PointList): void {
    this.draft.update((current) => ({ ...current, [list]: [...current[list], projectPoint()] }));
  }

  removePoint(list: PointList, index: number): void {
    this.draft.update((current) => ({
      ...current,
      [list]:
        current[list].length > 1
          ? current[list].filter((_, item) => item !== index)
          : current[list],
    }));
  }

  setPointImage(list: PointList, index: number, file: { name: string; url: string }): void {
    this.draft.update((current) => ({
      ...current,
      [list]: this.mapAt(current[list], index, (item) => this.withImage(item, file)),
    }));
  }

  setMediaImage(list: MediaList, index: number, file: { name: string; url: string }): void {
    this.draft.update((current) => ({
      ...current,
      [list]: this.mapAt(current[list], index, (item) => this.withImage(item, file)),
    }));
  }

  addMedia(list: MediaList): void {
    this.draft.update((current) => ({ ...current, [list]: [...current[list], projectMedia()] }));
  }

  removeMedia(list: MediaList, index: number): void {
    this.draft.update((current) => ({
      ...current,
      [list]:
        current[list].length > 1
          ? current[list].filter((_, item) => item !== index)
          : current[list],
    }));
  }

  setCover(kind: 'cover' | 'thumb', file: { name: string; url: string }): void {
    this.draft.update((current) =>
      kind === 'cover'
        ? { ...current, coverName: file.name, coverUrl: file.url }
        : { ...current, thumbName: file.name, thumbUrl: file.url },
    );
  }

  clearCover(kind: 'cover' | 'thumb'): void {
    this.draft.update((current) =>
      kind === 'cover'
        ? { ...current, coverName: '', coverUrl: '' }
        : { ...current, thumbName: '', thumbUrl: '' },
    );
  }

  clearPointImage(list: PointList, index: number): void {
    this.draft.update((current) => ({
      ...current,
      [list]: this.mapAt(current[list], index, (item) => ({
        ...item,
        imageName: '',
        imageUrl: '',
      })),
    }));
  }

  clearMediaImage(list: MediaList, index: number): void {
    this.draft.update((current) => ({
      ...current,
      [list]: this.mapAt(current[list], index, (item) => ({
        ...item,
        imageName: '',
        imageUrl: '',
      })),
    }));
  }

  clearSolutionsImage(): void {
    this.draft.update((current) => ({
      ...current,
      solutionsImage: { ...current.solutionsImage, imageName: '', imageUrl: '' },
    }));
  }

  clearGalleryImage(index: number): void {
    this.draft.update((current) => ({
      ...current,
      gallery: this.mapAt(current.gallery, index, (item) => ({
        ...item,
        imageName: '',
        imageUrl: '',
      })),
    }));
  }

  setCoverText(key: 'coverTitle' | 'coverAlt' | 'thumbTitle' | 'thumbAlt', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      [key]: this.writeLocale(current[key], value),
    }));
  }

  setSolutionsImage(file: { name: string; url: string }): void {
    this.draft.update((current) => ({
      ...current,
      solutionsImage: this.withImage(current.solutionsImage, file),
    }));
  }

  setSolutionsImageText(field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      solutionsImage: {
        ...current.solutionsImage,
        [field]: this.writeLocale(current.solutionsImage[field], value),
      },
    }));
  }

  setGalleryImage(index: number, file: { name: string; url: string }): void {
    this.draft.update((current) => ({
      ...current,
      gallery: this.mapAt(current.gallery, index, (item) => this.withImage(item, file)),
    }));
  }

  addGallery(): void {
    this.draft.update((current) => ({
      ...current,
      gallery: [...current.gallery, projectGalleryImage()],
    }));
  }

  removeGallery(index: number): void {
    this.draft.update((current) => ({
      ...current,
      gallery:
        current.gallery.length > 1
          ? current.gallery.filter((_, item) => item !== index)
          : current.gallery,
    }));
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
    this.draft.update((current) => ({
      ...current,
      identityButtons: this.patchLocaleField(current.identityButtons, index, field, value),
    }));
  }

  addIdentityButton(): void {
    this.draft.update((current) => ({
      ...current,
      identityButtons: [...current.identityButtons, projectIdentityButton()],
    }));
  }

  removeIdentityButton(index: number): void {
    this.draft.update((current) => ({
      ...current,
      identityButtons:
        current.identityButtons.length > 1
          ? current.identityButtons.filter((_, item) => item !== index)
          : current.identityButtons,
    }));
  }

  setIdentityButtonImage(
    buttonIndex: number,
    imageIndex: number,
    file: { name: string; url: string },
  ): void {
    this.draft.update((current) => ({
      ...current,
      identityButtons: this.mapAt(current.identityButtons, buttonIndex, (button) => ({
        ...button,
        images: this.mapAt(button.images, imageIndex, (image) => this.withImage(image, file)),
      })),
    }));
  }

  clearIdentityButtonImage(buttonIndex: number, imageIndex: number): void {
    this.draft.update((current) => ({
      ...current,
      identityButtons: this.mapAt(current.identityButtons, buttonIndex, (button) => ({
        ...button,
        images: this.mapAt(button.images, imageIndex, (image) => ({
          ...image,
          imageName: '',
          imageUrl: '',
        })),
      })),
    }));
  }

  setSeo(field: keyof Project['seo'], event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      seo: { ...current.seo, [field]: this.writeLocale(current.seo[field], value) },
    }));
  }

  private persist(
    published: boolean,
    message: 'project.saved' | 'project.draftSaved',
    leave: boolean,
  ): void {
    if (this.saving()) {
      return;
    }
    const current = { ...this.draft(), published };
    if (published && !this.namesValid()) {
      this.nameError.set(true);
      this.step.set(0);
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
          this.draft.set(saved);
          this.nameError.set(false);
          this.messages.add({ severity: 'success', summary: this.lang.t(message) });
          if (leave) {
            void this.router.navigate(['/projects', saved.id]);
          }
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  private namesValid(): boolean {
    const { name } = this.draft();
    return name.ar.trim().length > 0 && name.en.trim().length > 0;
  }

  private read(event: Event): string | undefined {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return undefined;
  }

  private writeLocale(current: LocaleText, value: string): LocaleText {
    return { ...current, [this.locale()]: value };
  }

  private mapAt<T>(items: readonly T[], index: number, update: (item: T) => T): T[] {
    return items.map((item, itemIndex) => (itemIndex === index ? update(item) : item));
  }

  private patchLocaleField<T extends Record<K, LocaleText>, K extends keyof T>(
    items: readonly T[],
    index: number,
    field: K,
    value: string,
  ): T[] {
    return this.mapAt(items, index, (item) => ({
      ...item,
      [field]: this.writeLocale(item[field], value),
    }));
  }

  private withImage<T extends { imageName: string; imageUrl: string }>(
    item: T,
    file: { name: string; url: string },
  ): T {
    return { ...item, imageName: file.name, imageUrl: file.url };
  }
}
