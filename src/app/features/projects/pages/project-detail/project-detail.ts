import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { switchMap } from 'rxjs';

import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageTabs, type PageTab } from '../../../../shared/components/page-tabs/page-tabs';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { ProjectDetailData } from '../../components/project-detail-data/project-detail-data';
import { ProjectDetailGallery } from '../../components/project-detail-gallery/project-detail-gallery';
import { ProjectDetailIdentity } from '../../components/project-detail-identity/project-detail-identity';
import { ProjectDetailSeo } from '../../components/project-detail-seo/project-detail-seo';
import { PROJECT_STEPS } from '../../constants/project-steps';
import { readLocale, type Project } from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-project-detail',
  imports: [
    PageHeader,
    RouterLink,
    StateView,
    PageTabs,
    ConfirmDialog,
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);
  readonly id = input.required<string>();
  readonly item = signal<Project | null>(null);
  readonly status = signal<'loading' | 'ready' | 'missing'>('loading');
  readonly tab = signal<string>(PROJECT_STEPS[0].id);
  readonly tabs: readonly PageTab[] = PROJECT_STEPS.map(({ id, labelKey }) => ({ id, labelKey }));

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          this.status.set('loading');
          this.tab.set(PROJECT_STEPS[0].id);
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

  protected summary(project: Project): string {
    return readLocale(project.summary, this.lang.language()) || project.summary.ar;
  }

  protected chooseTab(value: string | number | undefined): void {
    if (typeof value === 'string') {
      this.tab.set(value);
    }
  }

  protected async removeProject(): Promise<void> {
    const project = this.item();
    if (!project) {
      return;
    }
    const accepted = await this.confirm().ask({
      title: this.lang.t('project.deleteTitle'),
      message: this.lang.t('project.deleteMessage'),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .remove(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: this.lang.t('project.deleted') });
          void this.router.navigate(['/projects']);
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }
}
