import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { localeText } from '../../models/product.model';
import type { ProductsPageFeature, ProductsPageSector } from '../../models/products-page.model';
import { ProductsPageManage } from './products-page';

type ManageHarness = ProductsPageManage & {
  openFeature(feature?: ProductsPageFeature): void;
  openSector(sector?: ProductsPageSector): void;
  saveEditor(): void;
  text(value: { ar: string; en: string }): string;
  removeFeature(feature: ProductsPageFeature): Promise<void>;
  removeSector(sector: ProductsPageSector): Promise<void>;
};

describe('ProductsPageManage', () => {
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

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function render() {
    TestBed.configureTestingModule({
      imports: [ProductsPageManage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }],
    });
    const fixture = TestBed.createComponent(ProductsPageManage);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function page(fixture: Awaited<ReturnType<typeof render>>): ManageHarness {
    return fixture.componentInstance as unknown as ManageHarness;
  }

  function saveDisabled(component: ManageHarness): boolean {
    if (component.editorKind() === 'feature') {
      return !component.text(component.draftFeature().title).trim();
    }
    return (
      !component.text(component.draftSector().title).trim() || !component.draftSector().imageUrl
    );
  }

  it('loads features and sectors panels', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    const component = page(fixture);

    expect(component.status()).toBe('ready');
    expect(component.content()?.features.length).toBeGreaterThan(0);
    expect(component.content()?.sectors.length).toBeGreaterThan(0);
    expect(root.querySelector('app-products-page-features')).not.toBeNull();
    expect(root.querySelector('app-products-page-sectors')).not.toBeNull();
  });

  it('opens and cancels the feature editor', async () => {
    const fixture = await render();
    const component = page(fixture);

    component.openFeature();
    fixture.detectChanges();
    expect(component.editorOpen()).toBe(true);
    expect(component.editorKind()).toBe('feature');
    expect(component.editorMode()).toBe('create');
    expect(document.body.querySelector('app-products-page-editor-form')).not.toBeNull();

    component.editorOpen.set(false);
    fixture.detectChanges();
    expect(component.editorOpen()).toBe(false);
  });

  it('opens and cancels the sector editor', async () => {
    const fixture = await render();
    const component = page(fixture);

    component.openSector();
    fixture.detectChanges();
    expect(component.editorOpen()).toBe(true);
    expect(component.editorKind()).toBe('sector');
    expect(component.editorMode()).toBe('create');

    component.editorOpen.set(false);
    fixture.detectChanges();
    expect(component.editorOpen()).toBe(false);
  });

  it('disables save for an empty feature title and for a sector missing title or image', async () => {
    const fixture = await render();
    const component = page(fixture);

    component.openFeature();
    fixture.detectChanges();
    expect(saveDisabled(component)).toBe(true);

    component.draftFeature.update((current) => ({
      ...current,
      title: localeText('ميزة جديدة', 'New feature'),
    }));
    fixture.detectChanges();
    expect(saveDisabled(component)).toBe(false);

    component.openSector();
    fixture.detectChanges();
    expect(saveDisabled(component)).toBe(true);

    component.draftSector.update((current) => ({
      ...current,
      title: localeText('قطاع', 'Sector'),
    }));
    fixture.detectChanges();
    expect(saveDisabled(component)).toBe(true);

    component.draftSector.update((current) => ({
      ...current,
      imageUrl: '/images/product-cover-desk.jpg',
    }));
    fixture.detectChanges();
    expect(saveDisabled(component)).toBe(false);
  });

  it('uses the editor locale when deciding whether a feature title is present', async () => {
    const fixture = await render();
    const component = page(fixture);

    component.openFeature();
    component.draftFeature.update((current) => ({
      ...current,
      title: { ar: 'عنوان عربي', en: '' },
    }));
    component.locale.set('ar');
    fixture.detectChanges();
    expect(saveDisabled(component)).toBe(false);

    component.locale.set('en');
    fixture.detectChanges();
    expect(saveDisabled(component)).toBe(true);
  });

  it('saves a new feature into content and closes the editor', async () => {
    const fixture = await render();
    const component = page(fixture);
    const before = component.content()!.features.length;

    component.openFeature();
    component.draftFeature.update((current) => ({
      ...current,
      title: localeText('ميزة اختبار', 'Test feature'),
      body: localeText('وصف', 'Body'),
    }));
    component.saveEditor();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.editorOpen()).toBe(false);
    expect(component.content()!.features).toHaveLength(before + 1);
    expect(component.content()!.features.some((item) => item.title.ar === 'ميزة اختبار')).toBe(
      true,
    );
  });

  it('saves a new sector into content and closes the editor', async () => {
    const fixture = await render();
    const component = page(fixture);
    const before = component.content()!.sectors.length;

    component.openSector();
    component.draftSector.update((current) => ({
      ...current,
      title: localeText('قطاع اختبار', 'Test sector'),
      imageUrl: '/images/product-cover-wood.jpg',
    }));
    component.saveEditor();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.editorOpen()).toBe(false);
    expect(component.content()!.sectors).toHaveLength(before + 1);
    expect(component.content()!.sectors.some((item) => item.title.ar === 'قطاع اختبار')).toBe(true);
  });

  it('does not save a feature when the current locale title is blank', async () => {
    const fixture = await render();
    const component = page(fixture);
    const before = component.content()!.features.length;

    component.openFeature();
    component.locale.set('en');
    component.draftFeature.update((current) => ({
      ...current,
      title: { ar: 'فقط عربي', en: '   ' },
    }));
    component.saveEditor();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.editorOpen()).toBe(true);
    expect(component.content()!.features).toHaveLength(before);
  });

  it('deletes a feature after confirmation and keeps it when cancelled', async () => {
    const fixture = await render();
    const component = page(fixture);
    const target = component.content()!.features[0];
    const before = component.content()!.features.length;

    const ask = vi.spyOn(ConfirmDialog.prototype, 'ask').mockResolvedValueOnce(false);
    await component.removeFeature(target);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.content()!.features).toHaveLength(before);
    expect(component.content()!.features.some((item) => item.id === target.id)).toBe(true);

    ask.mockResolvedValueOnce(true);
    await component.removeFeature(target);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.content()!.features).toHaveLength(before - 1);
    expect(component.content()!.features.some((item) => item.id === target.id)).toBe(false);
  });

  it('deletes a sector after confirmation', async () => {
    const fixture = await render();
    const component = page(fixture);
    const target = component.content()!.sectors[0];
    const before = component.content()!.sectors.length;

    vi.spyOn(ConfirmDialog.prototype, 'ask').mockResolvedValue(true);
    await component.removeSector(target);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.content()!.sectors).toHaveLength(before - 1);
    expect(component.content()!.sectors.some((item) => item.id === target.id)).toBe(false);
  });
});
