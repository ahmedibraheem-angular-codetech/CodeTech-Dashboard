import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputText } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ContentPanel } from '../../../../shared/components/content-panel/content-panel';
import { Modal } from '../../../../shared/components/modal/modal';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { formatIsoDate } from '../../../../shared/utils/date';
import { formatFileSize } from '../../../../shared/utils/file-size';
import { parseUploadedImage } from '../../../../shared/utils/image-upload';
import { AboutImage, AboutMember } from '../../models/about.model';
import { AboutService } from '../../services/about.service';

function control(value: string): FormControl<string> {
  return new FormControl(value, { nonNullable: true, validators: [Validators.required] });
}

@Component({
  selector: 'app-about-team',
  imports: [
    ReactiveFormsModule,
    AppButton,
    InputText,
    Tooltip,
    ConfirmDialog,
    ContentPanel,
    Modal,
    SectionEmpty,
  ],
  templateUrl: './about-team.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutTeamSection {
  private readonly api = inject(AboutService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  private readonly confirm = viewChild.required(ConfirmDialog);

  readonly team = input.required<AboutMember[]>();
  readonly changed = output<AboutMember[]>();

  readonly editorOpen = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly image = signal<AboutImage | null>(null);
  readonly imageError = signal('');

  readonly imageSize = computed(() => formatFileSize(this.image()?.size ?? 0));
  readonly imageDate = computed(() =>
    formatIsoDate(this.image()?.uploadedAt ?? '1970-01-01', this.lang.language()),
  );

  readonly form = new FormGroup({
    name: control(''),
    role: control(''),
  });

  download(member: AboutMember): void {
    const link = document.createElement('a');
    link.href = 'images/avatar-placeholder.svg';
    link.download = `${member.name}.svg`;
    link.click();
  }

  open(member?: AboutMember): void {
    this.editingId.set(member?.id ?? null);
    this.form.setValue({ name: member?.name ?? '', role: member?.role ?? '' });
    this.form.markAsPristine();
    this.image.set(member?.image ?? null);
    this.imageError.set('');
    this.editorOpen.set(true);
  }

  onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.takeImage(input.files?.[0]);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.takeImage(event.dataTransfer?.files?.[0]);
  }

  removeImage(): void {
    this.image.set(null);
    this.imageError.set('');
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const member: AboutMember = {
      id: this.editingId() ?? crypto.randomUUID(),
      name: value.name.trim(),
      role: value.role.trim(),
      image: this.image(),
    };
    this.saving.set(true);
    this.api
      .saveMember(member)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editorOpen.set(false);
          this.messages.add({ severity: 'success', summary: this.lang.t('common.save') });
          this.reload();
        },
        error: () => this.fail(),
      });
  }

  async remove(member: AboutMember): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('about.deleteMemberTitle'),
      message: this.lang.t('about.deleteMember'),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.back'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .removeMember(member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.reload(),
        error: () => this.fail(),
      });
  }

  private reload(): void {
    this.api
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => this.changed.emit(content.team),
        error: () => this.fail(),
      });
  }

  private fail(): void {
    this.saving.set(false);
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }

  private takeImage(file: File | undefined): void {
    const result = parseUploadedImage(file);
    if (!result) {
      return;
    }
    if (!result.ok) {
      this.imageError.set(result.errorKey);
      return;
    }
    this.imageError.set('');
    this.image.set(result.image);
  }
}
