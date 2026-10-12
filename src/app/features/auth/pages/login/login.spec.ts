import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../core/auth/auth.service';
import { DEMO_CREDENTIALS } from '../../../../core/config/demo-credentials';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import { Login } from './login';

const DEMO = { password: 'test-password', otp: '0000' };

describe('Login', () => {
  async function render() {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
        { provide: DEMO_CREDENTIALS, useValue: DEMO },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const auth = TestBed.inject(AuthService);
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    return { fixture, root, navigate, auth };
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

  async function submit(fixture: Awaited<ReturnType<typeof render>>['fixture']): Promise<void> {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form');
    form?.dispatchEvent(new Event('submit'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('starts with an empty email field (no pre-filled address)', async () => {
    const { root } = await render();
    expect(input(root, '#email').value).toBe('');
  });

  it('shows required errors and does not sign in when the form is empty', async () => {
    const { fixture, root, navigate, auth } = await render();
    await submit(fixture);

    expect(root.querySelector('#email-error')).not.toBeNull();
    expect(root.querySelector('#password-error')).not.toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(auth.hasPendingLogin()).toBe(false);
  });

  it('shows an inline credential error for a wrong password', async () => {
    const { fixture, root, navigate, auth } = await render();
    fill(root, '#email', 'admin@codetech.sa');
    fill(root, '#password', 'not-the-password');
    await submit(fixture);

    expect(root.querySelector('#password-error')).not.toBeNull();
    expect(input(root, '#password').getAttribute('aria-invalid')).toBe('true');
    expect(navigate).not.toHaveBeenCalled();
    expect(auth.hasPendingLogin()).toBe(false);
  });

  it('moves to the verification step after a correct password', async () => {
    const { fixture, root, navigate, auth } = await render();
    fill(root, '#email', 'admin@codetech.sa');
    fill(root, '#password', DEMO.password);
    await submit(fixture);

    expect(navigate).toHaveBeenCalledWith(['/verify']);
    expect(auth.hasPendingLogin()).toBe(true);
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('toggles password visibility', async () => {
    const { fixture, root } = await render();
    expect(input(root, '#password').type).toBe('password');

    root.querySelector<HTMLButtonElement>('.field__toggle')?.click();
    fixture.detectChanges();
    expect(input(root, '#password').type).toBe('text');
  });

  it('keeps "remember me" cosmetic: ticking it persists nothing', async () => {
    const { fixture, root, auth } = await render();
    const checkbox = input(root, '.remember__input');
    checkbox.click();
    fixture.detectChanges();
    expect(checkbox.checked).toBe(true);

    fill(root, '#email', 'admin@codetech.sa');
    fill(root, '#password', DEMO.password);
    await submit(fixture);

    expect(auth.hasPendingLogin()).toBe(true);
    expect(localStorage.length).toBe(0);
    expect(JSON.stringify(Object.entries(sessionStorage))).not.toContain(DEMO.password);
  });
});
