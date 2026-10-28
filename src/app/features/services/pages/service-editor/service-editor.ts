import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
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
import type { Project } from '../../../projects/models/project.model';
import { ProjectsService } from '../../../projects/services/projects.service';
import {
  SERVICE_STEPS,
  blankService,
  readLocale,
  serviceFaq,
  servicePoint,
  serviceSector,
  serviceWhyItem,
  type LocaleText,
  type Service,
} from '../../models/service.model';
import { ObjectUrls } from '../../../../shared/components/product-upload/object-urls';
import { ServicesService } from '../../services/services.service';
import {
  FaqStep,
  FeaturesStep,
  ProjectsStep,
  SectorsStep,
  SolutionsStep,
  StagesStep,
  WhyStep,
} from './steps/service-steps';

export type ServicePointList = 'solutions' | 'stages' | 'features';
export type ServiceImageFile = { name: string; url: string };

@Component({
  selector: 'app-service-editor',
  imports: [
    EditorShell,
    WhyStep,
    SolutionsStep,
    StagesStep,
    FeaturesStep,
    ProjectsStep,
    SectorsStep,
    FaqStep,
  ],
  templateUrl: './service-editor.html',
  styleUrl: './service-editor.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceEditor {
  private readonly api = inject(ServicesService);
  private readonly objectUrls = inject(ObjectUrls);
  private readonly projectsApi = inject(ProjectsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly id = input('');
  readonly steps = SERVICE_STEPS;
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly step = signal(0);
  readonly passed = signal(-1);
  readonly draft = signal<Service>(blankService());
  readonly status = signal<'loading' | 'ready' | 'missing' | 'error'>(
    this.route.snapshot.data['mode'] === 'edit' ? 'loading' : 'ready',
  );
  readonly saving = signal(false);
  readonly nameError = signal(false);
  /** Projects offered by the “related projects” step; the Projects feature stays the source of truth. */
  readonly projects = signal<Project[]>([]);
  readonly projectsStatus = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly reload = signal(0);

  readonly mode = toSignal(
    this.route.data.pipe(map((data) => (data['mode'] === 'edit' ? 'edit' : 'create'))),
    { initialValue: this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create' },
  );
  readonly stepId = computed(() => SERVICE_STEPS[this.step()].id);
  readonly wizardSteps = computed(() =>
    this.steps.map((item) => ({
      id: item.id,
      label: this.lang.t(item.labelKey),
      labelKey: item.labelKey,
    })),
  );
  readonly shellLabels = computed<EditorShellLabels>(() => ({
    saveDraft: this.lang.t('service.saveDraft'),
    publish: this.lang.t('service.publish'),
    unpublish: this.lang.t('service.unpublish'),
    save: this.lang.t('common.save'),
    next: this.lang.t('service.next'),
    previous: this.lang.t('service.previous'),
    finish: this.lang.t('service.finish'),
    loading: this.lang.t('common.loading'),
    missing: this.lang.t('service.notFound'),
    error: this.lang.t('common.error'),
  }));
  readonly lastStep = computed(() => this.step() === SERVICE_STEPS.length - 1);

  private readonly editRequest = computed(() =>
    this.mode() === 'edit' && this.id() ? { id: this.id(), reload: this.reload() } : null,
  );

  constructor() {
    // Drop draft-owned object URLs when leaving the editor; store-owned ones stay via `sync`.
    this.destroyRef.onDestroy(() => this.objectUrls.abandon(this.draft()));

    effect(() => {
      const editing = this.mode() === 'edit' && this.id();
      untracked(() => {
        if (editing) {
          return;
        }
        this.status.set('ready');
        this.draft.set(blankService());
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
            map((service) => ({ failed: false as const, service })),
            catchError(() => of({ failed: true as const, service: null })),
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
        if (!result.service) {
          this.status.set('missing');
          return;
        }
        this.draft.set(result.service);
        this.step.set(0);
        this.passed.set(-1);
        this.nameError.set(false);
        this.status.set('ready');
      });

    this.loadProjects();
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

  loadProjects(): void {
    this.projectsStatus.set('loading');
    this.projectsApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => {
          this.projects.set(projects);
          this.projectsStatus.set('ready');
        },
        error: () => this.projectsStatus.set('error'),
      });
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
      void this.router.navigate(['/services']);
      return;
    }
    this.step.update((current) => current - 1);
  }

  saveDraft(): void {
    this.persist(false, 'service.draftSaved', false);
  }

  finish(): void {
    if (this.mode() === 'edit') {
      this.persist(this.draft().published, 'service.saved', true);
      return;
    }
    this.persist(true, 'service.saved', true);
  }

  updatePublished(published: boolean): void {
    this.persist(published, published ? 'service.saved' : 'service.draftSaved', false);
  }

  setField(key: 'name' | 'description', event: Event): void {
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

  setIcon(icon: string): void {
    this.draft.update((current) => ({ ...current, icon }));
  }

  setWhyImage(file: ServiceImageFile): void {
    this.draft.update((current) => ({
      ...current,
      whyImage: this.withImage(current.whyImage, file),
    }));
  }

  clearWhyImage(): void {
    this.draft.update((current) => ({
      ...current,
      whyImage: { ...current.whyImage, imageName: '', imageUrl: '' },
    }));
  }

  setWhyImageTitle(event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      whyImage: {
        ...current.whyImage,
        title: this.writeLocale(current.whyImage.title, value),
      },
    }));
  }

  setWhyTitle(index: number, event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      whyItems: this.patchLocaleField(current.whyItems, index, 'title', value),
    }));
  }

  setWhyIcon(index: number, file: ServiceImageFile): void {
    this.draft.update((current) => ({
      ...current,
      whyItems: this.mapAt(current.whyItems, index, (item) => this.withImage(item, file)),
    }));
  }

  clearWhyIcon(index: number): void {
    this.draft.update((current) => ({
      ...current,
      whyItems: this.mapAt(current.whyItems, index, (item) => this.withoutImage(item)),
    }));
  }

  addWhy(): void {
    this.draft.update((current) => ({
      ...current,
      whyItems: [...current.whyItems, serviceWhyItem()],
    }));
  }

  removeWhy(index: number): void {
    this.draft.update((current) => ({
      ...current,
      whyItems: this.withoutAt(current.whyItems, index),
    }));
  }

  // Steps 2–4 — solutions, stages, features

  setPoint(list: ServicePointList, index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      [list]: this.patchLocaleField(current[list], index, field, value),
    }));
  }

  addPoint(list: ServicePointList): void {
    this.draft.update((current) => ({ ...current, [list]: [...current[list], servicePoint()] }));
  }

  removePoint(list: ServicePointList, index: number): void {
    this.draft.update((current) => ({ ...current, [list]: this.withoutAt(current[list], index) }));
  }

  setPointImage(list: ServicePointList, index: number, file: ServiceImageFile): void {
    this.draft.update((current) => ({
      ...current,
      [list]: this.mapAt(current[list], index, (item) => this.withImage(item, file)),
    }));
  }

  clearPointImage(list: ServicePointList, index: number): void {
    this.draft.update((current) => ({
      ...current,
      [list]: this.mapAt(current[list], index, (item) => this.withoutImage(item)),
    }));
  }

  stageLabel(index: number): string {
    const order = index + 1;
    const ordinalKey = `service.stageOrder.${order}`;
    const ordinal = this.copy(ordinalKey);
    const suffix = ordinal === ordinalKey ? String(order) : ordinal;
    return `${this.copy('service.stageItem')} ${suffix}`.trim();
  }

  projectSelected(projectId: string): boolean {
    return this.draft().projectIds.includes(projectId);
  }

  setProject(projectId: string, selected: boolean): void {
    this.draft.update((current) => {
      const without = current.projectIds.filter((item) => item !== projectId);
      return { ...current, projectIds: selected ? [...without, projectId] : without };
    });
  }

  addSector(): void {
    this.draft.update((current) => ({
      ...current,
      sectors: [...current.sectors, serviceSector()],
    }));
  }

  removeSector(index: number): void {
    this.draft.update((current) => ({
      ...current,
      sectors: this.withoutAt(current.sectors, index),
    }));
  }

  setSectorImage(index: number, file: ServiceImageFile): void {
    this.draft.update((current) => ({
      ...current,
      sectors: this.mapAt(current.sectors, index, (item) => this.withImage(item, file)),
    }));
  }

  clearSectorImage(index: number): void {
    this.draft.update((current) => ({
      ...current,
      sectors: this.mapAt(current.sectors, index, (item) => this.withoutImage(item)),
    }));
  }

  setFaq(index: number, field: 'question' | 'answer', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      faqs: this.patchLocaleField(current.faqs, index, field, value),
    }));
  }

  addFaq(): void {
    this.draft.update((current) => ({ ...current, faqs: [...current.faqs, serviceFaq()] }));
  }

  removeFaq(index: number): void {
    this.draft.update((current) => ({ ...current, faqs: this.withoutAt(current.faqs, index) }));
  }

  private persist(
    published: boolean,
    message: 'service.saved' | 'service.draftSaved',
    leave: boolean,
  ): void {
    // The shell keeps its header actions visible while a record loads, fails to load, or is
    // missing; saving then would write the blank placeholder draft as a brand-new service.
    if (this.saving() || this.status() !== 'ready') {
      return;
    }
    if (published && !this.namesValid()) {
      this.nameError.set(true);
      this.step.set(0);
      return;
    }
    const current: Service = {
      ...this.draft(),
      published,
      projectIds: this.knownProjectIds(),
    };
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
            void this.router.navigate(['/services']);
          }
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  /**
   * Drops references to projects that no longer exist, so a saved service never points at a
   * deleted project. When the project list is unavailable nothing is dropped.
   */
  private knownProjectIds(): string[] {
    const ids = this.draft().projectIds;
    if (this.projectsStatus() !== 'ready') {
      return [...ids];
    }
    const known = new Set(this.projects().map((project) => project.id));
    return ids.filter((id) => known.has(id));
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

  /** Removes one item but never the last one: each repeatable section keeps a minimum of one. */
  private withoutAt<T>(items: readonly T[], index: number): T[] {
    return items.length > 1 ? items.filter((_, item) => item !== index) : [...items];
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
    file: ServiceImageFile,
  ): T {
    return { ...item, imageName: file.name, imageUrl: file.url };
  }

  private withoutImage<T extends { imageName: string; imageUrl: string }>(item: T): T {
    return { ...item, imageName: '', imageUrl: '' };
  }
}
