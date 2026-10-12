import { TestBed } from '@angular/core/testing';

import { PageTabs, type PageTab } from './page-tabs';

const TABS: readonly PageTab[] = [
  { id: 'seo', labelKey: 'nav.seo', icon: 'pi pi-search' },
  { id: 'home', labelKey: 'nav.home', icon: 'pi pi-home' },
];

describe('PageTabs', () => {
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

  function render(value = 'seo') {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [PageTabs] });
    const fixture = TestBed.createComponent(PageTabs);
    fixture.componentRef.setInput('tabs', TABS);
    fixture.componentRef.setInput('value', value);
    const selected: Array<string | number | undefined> = [];
    fixture.componentInstance.valueChange.subscribe((next) => selected.push(next));
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement, selected };
  }

  it('renders one PrimeNG tab per item, with the translated label and icon', () => {
    const { root } = render();
    const tabs = root.querySelectorAll('[role="tab"]');

    expect(root.querySelector('p-tabs')).not.toBeNull();
    expect(tabs).toHaveLength(2);
    expect(tabs[0].textContent).toContain('إعدادات SEO');
    expect(tabs[0].querySelector('.pi-search')).not.toBeNull();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  it('emits the clicked tab id and leaves selection to the parent', () => {
    const { fixture, root, selected } = render();

    root.querySelectorAll<HTMLElement>('[role="tab"]')[1].click();
    fixture.detectChanges();

    expect(selected).toEqual(['home']);
    expect(fixture.componentInstance.value()).toBe('seo');
  });
});
