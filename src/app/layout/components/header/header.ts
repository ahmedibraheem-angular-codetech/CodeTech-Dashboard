import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Button } from 'primeng/button';
import { Popover } from 'primeng/popover';
import { Tooltip } from 'primeng/tooltip';

import { Breadcrumbs } from '../breadcrumbs/breadcrumbs';
import { LanguageService } from '../../../core/services/language.service';
import { LayoutService } from '../../../core/services/layout.service';
import { AppButton } from '../../../shared/components/app-button/app-button';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';

interface Notice {
  id: string;
  titleKey: string;
  timeKey: string;
  read: boolean;
}

@Component({
  selector: 'app-header',
  imports: [
    Button,
    AppButton,
    Popover,
    Tooltip,
    RouterLink,
    RouterLinkActive,
    Breadcrumbs,
    UserAvatar,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly lang = inject(LanguageService);
  readonly layout = inject(LayoutService);
  readonly notices = signal<Notice[]>([
    { id: '1', titleKey: 'notify.one.title', timeKey: 'notify.one.time', read: false },
    { id: '2', titleKey: 'notify.two.title', timeKey: 'notify.two.time', read: false },
    { id: '3', titleKey: 'notify.three.title', timeKey: 'notify.three.time', read: true },
  ]);
  readonly unread = computed(() => this.notices().some((notice) => !notice.read));
  readonly zoomLabel = computed(() =>
    this.lang.t(this.layout.zoomDirection() === 'in' ? 'header.zoomIn' : 'header.zoomOut'),
  );
  private readonly notifications = viewChild.required<Popover>('notifications');

  openNotifications(event: Event): void {
    this.notifications().toggle(event);
  }

  markRead(id: string): void {
    this.notices.update((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }
}
