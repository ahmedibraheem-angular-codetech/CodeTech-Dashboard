import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { environment } from '../../../../../environments/environment';
import { apiUrl } from '../../../../core/config/api';
import type { FileObject } from '../../../../core/http/api.model';
import type { SiteSettingsDto } from '../../models/site-settings.api';
import type { SocialLinkDto } from '../../models/social-links.api';
import { SiteSettingsService } from '../../services/site-settings.service';
import { SocialLinksService } from '../../services/social-links.service';
import { SocialLinksPage } from './social-links';

const SITE = apiUrl(environment.apiUrl, 'admin/site-settings');
const SOCIAL = apiUrl(environment.apiUrl, 'admin/social-links');

const SITE_SETTINGS_GRANTS = [
  'site_settings.view',
  'site_settings.create',
  'site_settings.update',
  'site_settings.delete',
] as const;

const logoDto = (): FileObject => ({
  uuid: 'logo-1',
  name: 'logo',
  file_name: 'logo.png',
  mime_type: 'image/png',
  size: 10,
  url: 'https://cdn.test/logo.png',
  download_url: 'https://cdn.test/dl',
  created_at: '2026-10-29T10:00:00.000000Z',
});

const siteDto = (overrides: Partial<SiteSettingsDto> = {}): SiteSettingsDto => ({
  site_description: {
    ar: 'وصف الموقع العربي',
    en: 'We build digital solutions for CodeTech',
  },
  company_name: { ar: 'كود التقنية', en: 'CodeTech' },
  location_name: { ar: 'المملكة العربية السعودية', en: 'Kingdom of Saudi Arabia' },
  phone: '+966 55 298 3389',
  email: 'CodeTech@Gmail.com',
  website_url: 'https://code-tech.sa',
  google_maps_url: 'https://maps.google.com',
  logo: logoDto(),
  updated_by: { id: 1, name: 'Admin' },
  updated_at: '2026-09-19T00:00:00.000000Z',
  ...overrides,
});

const linkDto = (id: number, overrides: Partial<SocialLinkDto> = {}): SocialLinkDto => ({
  id,
  platform: 'linkedin',
  url: 'https://www.linkedin.com/company/codetech',
  is_published: true,
  sort_order: id,
  created_at: '2026-10-29T10:00:00.000000Z',
  updated_at: '2026-10-29T10:00:00.000000Z',
  ...overrides,
});

describe('SocialLinksPage', () => {
  let http: HttpTestingController;

  async function render(options?: {
    site?: SiteSettingsDto | 'error';
    channels?: SocialLinkDto[] | 'error';
  }) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SocialLinksPage],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
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
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SocialLinksPage);
    fixture.detectChanges();

    const siteReq = http.expectOne(SITE);
    const socialReq = http.expectOne(SOCIAL);

    if (options?.site === 'error') {
      siteReq.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
    } else {
      siteReq.flush({ data: options?.site ?? siteDto() });
    }

    if (options?.channels === 'error') {
      socialReq.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
    } else {
      socialReq.flush({
        data: options?.channels ?? [
          linkDto(1),
          linkDto(2, { platform: 'facebook', url: 'https://facebook.com/c' }),
          linkDto(3, { platform: 'x', url: 'https://x.com/c' }),
          linkDto(4, { platform: 'instagram' }),
          linkDto(5, { platform: 'snapchat' }),
          linkDto(6, { platform: 'tiktok' }),
          linkDto(7, { platform: 'whatsapp', url: 'https://wa.me/1' }),
        ],
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('loads site settings and social channels independently', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('h1')?.textContent).toContain('روابط التواصل الاجتماعي');
    expect(root.textContent).toContain('تفاصيل الموقع');
    expect(root.textContent).toContain('الموقع');
    expect(root.querySelector('.social-page__notice')).toBeNull();
    expect(root.querySelectorAll('app-social-link-card').length).toBe(7);
    expect(root.textContent).toContain('LinkedIn');
    expect(root.textContent).toContain('واتساب');
    expect(root.textContent).toContain('X');
  });

  it('keeps channels when site settings fail to load', async () => {
    const fixture = await render({ site: 'error' });
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('app-social-link-card').length).toBe(7);
    expect(fixture.componentInstance.site()).toBeNull();
  });

  it('keeps site details when social channels fail to load', async () => {
    const fixture = await render({ channels: 'error' });
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('تفاصيل الموقع');
    expect(root.querySelectorAll('app-social-link-card').length).toBe(0);
    expect(fixture.componentInstance.site()?.email).toBe('CodeTech@Gmail.com');
  });

  it('saves site settings without touching social endpoints', async () => {
    const fixture = await render();
    const page = fixture.componentInstance as unknown as {
      form: { patchValue: (v: Record<string, string>) => void };
      save: () => void;
    };
    page.form.patchValue({ phone: '+966 11 222 3333' });
    page.save();
    fixture.detectChanges();

    const put = http.expectOne(SITE);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.phone).toBe('+966 11 222 3333');
    expect(put.request.body.company_name).toEqual({ ar: 'كود التقنية', en: 'CodeTech' });
    expect(put.request.body).not.toHaveProperty('logo');
    put.flush({ data: siteDto({ phone: '+966 11 222 3333' }) });
    await fixture.whenStable();
    http.expectNone((req) => req.url.startsWith(SOCIAL) && req.method !== 'GET');
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

  it('persists toggle changes via publish', async () => {
    const fixture = await render();
    const api = TestBed.inject(SocialLinksService);
    const setPublished = vi.spyOn(api, 'setPublished');
    const page = fixture.componentInstance as unknown as {
      channels: () => { id: string; enabled: boolean }[];
      setEnabled: (ch: { id: string }, enabled: boolean) => void;
    };
    const channel = page.channels()[0]!;
    page.setEnabled(channel, false);
    expect(setPublished).toHaveBeenCalledWith(channel.id, false);

    const req = http.expectOne(`${SOCIAL}/${channel.id}/publish`);
    expect(req.request.body).toEqual({ is_published: false });
    req.flush({ data: linkDto(Number(channel.id), { is_published: false }) });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.channels()[0]!.enabled).toBe(false);
  });

  it('surfaces an error toast when toggle persistence fails', async () => {
    const fixture = await render();
    const api = TestBed.inject(SocialLinksService);
    vi.spyOn(api, 'setPublished').mockReturnValue(throwError(() => new Error('fail')));
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const page = fixture.componentInstance as unknown as {
      channels: () => { id: string }[];
      setEnabled: (ch: { id: string }, enabled: boolean) => void;
    };
    page.setEnabled(page.channels()[0]!, false);
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

  it('does not call site settings when saving a social channel', async () => {
    const fixture = await render();
    const siteApi = TestBed.inject(SiteSettingsService);
    const saveSpy = vi.spyOn(siteApi, 'save');
    const page = fixture.componentInstance as unknown as {
      onEditorSaved: (draft: { platform: 'twitter'; status: 'published'; url: string }) => void;
    };
    page.onEditorSaved({
      platform: 'twitter',
      status: 'published',
      url: 'https://x.com/new',
    });
    const post = http.expectOne(SOCIAL);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      platform: 'x',
      url: 'https://x.com/new',
      is_published: true,
    });
    post.flush({ data: linkDto(99, { platform: 'x', url: 'https://x.com/new' }) });
    await fixture.whenStable();
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
