import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { type PaginatorState } from 'primeng/paginator';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { forkJoin } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { loadFailureStatus } from '../../../../core/http/api-error';
import { LanguageService } from '../../../../core/services/language.service';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import { AppPaginator } from '../../../../shared/components/app-paginator/app-paginator';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { readLocale, readMedia, type Project } from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';

type LoadState = 'loading' | 'ready' | 'error' | 'offline';

@Component({
  selector: 'app-projects-list',
  imports: [
    FormsModule,
    PageHeader,
    RouterLink,
    ToggleSwitch,
    AppPaginator,
    ConfirmDialog,
    StateView,
    HasPermissionDirective,
  ],
  templateUrl: './projects-list.html',
  styleUrl: './projects-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsList {
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private readonly network = inject(NetworkStatusService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);
  readonly api = inject(ProjectsService);
  readonly items = signal<Project[]>([]);
  readonly status = signal<LoadState>('loading');
  readonly first = signal(0);
  readonly rows = signal(10);
  /** Bumps on every load so a slower, older response cannot overwrite a newer one. */
  private loadSeq = 0;

  constructor() {
    this.load();
  }

  readonly visible = computed(() => this.items().slice(this.first(), this.first() + this.rows()));

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('projects.update');
  });
  readonly canDelete = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('projects.delete');
  });

  protected title(project: Project): string {
    return readLocale(project.name, this.lang.language()) || project.name.ar;
  }

  protected summary(project: Project): string {
    return readLocale(project.summary, this.lang.language()) || project.summary.ar;
  }

  protected coverSrc(project: Project): string {
    const value = readMedia(project.cover, this.lang.language()).imageUrl.trim();
    return value.length > 0 && !value.startsWith('icon:') ? value : '';
  }

  protected tags(project: Project): { icon: string; label: string }[] {
    const language = this.lang.language();
    return project.categories.slice(0, 4).map((category) => {
      const url = readMedia(category.image, language).imageUrl;
      return {
        icon: url.startsWith('icon:') ? `pi ${url.slice(5)}` : 'pi pi-tag',
        label: readLocale(category.title, language) || category.title.ar,
      };
    });
  }

  protected page(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? this.rows());
  }

  protected publish(id: string, published: boolean): void {
    this.api
      .setPublished(id, published)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.items.update((items) =>
            items.map((item) => (item.id === id ? { ...item, published: saved.published } : item)),
          );
        },
        error: () => {
          this.items.update((items) =>
            items.map((item) => (item.id === id ? { ...item, published: !published } : item)),
          );
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
    this.items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, published } : item)),
    );
  }

  protected retry(): void {
    this.load();
  }

  protected async remove(project: Project): Promise<void> {
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
          this.items.update((items) => items.filter((item) => item.id !== project.id));
          this.stepBackIfPageEmpty();
          this.messages.add({ severity: 'success', summary: this.lang.t('project.deleted') });
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  private load(): void {
    const seq = ++this.loadSeq;
    this.status.set('loading');
    forkJoin({
      items: this.api.listAll(),
      visible: this.api.loadCatalogVisibility(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          if (seq !== this.loadSeq) {
            return;
          }
          this.items.set(items);
          this.status.set('ready');
        },
        error: (error: unknown) => {
          if (seq !== this.loadSeq) {
            return;
          }
          if (this.items().length > 0) {
            return;
          }
          this.status.set(loadFailureStatus(error, this.network.online()));
        },
      });
  }

  private stepBackIfPageEmpty(): void {
    const total = this.items().length;
    if (this.first() > 0 && this.first() >= total) {
      this.first.set(Math.max(0, Math.floor((total - 1) / this.rows()) * this.rows()));
    }
  }
}
