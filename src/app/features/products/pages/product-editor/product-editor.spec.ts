import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { firstValueFrom, map, of, Subject, throwError, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { blankProduct, localeText, type Product } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';
import { ProductEditor } from './product-editor';

@Component({ template: '' })
class ProductRouteStub {}

describe('ProductEditor', () => {
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

  async function render(
    mode: 'create' | 'edit',
    id = '',
    api?: Pick<ProductsService, 'get' | 'save'>,
  ) {
    TestBed.configureTestingModule({
      imports: [ProductEditor],
      providers: [
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
        provideRouter([{ path: 'products/:id', component: ProductRouteStub }]),
        {
          provide: ActivatedRoute,
          useValue: { data: of({ mode }), snapshot: { data: { mode } } },
        },
      ],
    });
    if (api) {
      TestBed.overrideProvider(ProductsService, { useValue: api });
    }
    localStorage.setItem('codetech.language', 'ar');
    const fixture = TestBed.createComponent(ProductEditor);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('keeps a stepper on the create flow', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('p-stepper.wizard')).not.toBeNull();
    expect(root.querySelector('.section-tabs')).toBeNull();
    expect(root.textContent).toContain('التالي');

    enterName(root, 'منتج تجريبي');
    fixture.detectChanges();
    [...root.querySelectorAll<HTMLButtonElement>('.locale-switch__option')]
      .find((button) => button.textContent?.includes('English'))
      ?.click();
    fixture.detectChanges();
    enterName(root, 'Sample product');
    fixture.detectChanges();

    root.querySelector<HTMLButtonElement>('.editor-nav--next')?.click();
    fixture.detectChanges();

    const marks = [...root.querySelectorAll<HTMLButtonElement>('.wizard__step')];
    expect(marks[0]?.classList.contains('is-done')).toBe(true);
    expect(marks[0]?.querySelector('.pi-check')).not.toBeNull();
    expect(marks[1]?.classList.contains('is-done')).toBe(false);

    marks[0]?.click();
    fixture.detectChanges();
    expect(marks[0]?.classList.contains('is-done')).toBe(false);
    expect(marks[0]?.querySelector('.pi-check')).toBeNull();
  });

  it('switches form copy with the Arabic and English locale tab', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('عنوان المنتج');
    expect(root.textContent).toContain('مميزات المنتج');

    const english = [...root.querySelectorAll<HTMLButtonElement>('.locale-switch__option')].find(
      (button) => button.textContent?.includes('English'),
    );
    english?.click();
    fixture.detectChanges();

    expect(document.documentElement.dir).toBe('rtl');
    expect(root.querySelector('.editor-card')?.getAttribute('dir')).toBe('ltr');
    expect(root.textContent).toContain('إضافة منتج جديد');
    expect(root.textContent).toContain('Product title');
    expect(root.textContent).toContain('Product features');
    expect(root.textContent).toContain('Add a feature');
  });

  it('uses tabs on the edit flow and keeps the product name', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-page-tabs')).not.toBeNull();
    expect(root.querySelector('p-stepper')).toBeNull();
    expect(root.querySelector<HTMLInputElement>('input:not([type="file"])')?.value).toBe(
      'نظام إدارة خدمات تقنية المعلومات',
    );

    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs[2]?.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('ما يقدمه المنتج');
    tabs[0]?.click();
    fixture.detectChanges();
    const name = root.querySelector<HTMLInputElement>('input:not([type="file"])');
    expect(name?.value).toBe('نظام إدارة خدمات تقنية المعلومات');
  });

  it('stays on the first step until both names are filled', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;

    clickNext(root);
    fixture.detectChanges();
    expect(root.textContent).toContain('هذا الحقل مطلوب');
    expect(root.querySelector('.wizard__step.is-done')).toBeNull();

    enterName(root, 'منتج تجريبي');
    clickNext(root);
    fixture.detectChanges();
    expect(root.textContent).toContain('هذا الحقل مطلوب');
    expect(root.querySelector('.wizard__step.is-done')).toBeNull();

    switchToEnglish(root);
    fixture.detectChanges();
    enterName(root, 'Sample product');
    clickNext(root);
    fixture.detectChanges();

    expect(root.textContent).not.toContain('هذا الحقل مطلوب');
    expect(root.querySelector('.wizard__step.is-done')).not.toBeNull();
  });

  it('keeps the published flag on edit save and can draft or publish without leaving', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const api = TestBed.inject(ProductsService);
    const router = TestBed.inject(Router);

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);
    expect((await firstValueFrom(api.get('info-system')))?.published).toBe(false);
    expect(root.textContent).toContain('نشر');
    expect(router.url).toBe('/');

    clickButton(root, 'نشر');
    await settle(fixture);
    expect((await firstValueFrom(api.get('info-system')))?.published).toBe(true);
    expect(root.textContent).toContain('إلغاء النشر');
    expect(router.url).toBe('/');

    clickButton(root, 'حفظ');
    await settle(fixture);
    expect((await firstValueFrom(api.get('info-system')))?.published).toBe(true);
    expect(router.url).toBe('/products/info-system');
  });

  it('creates one published product when finish is clicked twice', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;
    const api = TestBed.inject(ProductsService);
    const before = (await firstValueFrom(api.list())).length;

    enterName(root, 'منتج جديد');
    fixture.detectChanges();
    switchToEnglish(root);
    fixture.detectChanges();
    enterName(root, 'New product');
    fixture.detectChanges();
    [...root.querySelectorAll<HTMLButtonElement>('.locale-switch__option')]
      .find((item) => item.textContent?.includes('عربي'))
      ?.click();
    fixture.detectChanges();
    for (let step = 0; step < 7; step += 1) {
      clickNext(root);
      fixture.detectChanges();
    }

    const finish = button(root, 'إنهاء');
    finish.click();
    finish.click();
    await settle(fixture);

    const products = await firstValueFrom(api.list());
    const created = products.filter((item) => item.name.ar === 'منتج جديد');
    expect(products).toHaveLength(before + 1);
    expect(created).toHaveLength(1);
    expect(created[0]?.published).toBe(true);
    expect(created[0]?.name.en).toBe('New product');
  });

  it('ignores a stale product load when the id changes', async () => {
    const pending: Subject<Product | null>[] = [];
    const fixture = await render('edit', 'old-id', {
      get: () => {
        const result = new Subject<Product | null>();
        pending.push(result);
        return result.asObservable();
      },
      save: () => timer(0).pipe(map(() => blankProduct())),
    });
    const root: HTMLElement = fixture.nativeElement;
    expect(pending).toHaveLength(1);

    fixture.componentRef.setInput('id', 'new-id');
    fixture.detectChanges();
    await settle(fixture);
    expect(pending).toHaveLength(2);

    pending[1]?.next(named('new-id', 'المنتج الجديد'));
    pending[1]?.complete();
    pending[0]?.next(named('old-id', 'المنتج القديم'));
    pending[0]?.complete();
    await settle(fixture);

    expect(root.querySelector<HTMLInputElement>('input:not([type="file"])')?.value).toBe(
      'المنتج الجديد',
    );
  });

  it('shows an error and loads the product again from retry', async () => {
    let failed = true;
    const fixture = await render('edit', 'info-system', {
      get: () =>
        failed
          ? throwError(() => new Error('failed'))
          : of(named('info-system', 'بعد إعادة المحاولة')),
      save: () => timer(0).pipe(map(() => blankProduct())),
    });
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('حدث خطأ');
    expect(root.querySelector('input:not([type="file"])')).toBeNull();

    failed = false;
    clickButton(root, 'إعادة المحاولة');
    await settle(fixture);

    expect(root.textContent).not.toContain('حدث خطأ');
    expect(root.querySelector<HTMLInputElement>('input:not([type="file"])')?.value).toBe(
      'بعد إعادة المحاولة',
    );
  });

  it('removes a sector and a unit point and keeps the last one', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    tabs[1]?.click();
    fixture.detectChanges();
    const sectors = () => [
      ...root.querySelectorAll<HTMLButtonElement>('.field > .feature-card__remove'),
    ];
    expect(sectors()).toHaveLength(8);
    while (sectors().length > 1) {
      sectors()[0]?.click();
      fixture.detectChanges();
    }
    expect(sectors()).toHaveLength(1);
    expect(sectors()[0]?.disabled).toBe(true);

    tabs[4]?.click();
    fixture.detectChanges();
    const points = () => [
      ...(root
        .querySelector('.unit-grid')
        ?.querySelectorAll<HTMLButtonElement>('.feature-card__remove') ?? []),
    ];
    expect(points()).toHaveLength(4);
    while (points().length > 1) {
      points()[0]?.click();
      fixture.detectChanges();
    }
    expect(points()).toHaveLength(1);
    expect(points()[0]?.disabled).toBe(true);
  });
});

