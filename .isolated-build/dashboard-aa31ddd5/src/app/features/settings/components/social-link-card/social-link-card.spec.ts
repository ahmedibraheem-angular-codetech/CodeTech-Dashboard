import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SocialChannel } from '../../models/social-links.model';
import { SocialLinkCard } from './social-link-card';
import type { SocialLinkCopyResult } from './social-link-url';

const channel: SocialChannel = {
  id: 'ch-linkedin',
  platform: 'linkedin',
  enabled: true,
  status: 'published',
  url: {
    ar: 'Https://Www.Linkedin.Com/Company/Codetech',
    en: 'Https://Www.Linkedin.Com/Company/Codetech',
  },
};

@Component({
  selector: 'app-social-link-card-host',
  imports: [SocialLinkCard],
  template: `
    <app-social-link-card
      [channel]="channel"
      [title]="title"
      [url]="url"
      editLabel="Edit"
      deleteLabel="Delete"
      [openLabel]="openLabel"
      [copyLabel]="copyLabel"
      [urlFieldLabel]="urlFieldLabel"
      (enabledChange)="enabled = $event"
      (copyResult)="copies.push($event)"
    />
  `,
})
class SocialLinkCardHost {
  channel = { ...channel };
  title = 'LinkedIn';
  url = 'Https://Www.Linkedin.Com/Company/Codetech';
  openLabel = 'Open LinkedIn link';
  copyLabel = 'Copy LinkedIn link';
  urlFieldLabel = 'LinkedIn URL';
  enabled: boolean | null = null;
  copies: SocialLinkCopyResult[] = [];
}

describe('SocialLinkCard', () => {
  let fixture: ComponentFixture<SocialLinkCardHost>;
  let host: SocialLinkCardHost;
  let openSpy: ReturnType<typeof vi.spyOn>;

  async function render(url?: string): Promise<SocialLinkCard> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [SocialLinkCardHost] });
    fixture = TestBed.createComponent(SocialLinkCardHost);
    host = fixture.componentInstance;
    if (url !== undefined) {
      host.url = url;
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(SocialLinkCard))
      .componentInstance as SocialLinkCard;
  }

  afterEach(() => {
    openSpy?.mockRestore();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  function iconButtons(): HTMLButtonElement[] {
    return [
      ...fixture.nativeElement.querySelectorAll('.social-card__icon-btn'),
    ] as HTMLButtonElement[];
  }

  it('opens a valid https URL with noopener,noreferrer', async () => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const card = await render('https://example.com/a');
    card['openUrl']();
    expect(openSpy).toHaveBeenCalledWith('https://example.com/a', '_blank', 'noopener,noreferrer');
  });

  it('opens a valid http URL', async () => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const card = await render('http://example.com');
    card['openUrl']();
    expect(openSpy).toHaveBeenCalledWith('http://example.com/', '_blank', 'noopener,noreferrer');
  });

  it('prefixes https when protocol is missing', async () => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const card = await render('example.com/x');
    card['openUrl']();
    expect(openSpy).toHaveBeenCalledWith('https://example.com/x', '_blank', 'noopener,noreferrer');
  });

  it('does not open empty, whitespace, malformed, or unsafe URLs', async () => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    for (const bad of ['', '   ', 'https://', 'javascript:alert(1)', 'data:text/html,x']) {
      const card = await render(bad);
      card['openUrl']();
    }
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('emits success when clipboard write succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const card = await render('Https://Example.Com');
    await card['copyUrl']();
    expect(writeText).toHaveBeenCalledWith('Https://Example.Com');
    expect(host.copies).toEqual([{ ok: true }]);
  });

  it('emits denied when clipboard write rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const card = await render('Https://Example.Com');
    await card['copyUrl']();
    expect(host.copies).toEqual([{ ok: false, reason: 'denied' }]);
  });

  it('emits empty without calling clipboard for blank URLs', async () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const card = await render('   ');
    await card['copyUrl']();
    expect(writeText).not.toHaveBeenCalled();
    expect(host.copies).toEqual([{ ok: false, reason: 'empty' }]);
  });

  it('emits unsupported when Clipboard API is missing', async () => {
    vi.stubGlobal('navigator', { clipboard: undefined });
    const card = await render('Https://Example.Com');
    await card['copyUrl']();
    expect(host.copies).toEqual([{ ok: false, reason: 'unsupported' }]);
  });

  it('exposes distinct accessible labels for open and copy', async () => {
    await render();
    const [openBtn, copyBtn] = iconButtons();
    expect(openBtn.getAttribute('aria-label')).toBe('Open LinkedIn link');
    expect(copyBtn.getAttribute('aria-label')).toBe('Copy LinkedIn link');
    expect(openBtn.getAttribute('aria-label')).not.toBe(copyBtn.getAttribute('aria-label'));
  });

  it('keeps the URL input focusable for keyboard select/copy', async () => {
    await render();
    const input = fixture.nativeElement.querySelector('.social-card__input') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(input.tabIndex).toBeGreaterThanOrEqual(0);
    expect(input.getAttribute('aria-label')).toBe('LinkedIn URL');
  });

  it('emits enabledChange when the toggle changes', async () => {
    const card = await render();
    card.enabledChange.emit(false);
    expect(host.enabled).toBe(false);
  });
});
