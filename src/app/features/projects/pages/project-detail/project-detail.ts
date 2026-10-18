import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { StateView } from '../../../../shared/components/state-view/state-view';
import type { Project } from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-project-detail',
  imports: [PageHeader, RouterLink, StateView],
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
}
