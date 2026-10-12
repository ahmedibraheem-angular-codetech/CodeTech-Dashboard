import { ChangeDetectionStrategy, Component, DestroyRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

import { ProfileService } from '../../../../core/profile/profile.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'app-avatar-card',
  imports: [Button, Tooltip, UserAvatar, ConfirmDialog],
  templateUrl: './avatar-card.html',
  host: { class: 'd-block h-100' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarCard {
  private readonly api = inject(ProfileService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = viewChild.required(ConfirmDialog);
  readonly lang = inject(LanguageService);
  readonly accept = ACCEPTED_TYPES.join(',');
  readonly user = this.api.profile;

  onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    // Reset so choosing the same file again still fires `change`.
    input.value = '';
    if (!file) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_BYTES) {
      this.messages.add({
        severity: 'warn',
        summary: this.lang.t('profile.invalidImageSummary'),
        detail: this.lang.t('profile.invalidImageDetail'),
      });
      return;
    }
    this.api
      .setAvatar(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() =>
        this.messages.add({ severity: 'success', summary: this.lang.t('profile.photoUpdated') }),
      );
  }

  async remove(): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('profile.removePhoto'),
      message: this.lang.t('profile.removePhotoMessage'),
      confirmLabel: this.lang.t('users.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .removeAvatar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() =>
        this.messages.add({ severity: 'success', summary: this.lang.t('profile.photoRemoved') }),
      );
  }
}
