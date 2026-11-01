import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { type User } from '../../models/user.model';
import { UsersService } from '../../services/users.service';
import { UserDetailPage } from './user-detail';

const USER_GRANTS = ['users.view', 'users.create', 'users.update', 'users.delete'] as const;

describe('UserDetailPage', () => {
  const user: User = {
    id: 'u4',
    name: 'نورة القحطاني',
    email: 'noura@codetech.sa',
    phone: '0551111004',
    role: 'viewer',
    status: 'suspended',
    joinedAt: '2025-01-09',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        MessageService,
        {
          provide: UsersService,
          useValue: {
            get: () => of(user),
            update: () => of(user),
            remove: () => of(undefined),
          },
        },
        {
          provide: LanguageService,
          useValue: {
            language: signal('ar'),
            t: (key: string) => key,
            lookup: (key: string) => key,
            set: () => undefined,
          },
        },
      ],
    }).compileComponents();

    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...USER_GRANTS],
      }),
    );
  });

  it('renders the suspended user detail sections', () => {
    const fixture = TestBed.createComponent(UserDetailPage);
    fixture.componentRef.setInput('id', 'u4');
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('h1')?.textContent).toContain('نورة القحطاني');
    expect(root.textContent).toContain('users.banReason');
    expect(root.textContent).toContain('users.details');
  });
});
