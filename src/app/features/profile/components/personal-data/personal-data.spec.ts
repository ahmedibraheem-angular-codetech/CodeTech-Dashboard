import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import { ProfileService } from '../../../../core/profile/profile.service';
import { PersonalData, noWhitespaceOnly } from './personal-data';

const SESSION = authSession({
  token: 't',
  email: 'admin@codetech.sa',
  name: 'أحمد محمد',
  roleKey: 'roles.superAdmin',
  remember: false,
});

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
      sessionStorage.setItem('codetech.session', JSON.stringify(SESSION));
    }
    TestBed.configureTestingModule({
      imports: [PersonalData],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: API_LATENCY_MS, useValue: 0 },
      ],
    });
    const fixture = TestBed.createComponent(PersonalData);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  type Fixture = ReturnType<typeof render>['fixture'];

  async function settle(fixture: Fixture): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function submit(fixture: Fixture): Promise<void> {
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    await settle(fixture);
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
    const { fixture } = render();
    expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
      name: SESSION.name,
      email: SESSION.email,
      phone: '+966 55 298 3389',
    });
  });

  it('blocks an invalid email and username', async () => {
    const { fixture, root } = render();
    fixture.componentInstance.form.patchValue({ email: 'nope', username: 'a b' });
    await submit(fixture);

    expect(root.querySelector('#profile-email-error')).not.toBeNull();
    expect(root.querySelector('#profile-username-error')).not.toBeNull();
    expect(TestBed.inject(ProfileService).profile()?.email).toBe(SESSION.email);
  });

  it('saves valid changes and restores the saved values on cancel', async () => {
    const { fixture } = render();
    fixture.componentInstance.form.patchValue({ phone: '0551112222' });
    await submit(fixture);
    expect(TestBed.inject(ProfileService).profile()?.phone).toBe('0551112222');

    fixture.componentInstance.form.patchValue({ phone: '0559999999' });
    fixture.componentInstance.cancel();
    expect(fixture.componentInstance.form.controls.phone.value).toBe('0551112222');
  });

  describe('validation', () => {
    it('treats a whitespace-only value like an empty one, with the same message', async () => {
      const { fixture, root } = render();
      type(fixture, 'profile-name', '   ');
      await submit(fixture);

      expect(fixture.componentInstance.form.controls.name.value).toBe('');
      expect(root.querySelector('#profile-name-error')?.textContent).toContain('الاسم مطلوب');
    });

    it.each(['-------', '12345', '+966--55', '+966 55 298 3389 77777777777777'])(
      'rejects the phone number %s',
      (phone) => {
        const { fixture } = render();
        const control = fixture.componentInstance.form.controls.phone;
        control.setValue(phone);
        expect(control.hasError('pattern')).toBe(true);
      },
    );

    it.each(['+966 55 298 3389', '0551112222', '055-111-2222', '+9665512345'])(
      'accepts the phone number %s',
      (phone) => {
        const { fixture } = render();
        const control = fixture.componentInstance.form.controls.phone;
        control.setValue(phone);
        expect(control.valid).toBe(true);
      },
    );
  });

  describe('save', () => {
    it('trims every value and keeps a single leading @ on the username', async () => {
      const { fixture } = render();
      type(fixture, 'profile-name', '  علي حسن  ');
      type(fixture, 'profile-username', '@@new_user');
      type(fixture, 'profile-email', '  new@codetech.sa ');
      type(fixture, 'profile-phone', ' +966 50 111 2222 ');
      await submit(fixture);

      expect(TestBed.inject(ProfileService).profile()).toMatchObject({
        name: 'علي حسن',
        username: '@new_user',
        email: 'new@codetech.sa',
        phone: '+966 50 111 2222',
      });
      expect(fixture.componentInstance.form.controls.username.value).toBe('@new_user');
    });

    it('adds the @ when the username is typed without it', async () => {
      const { fixture } = render();
      type(fixture, 'profile-username', 'plain_name');
      await submit(fixture);

      expect(TestBed.inject(ProfileService).profile()?.username).toBe('@plain_name');
    });

    it('ignores a second submit while the first one is still saving', () => {
      const { fixture } = render();
      const update = vi.spyOn(TestBed.inject(ProfileService), 'update');

      fixture.componentInstance.save();
      fixture.componentInstance.save();

      expect(update).toHaveBeenCalledTimes(1);
    });

    it('releases the saving flag after the request completes', async () => {
      const { fixture } = render();
      fixture.componentInstance.save();
      expect(fixture.componentInstance.saving()).toBe(true);

      await settle(fixture);
      expect(fixture.componentInstance.saving()).toBe(false);
    });
  });

  describe('cancel button', () => {
    it('is disabled until the form is edited, and again once the edit is saved', async () => {
      const { fixture, root } = render();
      expect(cancelButton(root).disabled).toBe(true);

      type(fixture, 'profile-name', 'اسم آخر');
      expect(cancelButton(root).disabled).toBe(false);

      await submit(fixture);
      expect(cancelButton(root).disabled).toBe(true);
    });

    it('keeps Save enabled so validation messages can be reached', () => {
      const { root } = render();
      expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
    });
  });

  describe('profile loading late', () => {
    it('fills the form once the profile arrives', () => {
      const { fixture } = render({ signedIn: false });
      expect(fixture.componentInstance.form.controls.name.value).toBe('');

      TestBed.inject(AuthService).session.set(SESSION);
      fixture.detectChanges();

      expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
        name: SESSION.name,
        email: SESSION.email,
      });
    });

    it('never overwrites what the user is typing', () => {
      const { fixture } = render({ signedIn: false });
      type(fixture, 'profile-name', 'كتابة المستخدم');

      TestBed.inject(AuthService).session.set(SESSION);
      fixture.detectChanges();

      expect(fixture.componentInstance.form.controls.name.value).toBe('كتابة المستخدم');
    });

    it('is not reset by changes outside the four editable fields', async () => {
      const { fixture } = render();
      fixture.componentInstance.form.controls.name.markAsTouched();

      await new Promise<void>((resolve) =>
        TestBed.inject(ProfileService)
          .removeAvatar()
          .subscribe(() => resolve()),
      );
      fixture.detectChanges();

      expect(fixture.componentInstance.form.controls.name.touched).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('associates every label with its input and keeps errors outside the label', async () => {
      const { fixture, root } = render();
      fixture.componentInstance.form.patchValue({ email: 'nope' });
      await submit(fixture);

      for (const name of ['name', 'username', 'email', 'phone']) {
        expect(root.querySelector(`label[for="profile-${name}"]`)).not.toBeNull();
        expect(root.querySelector(`input#profile-${name}`)).not.toBeNull();
      }
      expect(root.querySelector('label app-field-error')).toBeNull();
      expect(root.querySelector('#profile-email')?.getAttribute('aria-describedby')).toBe(
        'profile-email-error',
      );
      expect(root.querySelector('#profile-email-error')?.getAttribute('role')).toBe('alert');
    });
  });
});
