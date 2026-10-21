import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { Popover } from 'primeng/popover';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import type { User, UserStatus } from '../../models/user.model';

export interface UserDetailStatusChoice {
  label: string;
  value: UserStatus;
}

/**
 * User detail profile header: avatar, identity badges, and primary actions.
 * Parent owns edit/delete/status persistence; this panel owns the status menu UI.
 */
@Component({
  selector: 'app-user-detail-profile',
  imports: [Avatar, AppButton, Popover],
  templateUrl: './user-detail-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailProfile {
  private readonly statusMenu = viewChild.required(Popover);
  readonly lang = inject(LanguageService);

  readonly user = input.required<User>();
  readonly avatarUrl = input.required<string>();
  readonly roleLabel = input.required<string>();
  readonly statusLabel = input.required<string>();
  readonly timeLabel = input.required<string>();
  readonly isBlocked = input(false);
  readonly saving = input(false);
  readonly statusChoices = input.required<UserDetailStatusChoice[]>();

  readonly edit = output<void>();
  readonly remove = output<void>();
  readonly statusChange = output<UserStatus>();

  protected openStatusMenu(event: Event): void {
    this.statusMenu().toggle(event);
  }

  protected setStatus(next: UserStatus): void {
    this.statusMenu().hide();
    this.statusChange.emit(next);
  }
}
