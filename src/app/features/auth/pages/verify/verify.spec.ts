import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../core/auth/auth.service';
import { DEMO_CREDENTIALS } from '../../../../core/config/demo-credentials';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import { Verify } from './verify';

const DEMO = { password: 'test-password', otp: '0000' };

describe('Verify', () => {
  async function render(options: { pendingLogin: boolean } = { pendingLogin: true }) {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Verify],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
        { provide: DEMO_CREDENTIALS, useValue: DEMO },
      ],
    });
    const auth = TestBed.inject(AuthService);
    if (options.pendingLogin) {
      await firstValueFrom(auth.login('admin@codetech.sa', DEMO.password));
    }
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const fixture = TestBed.createComponent(Verify);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    return { fixture, root, navigate, toast, auth };
  }

  async function submit(
    fixture: Awaited<ReturnType<typeof render>>['fixture'],
    code: string,
  ): Promise<void> {
    fixture.componentInstance.form.controls.code.setValue(code);
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('requires a four-digit code before calling the service', async () => {
    const { fixture, root, navigate, auth } = await render();
    await submit(fixture, '12');

    expect(root.querySelector('#otp-error')).not.toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('shows an inline error for a wrong code and stays on the page', async () => {
    const { fixture, root, navigate, auth } = await render();
    await submit(fixture, '9999');

    expect(root.querySelector('#otp-error')).not.toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('opens the session and goes home after the correct code', async () => {
    const { fixture, navigate, auth } = await render();
    await submit(fixture, DEMO.otp);

    expect(auth.isAuthenticated()).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('shows a toast and returns to login when there is no pending login', async () => {
    const { fixture, navigate, toast } = await render({ pendingLogin: false });
    await submit(fixture, DEMO.otp);

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('starts a 60 second resend countdown and disables the button meanwhile', async () => {
    const { fixture, root } = await render();
    const resend = root.querySelector<HTMLButtonElement>('.otp-footer button');
    resend?.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.clock()).toBe('01:00');
    expect(root.querySelector<HTMLButtonElement>('.otp-footer button')?.disabled).toBe(true);
  });
});
