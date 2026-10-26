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

import { LanguageService } from '../../../../core/services/language.service';
import { AppPaginator } from '../../../../shared/components/app-paginator/app-paginator';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { readLocale, type Project } from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-projects-page',
  imports: [
    FormsModule,
    PageHeader,
    RouterLink,
    ToggleSwitch,
    AppPaginator,
    ConfirmDialog,
    StateView,
  ],
  templateUrl: './projects-list.html',
  styleUrl: './projects-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);
  readonly api = inject(ProjectsService);
  readonly items = signal<Project[]>([]);
  readonly first = signal(0);
  readonly rows = signal(10);

  constructor() {
    this.api
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe((items) => this.items.set(items));
  }

  readonly visible = computed(() => this.items().slice(this.first(), this.first() + this.rows()));

  protected title(project: Project): string {
    return readLocale(project.name, this.lang.language()) || project.name.ar;
  }

  protected summary(project: Project): string {
    return readLocale(project.summary, this.lang.language()) || project.summary.ar;
  }

  protected tags(project: Project): { icon: string; label: string }[] {
    return project.categories.slice(0, 4).map((category) => ({
      icon: category.imageUrl.startsWith('icon:')
        ? `pi ${category.imageUrl.slice(5)}`
        : 'pi pi-tag',
      label: readLocale(category.title, this.lang.language()) || category.title.ar,
    }));
  }

  protected page(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? this.rows());
  }

  protected publish(id: string, published: boolean): void {
    this.api.setPublished(id, published);
    this.items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, published } : item)),
    );
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
      .subscribe(() => {
        this.items.update((items) => items.filter((item) => item.id !== project.id));
        this.messages.add({ severity: 'success', summary: this.lang.t('project.deleted') });
      });
  }
}
