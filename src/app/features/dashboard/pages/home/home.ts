import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { User } from '../../../users/models/user.model';
import { UsersService } from '../../../users/services/users.service';
import { ContentBlockCard } from '../../components/content-block-card/content-block-card';
import { OverviewStats } from '../../components/overview-stats/overview-stats';
import { PartnersSection } from '../../components/partners-section/partners-section';
import { RecentUsers } from '../../components/recent-users/recent-users';
import { VideoSection } from '../../components/video-section/video-section';
import { ContentBlock, Partner } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';

type Status = 'loading' | 'ready' | 'error';

/**
 * Homepage management container: loads the content and the users summary, and hands
 * them to presentational sections that own their own editing dialogs.
 */
@Component({
  selector: 'app-home',
  imports: [
    PageHeader,
    StateView,
    PartnersSection,
    VideoSection,
    ContentBlockCard,
    OverviewStats,
    RecentUsers,
  ],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly api = inject(HomepageService);
  private readonly usersApi = inject(UsersService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly status = signal<Status>('loading');
  readonly partners = signal<Partner[]>([]);
  readonly videoEnabled = signal(true);
  readonly videoName = signal<string | null>(null);
  readonly contactRequests = signal(0);
  readonly about = signal<ContentBlock | null>(null);
  readonly vision = signal<ContentBlock | null>(null);

  readonly recentUsers = signal<User[]>([]);
  readonly userTotal = signal(0);
  readonly activeUsers = signal(0);

  readonly activity = [
    { text: 'home.activityOne', time: 'home.activityTimeOne' },
    { text: 'home.activityTwo', time: 'home.activityTimeTwo' },
    { text: 'home.activityThree', time: 'home.activityTimeThree' },
  ] as const;

  constructor() {
    this.reload();
    this.usersApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.recentUsers.set(users.slice(0, 5));
          this.userTotal.set(users.length);
          this.activeUsers.set(users.filter((user) => user.status === 'active').length);
        },
        error: () => this.messages.add({ severity: 'error', summary: this.lang.t('common.error') }),
      });
  }

  reload(silent = false): void {
    if (!silent) {
      this.status.set('loading');
    }
    this.api
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.partners.set(content.partners);
          this.videoEnabled.set(content.videoEnabled);
          this.videoName.set(content.videoName);
          this.contactRequests.set(content.contactRequests);
          this.about.set(content.about);
          this.vision.set(content.vision);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }
}
