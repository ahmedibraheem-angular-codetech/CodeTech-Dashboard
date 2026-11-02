import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { authSession } from '../../../../core/auth/auth-session.fixture';
import type { ProfileUserDto } from '../../../../core/auth/auth.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { apiUrl } from '../../../../core/config/api';
import { ProfileService } from '../../../../core/profile/profile.service';
import { PersonalData, noWhitespaceOnly } from './personal-data';

const PROFILE = apiUrl(environment.apiUrl, 'admin/profile');

const SESSION = authSession({
  token: 't',
  email: 'admin@codetech.sa',
  name: 'أحمد محمد',
  roleKey: 'roles.superAdmin',
  remember: false,
  profileLoaded: true,
  username: 'Ahmedddd1',
  phone: '+966 55 298 3389',
  avatarUrl: null,
  lastLoginAt: '2026-03-18T10:00:00',
});

function profileDto(overrides: Partial<ProfileUserDto> = {}): { data: ProfileUserDto } {
  return {
    data: {
      id: 7,
      code: 'USE-00007',
      name: SESSION.name,
      username: 'Ahmedddd1',
      email: SESSION.email,
      phone: SESSION.phone,
      status: 'active',
      role: { id: 1, name: SESSION.roleKey, is_protected: true },
      avatar: null,
      blocked_reason: null,
      blocked_at: null,
      last_login_at: SESSION.lastLoginAt,
      last_activity_at: null,
      created_at: '2026-10-20T08:00:00.000000Z',
      updated_at: '2026-10-29T09:30:00.000000Z',
      birth_date: null,
      about: null,
      permissions: [],
      ...overrides,
    },
  };
}

describe('noWhitespaceOnly', () => {
  it('flags values made only of spaces', () => {
    expect(noWhitespaceOnly(new FormControl('   '))).toEqual({ whitespace: true });
  });

  it('leaves empty and real values to the other validators', () => {
    expect(noWhitespaceOnly(new FormControl(''))).toBeNull();
    expect(noWhitespaceOnly(new FormControl(' a '))).toBeNull();
  });
});

