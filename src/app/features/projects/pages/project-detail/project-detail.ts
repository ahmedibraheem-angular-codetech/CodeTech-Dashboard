import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageTabs, type PageTab } from '../../../../shared/components/page-tabs/page-tabs';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { ProjectDetailData } from '../../components/project-detail-data/project-detail-data';
import { ProjectDetailGallery } from '../../components/project-detail-gallery/project-detail-gallery';
import { ProjectDetailIdentity } from '../../components/project-detail-identity/project-detail-identity';
import { ProjectDetailSeo } from '../../components/project-detail-seo/project-detail-seo';
import { readLocale, readMedia, type Project } from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';
import { usableProjectImage } from '../../utils/project-detail-visual';

@Component({
  selector: 'app-project-detail',
  imports: [
    PageHeader,
    RouterLink,
    StateView,
    PageTabs,
    HasPermissionDirective,
    ProjectDetailData,
    ProjectDetailGallery,
    ProjectDetailIdentity,
    ProjectDetailSeo,
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPage {
  private readonly api = inject(ProjectsService);
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

  protected readonly coverUrl = computed(() => {
    const project = this.item();
    if (!project) {
      return '';
    }
    const url = readMedia(project.cover, this.lang.language()).imageUrl;
    return usableProjectImage(url) ? url : '';
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          this.status.set('loading');
          return this.api.get(id);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((project) => {
        this.item.set(project);
        this.status.set(project ? 'ready' : 'missing');
      });
  }

  protected title(project: Project): string {
    return readLocale(project.name, this.lang.language()) || project.name.ar;
  }

  protected chooseTab(value: string | number | undefined): void {
    if (typeof value === 'string') {
      this.tab.set(value);
    }
  }
}
