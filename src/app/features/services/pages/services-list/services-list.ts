import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { type PaginatorState } from 'primeng/paginator';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { AppPaginator } from '../../../../shared/components/app-paginator/app-paginator';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { ServiceCard } from '../../components/service-card/service-card';
import { readLocale, type Service } from '../../models/service.model';
import { ServicesService } from '../../services/services.service';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-services-page',
  imports: [PageHeader, AppButton, AppPaginator, ConfirmDialog, StateView, ServiceCard],
  templateUrl: './services-list.html',
  styleUrl: './services-list.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesPage {
  private readonly api = inject(ServicesService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);
  readonly items = signal<Service[]>([]);
  readonly status = signal<LoadState>('loading');
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly visible = computed(() => this.items().slice(this.first(), this.first() + this.rows()));
  /** Bumps on every load so a slower, older response cannot overwrite a newer one. */
  private loadSeq = 0;

  constructor() {
    this.load();
  }

  protected name(service: Service): string {
    return readLocale(service.name, this.lang.language()) || service.name.ar;
  }

  protected description(service: Service): string {
    return readLocale(service.description, this.lang.language()) || service.description.ar;
  }

  protected page(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? this.rows());
  }

  protected add(): void {
    void this.router.navigate(['/services', 'new']);
  }

  protected open(service: Service): void {
    void this.router.navigate(['/services', service.id]);
  }

  protected edit(service: Service): void {
    void this.router.navigate(['/services', service.id, 'edit']);
  }

  protected publish(id: string, published: boolean): void {
    this.api.setPublished(id, published);
    this.items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, published } : item)),
    );
  }

  protected retry(): void {
    this.load();
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
      .subscribe({
        next: () => {
          this.items.update((items) => items.filter((item) => item.id !== service.id));
          this.stepBackIfPageEmpty();
          this.messages.add({ severity: 'success', summary: this.lang.t('service.deleted') });
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  private load(): void {
    const seq = ++this.loadSeq;
    this.status.set('loading');
    this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          if (seq !== this.loadSeq) {
            return;
          }
          this.items.set(items);
          this.status.set('ready');
        },
        error: () => {
          if (seq !== this.loadSeq) {
            return;
          }
          this.status.set('error');
        },
      });
  }

  /** Removing the last card of a later page would otherwise leave an empty page behind. */
  private stepBackIfPageEmpty(): void {
    const total = this.items().length;
    if (this.first() > 0 && this.first() >= total) {
      this.first.set(Math.max(0, Math.floor((total - 1) / this.rows()) * this.rows()));
    }
  }
}
