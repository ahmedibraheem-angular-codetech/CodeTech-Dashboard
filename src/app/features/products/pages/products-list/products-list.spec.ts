import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, firstValueFrom, throwError } from 'rxjs';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import { LanguageService } from '../../../../core/services/language.service';
import { blankProduct, localeText, type Product } from '../../models/product.model';
import { PRODUCTS_SEED } from '../../services/products.mock';
import { ProductsService } from '../../services/products.service';
import { ProductsPage } from './products-list';

const PRODUCT_GRANTS = [
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
] as const;

describe('ProductsPage', () => {
  async function settle<T>(fixture: { detectChanges(): void; whenStable(): Promise<void> } & T) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function render(prepare?: (api: ProductsService) => Promise<void>) {
    TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...PRODUCT_GRANTS],
      }),
    );
    const api = TestBed.inject(ProductsService);
    await prepare?.(api);
    const fixture = TestBed.createComponent(ProductsPage);
    fixture.detectChanges();
    return { fixture, api, root: fixture.nativeElement as HTMLElement };
  }

  const cards = (root: HTMLElement) => root.querySelectorAll('.product-card');
  const confirmOf = (fixture: { componentRef: { instance: ProductsPage } }) =>
    fixture.componentRef.instance['confirm']();
  const deleteButtons = (root: HTMLElement) =>
    root.querySelectorAll<HTMLButtonElement>('button[aria-label="حذف المنتج"]');

  afterEach(() => {
    TestBed.inject(LanguageService).set('ar');
  });

  it('shows the loading state until the products arrive', async () => {
    const { fixture, root } = await render();
    expect(root.querySelector('app-state-view .pi-inbox')).toBeNull();
    expect(root.querySelector('app-state-view p-progress-spinner')).not.toBeNull();
    expect(cards(root)).toHaveLength(0);
    await settle(fixture);
    expect(root.querySelector('app-state-view')).toBeNull();
    expect(cards(root).length).toBeGreaterThan(0);
  });

  it('renders the catalog from the products service', async () => {
    const { fixture, root } = await render();
    await settle(fixture);

    expect(root.textContent).toContain('إدارة المنتجات');
    expect(root.textContent).toContain('نظام إدارة خدمات تقنية المعلومات');
    expect(cards(root).length).toBeGreaterThan(0);
    expect(fixture.componentInstance.status()).toBe('ready');
  });

  it('shows an error instead of the empty state when loading fails', async () => {
    TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProductsService);
    vi.spyOn(api, 'list').mockReturnValue(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(ProductsPage);
    fixture.detectChanges();
    await settle(fixture);
    const root: HTMLElement = fixture.nativeElement;

    expect(fixture.componentInstance.status()).toBe('error');
    expect(root.querySelector('app-state-view .pi-exclamation-circle')).not.toBeNull();
    expect(root.querySelector('app-state-view .pi-inbox')).toBeNull();
    expect(root.textContent).toContain('حدث خطأ');
    expect(root.textContent).toContain('إعادة المحاولة');
    expect(cards(root)).toHaveLength(0);
  });

  it('retries after a load failure and shows the catalog on success', async () => {
    TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProductsService);
    const list = vi.spyOn(api, 'list').mockReturnValueOnce(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(ProductsPage);
    fixture.detectChanges();
    await settle(fixture);
    expect(fixture.componentInstance.status()).toBe('error');

    const next = new Subject<Product[]>();
    list.mockReturnValueOnce(next.asObservable());
    fixture.componentInstance['retry']();
    expect(fixture.componentInstance.status()).toBe('loading');
    next.next(structuredClone(PRODUCTS_SEED));
    next.complete();
    await settle(fixture);

    expect(fixture.componentInstance.status()).toBe('ready');
    expect(cards(fixture.nativeElement).length).toBeGreaterThan(0);
  });

  it('keeps the error state when retry fails again', async () => {
    TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProductsService);
    vi.spyOn(api, 'list').mockReturnValue(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(ProductsPage);
    fixture.detectChanges();
    await settle(fixture);

    fixture.componentInstance['retry']();
    await settle(fixture);

    expect(fixture.componentInstance.status()).toBe('error');
    expect(
      fixture.nativeElement.querySelector('app-state-view .pi-exclamation-circle'),
    ).not.toBeNull();
  });

  it('ignores a stale list response after a newer load has started', async () => {
    TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ProductsService);
    const first = new Subject<Product[]>();
    const second = new Subject<Product[]>();
    let calls = 0;
    vi.spyOn(api, 'list').mockImplementation(() => {
      calls += 1;
      return calls === 1 ? first.asObservable() : second.asObservable();
    });
    const fixture = TestBed.createComponent(ProductsPage);
    fixture.detectChanges();
    expect(fixture.componentInstance.status()).toBe('loading');

    fixture.componentInstance['retry']();
    const newer = structuredClone(PRODUCTS_SEED).slice(0, 1);
    second.next(newer);
    second.complete();
    await settle(fixture);
    expect(fixture.componentInstance.status()).toBe('ready');
    expect(fixture.componentInstance['source']()).toEqual(newer);

    first.next(structuredClone(PRODUCTS_SEED));
    first.complete();
    await settle(fixture);
    expect(fixture.componentInstance['source']()).toEqual(newer);
    expect(cards(fixture.nativeElement)).toHaveLength(1);
  });

  it('does not report a successful deletion when the remove request fails', async () => {
    const { fixture, api, root } = await render();
    await settle(fixture);
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    vi.spyOn(api, 'remove').mockReturnValue(throwError(() => new Error('offline')));
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const before = cards(root).length;

    deleteButtons(root)[0]!.click();
    await settle(fixture);

    expect(cards(root)).toHaveLength(before);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'حدث خطأ' }),
    );
    expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
  });

  it('removes the product and updates the list when deletion is confirmed', async () => {
    const { fixture, api, root } = await render();
    await settle(fixture);
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    const removed = PRODUCTS_SEED[0]!;
    const before = cards(root).length;

    deleteButtons(root)[0]!.click();
    await settle(fixture);

    expect(cards(root)).toHaveLength(before - 1);
    expect(await firstValueFrom(api.get(removed.id))).toBeNull();
    expect(await firstValueFrom(api.list())).toHaveLength(before - 1);
  });

  it('keeps the product when deletion is cancelled', async () => {
    const { fixture, api, root } = await render();
    await settle(fixture);
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(false);
    const before = await firstValueFrom(api.list());

    deleteButtons(root)[0]!.click();
    await settle(fixture);

    expect(cards(root)).toHaveLength(before.length);
    expect(await firstValueFrom(api.list())).toEqual(before);
  });

  it('shows the empty state when there are no products', async () => {
    const { fixture, root } = await render(async (api) => {
      for (const product of PRODUCTS_SEED) {
        await firstValueFrom(api.remove(product.id));
      }
    });
    await settle(fixture);

    expect(cards(root)).toHaveLength(0);
    expect(root.querySelector('app-state-view')?.textContent).toContain('لا توجد منتجات بعد');
    expect(root.querySelector('app-paginator')).toBeNull();
    expect(fixture.componentInstance.first()).toBe(0);
  });

  it('paginates long lists and steps back when the last card of a page is removed', async () => {
    const { fixture, root } = await render(async (api) => {
      const base = PRODUCTS_SEED[0]!;
      for (let index = 0; index < 5; index += 1) {
        await firstValueFrom(
          api.save({
            ...structuredClone(base),
            id: `extra-${index}`,
            name: localeText(`إضافي ${index}`, `Extra ${index}`),
          }),
        );
      }
    });
    await settle(fixture);
    expect(cards(root)).toHaveLength(10);
    expect(root.querySelector('app-paginator')).not.toBeNull();

    const page = fixture.componentInstance;
    page['page']({ first: 10, rows: 10 });
    fixture.detectChanges();
    expect(cards(root)).toHaveLength(1);

    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    deleteButtons(root)[0]!.click();
    await settle(fixture);

    expect(page.first()).toBe(0);
    expect(cards(root)).toHaveLength(10);
  });

  it('keeps the current page when other items remain after a deletion', async () => {
    const { fixture, root } = await render(async (api) => {
      const base = PRODUCTS_SEED[0]!;
      for (let index = 0; index < 5; index += 1) {
        await firstValueFrom(
          api.save({
            ...structuredClone(base),
            id: `extra-${index}`,
            name: localeText(`إضافي ${index}`, `Extra ${index}`),
          }),
        );
      }
    });
    await settle(fixture);

    const page = fixture.componentInstance;
    page['page']({ first: 10, rows: 10 });
    fixture.detectChanges();
    expect(cards(root)).toHaveLength(1);

    const api = TestBed.inject(ProductsService);
    await firstValueFrom(
      api.save({
        ...blankProduct(),
        id: 'extra-tail',
        name: localeText('ذيل', 'Tail'),
        published: true,
      }),
    );

    page['source'].set(await firstValueFrom(api.list()));
    fixture.detectChanges();
    expect(cards(root)).toHaveLength(2);

    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    deleteButtons(root)[0]!.click();
    await settle(fixture);

    expect(page.first()).toBe(10);
    expect(cards(root)).toHaveLength(1);
  });

  it('stays on a valid page and shows the empty state after deleting the final record', async () => {
    const { fixture, root } = await render(async (api) => {
      for (const product of PRODUCTS_SEED.slice(1)) {
        await firstValueFrom(api.remove(product.id));
      }
    });
    await settle(fixture);
    expect(cards(root)).toHaveLength(1);

    const page = fixture.componentInstance;
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    deleteButtons(root)[0]!.click();
    await settle(fixture);

    expect(page.first()).toBe(0);
    expect(cards(root)).toHaveLength(0);
    expect(root.querySelector('app-state-view')?.textContent).toContain('لا توجد منتجات بعد');
    expect(root.querySelector('app-paginator')).toBeNull();
  });

  it('resets an out-of-range page index when the final record is removed', async () => {
    const { fixture, root } = await render(async (api) => {
      for (const product of PRODUCTS_SEED.slice(1)) {
        await firstValueFrom(api.remove(product.id));
      }
    });
    await settle(fixture);

    const page = fixture.componentInstance;
    const only = page['source']()[0]!;
    page.first.set(10);
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    await page['remove'](only);
    await settle(fixture);

    expect(page.first()).toBe(0);
    expect(root.querySelector('app-state-view')?.textContent).toContain('لا توجد منتجات بعد');
    expect(root.querySelector('app-paginator')).toBeNull();
  });

  it('recovers to a valid page when the displayed list shrinks below the current offset', async () => {

    const { fixture, root } = await render(async (api) => {
      const base = PRODUCTS_SEED[0]!;
      for (let index = 0; index < 5; index += 1) {
        await firstValueFrom(
          api.save({
            ...structuredClone(base),
            id: `extra-${index}`,
            name: localeText(`إضافي ${index}`, `Extra ${index}`),
          }),
        );
      }
    });
    await settle(fixture);

    const page = fixture.componentInstance;
    page['page']({ first: 10, rows: 10 });
    fixture.detectChanges();
    expect(cards(root)).toHaveLength(1);

    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    deleteButtons(root)[0]!.click();
    await settle(fixture);

    expect(page.first()).toBe(0);
    expect(page.first()).toBeLessThan(page['source']().length);
    expect(cards(root).length).toBeGreaterThan(0);
  });
});
