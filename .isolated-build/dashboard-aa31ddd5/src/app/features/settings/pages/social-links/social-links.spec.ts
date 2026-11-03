import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import { SocialLinksService } from '../../services/social-links.service';
import { SocialLinksPage } from './social-links';

const SITE_SETTINGS_GRANTS = [
  'site_settings.view',
  'site_settings.create',
  'site_settings.update',
  'site_settings.delete',
] as const;

describe('SocialLinksPage', () => {
  async function render() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SocialLinksPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...SITE_SETTINGS_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(SocialLinksPage);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders site details, location and social channel cards', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('h1')?.textContent).toContain('روابط التواصل الاجتماعي');
    expect(root.textContent).toContain('تفاصيل الموقع');
    expect(root.textContent).toContain('الموقع');
    expect(root.querySelectorAll('app-social-link-card').length).toBeGreaterThanOrEqual(6);
    expect(root.textContent).toContain('LinkedIn');
    expect(root.textContent).toContain('واتساب');
  });

  it('opens the edit-channel modal from a social card action', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;

    const edit = [...root.querySelectorAll('button')].find((btn) =>
      (btn.textContent ?? '').includes('تعديل'),
    );
    expect(edit).toBeTruthy();
    edit?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // PrimeNG dialog content is portaled to document.body.
    const overlay = document.body.textContent ?? '';
    expect(overlay).toContain('المنصة');
    expect(overlay).toContain('حالة النشر');
  });

  it('shows a success toast when a link is copied', async () => {
    const fixture = await render();
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const page = fixture.componentInstance as unknown as {
      onCopyResult: (r: { ok: true } | { ok: false; reason: string }) => void;
    };
    page.onCopyResult({ ok: true });
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', summary: 'تم نسخ الرابط' }),
    );
  });

  it('shows an error toast when clipboard copy fails', async () => {
    const fixture = await render();
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const page = fixture.componentInstance as unknown as {
      onCopyResult: (r: { ok: true } | { ok: false; reason: string }) => void;
    };
    page.onCopyResult({ ok: false, reason: 'denied' });
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'تعذر نسخ الرابط' }),
    );
  });

  it('persists toggle changes via the service', async () => {
    const fixture = await render();
    const api = TestBed.inject(SocialLinksService);
    const setEnabled = vi.spyOn(api, 'setChannelEnabled');
    const page = fixture.componentInstance as unknown as {
      channels: () => { id: string; enabled: boolean }[];
      setEnabled: (ch: { id: string }, enabled: boolean) => void;
    };
    const channel = page.channels()[0];
    page.setEnabled(channel, false);
    expect(setEnabled).toHaveBeenCalledWith(channel.id, false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.channels()[0].enabled).toBe(false);
  });

  it('surfaces an error toast when toggle persistence fails', async () => {
    const fixture = await render();
    const api = TestBed.inject(SocialLinksService);
    vi.spyOn(api, 'setChannelEnabled').mockReturnValue(throwError(() => new Error('fail')));
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const page = fixture.componentInstance as unknown as {
      channels: () => { id: string }[];
      setEnabled: (ch: { id: string }, enabled: boolean) => void;
    };
    page.setEnabled(page.channels()[0], false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
  });

  it('switches section direction, copy, and bilingual drafts with the locale switch', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    const page = fixture.componentInstance as unknown as {
      locale: () => string;
      setLocale: (next: 'ar' | 'en') => void;
      form: { controls: { description: { value: string }; locationName: { value: string } } };
      t: (key: string) => string;
    };

    const section = root.querySelector('.social-page');
    expect(section?.getAttribute('dir')).toBe('rtl');
    expect(root.querySelector('h1')?.textContent).toContain('روابط التواصل الاجتماعي');
    expect(page.locale()).toBe('ar');
    expect(page.t('social.siteDetails')).toBe('تفاصيل الموقع');

    page.setLocale('en');
    fixture.detectChanges();

    expect(page.locale()).toBe('en');
    expect(section?.getAttribute('dir')).toBe('ltr');
    expect(page.t('social.siteDetails')).toBe('Site details');
    expect(page.form.controls.description.value).toMatch(/CodeTech/);
    expect(page.form.controls.locationName.value).toBe('Kingdom of Saudi Arabia');
    expect(root.querySelector('h1')?.textContent).toContain('Social links');
    expect(root.textContent).toContain('Site details');
    expect(root.textContent).toContain('Edit');
  });
});
