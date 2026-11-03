import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { type FileSelectEvent, FileUpload } from 'primeng/fileupload';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';

import { isApiError } from '../../../../core/http/api-error';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { HOME_VIDEO_MAX_BYTES } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';

@Component({
  selector: 'app-video-section',
  imports: [
    FormsModule,
    AppButton,
    FileUpload,
    ToggleSwitch,
    Tooltip,
    SectionEmpty,
    ConfirmDialog,
    HasPermissionDirective,
  ],
  templateUrl: './video-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoSection {
  private readonly api = inject(HomepageService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly upload = viewChild(FileUpload);
  readonly lang = inject(LanguageService);

  readonly enabled = model.required<boolean>();

  readonly name = model.required<string | null>();

  readonly url = model.required<string | null>();

  readonly playing = signal(false);
  readonly saving = signal(false);

  play(): void {
    if (this.enabled() && this.url()) {
      this.playing.set(true);
    }
  }

  toggle(enabled: boolean): void {
    const previous = this.enabled();
    this.enabled.set(enabled);
    if (!enabled) {
      this.playing.set(false);
    }
    this.api
      .setVideoEnabled(enabled)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.enabled.set(content.videoEnabled);
          this.name.set(content.videoName);
          this.url.set(content.videoUrl);
        },
        error: (error: unknown) => {
          this.enabled.set(previous);
          this.messages.add({
            severity: 'error',
            summary: this.errorMessage(error, 'home.toastVideoUploadError'),
          });
        },
      });
  }

  onSelected(event: FileSelectEvent): void {
    const file = event.files[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('video/')) {
      return;
    }
    if (file.size > HOME_VIDEO_MAX_BYTES) {
      this.upload()?.clear();
      this.messages.add({
        severity: 'error',
        summary: this.lang.t('home.videoSize'),
      });
      return;
    }
    this.saving.set(true);
    this.api
      .setVideo(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.saving.set(false);
          this.name.set(content.videoName);
          this.url.set(content.videoUrl);
          this.enabled.set(content.videoEnabled);
          this.playing.set(false);
          this.upload()?.clear();
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('home.toastVideoUpdateSuccess'),
          });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.upload()?.clear();
          this.messages.add({
            severity: 'error',
            summary: this.errorMessage(error, 'home.toastVideoUploadError'),
          });
        },
      });
  }

  async remove(): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('home.deleteVideo'),
      message: this.lang.t('home.deleteVideoMessage'),
      confirmLabel: this.lang.t('users.delete'),
      cancelLabel: this.lang.t('common.back'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .removeVideo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.playing.set(false);
          this.name.set(content.videoName);
          this.url.set(content.videoUrl);
          this.enabled.set(content.videoEnabled);
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('home.toastVideoDeleteSuccess'),
          });
        },
        error: (error: unknown) =>
          this.messages.add({
            severity: 'error',
            summary: this.errorMessage(error, 'home.toastVideoDeleteError'),
          }),
      });
  }

  private errorMessage(error: unknown, fallbackKey: string): string {
    if (isApiError(error) && error.serverMessage) {
      return error.serverMessage;
    }
    return this.lang.t(fallbackKey);
  }
}
