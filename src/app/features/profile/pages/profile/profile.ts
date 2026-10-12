import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';

import { AuthService } from '../../../../core/auth/auth.service';
import { ProfileService } from '../../../../core/profile/profile.service';
import { LanguageService } from '../../../../core/services/language.service';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { AvatarCard } from '../../components/avatar-card/avatar-card';
import { PasswordChange } from '../../components/password-change/password-change';
import { PersonalData } from '../../components/personal-data/personal-data';

@Component({
  selector: 'app-profile-page',
  imports: [
    Button,
    Tag,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    UserAvatar,
    PersonalData,
    AvatarCard,
    PasswordChange,
  ],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly lang = inject(LanguageService);
  readonly user = inject(ProfileService).profile;
  readonly tab = signal<string | number | undefined>('data');

  /** Last sign in, split so the date and the time can carry their own icons. */
  readonly lastLogin = computed(() => {
    const profile = this.user();
    if (!profile) {
      return null;
    }
    const at = new Date(profile.lastLogin);
    const locale = this.lang.language() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
    return {
      iso: profile.lastLogin,
      date: profile.lastLogin.slice(0, 10),
      time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(at),
    };
  });

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
