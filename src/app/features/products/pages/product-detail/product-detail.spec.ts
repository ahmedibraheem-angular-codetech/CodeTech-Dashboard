import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import type { ProductDetailRemovable } from './product-detail.types';
import { ProductDetailPage } from './product-detail';

type DetailHarness = ProductDetailPage & {
  selectTab(value: string | number | undefined): void;
  removeItem(key: ProductDetailRemovable, index: number): void;
};

const PRODUCT_GRANTS = [
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
] as const;

describe('ProductDetailPage', () => {
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

  async function render(id = 'info-system') {
    TestBed.configureTestingModule({
      imports: [ProductDetailPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...PRODUCT_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(ProductDetailPage);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function page(fixture: Awaited<ReturnType<typeof render>>): DetailHarness {
    return fixture.componentInstance as DetailHarness;
  }

  it('exposes the six detail tabs and renders the info panel by default', async () => {
    const fixture = await render();
    const component = page(fixture);
    const root: HTMLElement = fixture.nativeElement;

    expect(component.tabs.map((tab) => tab.id)).toEqual([
      'info',
      'sectors',
      'offer',
      'units',
      'identity',
      'faq',
    ]);
    expect(root.querySelector('app-page-tabs')).not.toBeNull();
    expect(root.querySelector('app-product-detail-info')).not.toBeNull();
    expect(component.item()?.id).toBe('info-system');
    expect(component.item()!.stats.length).toBeGreaterThan(1);
    expect(component.item()!.units.length).toBeGreaterThan(1);
    expect(component.item()!.identity.length).toBeGreaterThan(1);
  });

  it('switches the visible tab panels', async () => {
    const fixture = await render();
    const component = page(fixture);
    const root: HTMLElement = fixture.nativeElement;

    for (const [tabId, selector] of [
      ['sectors', 'app-product-detail-sectors'],
      ['offer', 'app-product-detail-offer'],
      ['units', 'app-product-detail-units'],
      ['identity', 'app-product-detail-identity'],
      ['faq', 'app-product-detail-faq'],
      ['info', 'app-product-detail-info'],
    ] as const) {
      component.selectTab(tabId);
      fixture.detectChanges();
      expect(root.querySelector(selector)).not.toBeNull();
    }
  });

  it('clamps statIndex when the selected last stat is removed', async () => {
    const fixture = await render();
    const component = page(fixture);
    const before = component.item()!.stats.length;
    expect(before).toBeGreaterThanOrEqual(2);

    component.statIndex.set(before - 1);
    component.removeItem('stats', before - 1);
    fixture.detectChanges();

    expect(component.item()!.stats).toHaveLength(before - 1);
    expect(component.statIndex()).toBe(before - 2);
  });

  it('decrements statIndex when an earlier stat than the selection is removed', async () => {
    const fixture = await render();
    const component = page(fixture);
    const before = component.item()!.stats.length;
    expect(before).toBeGreaterThanOrEqual(3);

    component.statIndex.set(2);
    component.removeItem('stats', 0);
    fixture.detectChanges();

    expect(component.item()!.stats).toHaveLength(before - 1);
    expect(component.statIndex()).toBe(1);
  });

  it('keeps statIndex when the selected middle stat is removed and a later item remains', async () => {
    const fixture = await render();
    const component = page(fixture);
    const before = component.item()!.stats.length;
    expect(before).toBeGreaterThanOrEqual(3);

    component.statIndex.set(1);
    const nextLabel = component.item()!.stats[2].value;
    component.removeItem('stats', 1);
    fixture.detectChanges();

    expect(component.item()!.stats).toHaveLength(before - 1);
    expect(component.statIndex()).toBe(1);
    expect(component.item()!.stats[1].value).toBe(nextLabel);
  });

  it('clamps unitIndex after removing the last unit', async () => {
    const fixture = await render();
    const component = page(fixture);
    const before = component.item()!.units.length;
    expect(before).toBeGreaterThanOrEqual(2);

    component.unitIndex.set(before - 1);
    component.removeItem('units', before - 1);
    fixture.detectChanges();

    expect(component.item()!.units).toHaveLength(before - 1);
    expect(component.unitIndex()).toBe(before - 2);
  });

  it('decrements unitIndex when removing a unit before the selection', async () => {
    const fixture = await render();
    const component = page(fixture);
    expect(component.item()!.units.length).toBeGreaterThanOrEqual(3);

    component.unitIndex.set(2);
    component.removeItem('units', 0);
    fixture.detectChanges();

    expect(component.unitIndex()).toBe(1);
  });

  it('clamps identityIndex after removing the last identity item', async () => {
    const fixture = await render();
    const component = page(fixture);
    const before = component.item()!.identity.length;
    expect(before).toBeGreaterThanOrEqual(2);

    component.identityIndex.set(before - 1);
    component.removeItem('identity', before - 1);
    fixture.detectChanges();

    expect(component.item()!.identity).toHaveLength(before - 1);
    expect(component.identityIndex()).toBe(before - 2);
  });

  it('decrements identityIndex when removing an earlier identity item', async () => {
    const fixture = await render();
    const component = page(fixture);
    expect(component.item()!.identity.length).toBeGreaterThanOrEqual(3);

    component.identityIndex.set(2);
    component.removeItem('identity', 1);
    fixture.detectChanges();

    expect(component.identityIndex()).toBe(1);
  });

  it('does not remove from an indexed list when only one item remains', async () => {
    const fixture = await render();
    const component = page(fixture);

    while (component.item()!.stats.length > 1) {
      component.removeItem('stats', 0);
    }
    fixture.detectChanges();
    expect(component.item()!.stats).toHaveLength(1);

    const only = component.item()!.stats[0];
    component.removeItem('stats', 0);
    fixture.detectChanges();

    expect(component.item()!.stats).toHaveLength(1);
    expect(component.item()!.stats[0]).toEqual(only);
  });
});
