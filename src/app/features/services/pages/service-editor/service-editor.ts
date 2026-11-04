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
import { loadFailureStatus } from '../../../../core/http/api-error';
import { LanguageService } from '../../../../core/services/language.service';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import {
  EditorShell,
  type EditorShellLabels,
} from '../../../../shared/components/editor-shell/editor-shell';
import { readMedia, type Project } from '../../../projects/models/project.model';
import { ProjectsService } from '../../../projects/services/projects.service';
import {
  SERVICE_STEPS,
  blankService,
  readLocale,
  type LocaleText,
  type Service,
} from '../../models/service.model';
import { ObjectUrls } from '../../../../shared/components/product-upload/object-urls';
import { ServicesService } from '../../services/services.service';
import {
  type ServicePageStatus,
  type ServiceProjectsStatus,
} from '../../constants/service.constants';
import {
  draftAddFaq,
  draftAddPoint,
  draftAddSector,
  draftAddWhy,
  draftClearPointImage,
  draftClearSectorImage,
  draftClearWhyIcon,
  draftClearWhyImage,
  draftRemoveFaq,
  draftRemovePoint,
  draftRemoveSector,
  draftRemoveWhy,
  draftSetFaq,
  draftSetField,
  draftSetPoint,
  draftSetPointImage,
  draftSetProject,
  draftSetSectorImage,
  draftSetWhyIcon,
  draftSetWhyImage,
  draftSetWhyImageTitle,
  draftSetWhyTitle,
  type ServiceImageFile,
  type ServicePointList,
} from '../../utils/service-draft';
import {
  createModeEditorState,
  editLoadSuccessState,
  type ServiceEditorLoadState,
} from '../../utils/service-editor-load';
import {
  decideNextStep,
  decidePreviousStep,
  decideSelectStep,
  type ServiceEditorNavDecision,
  type ServiceEditorNavInput,
} from '../../utils/service-editor-navigation';
import { evaluateServicePersist } from '../../utils/service-editor-persist';
import {
  FaqStep,
  FeaturesStep,
  ProjectsStep,
  SectorsStep,
  SolutionsStep,
  StagesStep,
  WhyStep,
} from './steps/service-steps';

export type { ServicePointList, ServiceImageFile };

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
  private readonly network = inject(NetworkStatusService);
  readonly lang = inject(LanguageService);

  readonly id = input('');
  readonly steps = SERVICE_STEPS;
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly step = signal(0);
  readonly passed = signal(-1);
  readonly draft = signal<Service>(blankService());
  readonly status = signal<ServicePageStatus>(
    this.route.snapshot.data['mode'] === 'edit' ? 'loading' : 'ready',
  );
  readonly saving = signal(false);
  readonly nameError = signal(false);

  readonly projects = signal<Project[]>([]);
  readonly projectsStatus = signal<ServiceProjectsStatus>('loading');
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
            map((service) => ({ failed: false as const, service, error: null as unknown })),
            catchError((error: unknown) => of({ failed: true as const, service: null, error })),
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
        if (!result.service) {
          this.status.set('missing');
          return;
        }
        this.applyLoadState(editLoadSuccessState(result.service));
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
        error: (error: unknown) => {
          if (this.projects().length > 0) {
            return;
          }
          this.projectsStatus.set(loadFailureStatus(error, this.network.online()));
        },
      });
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
    this.draft.update((current) => draftSetField(current, key, this.locale(), value));
    if (key === 'name') {
      this.nameError.set(false);
    }
  }

  setWhyImage(file: ServiceImageFile): void {
    this.draft.update((current) => draftSetWhyImage(current, this.locale(), file));
  }

  clearWhyImage(): void {
    this.draft.update((current) => draftClearWhyImage(current, this.locale()));
  }

  setWhyImageTitle(event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => draftSetWhyImageTitle(current, this.locale(), value));
  }

  setWhyTitle(index: number, event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => draftSetWhyTitle(current, index, this.locale(), value));
  }

  setWhyIcon(index: number, file: ServiceImageFile): void {
    this.draft.update((current) => draftSetWhyIcon(current, index, this.locale(), file));
  }

  clearWhyIcon(index: number): void {
    this.draft.update((current) => draftClearWhyIcon(current, index, this.locale()));
  }

  addWhy(): void {
    this.draft.update((current) => draftAddWhy(current));
  }

  removeWhy(index: number): void {
    this.draft.update((current) => draftRemoveWhy(current, index));
  }

  setPoint(list: ServicePointList, index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) =>
      draftSetPoint(current, list, index, field, this.locale(), value),
    );
  }

  addPoint(list: ServicePointList): void {
    this.draft.update((current) => draftAddPoint(current, list));
  }

  removePoint(list: ServicePointList, index: number): void {
    this.draft.update((current) => draftRemovePoint(current, list, index));
  }

  setPointImage(list: ServicePointList, index: number, file: ServiceImageFile): void {
    this.draft.update((current) => draftSetPointImage(current, list, index, this.locale(), file));
  }

  clearPointImage(list: ServicePointList, index: number): void {
    this.draft.update((current) => draftClearPointImage(current, list, index, this.locale()));
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

  projectCoverUrl(project: Project): string {
    return readMedia(project.cover, this.locale()).imageUrl;
  }

  setProject(projectId: string, selected: boolean): void {
    this.draft.update((current) => draftSetProject(current, projectId, selected));
  }

  addSector(): void {
    this.draft.update((current) => draftAddSector(current));
  }

  removeSector(index: number): void {
    this.draft.update((current) => draftRemoveSector(current, index));
  }

  setSectorImage(index: number, file: ServiceImageFile): void {
    this.draft.update((current) => draftSetSectorImage(current, index, this.locale(), file));
  }

  clearSectorImage(index: number): void {
    this.draft.update((current) => draftClearSectorImage(current, index, this.locale()));
  }

  setFaq(index: number, field: 'question' | 'answer', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => draftSetFaq(current, index, field, this.locale(), value));
  }

  addFaq(): void {
    this.draft.update((current) => draftAddFaq(current));
  }

  removeFaq(index: number): void {
    this.draft.update((current) => draftRemoveFaq(current, index));
  }

  private persist(
    published: boolean,
    message: 'service.saved' | 'service.draftSaved',
    leave: boolean,
  ): void {
    const evaluation = evaluateServicePersist(this.draft(), published, {
      saving: this.saving(),
      status: this.status(),
      projects: this.projects(),
      projectsStatus: this.projectsStatus(),
    });
    if (evaluation.kind === 'busy') {
      return;
    }
    if (evaluation.kind === 'nameError') {
      this.nameError.set(true);
      this.step.set(evaluation.step);
      return;
    }

    const current = evaluation.service;
    this.saving.set(true);
    this.api
      .save(current)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.objectUrls.sync(current, saved);
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

  private navInput(): ServiceEditorNavInput {
    return {
      mode: this.mode() === 'edit' ? 'edit' : 'create',
      saving: this.saving(),
      step: this.step(),
      draft: this.draft(),
    };
  }

  private applyNavDecision(decision: ServiceEditorNavDecision): void {
    switch (decision.kind) {
      case 'noop':
        return;
      case 'nameError':
        this.nameError.set(true);
        return;
      case 'navigateList':
        void this.router.navigate(['/services']);
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

  private applyLoadState(state: ServiceEditorLoadState): void {
    this.draft.set(state.draft);
    this.step.set(state.step);
    this.passed.set(state.passed);
    this.nameError.set(state.nameError);
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
