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
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageTabs, type PageTab } from '../../../../shared/components/page-tabs/page-tabs';
import { SectorCard } from '../../../../shared/components/sector-card/sector-card';
import { StateView } from '../../../../shared/components/state-view/state-view';
import type { Project } from '../../../projects/models/project.model';
import { ProjectsService } from '../../../projects/services/projects.service';
import {
  SERVICE_STEPS,
  readLocale,
  type LocaleText,
  type Service,
  type ServiceImage,
} from '../../models/service.model';
import { ServicesService } from '../../services/services.service';

const FALLBACK_ICON = 'pi-cog';
/** `Service.icon` and `icon:` image values hold bare PrimeIcons classes, never URLs. */
const ICON_CLASS = /^pi-[a-z0-9-]+$/;

/** How one stored image value is drawn: a PrimeIcons glyph, a picture, or nothing. */
export interface ServiceVisual {
  icon: string;
  image: string;
}

/**
 * Read-only view of one service. It loads the record by route id and resolves the related
 * project ids against the Projects service without ever writing back to either record.
 */
@Component({
  selector: 'app-service-detail',
  imports: [RouterLink, PageHeader, PageTabs, SectorCard, StateView],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceDetailPage {
  private readonly api = inject(ServicesService);
  private readonly projectsApi = inject(ProjectsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breadcrumbs = inject(BreadcrumbService);
  readonly lang = inject(LanguageService);

  /** Bound from the `:id` route parameter; an empty id resolves to the not-found state. */
  readonly id = input('');
  readonly item = signal<Service | null>(null);
  readonly status = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');
  readonly tab = signal<string>(SERVICE_STEPS[0].id);
  readonly projects = signal<Project[]>([]);
  readonly projectsStatus = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly reload = signal(0);

  /** Same seven sections, in the same order and with the same labels, as the editor. */
  readonly tabs: readonly PageTab[] = SERVICE_STEPS.map(({ id, labelKey }) => ({ id, labelKey }));

  protected readonly backIcon = computed(() =>
    this.lang.language() === 'ar' ? 'pi-arrow-right' : 'pi-arrow-left',
  );

  /** Only entries that carry something to show; blank placeholders from the editor are skipped. */
  protected readonly whyItems = computed(() =>
    (this.item()?.whyItems ?? []).filter((entry) => this.filled(entry.title) || entry.imageUrl),
  );
  protected readonly whyImage = computed(() => this.item()?.whyImage ?? null);
  protected readonly solutions = computed(() => this.points('solutions'));
  protected readonly stages = computed(() => this.points('stages'));
  protected readonly features = computed(() => this.points('features'));
  /**
   * A sector is only its image, and the shared sector tile draws its label in white over that
   * image, so an entry without a drawable picture (blank, or an `icon:` value) is left out
   * rather than shown as an unreadable white tile.
   */
  protected readonly sectors = computed(() =>
    (this.item()?.sectors ?? []).filter((entry) => this.visual(entry).image),
  );
  protected readonly faqs = computed(() =>
    (this.item()?.faqs ?? []).filter(
      (entry) => this.filled(entry.question) || this.filled(entry.answer),
    ),
  );

  /** Related projects in the order they were chosen; ids with no matching project are skipped. */
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

    // The last breadcrumb shows the loaded service name (in the interface language) instead of
    // its id, using the same `BreadcrumbService` labels as the user and article details. The
    // cleanup drops the label when the record changes, fails to load, or the page is left.
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

  /** Text in the interface language, falling back to the other language when it is blank. */
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
