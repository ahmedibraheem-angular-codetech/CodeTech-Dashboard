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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageTabs, type PageTab } from '../../../../shared/components/page-tabs/page-tabs';
import { StateView } from '../../../../shared/components/state-view/state-view';
import {
  readLocale,
  type LocaleText,
  type Project,
  type ProjectMedia,
  type ProjectPoint,
} from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';

const ICON_CLASS = /^pi-[a-z0-9-]+$/;

type PointVisual = { icon: string; image: string };

@Component({
  selector: 'app-project-detail',
  imports: [PageHeader, RouterLink, StateView, PageTabs],
  templateUrl: './project-detail.html',
  styleUrl: '../projects-list/projects-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPage {
  private readonly api = inject(ProjectsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  readonly id = input.required<string>();
  readonly item = signal<Project | null>(null);
  readonly status = signal<'loading' | 'ready' | 'missing'>('loading');
  readonly tab = signal('data');

  readonly tabs = computed<PageTab[]>(() => {
    this.lang.language();
    return [
      { id: 'data', labelKey: 'project.detailData' },
      { id: 'gallery', labelKey: 'project.detailGallery' },
      { id: 'identity', labelKey: 'project.detailIdentity' },
      { id: 'seo', labelKey: 'project.detailSeo' },
    ];
  });

  protected readonly aboutCards = computed(() => this.points('aboutCards'));
  protected readonly challenges = computed(() => this.points('challenges'));
  protected readonly solutions = computed(() => this.points('solutions'));
  protected readonly features = computed(() => this.points('features'));
  protected readonly results = computed(() => this.points('results'));
  protected readonly tools = computed(() =>
    (this.item()?.tools ?? []).filter(
      (entry) =>
        this.filled(entry.title) || this.filled(entry.body) || this.usableImage(entry.imageUrl),
    ),
  );
  protected readonly solutionsImage = computed(() => {
    const image = this.item()?.solutionsImage;
    return image && this.usableImage(image.imageUrl) ? image : null;
  });
  protected readonly coverUrl = computed(() => {
    const url = this.item()?.coverUrl ?? '';
    return this.usableImage(url) ? url : '';
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => {
        this.status.set('loading');
        this.api
          .get(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((project) => {
            this.item.set(project);
            this.status.set(project ? 'ready' : 'missing');
          });
      });
    });
  }

  protected title(project: Project): string {
    return readLocale(project.name, this.lang.language()) || project.name.ar;
  }

  protected summary(project: Project): string {
    return readLocale(project.summary, this.lang.language()) || project.summary.ar;
  }

  protected locale(value: LocaleText): string {
    return readLocale(value, this.lang.language()) || value.ar;
  }

  protected chooseTab(value: string | number | undefined): void {
    if (typeof value === 'string') {
      this.tab.set(value);
    }
  }

  protected visual(entry: Pick<ProjectPoint, 'imageUrl'> | ProjectMedia): PointVisual {
    const url = entry.imageUrl;
    if (!url) {
      return { icon: '', image: '' };
    }
    if (url.startsWith('icon:')) {
      const icon = url.slice('icon:'.length);
      return { icon: ICON_CLASS.test(icon) ? icon : '', image: '' };
    }
    return { icon: '', image: url };
  }

  private points(list: 'aboutCards' | 'challenges' | 'solutions' | 'features' | 'results') {
    return (this.item()?.[list] ?? []).filter((entry) => {
      const art = this.visual(entry);
      return this.filled(entry.title) || this.filled(entry.body) || !!art.image || !!art.icon;
    });
  }

  private filled(value: LocaleText): boolean {
    return value.ar.trim().length > 0 || value.en.trim().length > 0;
  }

  /** Real image paths / blob URLs only — blank and `icon:` values must not become `img[src]`. */
  private usableImage(url: string): boolean {
    return url.length > 0 && !url.startsWith('icon:');
  }
}
