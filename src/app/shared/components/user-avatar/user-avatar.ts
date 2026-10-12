import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Avatar } from 'primeng/avatar';

import { ProfileService } from '../../../core/profile/profile.service';

/**
 * The signed-in user's picture, falling back to their initial when there is none.
 * Decorative: put the accessible name on the link or button that wraps it.
 */
@Component({
  selector: 'app-user-avatar',
  imports: [Avatar],
  template: `
    @if (user(); as profile) {
      <p-avatar
        shape="square"
        [image]="profile.avatarUrl ?? undefined"
        [label]="profile.avatarUrl ? undefined : initial()"
      />
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[style.--p-avatar-width]': 'sizeCss()',
    '[style.--p-avatar-height]': 'sizeCss()',
    '[style.--p-avatar-font-size]': 'fontCss()',
    '[style.--p-avatar-border-radius]': 'radius()',
    '[style.border-radius]': 'radius()',
    '[style.display]': "'inline-flex'",
    '[style.overflow]': "'hidden'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatar {
  /** Edge length in px. */
  readonly size = input(48);
  /** Any CSS radius; `50%` makes it round. */
  readonly radius = input('50%');

  private readonly profile = inject(ProfileService);
  protected readonly user = this.profile.profile;
  protected readonly initial = computed(() => this.user()?.name.slice(0, 1) ?? '');
  protected readonly sizeCss = computed(() => `${this.size()}px`);
  protected readonly fontCss = computed(() => `${Math.round(this.size() * 0.4)}px`);
}
