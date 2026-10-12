import { TestBed } from '@angular/core/testing';

import { SeoPage } from './seo';

describe('SeoPage', () => {
  // jsdom has no ResizeObserver, which PrimeNG's scrollable tab list uses.
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  function render() {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [SeoPage] });
    const fixture = TestBed.createComponent(SeoPage);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('renders the seven page tabs on one shared layout', () => {
    const { root } = render();
    const tabs = root.querySelectorAll('app-page-tabs [role="tab"]');

    expect(tabs).toHaveLength(7);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(root.querySelectorAll('.seo-panel')).toHaveLength(2);
    expect(root.querySelector('.seo-drop')).not.toBeNull();
    expect(root.querySelector('#seo-description')).not.toBeNull();
  });

  it('keeps the same cards when another page tab is selected', () => {
    const { fixture, root } = render();
    const tabs = root.querySelectorAll<HTMLButtonElement>('app-page-tabs [role="tab"]');

    tabs[3].click();
    fixture.detectChanges();

    expect(tabs[3].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(root.querySelectorAll('.seo-panel')).toHaveLength(2);
  });

  it('follows the card language for the field copy', () => {
    const { fixture, root } = render();
    const meta = root.querySelectorAll('.seo-panel')[0];

    expect(meta.textContent).toContain('عنوان SEO لصفحة إعدادات SEO');

    meta.querySelectorAll<HTMLButtonElement>('.locale-switch__option')[0].click();
    fixture.detectChanges();

    expect(meta.textContent).toContain('Meta Title');
    expect(root.querySelectorAll('.seo-panel')[1].textContent).toContain('رفع الصورة');
  });

  it('counts the description and restores it on undo', () => {
    const { fixture, root } = render();
    const description = root.querySelector<HTMLTextAreaElement>('#seo-description');
    expect(description).not.toBeNull();

    description!.value = 'Hello';
    description!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(root.querySelector('.seo-count span')?.textContent).toBe('5/160');

    const revert = root.querySelectorAll('p-button')[1].querySelector('button');
    expect(revert?.disabled).toBe(false);
    revert?.click();
    fixture.detectChanges();

    expect(root.querySelector<HTMLTextAreaElement>('#seo-description')?.value).toBe('');
    expect(root.querySelector('.seo-count span')?.textContent).toBe('0/160');
  });

  it('rejects a thumbnail that is not a PNG or JPG', () => {
    const { fixture, root } = render();
    const input = root.querySelector<HTMLInputElement>('input[type="file"]');
    const file = new File(['gif'], 'anim.gif', { type: 'image/gif' });
    Object.defineProperty(input, 'files', { configurable: true, value: { 0: file, length: 1 } });
    input!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(root.querySelector('.field__error')?.textContent).toContain('PNG');
  });
});