function enterName(root: HTMLElement, value: string): void {
  const name = root.querySelector<HTMLInputElement>('input:not([type="file"])');
  if (!name) {
    throw new Error('Product name field is missing');
  }
  name.value = value;
  name.dispatchEvent(new Event('input'));
}

function switchToEnglish(root: HTMLElement): void {
  const english = [...root.querySelectorAll<HTMLButtonElement>('.locale-switch__option')].find(
    (item) => item.textContent?.includes('English'),
  );
  if (!english) {
    throw new Error('English locale tab is missing');
  }
  english.click();
}

function clickNext(root: HTMLElement): void {
  const next = root.querySelector<HTMLButtonElement>('.editor-nav--next');
  if (!next) {
    throw new Error('Next button is missing');
  }
  next.click();
}

function button(root: HTMLElement, label: string): HTMLButtonElement {
  const match = [...root.querySelectorAll('p-button')].find(
    (item) => item.textContent?.trim() === label,
  );
  const inner = match?.querySelector('button');
  if (!inner) {
    throw new Error(`Button "${label}" is missing`);
  }
  return inner;
}

function clickButton(root: HTMLElement, label: string): void {
  button(root, label).click();
}

async function settle(fixture: { whenStable: () => Promise<unknown>; detectChanges: () => void }) {
  await new Promise((resolve) => setTimeout(resolve, 20));
  await fixture.whenStable();
  fixture.detectChanges();
}

function named(id: string, arabic: string): Product {
  return { ...blankProduct(), id, published: true, name: localeText(arabic, arabic) };
}
