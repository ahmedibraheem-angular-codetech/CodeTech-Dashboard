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
import type { Project } from '../../../projects/models/project.model';
import { ProjectsService } from '../../../projects/services/projects.service';
import { ServiceProjectCard } from '../../components/service-project-card/service-project-card';
import {
  SERVICE_STEPS,
  readLocale,
  type LocaleText,
  type Service,
  type ServiceImage,
} from '../../models/service.model';
import { ServicesService } from '../../services/services.service';

const FALLBACK_ICON = 'pi-cog';

const ICON_CLASS = /^pi-[a-z0-9-]+$/;

export interface ServiceVisual {
  icon: string;
  image: string;
}

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
  readonly status = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');
  readonly tab = signal<string>(SERVICE_STEPS[0].id);
  readonly projects = signal<Project[]>([]);
  readonly projectsStatus = signal<'loading' | 'ready' | 'error'>('loading');
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
    (this.item()?.whyItems ?? []).filter((entry) => this.filled(entry.title) || entry.imageUrl),
  );
  protected readonly whyImage = computed(() => this.item()?.whyImage ?? null);
  protected readonly solutions = computed(() => this.points('solutions'));
  protected readonly stages = computed(() => this.points('stages'));

  protected readonly features = computed(() =>
    (this.item()?.features ?? []).filter(
      (entry) => this.filled(entry.title) || this.filled(entry.body),
    ),
  );

  protected readonly sectors = computed(() =>
    (this.item()?.sectors ?? []).filter((entry) => this.visual(entry).image),
  );
  protected readonly faqs = computed(() =>
    (this.item()?.faqs ?? []).filter(
      (entry) => this.filled(entry.question) || this.filled(entry.answer),
    ),
  );

  protected readonly relatedProjects = computed(() => {
    const byId = new Map(this.projects().map((project) => [project.id, project]));
    return (this.item()?.projectIds ?? []).flatMap((projectId) => {
      const match = byId.get(projectId);
      return match ? [match] : [];
    });
  });
  protected readonly projectsUnavailable = computed(
    () =>
      this.projectsStatus() === 'ready' &&
      this.relatedProjects().length < (this.item()?.projectIds.length ?? 0),
  );

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
    this.projectsApi.setPublished(id, published);
    this.projects.update((items) =>
      items.map((item) => (item.id === id ? { ...item, published } : item)),
    );
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
    return `pi ${ICON_CLASS.test(icon) ? icon : FALLBACK_ICON}`;
  }

  protected visual(image: ServiceImage): ServiceVisual {
    const url = image.imageUrl;
    if (url.startsWith('icon:')) {
      const icon = url.slice('icon:'.length);
      return { icon: ICON_CLASS.test(icon) ? icon : '', image: '' };
    }
    return { icon: '', image: url };
  }

  protected sectorLabel(index: number): string {
    return `${this.lang.t('service.sectorItem')} ${index + 1}`;
  }

  protected position(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  private points(list: 'solutions' | 'stages' | 'features') {
    return (this.item()?.[list] ?? []).filter(
      (entry) => this.filled(entry.title) || this.filled(entry.body) || entry.imageUrl,
    );
  }

  private filled(value: LocaleText): boolean {
    return value.ar.trim().length > 0 || value.en.trim().length > 0;
  }
}
