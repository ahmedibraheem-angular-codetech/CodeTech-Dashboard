import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Button, ButtonDirective, ButtonIcon } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Popover } from 'primeng/popover';
import { Tooltip } from 'primeng/tooltip';

import { AuthService } from '../../../core/auth/auth.service';
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs';
import { LanguageService } from '../../../core/services/language.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ThemeService } from '../../../core/services/theme.service';

interface Notice {
  id: string;
  titleKey: string;
  timeKey: string;
  read: boolean;
}

@Component({
  selector: 'app-header',
  imports: [
    FormsModule,
    Button,
    ButtonDirective,
    ButtonIcon,
    InputText,
    Menu,
    Popover,
    Tooltip,
    Breadcrumbs,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly lang = inject(LanguageService);
  readonly theme = inject(ThemeService);
  readonly layout = inject(LayoutService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly searchOpen = signal(false);
  readonly query = signal('');
  readonly notices = signal<Notice[]>([
    { id: '1', titleKey: 'notify.one.title', timeKey: 'notify.one.time', read: false },
    { id: '2', titleKey: 'notify.two.title', timeKey: 'notify.two.time', read: false },
    { id: '3', titleKey: 'notify.three.title', timeKey: 'notify.three.time', read: true },
  ]);
  readonly unread = computed(() => this.notices().some((notice) => !notice.read));
  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: this.lang.t('header.profile'),
      icon: 'pi pi-user',
      command: () => void this.router.navigate(['/settings']),
    },
    {
      label: this.lang.t('header.logout'),
      icon: 'pi pi-sign-out',
      command: () => this.logout(),
    },
  ]);
  private readonly notifications = viewChild.required<Popover>('notifications');
  private readonly userMenu = viewChild.required<Menu>('userMenu');

  shortName(): string {
    return this.auth.session()?.name.split(' ')[0] ?? '';
  }

  initials(): string {
    return this.auth.session()?.name.slice(0, 1) ?? '';
  }

  openNotifications(event: Event): void {
    this.notifications().toggle(event);
  }

  openUserMenu(event: Event): void {
    this.userMenu().toggle(event);
  }

  markRead(id: string): void {
    this.notices.update((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  search(): void {
    const query = this.query().trim();
    void this.router.navigate(['/users'], { queryParams: query ? { q: query } : {} });
    this.searchOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
