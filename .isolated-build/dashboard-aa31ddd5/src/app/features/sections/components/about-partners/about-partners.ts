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
import { type AboutImage, type AboutPartner } from '../../models/about.model';
import { AboutService } from '../../services/about.service';

@Component({
  selector: 'app-about-partners',
  imports: [
    AppButton,
    Tooltip,
    SectionEmpty,
    ContentPanel,
    Modal,
    ConfirmDialog,
    HasPermissionDirective,
  ],
  templateUrl: './about-partners.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPartnersSection {
  private readonly api = inject(AboutService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  readonly partners = input.required<AboutPartner[]>();
  readonly changed = output<AboutPartner[]>();

  readonly editorOpen = signal(false);
  readonly saving = signal(false);
  readonly image = signal<AboutImage | null>(null);
  readonly preview = signal<string | null>(null);
  readonly imageError = signal('');
  readonly imageSize = computed(() => formatFileSize(this.image()?.size ?? 0));
  readonly imageDate = computed(() =>
    formatIsoDate(this.image()?.uploadedAt ?? '1970-01-01', this.lang.language()),
  );

  download(partner: AboutPartner): void {
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
    const partner: AboutPartner = {
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
          this.reload();
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('about.toastPartnerAddSuccess'),
          });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.messages.add({
            severity: 'error',
            summary:
              isApiError(error) && error.serverMessage
                ? error.serverMessage
                : this.lang.t('about.toastAddError'),
          });
        },
      });
  }

  async remove(partner: AboutPartner): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('about.deletePartnerTitle'),
      message: this.lang.t('about.deletePartner'),
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
        next: () => {
          this.reload();
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('about.toastPartnerDeleteSuccess'),
          });
        },
        error: (error: unknown) =>
          this.messages.add({
            severity: 'error',
            summary:
              isApiError(error) && error.serverMessage
                ? error.serverMessage
                : this.lang.t('about.toastDeleteError'),
          }),
      });
  }

  private reload(): void {
    this.api
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => this.changed.emit(content.partners),
        error: (error: unknown) =>
          this.messages.add({
            severity: 'error',
            summary:
              isApiError(error) && error.serverMessage
                ? error.serverMessage
                : this.lang.t('about.toastSaveError'),
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
}
