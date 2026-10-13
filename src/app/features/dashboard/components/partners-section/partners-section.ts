import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';

import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ContentPanel } from '../../../../shared/components/content-panel/content-panel';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { Partner } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';

@Component({
  selector: 'app-partners-section',
  imports: [
    ReactiveFormsModule,
    Button,
    Dialog,
    InputText,
    Tooltip,
    SectionEmpty,
    ContentPanel,
    ConfirmDialog,
  ],
  templateUrl: './partners-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnersSection {
  private readonly api = inject(HomepageService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  readonly partners = input.required<Partner[]>();
  /** Emitted after a partner was added, edited or removed, so the parent can reload. */
  readonly changed = output<void>();

  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    monogram: ['', [Validators.required, Validators.maxLength(2)]],
  });

  download(partner: Partner): void {
    const link = document.createElement('a');
    link.href = 'images/codeTech.svg';
    link.download = `${partner.name}.svg`;
    link.click();
  }

  open(partner?: Partner): void {
    this.editingId.set(partner?.id ?? null);
    this.form.reset({ name: partner?.name ?? '', monogram: partner?.monogram ?? '' });
    this.editorOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) {
      return;
    }
    const value = this.form.getRawValue();
    const partner: Partner = {
      id: this.editingId() ?? crypto.randomUUID(),
      name: value.name.trim(),
      monogram: value.monogram.trim(),
    };
    this.saving.set(true);
    this.api
      .savePartner(partner)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editorOpen.set(false);
          this.changed.emit();
          this.messages.add({ severity: 'success', summary: this.lang.t('common.save') });
        },
        error: () => {
          this.saving.set(false);
          this.notifyFailure();
        },
      });
  }

  async remove(partner: Partner): Promise<void> {
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
      .subscribe({
        next: () => this.changed.emit(),
        error: () => this.notifyFailure(),
      });
  }

  private notifyFailure(): void {
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }
}
