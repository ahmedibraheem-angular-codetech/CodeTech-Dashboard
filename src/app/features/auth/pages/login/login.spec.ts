import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../core/auth/auth.service';
import { apiUrl } from '../../../../core/config/api';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import { environment } from '../../../../../environments/environment';
import { Login } from './login';

const LOGIN = apiUrl(environment.apiUrl, 'admin/auth/login');
const FORGOT = apiUrl(environment.apiUrl, 'admin/auth/forgot-password');
const VERIFY_CODE = apiUrl(environment.apiUrl, 'admin/auth/verify-code');
const RESET_PASSWORD = apiUrl(environment.apiUrl, 'admin/auth/reset-password');
const RESET_TOKEN = 'a'.repeat(64);

const LOGIN_BODY = {
  data: {
    token: 'api-token',
    user: {
      id: 7,
      code: 'USE-00007',
      name: 'يوسف احمد',
      username: null,
      email: 'admin@example.test',
      phone: null,
      status: 'active',
      role: { id: 1, name: 'المدير العام', is_protected: true },
      avatar_url: null,
    },
  },
};

describe('Login', () => {
  async function render() {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    return { fixture, root, navigate, auth, http };
  }

  function input(root: HTMLElement, selector: string): HTMLInputElement {
    const element = root.querySelector<HTMLInputElement>(selector);
    if (!element) {
      throw new Error(`Missing element: ${selector}`);
    }
    return element;
  }

  function fill(root: HTMLElement, selector: string, value: string): void {
    const element = input(root, selector);
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }

  async function submit(
    rendered: Awaited<ReturnType<typeof render>>,
    flush?: 'ok' | '422',
  ): Promise<void> {
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    if (flush === 'ok') {
      rendered.http.expectOne(LOGIN).flush(LOGIN_BODY);
      const forgot = rendered.http.expectOne(FORGOT);
      expect(forgot.request.method).toBe('POST');
      expect(forgot.request.body).toEqual({ email: 'admin@example.test' });
      forgot.flush({ message: 'ok' });
    } else if (flush === '422') {
      rendered.http
        .expectOne(LOGIN)
        .flush(
          { message: 'كلمة المرور غير صحيحة', errors: { password: ['invalid'] } },
          { status: 422, statusText: 'Unprocessable Entity' },
        );
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();
  }

  it('starts with an empty email field (no pre-filled address)', async () => {
    const { root, http } = await render();
    expect(input(root, '#email').value).toBe('');
    http.verify();
  });

  it('shows required errors and does not sign in when the form is empty', async () => {
    const rendered = await render();
    await submit(rendered);

    expect(rendered.root.querySelector('#email-error')).not.toBeNull();
    expect(rendered.root.querySelector('#password-error')).not.toBeNull();
    expect(rendered.navigate).not.toHaveBeenCalled();
    expect(rendered.auth.hasPendingLogin()).toBe(false);
    rendered.http.verify();
  });

  it('shows an inline credential error for a wrong password', async () => {
    const rendered = await render();
    fill(rendered.root, '#email', 'admin@example.test');
    fill(rendered.root, '#password', 'not-the-password');
    await submit(rendered, '422');

    expect(rendered.root.querySelector('#password-error')).not.toBeNull();
    expect(input(rendered.root, '#password').getAttribute('aria-invalid')).toBe('true');
    expect(rendered.navigate).not.toHaveBeenCalled();
    expect(rendered.auth.hasPendingLogin()).toBe(false);
    rendered.http.verify();
  });

  it('moves to the verification step after a correct password without opening a session', async () => {
    const rendered = await render();
    fill(rendered.root, '#email', 'admin@example.test');
    fill(rendered.root, '#password', 'Password@123');
    await submit(rendered, 'ok');

    expect(rendered.navigate).toHaveBeenCalledWith(['/verify']);
    expect(rendered.auth.hasPendingLogin()).toBe(true);
    expect(rendered.auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
    expect(localStorage.getItem('codetech.session')).toBeNull();
    rendered.http.verify();
  });

  it('sends the forgot-password email and opens the verification step', async () => {
    const rendered = await render();
    const forgot = [...rendered.root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('نسيت'),
    );
    forgot?.click();
    rendered.fixture.detectChanges();
    await rendered.fixture.whenStable();

    fill(rendered.root, '#forgot-email', 'user@example.test');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    const request = rendered.http.expectOne(FORGOT);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'user@example.test' });
    request.flush({ message: 'ok' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    expect(rendered.root.querySelector('h1')?.textContent).toContain('رمز التحقق');
    rendered.http.verify();
  });

  it('verifies the reset code and opens the new-password step', async () => {
    const rendered = await render();
    const forgot = [...rendered.root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('نسيت'),
    );
    forgot?.click();
    rendered.fixture.detectChanges();
    fill(rendered.root, '#forgot-email', 'admin@example.test');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    rendered.http.expectOne(FORGOT).flush({ message: 'ok' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    rendered.fixture.componentInstance.otpForm.controls.code.setValue('0427');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    const request = rendered.http.expectOne(VERIFY_CODE);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'admin@example.test', code: '0427' });
    request.flush({ data: { reset_token: RESET_TOKEN } });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    expect(rendered.root.querySelector('h1')?.textContent).toContain('إعادة تعيين كلمة مرور');
    rendered.http.verify();
  });

  it('sets the new password with the reset token', async () => {
    const rendered = await render();
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const forgot = [...rendered.root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('نسيت'),
    );
    forgot?.click();
    rendered.fixture.detectChanges();
    fill(rendered.root, '#forgot-email', 'admin@example.test');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    rendered.http.expectOne(FORGOT).flush({ message: 'ok' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    rendered.fixture.componentInstance.otpForm.controls.code.setValue('0427');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    rendered.http.expectOne(VERIFY_CODE).flush({ data: { reset_token: RESET_TOKEN } });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    rendered.fixture.componentInstance.newPasswordForm.setValue({
      password: 'NewPassw0rd',
      confirmPassword: 'NewPassw0rd',
    });
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    const request = rendered.http.expectOne(RESET_PASSWORD);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'admin@example.test',
      reset_token: RESET_TOKEN,
      password: 'NewPassw0rd',
      password_confirmation: 'NewPassw0rd',
    });
    request.flush({ message: 'ok' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    expect(rendered.fixture.componentInstance.successOpen()).toBe(true);
    expect(toast).not.toHaveBeenCalled();
    expect(JSON.stringify(Object.entries(sessionStorage))).not.toContain('NewPassw0rd');
    expect(JSON.stringify(Object.entries(localStorage))).not.toContain('NewPassw0rd');
    rendered.http.verify();
  });

  it('shows the server password message when reset is rejected', async () => {
    const rendered = await render();
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const forgot = [...rendered.root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('نسيت'),
    );
    forgot?.click();
    rendered.fixture.detectChanges();
    fill(rendered.root, '#forgot-email', 'admin@example.test');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    rendered.http.expectOne(FORGOT).flush({ message: 'ok' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    rendered.fixture.componentInstance.otpForm.controls.code.setValue('0427');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    rendered.http.expectOne(VERIFY_CODE).flush({ reset_token: RESET_TOKEN });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    rendered.fixture.componentInstance.newPasswordForm.setValue({
      password: 'NewPassw0rd',
      confirmPassword: 'NewPassw0rd',
    });
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    rendered.http.expectOne(RESET_PASSWORD).flush(
      {
        message: 'كلمة المرور غير صحيحة، حاول مرة اخرى',
        errors: { password: ['كلمة المرور غير صحيحة، حاول مرة اخرى'] },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    expect(rendered.fixture.componentInstance.successOpen()).toBe(false);
    expect(toast).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'كلمة المرور غير صحيحة، حاول مرة اخرى',
    });
    rendered.http.verify();
  });

  it('shows an inline error when the reset code is rejected', async () => {
    const rendered = await render();
    const forgot = [...rendered.root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('نسيت'),
    );
    forgot?.click();
    rendered.fixture.detectChanges();
    fill(rendered.root, '#forgot-email', 'admin@example.test');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    rendered.http.expectOne(FORGOT).flush({ message: 'ok' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    rendered.fixture.componentInstance.otpForm.controls.code.setValue('0000');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    rendered.http
      .expectOne(VERIFY_CODE)
      .flush(
        { message: 'رمز التحقق خاطئ', errors: { code: ['invalid'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    expect(rendered.root.querySelector('#otp-error')).not.toBeNull();
    expect(rendered.root.querySelector('#reset-password')).toBeNull();
    rendered.http.verify();
  });

  it('toggles password visibility', async () => {
    const { fixture, root, http } = await render();
    expect(input(root, '#password').type).toBe('password');

    root.querySelector<HTMLButtonElement>('.field__toggle button')?.click();
    fixture.detectChanges();
    expect(input(root, '#password').type).toBe('text');
    http.verify();
  });

  it('sends remember=true and still keeps the token pending until OTP', async () => {
    const rendered = await render();
    const checkbox = input(rendered.root, '#remember');
    checkbox.click();
    rendered.fixture.detectChanges();
    expect(checkbox.checked).toBe(true);

    fill(rendered.root, '#email', 'admin@example.test');
    fill(rendered.root, '#password', 'Password@123');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    const request = rendered.http.expectOne(LOGIN);
    expect(request.request.body).toEqual({
      email: 'admin@example.test',
      password: 'Password@123',
      remember: true,
    });
    request.flush(LOGIN_BODY);
    const forgot = rendered.http.expectOne(FORGOT);
    expect(forgot.request.body).toEqual({ email: 'admin@example.test' });
    forgot.flush({ message: 'ok' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();

    expect(rendered.auth.hasPendingLogin()).toBe(true);
    expect(localStorage.getItem('codetech.session')).toBeNull();
    expect(JSON.stringify(Object.entries(sessionStorage))).not.toContain('Password@123');
    rendered.http.verify();
  });
});