describe('PersonalData', () => {
  function render(options: { signedIn: boolean } = { signedIn: true }) {
    sessionStorage.clear();
    if (options.signedIn) {
      sessionStorage.setItem(
        'codetech.session',
        JSON.stringify({
          token: SESSION.token,
          email: SESSION.email,
          name: SESSION.name,
          roleKey: SESSION.roleKey,
          remember: SESSION.remember,
        }),
      );
    }
    TestBed.configureTestingModule({
      imports: [PersonalData],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    const auth = TestBed.inject(AuthService);
    if (options.signedIn) {
      auth.session.set(SESSION);
    }
    const fixture = TestBed.createComponent(PersonalData);
    fixture.detectChanges();
    return {
      fixture,
      root: fixture.nativeElement as HTMLElement,
      http: TestBed.inject(HttpTestingController),
      toast: vi.spyOn(TestBed.inject(MessageService), 'add'),
    };
  }

  type Fixture = ReturnType<typeof render>['fixture'];

  async function settle(fixture: Fixture): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function submit(
    rendered: ReturnType<typeof render>,
    flush?: { data: ProfileUserDto } | 'error',
  ): Promise<void> {
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    if (flush === 'error') {
      rendered.http
        .expectOne(PROFILE)
        .flush(
          { message: 'حقل البريد الإلكتروني مطلوب.', errors: { email: ['invalid'] } },
          { status: 422, statusText: 'Unprocessable Entity' },
        );
    } else if (flush) {
      rendered.http.expectOne(PROFILE).flush(flush);
    }
    await settle(rendered.fixture);
  }

  function type(fixture: Fixture, id: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${id}`);
    if (!input) {
      throw new Error(`no #${id}`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function cancelButton(root: HTMLElement): HTMLButtonElement {
    const button = root.querySelector<HTMLButtonElement>('.profile-actions__cancel button');
    if (!button) {
      throw new Error('no cancel button');
    }
    return button;
  }

  it('is prefilled from the profile', () => {
    const { fixture, http } = render();
    expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
      name: SESSION.name,
      email: SESSION.email,
      username: '@Ahmedddd1',
      phone: '+966 55 298 3389',
    });
    http.verify();
  });

  it('blocks an invalid email and username', async () => {
    const rendered = render();
    rendered.fixture.componentInstance.form.patchValue({ email: 'nope', username: 'a b' });
    await submit(rendered);

    expect(rendered.root.querySelector('#profile-email-error')).not.toBeNull();
    expect(rendered.root.querySelector('#profile-username-error')).not.toBeNull();
    expect(TestBed.inject(ProfileService).profile()?.email).toBe(SESSION.email);
    rendered.http.verify();
  });

  it('saves valid changes and restores the saved values on cancel', async () => {
    const rendered = render();
    rendered.fixture.componentInstance.form.patchValue({ phone: '0551112222' });
    await submit(
      rendered,
      profileDto({ phone: '0551112222', username: 'Ahmedddd1', name: SESSION.name }),
    );
    expect(TestBed.inject(ProfileService).profile()?.phone).toBe('0551112222');

    rendered.fixture.componentInstance.form.patchValue({ phone: '0559999999' });
    rendered.fixture.componentInstance.cancel();
    expect(rendered.fixture.componentInstance.form.controls.phone.value).toBe('0551112222');
    rendered.http.verify();
  });

  describe('validation', () => {
    it('treats a whitespace-only value like an empty one, with the same message', async () => {
      const rendered = render();
      type(rendered.fixture, 'profile-name', '   ');
      await submit(rendered);

      expect(rendered.fixture.componentInstance.form.controls.name.value).toBe('');
      expect(rendered.root.querySelector('#profile-name-error')?.textContent).toContain(
        'الاسم مطلوب',
      );
      rendered.http.verify();
    });

    it.each(['-------', '12345', '+966--55', '+966 55 298 3389 77777777777777'])(
      'rejects the phone number %s',
      (phone) => {
        const { fixture, http } = render();
        const control = fixture.componentInstance.form.controls.phone;
        control.setValue(phone);
        expect(control.hasError('pattern')).toBe(true);
        http.verify();
      },
    );

    it.each(['+966 55 298 3389', '0551112222', '055-111-2222', '+9665512345'])(
      'accepts the phone number %s',
      (phone) => {
        const { fixture, http } = render();
        const control = fixture.componentInstance.form.controls.phone;
        control.setValue(phone);
        expect(control.valid).toBe(true);
        http.verify();
      },
    );
  });

  describe('save', () => {
    it('trims every value and keeps a single leading @ on the username', async () => {
      const rendered = render();
      type(rendered.fixture, 'profile-name', '  علي حسن  ');
      type(rendered.fixture, 'profile-username', '@@new_user');
      type(rendered.fixture, 'profile-email', '  new@codetech.sa ');
      type(rendered.fixture, 'profile-phone', ' +966 50 111 2222 ');
      rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
      const request = rendered.http.expectOne(PROFILE);
      expect(request.request.body).toEqual({
        name: 'علي حسن',
        username: 'new_user',
        email: 'new@codetech.sa',
        phone: '+966 50 111 2222',
      });
      request.flush(
        profileDto({
          name: 'علي حسن',
          username: 'new_user',
          email: 'new@codetech.sa',
          phone: '+966 50 111 2222',
        }),
      );
      await settle(rendered.fixture);

      expect(TestBed.inject(ProfileService).profile()).toMatchObject({
        name: 'علي حسن',
        username: '@new_user',
        email: 'new@codetech.sa',
        phone: '+966 50 111 2222',
      });
      expect(rendered.fixture.componentInstance.form.controls.username.value).toBe('@new_user');
      rendered.http.verify();
    });

    it('adds the @ when the username is typed without it', async () => {
      const rendered = render();
      type(rendered.fixture, 'profile-username', 'plain_name');
      await submit(rendered, profileDto({ username: 'plain_name' }));

      expect(TestBed.inject(ProfileService).profile()?.username).toBe('@plain_name');
      rendered.http.verify();
    });

    it('ignores a second submit while the first one is still saving', () => {
      const rendered = render();
      const update = vi.spyOn(TestBed.inject(ProfileService), 'update');

      rendered.fixture.componentInstance.save();
      rendered.fixture.componentInstance.save();

      expect(update).toHaveBeenCalledTimes(1);
      rendered.http.expectOne(PROFILE).flush(profileDto());
    });

    it('releases the saving flag after the request completes', async () => {
      const rendered = render();
      rendered.fixture.componentInstance.save();
      expect(rendered.fixture.componentInstance.saving()).toBe(true);

      rendered.http.expectOne(PROFILE).flush(profileDto());
      await settle(rendered.fixture);
      expect(rendered.fixture.componentInstance.saving()).toBe(false);
      rendered.http.verify();
    });

    it('shows the server message when the update fails', async () => {
      const rendered = render();
      type(rendered.fixture, 'profile-name', 'اسم آخر');
      await submit(rendered, 'error');
      expect(rendered.toast).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'حقل البريد الإلكتروني مطلوب.',
      });
      rendered.http.verify();
    });
  });

  describe('cancel button', () => {
    it('is disabled until the form is edited, and again once the edit is saved', async () => {
      const rendered = render();
      expect(cancelButton(rendered.root).disabled).toBe(true);

      type(rendered.fixture, 'profile-name', 'اسم آخر');
      expect(cancelButton(rendered.root).disabled).toBe(false);

      await submit(rendered, profileDto({ name: 'اسم آخر' }));
      expect(cancelButton(rendered.root).disabled).toBe(true);
      rendered.http.verify();
    });

    it('keeps Save enabled so validation messages can be reached', () => {
      const { root, http } = render();
      expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
      http.verify();
    });
  });

  describe('profile loading late', () => {
    it('fills the form once the profile arrives', () => {
      const { fixture, http } = render({ signedIn: false });
      expect(fixture.componentInstance.form.controls.name.value).toBe('');

      TestBed.inject(AuthService).session.set(SESSION);
      fixture.detectChanges();

      expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
        name: SESSION.name,
        email: SESSION.email,
      });
      http.verify();
    });

    it('never overwrites what the user is typing', () => {
      const { fixture, http } = render({ signedIn: false });
      type(fixture, 'profile-name', 'كتابة المستخدم');

      TestBed.inject(AuthService).session.set(SESSION);
      fixture.detectChanges();

      expect(fixture.componentInstance.form.controls.name.value).toBe('كتابة المستخدم');
      http.verify();
    });

    it('is not reset by changes outside the four editable fields', async () => {
      const rendered = render();
      rendered.fixture.componentInstance.form.controls.name.markAsTouched();

      const pending = firstValueFrom(TestBed.inject(ProfileService).removeAvatar());
      rendered.http.expectOne(PROFILE).flush(profileDto({ avatar: null }));
      await pending;
      rendered.fixture.detectChanges();

      expect(rendered.fixture.componentInstance.form.controls.name.touched).toBe(true);
      rendered.http.verify();
    });
  });

  describe('accessibility', () => {
    it('associates every label with its input and keeps errors outside the label', async () => {
      const rendered = render();
      rendered.fixture.componentInstance.form.patchValue({ email: 'nope' });
      await submit(rendered);

      for (const name of ['name', 'username', 'email', 'phone']) {
        expect(rendered.root.querySelector(`label[for="profile-${name}"]`)).not.toBeNull();
        expect(rendered.root.querySelector(`input#profile-${name}`)).not.toBeNull();
      }
      expect(rendered.root.querySelector('label app-field-error')).toBeNull();
      expect(rendered.root.querySelector('#profile-email')?.getAttribute('aria-describedby')).toBe(
        'profile-email-error',
      );
      expect(rendered.root.querySelector('#profile-email-error')?.getAttribute('role')).toBe(
        'alert',
      );
      rendered.http.verify();
    });
  });
});
