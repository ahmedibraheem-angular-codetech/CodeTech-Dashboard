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
import { MessageService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';

import { isApiError } from '../../../../core/http/api-error';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ContentPanel } from '../../../../shared/components/content-panel/content-panel';
import { Modal } from '../../../../shared/components/modal/modal';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { formatIsoDate } from '../../../../shared/utils/date';
import { formatFileSize } from '../../../../shared/utils/file-size';
import { parseUploadedImage } from '../../../../shared/utils/image-upload';
import { type BlockImage, type Partner } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';

@Component({
  selector: 'app-partners-section',
  imports: [
    AppButton,
    Tooltip,
    SectionEmpty,
    ContentPanel,
    Modal,
    ConfirmDialog,
    HasPermissionDirective,
  ],
  templateUrl: './partners-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnersSection {
  private readonly api = inject(HomepageService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  readonly partners = input.required<Partner[]>();

  readonly changed = output<void>();

  readonly editorOpen = signal(false);
  readonly saving = signal(false);
  readonly image = signal<BlockImage | null>(null);

  readonly preview = signal<string | null>(null);

  readonly imageError = signal('');
  readonly imageSize = computed(() => formatFileSize(this.image()?.size ?? 0));
  readonly imageDate = computed(() =>
    formatIsoDate(this.image()?.uploadedAt ?? '1970-01-01', this.lang.language()),
  );

  download(partner: Partner): void {
    const href = partner.image?.downloadUrl || partner.image?.url;
    if (!href) {
      return;
    }
    const link = document.createElement('a');
    link.href = href;
    link.download = partner.image?.name || partner.name;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
  }

  open(): void {
    this.clearImage();
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
    this.clearImage();
    this.imageError.set('');
  }

  save(): void {
    const image = this.image();
    if (!image?.file || this.saving()) {
      return;
    }
    const base = image.name.replace(/\.[^.]+$/, '').trim() || image.name;
    const partner: Partner = {
      id: 'new',
      name: base,
      monogram: base.charAt(0),
      image,
    };
    this.saving.set(true);
    this.api
      .savePartner(partner)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editorOpen.set(false);
          this.clearImage();
          this.changed.emit();
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('home.toastPartnerAddSuccess'),
          });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.messages.add({
            severity: 'error',
            summary: this.errorMessage(error, 'home.toastPartnerAddError'),
          });
        },
      });
  }

  async remove(partner: Partner): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('home.deleteTitle'),
      message: this.lang.t('home.deletePartner'),
      confirmLabel: this.lang.t('users.delete'),
      cancelLabel: this.lang.t('common.back'),
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
        error: (error: unknown) =>
          this.messages.add({
            severity: 'error',
            summary: this.errorMessage(error, 'common.error'),
          }),
      });
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
    if (!file) {
      return;
    }
    this.clearImage();
    this.imageError.set('');
    this.preview.set(URL.createObjectURL(file));
    this.image.set({ ...result.image, file, url: undefined });
  }

  private clearImage(): void {
    const preview = this.preview();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    this.preview.set(null);
    this.image.set(null);
  }

  private errorMessage(error: unknown, fallbackKey: string): string {
    if (isApiError(error) && error.serverMessage) {
      return error.serverMessage;
    }
    return this.lang.t(fallbackKey);
  }
}
