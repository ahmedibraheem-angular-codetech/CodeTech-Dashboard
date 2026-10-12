import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { User } from '../../../users/models/user.model';
import { UsersService } from '../../../users/services/users.service';
import { ContentBlock, Partner } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';

type Status = 'loading' | 'ready' | 'error';
type Editor = 'partner' | 'about' | 'vision' | null;

@Component({
  selector: 'app-home',
  imports: [NgTemplateOutlet, ReactiveFormsModule, FormsModule, Dialog, ToggleSwitch, PageHeader, StateView, ConfirmDialog, RouterLink, TableModule, StatusBadge],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly api = inject(HomepageService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly usersApi = inject(UsersService);
  readonly lang = inject(LanguageService);
  readonly recentUsers = signal<User[]>([]);
  readonly userTotal = signal(0);
  readonly activeUsers = signal(0);

  readonly status = signal<Status>('loading');
  readonly partners = signal<Partner[]>([]);
  readonly videoEnabled = signal(true);
  readonly videoName = signal<string | null>(null);
  readonly about = signal<ContentBlock | null>(null);
  readonly vision = signal<ContentBlock | null>(null);
  readonly editor = signal<Editor>(null);
  readonly editingPartnerId = signal<string | null>(null);
  readonly tiles = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly activity = [
    { text: 'home.activityOne', time: 'home.activityTimeOne' },
    { text: 'home.activityTwo', time: 'home.activityTimeTwo' },
    { text: 'home.activityThree', time: 'home.activityTimeThree' },
  ] as const;

  readonly partnerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    monogram: ['', [Validators.required, Validators.maxLength(2)]],
  });

  readonly blockForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    body: ['', Validators.required],
    point1: ['', Validators.required],
    point2: ['', Validators.required],
    point3: ['', Validators.required],
  });

  constructor() {
    this.reload();
    this.usersApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => {
        this.recentUsers.set(users.slice(0, 5));
        this.userTotal.set(users.length);
        this.activeUsers.set(users.filter((user) => user.status === 'active').length);
      });
  }

  reload(silent = false): void {
    if (!silent) {
      this.status.set('loading');
    }
    this.api
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.partners.set(content.partners);
          this.videoEnabled.set(content.videoEnabled);
          this.videoName.set(content.videoName);
          this.about.set(content.about);
          this.vision.set(content.vision);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }

  toggleVideo(enabled: boolean): void {
    this.videoEnabled.set(enabled);
    this.api.setVideoEnabled(enabled);
  }

  openPartner(partner?: Partner): void {
    this.editingPartnerId.set(partner?.id ?? null);
    this.partnerForm.reset({ name: partner?.name ?? '', monogram: partner?.monogram ?? '' });
    this.editor.set('partner');
  }

  savePartner(): void {
    if (this.partnerForm.invalid) {
      this.partnerForm.markAllAsTouched();
      return;
    }
    const value = this.partnerForm.getRawValue();
    const partner: Partner = {
      id: this.editingPartnerId() ?? crypto.randomUUID(),
      name: value.name.trim(),
      monogram: value.monogram.trim(),
    };
    this.api
      .savePartner(partner)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.editor.set(null);
        this.reload(true);
        this.toast('common.save');
      });
  }

  async removePartner(partner: Partner): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('home.deleteTitle'),
      message: this.lang.t('home.deletePartner'),
      confirmLabel: this.lang.t('users.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .removePartner(partner.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload(true));
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.api
      .setVideoName(file.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.videoName.set(file.name);
        input.value = '';
      });
  }

  async removeVideo(): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('home.deleteVideo'),
      message: this.lang.t('home.deleteVideoMessage'),
      confirmLabel: this.lang.t('users.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .setVideoName(null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.videoName.set(null));
  }

  openBlock(kind: string): void {
    if (kind !== 'about' && kind !== 'vision') {
      return;
    }
    const block = kind === 'about' ? this.about() : this.vision();
    if (!block) {
      return;
    }
    this.blockForm.reset({
      title: block.title,
      body: block.body,
      point1: block.points[0],
      point2: block.points[1],
      point3: block.points[2],
    });
    this.editor.set(kind);
  }

  saveBlock(): void {
    const kind = this.editor();
    if ((kind !== 'about' && kind !== 'vision') || this.blockForm.invalid) {
      this.blockForm.markAllAsTouched();
      return;
    }
    const value = this.blockForm.getRawValue();
    const block: ContentBlock = {
      title: value.title.trim(),
      body: value.body.trim(),
      points: [value.point1.trim(), value.point2.trim(), value.point3.trim()],
    };
    this.api
      .saveBlock(kind, block)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (kind === 'about') {
          this.about.set(saved);
        } else {
          this.vision.set(saved);
        }
        this.editor.set(null);
        this.toast('common.save');
      });
  }

  private toast(key: string): void {
    this.messages.add({ severity: 'success', summary: this.lang.t(key) });
  }
}
