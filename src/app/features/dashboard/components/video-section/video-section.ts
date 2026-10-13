import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { FileSelectEvent, FileUpload } from 'primeng/fileupload';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';

import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { HomepageService } from '../../services/homepage.service';

@Component({
  selector: 'app-video-section',
  imports: [FormsModule, Button, FileUpload, ToggleSwitch, Tooltip, SectionEmpty, ConfirmDialog],
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

  /** Two-way bound by the parent: `[(enabled)]="videoEnabled"`. */
  readonly enabled = model.required<boolean>();
  /** Two-way bound by the parent: `[(name)]="videoName"`. */
  readonly name = model.required<string | null>();

  /**
   * TEMPORARY: fixed YouTube video until the backend returns the uploaded video URL.
   * Replace with the URL from `HomepageService` once it exists.
   */
  readonly videoSrc: SafeResourceUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(
    'https://www.youtube.com/embed/X5xvlXV9crE',
  );

  toggle(enabled: boolean): void {
    this.enabled.set(enabled);
    this.api.setVideoEnabled(enabled);
  }

  onSelected(event: FileSelectEvent): void {
    const file = event.files[0];
    // `p-fileupload` already shows its own message for rejected files but still emits the event.
    if (!file?.type.startsWith('video/')) {
      return;
    }
    this.api
      .setVideoName(file.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.name.set(file.name);
          this.upload()?.clear();
        },
        error: () => this.notifyFailure(),
      });
  }

  async remove(): Promise<void> {
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
      .subscribe({
        next: () => this.name.set(null),
        error: () => this.notifyFailure(),
      });
  }

  private notifyFailure(): void {
    this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
  }
}
