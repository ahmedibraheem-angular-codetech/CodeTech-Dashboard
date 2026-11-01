import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../core/auth/auth.service';
import { TEMPORARY_DEMO_OTP } from '../../../../core/config/demo-credentials';
import { apiUrl } from '../../../../core/config/api';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import { environment } from '../../../../../environments/environment';
import { Verify } from './verify';

const LOGIN = apiUrl(environment.apiUrl, 'admin/auth/login');
const PROFILE = apiUrl(environment.apiUrl, 'admin/profile');

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

const PROFILE_BODY = {
  data: {
    id: 7,
    code: 'USE-00007',
    name: 'يوسف احمد',
    username: null,
    email: 'admin@codetech-sa.com',
    phone: null,
    status: 'active',
    role: { id: 1, name: 'المدير العام', is_protected: true },
    avatar: null,
    blocked_reason: null,
    blocked_at: null,
    last_login_at: '2026-10-29T09:30:00.000000Z',
    last_activity_at: null,
    created_at: '2026-10-20T08:00:00.000000Z',
    updated_at: '2026-10-29T09:30:00.000000Z',
    birth_date: null,
    about: null,
    permissions: ['users.view'],
  },
};

describe('Verify', () => {
  async function render(options: { pendingLogin: boolean } = { pendingLogin: true }) {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Verify],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
      ],
    });
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    if (options.pendingLogin) {
      const pending = firstValueFrom(auth.login('admin@codetech-sa.com', 'Password@123', false));
      http.expectOne(LOGIN).flush(LOGIN_BODY);
      await pending;
    }
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const fixture = TestBed.createComponent(Verify);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    return { fixture, root, navigate, toast, auth, http };
  }

  async function submit(
    rendered: Awaited<ReturnType<typeof render>>,
    code: string,
    flushProfile = false,
  ): Promise<void> {
    rendered.fixture.componentInstance.form.controls.code.setValue(code);
    rendered.root.querySelector('form')?.dispatchEvent(new Event('submit'));
    if (flushProfile) {
      rendered.http.expectOne(PROFILE).flush(PROFILE_BODY);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();
  }

  it('requires a four-digit code before calling the service', async () => {
    const rendered = await render();
    await submit(rendered, '12');

    expect(rendered.root.querySelector('#otp-error')).not.toBeNull();
    expect(rendered.navigate).not.toHaveBeenCalled();
    expect(rendered.auth.isAuthenticated()).toBe(false);
    rendered.http.verify();
  });

  it('shows an inline error for a wrong code and stays on the page', async () => {
    const rendered = await render();
    await submit(rendered, '9999');

    expect(rendered.root.querySelector('#otp-error')).not.toBeNull();
    expect(rendered.navigate).not.toHaveBeenCalled();
    expect(rendered.auth.isAuthenticated()).toBe(false);
    expect(rendered.auth.hasPendingLogin()).toBe(true);
    rendered.http.verify();
  });

  it('opens the session and goes home after the temporary fixed OTP 1111', async () => {
    const rendered = await render();
    expect(TEMPORARY_DEMO_OTP).toBe('1111');
    await submit(rendered, '1111', true);

    expect(rendered.auth.isAuthenticated()).toBe(true);
    expect(rendered.navigate).toHaveBeenCalledWith(['/']);
    rendered.http.verify();
  });

  it('shows a toast and returns to login when there is no pending login', async () => {
    const rendered = await render({ pendingLogin: false });
    await submit(rendered, TEMPORARY_DEMO_OTP);

    expect(rendered.toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    expect(rendered.navigate).toHaveBeenCalledWith(['/login']);
    rendered.http.verify();
  });

  it('starts a 60 second resend countdown and disables the button meanwhile', async () => {
    const rendered = await render();
    const resend = rendered.root.querySelector<HTMLButtonElement>('.otp-footer button');
    resend?.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rendered.fixture.whenStable();
    rendered.fixture.detectChanges();

    expect(rendered.fixture.componentInstance.clock()).toBe('01:00');
    expect(rendered.root.querySelector<HTMLButtonElement>('.otp-footer button')?.disabled).toBe(
      true,
    );
    rendered.http.verify();
  });

  it('clears pending auth when the user goes back to login', async () => {
    const rendered = await render();
    rendered.fixture.componentInstance.back();
    expect(rendered.auth.hasPendingLogin()).toBe(false);
    expect(rendered.navigate).toHaveBeenCalledWith(['/login']);
    rendered.http.verify();
  });
});
