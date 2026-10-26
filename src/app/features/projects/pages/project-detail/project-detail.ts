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
import { readLocale, type Project } from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';

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

  protected locale(value: { ar: string; en: string }): string {
    return readLocale(value, this.lang.language()) || value.ar;
  }

  protected chooseTab(value: string | number | undefined): void {
    if (typeof value === 'string') {
      this.tab.set(value);
    }
  }
}
