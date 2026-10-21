import { NgTemplateOutlet } from '@angular/common';
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
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../../shared/components/modal/modal';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { Inquiry, InquiryStatus } from '../../models/inquiry.model';
import { InquiriesService } from '../../services/inquiries.service';
import { InquiryDetailComposer } from './components/inquiry-detail-composer/inquiry-detail-composer';
import { InquiryDetailDetails } from './components/inquiry-detail-details/inquiry-detail-details';
import { InquiryDetailHeader } from './components/inquiry-detail-header/inquiry-detail-header';
import {
  InquiryDetailTimeline,
  type InquiryTimelineStep,
} from './components/inquiry-detail-timeline/inquiry-detail-timeline';

type Status = 'loading' | 'ready' | 'error' | 'missing';
type Composer = 'note' | 'reply';

/**
 * Inquiry detail container: loads the request, owns note/reply/close/delete
 * workflows, and composes header, details, timeline, and composer panels.
 */
@Component({
  selector: 'app-inquiry-detail',
  imports: [
    NgTemplateOutlet,
    ConfirmDialog,
    Modal,
    StateView,
    InquiryDetailHeader,
    InquiryDetailDetails,
    InquiryDetailTimeline,
    InquiryDetailComposer,
  ],
  templateUrl: './inquiry-detail.html',
  styleUrl: './inquiry-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiryDetailPage {
  private readonly api = inject(InquiriesService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  /** Bound from `/contact/inquiries/:id` or `/contact/start/:id`. */
  readonly id = input.required<string>();

  readonly status = signal<Status>('loading');
  readonly item = signal<Inquiry | null>(null);
  readonly composer = signal<Composer | null>(null);
  readonly saving = signal(false);
  readonly draft = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  readonly badge = computed(() => {
    const item = this.item();
    if (!item) {
      return null;
    }
    return { tone: item.status, label: this.statusLabel(item.status) };
  });

  readonly steps = computed(() => this.buildSteps(this.item()));

  readonly composerCopy = computed(() => {
    const reply = this.composer() === 'reply';
    return {
      title: this.lang.t(reply ? 'inquiry.addReplyTitle' : 'inquiry.addNoteTitle'),
      field: this.lang.t(reply ? 'inquiry.replyField' : 'inquiry.noteField'),
      save: this.lang.t(reply ? 'inquiry.send' : 'inquiry.add'),
      error: this.lang.t(reply ? 'inquiry.replyRequired' : 'inquiry.noteRequired'),
    };
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  protected openComposer(kind: Composer): void {
    this.draft.reset('');
    this.composer.set(kind);
  }

  protected saveComposer(): void {
    const kind = this.composer();
    const current = this.item();
    if (!kind || !current || this.saving()) {
      return;
    }
    if (this.draft.invalid) {
      this.draft.markAsTouched();
      return;
    }
    const body = this.draft.value.trim();
    this.saving.set(true);
    const request =
      kind === 'note' ? this.api.addNote(current.id, body) : this.api.addReply(current.id, body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (item) => {
        this.item.set(item);
        this.saving.set(false);
        this.composer.set(null);
        this.messages.add({
          severity: 'success',
          summary: this.lang.t(kind === 'note' ? 'inquiry.savedNote' : 'inquiry.sentReply'),
        });
      },
      error: () => this.fail(),
    });
  }

  protected closeRequest(): void {
    const current = this.item();
    if (!current || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.api
      .close(current.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item) => {
          this.item.set(item);
          this.saving.set(false);
          this.messages.add({ severity: 'success', summary: this.lang.t('inquiry.closed') });
        },
        error: () => this.fail(),
      });
  }

  protected async remove(): Promise<void> {
    const current = this.item();
    if (!current) {
      return;
    }
    const accepted = await this.confirm().ask({
      title: this.lang.t('inquiry.deleteTitle'),
      message: this.lang.t('inquiry.deleteMessage'),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .remove(current.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: this.lang.t('inquiry.deleted') });
          void this.router.navigate([this.listPath()]);
        },
        error: () => this.fail(),
      });
  }

  protected reload(): void {
    this.load(this.id());
  }

  /** Delete returns to the list that opened this request. */
  private listPath(): string {
    const path = this.router.url.split('?')[0];
    return path.startsWith('/contact/start') ? '/contact/start' : '/contact/inquiries';
  }

  private load(id: string): void {
    this.status.set('loading');
    this.api
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item) => {
          this.item.set(item);
          this.status.set(item ? 'ready' : 'missing');
        },
        error: () => this.status.set('error'),
      });
  }

  private statusLabel(status: InquiryStatus): string {
    if (status === 'progress') {
      return this.lang.t('inquiry.statusProgress');
    }
    if (status === 'closed') {
      return this.lang.t('inquiry.statusClosed');
    }
    return this.lang.t('inquiry.statusNew');
  }

  private buildSteps(item: Inquiry | null): InquiryTimelineStep[] {
    if (!item) {
      return [];
    }
    const note = item.notes.at(-1);
    const reply = item.reply;
    const closed = item.status === 'closed';
    return [
      {
        id: 'received',
        title: this.lang.t('inquiry.stepReceived'),
        hint: this.lang.t('inquiry.stepReceivedHint'),
        state: 'done',
        date: item.date,
        time: item.time,
      },
      {
        id: 'note',
        title: note
          ? this.lang.t('inquiry.stepNote').replace('{name}', note.author)
          : this.lang.t('inquiry.stepNotePending'),
        hint: this.lang.t('inquiry.stepNoteHint'),
        state: note ? 'done' : 'current',
        date: note?.date ?? item.date,
        time: note?.time ?? item.time,
      },
      {
        id: 'follow',
        title: this.lang.t(reply ? 'inquiry.stepReply' : 'inquiry.stepFollowup'),
        hint: this.lang.t(reply ? 'inquiry.stepReplyHint' : 'inquiry.stepFollowupHint'),
        state: reply ? 'done' : note ? 'current' : 'todo',
        date: reply?.date ?? item.date,
        time: reply?.time ?? item.time,
      },
      {
        id: 'done',
        title: this.lang.t('inquiry.stepDone'),
        hint: this.lang.t('inquiry.stepDoneHint'),
        state: closed ? 'done' : reply ? 'current' : 'todo',
        date: item.date,
        time: item.time,
      },
    ];
  }

  private fail(): void {
    this.saving.set(false);
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }
}
