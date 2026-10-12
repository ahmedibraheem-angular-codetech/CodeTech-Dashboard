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
import { MessageService } from 'primeng/api';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HomepageService } from '../../services/homepage.service';

@Component({
  selector: 'app-video-section',
  imports: [FormsModule, ToggleSwitch, StateView, ConfirmDialog],
  templateUrl: './video-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoSection {
  private readonly api = inject(HomepageService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);

  /** Two-way bound by the parent: `[(enabled)]="videoEnabled"`. */
  readonly enabled = model.required<boolean>();
  /** Two-way bound by the parent: `[(name)]="videoName"`. */
  readonly name = model.required<string | null>();

  readonly tiles = [1, 2, 3, 4, 5, 6, 7, 8];

  toggle(enabled: boolean): void {
    this.enabled.set(enabled);
    this.api.setVideoEnabled(enabled);
  }

  onSelected(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.api
      .setVideoName(file.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.name.set(file.name);
          input.value = '';
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
