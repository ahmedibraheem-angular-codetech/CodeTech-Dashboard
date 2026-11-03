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
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, map, of, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { InfoField } from '../../../../shared/components/info-field/info-field';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageTabs, type PageTab } from '../../../../shared/components/page-tabs/page-tabs';
import { SectorCard } from '../../../../shared/components/sector-card/sector-card';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import {
  readMedia as readProjectMedia,
  type Project,
} from '../../../projects/models/project.model';
import { ProjectsService } from '../../../projects/services/projects.service';
import { ServiceProjectCard } from '../../components/service-project-card/service-project-card';
import {
  SERVICE_STEPS,
  readLocale,
  readMedia,
  type LocaleText,
  type LocalizedMedia,
  type Service,
  type ServiceImage,
  type ServiceSector,
} from '../../models/service.model';
import { ServicesService } from '../../services/services.service';
import {
  type ServicePageStatus,
  type ServiceProjectsStatus,
} from '../../constants/service.constants';
import { filledLocale } from '../../utils/service-locale';
import { serviceIconClass, serviceVisual, type ServiceVisual } from '../../utils/service-visual';

export type { ServiceVisual };

@Component({
  selector: 'app-service-detail',
  imports: [
    RouterLink,
    AppButton,
    ConfirmDialog,
    InfoField,
    PageHeader,
    PageTabs,
    SectorCard,
    ServiceProjectCard,
    StateView,
    HasPermissionDirective,
  ],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceDetailPage {
  private readonly api = inject(ServicesService);
  private readonly projectsApi = inject(ProjectsService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly auth = inject(AuthService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  readonly id = input('');
  readonly item = signal<Service | null>(null);
  readonly status = signal<ServicePageStatus>('loading');
  readonly tab = signal<string>(SERVICE_STEPS[0].id);
  readonly projects = signal<Project[]>([]);
  readonly projectsStatus = signal<ServiceProjectsStatus>('loading');
  private readonly reload = signal(0);

  readonly tabs: readonly PageTab[] = [
    ...SERVICE_STEPS.filter((step) => step.id !== 'sectors' && step.id !== 'faq').map(
      ({ id, labelKey }) => ({ id, labelKey }),
    ),
    { id: 'sectors-faq', labelKey: 'service.step.sectorsFaq' },
  ];

  protected readonly backIcon = computed(() =>
    this.lang.language() === 'ar' ? 'pi-arrow-right' : 'pi-arrow-left',
  );

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('services.update');
  });
  readonly canDelete = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('services.delete');
  });
  readonly canCreateProject = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('projects.create');
  });
  readonly canPublishProject = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('projects.update');
  });

  protected readonly whyItems = computed(() =>
    (this.item()?.whyItems ?? []).filter((entry) => {
      const media = readMedia(entry.image, this.lang.language());
      return filledLocale(entry.title) || !!media.imageUrl;
    }),
  );
  protected readonly whyImage = computed(() => this.item()?.whyImage ?? null);
  protected readonly solutions = computed(() => this.points('solutions'));
  protected readonly stages = computed(() => this.points('stages'));

  protected readonly features = computed(() =>
    (this.item()?.features ?? []).filter(
      (entry) => filledLocale(entry.title) || filledLocale(entry.body),
    ),
  );

  protected readonly sectors = computed(() =>
    (this.item()?.sectors ?? []).filter((entry) => this.visual(this.sectorMedia(entry)).image),
  );
  protected readonly faqs = computed(() =>
    (this.item()?.faqs ?? []).filter(
      (entry) => filledLocale(entry.question) || filledLocale(entry.answer),
    ),
  );

  protected readonly relatedProjects = computed(() => {
    const linked = this.item()?.linkedProjects ?? [];
    if (linked.length) {
      return linked.map((item) => ({
        id: item.id,
        name: item.title,
        summary: item.description,
        coverUrl: item.coverUrl,
        published: item.visible,
      }));
    }
    const byId = new Map(this.projects().map((project) => [project.id, project]));
    return (this.item()?.projectIds ?? []).flatMap((projectId) => {
      const match = byId.get(projectId);
      return match
        ? [
            {
              id: match.id,
              name: match.name,
              summary: match.summary,
              coverUrl: readProjectMedia(match.cover, this.lang.language()).imageUrl,
              published: match.published,
            },
          ]
        : [];
    });
  });
  protected readonly projectsUnavailable = computed(() => {
    if ((this.item()?.linkedProjects.length ?? 0) > 0) {
      return false;
    }
    return (
      this.projectsStatus() === 'ready' &&
      this.relatedProjects().length < (this.item()?.projectIds.length ?? 0)
    );
  });

  constructor() {
    toObservable(computed(() => ({ id: this.id(), reload: this.reload() })))
      .pipe(
        switchMap(({ id }) => {
          this.status.set('loading');
          this.item.set(null);
          if (!id) {
            return of({ failed: false as const, service: null });
          }
          return this.api.get(id).pipe(
            map((service) => ({ failed: false as const, service })),
            catchError(() => of({ failed: true as const, service: null })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.item.set(result.service);
        this.status.set(result.failed ? 'error' : result.service ? 'ready' : 'missing');
      });
    this.loadProjects();

    effect((onCleanup) => {
      const service = this.item();
      if (!service) {
        return;
      }
      const url = `/services/${service.id}`;
      const name = this.text(service.name);
      if (!name) {
        return;
      }
      untracked(() => this.breadcrumbs.setLabel(url, name));
      onCleanup(() => this.breadcrumbs.clearLabel(url));
    });
  }

  retry(): void {
    this.reload.update((value) => value + 1);
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

  protected selectTab(value: string | number | undefined): void {
    if (typeof value === 'string') {
      this.tab.set(value);
    }
  }

  protected edit(): void {
    const id = this.item()?.id;
    if (!id) {
      return;
    }
    void this.router.navigate(['/services', id, 'edit']);
  }

  protected addProject(): void {
    void this.router.navigate(['/projects', 'new']);
  }

  protected publishProject(id: string, published: boolean): void {
    const service = this.item();
    if (service?.linkedProjects.length) {
      this.api
        .setProjectVisible(service.id, id, published)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.item.update((current) =>
              current
                ? {
                    ...current,
                    linkedProjects: current.linkedProjects.map((item) =>
                      item.id === id ? { ...item, visible: published } : item,
                    ),
                  }
                : current,
            );
          },
          error: () => {
            this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
          },
        });
      return;
    }
    this.projectsApi
      .setPublished(id, published)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.projects.update((items) =>
            items.map((item) => (item.id === id ? { ...item, published: saved.published } : item)),
          );
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  protected async remove(service: Service): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('service.deleteTitle'),
      message: this.lang.t('service.deleteMessage'),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .remove(service.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.messages.add({ severity: 'success', summary: this.lang.t('service.deleted') });
        void this.router.navigate(['/services']);
      });
  }

  protected text(value: LocaleText): string {
    const language = this.lang.language();
    return readLocale(value, language) || value.ar || value.en;
  }

  protected iconClass(icon: string): string {
    return serviceIconClass(icon);
  }

  protected sectorMedia(sector: ServiceSector): ServiceImage {
    return readMedia(sector.image, this.lang.language());
  }

  protected slotMedia(image: LocalizedMedia): ServiceImage {
    return readMedia(image, this.lang.language());
  }

  protected visual(image: ServiceImage | LocalizedMedia): ServiceVisual {
    if ('ar' in image && 'en' in image) {
      return serviceVisual(this.slotMedia(image));
    }
    return serviceVisual(image);
  }

  protected sectorLabel(index: number): string {
    return `${this.lang.t('service.sectorItem')} ${index + 1}`;
  }

  protected position(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  private points(list: 'solutions' | 'stages' | 'features') {
    const language = this.lang.language();
    return (this.item()?.[list] ?? []).filter((entry) => {
      const media = readMedia(entry.image, language);
      return filledLocale(entry.title) || filledLocale(entry.body) || !!media.imageUrl;
    });
  }
}
