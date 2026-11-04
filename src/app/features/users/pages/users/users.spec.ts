import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import { flushDelay, flushUi } from '../../../../../testing/flush-ui';
import type { User, UserStats } from '../../models/user.model';
import { UsersService } from '../../services/users.service';
import { UsersPage } from './users';

const USER: User = {
  id: '4',
  code: 'USE-00004',
  name: 'نورة القحطاني',
  username: null,
  email: 'noura@example.test',
  phone: '0551111004',
  role: { id: 2, name: 'Editor', isProtected: false },
  status: 'active',
  statusRaw: 'active',
  avatarUrl: null,
  avatarUuid: null,
  blockedReason: null,
  blockedAt: null,
  lastActivityAt: '2026-10-29T10:12:00.000000Z',
  createdAt: '2025-01-09T08:00:00.000000Z',
};

const STATS: UserStats = {
  total: { value: 1, previous: null, changePct: null },
  active: { value: 1, previous: null, changePct: null },
  inactive: { value: 0, previous: null, changePct: null },
  blocked: { value: 0, previous: null, changePct: null },
};

describe('UsersPage', () => {
  async function render(api: Partial<UsersService> = {}) {
    TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [
        provideRouter([]),
        MessageService,
        {
          provide: UsersService,
          useValue: {
            list: () => of({ items: [USER], total: 1 }),
            stats: () => of(STATS),
            roles: () => of([{ id: 2, name: 'Editor', isProtected: false }]),
            exportCsv: () => of(new Blob(['id'])),
            ...api,
          },
        },
        {
          provide: NetworkStatusService,
          useValue: { online: signal(true) },
        },
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@example.test',
        name: 'Admin',
        profileLoaded: true,
        permissions: ['users.view', 'users.create', 'users.update', 'users.delete'],
      }),
    );
    localStorage.setItem('codetech.language', 'ar');
    const fixture = TestBed.createComponent(UsersPage);
    fixture.detectChanges();
    // listQuery is debounced 200ms in UsersPage before the HTTP call.
    await flushDelay(220);
    await flushUi(fixture);
    return fixture;
  }

  it('loads users, roles, and stats into the ready state', async () => {
    const fixture = await render();
    const page = fixture.componentInstance;
    expect(page.state()).toBe('ready');
    expect(page.rows()).toEqual([USER]);
    expect(page.total()).toBe(1);
    expect(page.roles()).toHaveLength(1);
    expect(page.stats()?.total.value).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('نورة القحطاني');
  });

  it('maps a list failure to the error state while online', async () => {
    const fixture = await render({
      list: () => throwError(() => new Error('boom')),
    });
    expect(fixture.componentInstance.state()).toBe('error');
  });
});
