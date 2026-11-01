import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { AuthService } from '../../../../core/auth/auth.service';
import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { readLocale, type LocaleText } from '../../models/project.model';
import { type ProjectsPageContent, type ProjectsPageStat } from '../../models/projects-page.model';
import { ProjectsPageService } from '../../services/projects-page.service';

@Component({
  selector: 'app-projects-page-manage',
  imports: [
    ConfirmDialog,
    FormsModule,
    InputText,
    LocaleSwitch,
    Modal,
    PageHeader,
    StateView,
    ToggleSwitch,
    HasPermissionDirective,
  ],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPageManage {
  private readonly api = inject(ProjectsPageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly auth = inject(AuthService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);
  readonly status = signal<'loading' | 'ready'>('loading');
  readonly content = signal<ProjectsPageContent | null>(null);
  readonly editorOpen = signal(false);
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly drafts = signal<ProjectsPageStat[]>([]);
  readonly saving = signal(false);

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('projects.update');
  });
  readonly canDelete = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('projects.delete');
  });

  constructor() {
    effect(() => {
      untracked(() => this.load());
    });
  }

  protected text(value: LocaleText): string {
    return readLocale(value, this.lang.language()) || value.ar;
  }

  protected draftText(value: LocaleText): string {
    return readLocale(value, this.locale());
  }

  protected copy(key: string): string {
    return this.lang.lookup(key, this.locale()) ?? key;
  }

  protected editorDir(): 'rtl' | 'ltr' {
    return this.locale() === 'ar' ? 'rtl' : 'ltr';
  }

  protected canSave(): boolean {
    const items = this.drafts();
    return items.length > 0 && items.every((item) => this.draftText(item.label).trim());
  }

  protected toggleNumbers(enabled: boolean): void {
    this.api.toggleNumbers(enabled);
    this.content.update((current) => (current ? { ...current, numbersEnabled: enabled } : current));
  }

  protected openNumbersEditor(): void {
    const page = this.content();
    if (!page) {
      return;
    }
    this.locale.set(this.lang.language());
    this.drafts.set(structuredClone(page.numbers));
    this.editorOpen.set(true);
  }

  protected setDraftField(index: number, field: 'label' | 'value', event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const value = target.value;
    const language = this.locale();
    this.drafts.update((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: { ...item[field], [language]: value } } : item,
      ),
    );
  }

  protected removeDraft(index: number): void {
    this.drafts.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  protected saveNumbers(): void {
    if (!this.canSave()) {
      return;
    }
    this.saving.set(true);
    this.api
      .saveNumbers(this.drafts())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (numbers) => {
          this.content.update((current) => (current ? { ...current, numbers } : current));
          this.saving.set(false);
          this.editorOpen.set(false);
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('project.page.statSaved'),
          });
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  protected async removeStat(stat: ProjectsPageStat): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('project.page.deleteStatTitle'),
      message: this.lang.t('project.page.deleteStatMessage'),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .removeStat(stat.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.content.update((current) =>
            current
              ? { ...current, numbers: current.numbers.filter((item) => item.id !== stat.id) }
              : current,
          );
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('project.page.statDeleted'),
          });
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  private load(): void {
    this.status.set('loading');
    this.api
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((content) => {
        this.content.set(content);
        this.status.set('ready');
      });
  }
}
