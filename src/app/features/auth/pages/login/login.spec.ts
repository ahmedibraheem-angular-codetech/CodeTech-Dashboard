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

const LOGIN_BODY = {
  data: {
    token: 'api-token',
    user: {
      id: 7,
      code: 'USE-00007',
      name: 'يوسف احمد',
      username: null,
      email: 'admin@codetech-sa.com',
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
    } else if (flush === '422') {
      rendered.http.expectOne(LOGIN).flush(
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
    fill(rendered.root, '#email', 'admin@codetech-sa.com');
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
    fill(rendered.root, '#email', 'admin@codetech-sa.com');
    fill(rendered.root, '#password', 'Password@123');
    await submit(rendered, 'ok');

    expect(rendered.navigate).toHaveBeenCalledWith(['/verify']);
    expect(rendered.auth.hasPendingLogin()).toBe(true);
    expect(rendered.auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('codetech.session')).toBeNull();
    expect(localStorage.getItem('codetech.session')).toBeNull();
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

    fill(rendered.root, '#email', 'admin@codetech-sa.com');
    fill(rendered.root, '#password', 'Password@123');
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    const request = rendered.http.expectOne(LOGIN);
    expect(request.request.body).toEqual({
      email: 'admin@codetech-sa.com',
      password: 'Password@123',
      remember: true,
    });
    request.flush(LOGIN_BODY);
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();

    expect(rendered.auth.hasPendingLogin()).toBe(true);
    expect(localStorage.getItem('codetech.session')).toBeNull();
    expect(JSON.stringify(Object.entries(sessionStorage))).not.toContain('Password@123');
    rendered.http.verify();
  });
});
