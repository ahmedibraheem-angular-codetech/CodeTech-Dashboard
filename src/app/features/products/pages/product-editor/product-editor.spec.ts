import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { firstValueFrom, map, NEVER, of, Subject, throwError, timer } from 'rxjs';

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

  describe('unloaded records', () => {
    const unloaded = {
      missing: () => of(null),
      failed: () => throwError(() => new Error('offline')),
      loading: () => NEVER,
    };

    for (const [name, get] of Object.entries(unloaded)) {
      it(`cannot save, publish, or create a record while the edit page is ${name}`, async () => {
        const save = vi.fn((product: Product) => of(product));
        const fixture = await render('edit', 'info-system', { get, save });
        const root: HTMLElement = fixture.nativeElement;
        const editor = fixture.componentInstance;
        const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
        const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
        expect(editor.status()).toBe(
          name === 'loading' ? 'loading' : name === 'failed' ? 'error' : 'missing',
        );

        editor.saveDraft();
        editor.updatePublished(false);
        editor.updatePublished(true);
        editor.finish();
        for (const label of ['حفظ كمسودة', 'إلغاء النشر', 'حفظ']) {
          clickButton(root, label);
        }
        await settle(fixture);

        expect(save).not.toHaveBeenCalled();
        expect(toast).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
        expect(editor.draft().id).toBe('');
      });
    }

    it('does not add a product to the list when an unknown id is saved', async () => {
      const fixture = await render('edit', 'does-not-exist');
      const root: HTMLElement = fixture.nativeElement;
      const api = TestBed.inject(ProductsService);
      const before = await firstValueFrom(api.list());
      expect(fixture.componentInstance.status()).toBe('missing');

      for (const label of ['حفظ كمسودة', 'إلغاء النشر', 'حفظ']) {
        clickButton(root, label);
      }
      await settle(fixture);

      expect(await firstValueFrom(api.list())).toEqual(before);
    });

    it('saves normally once a failed load has been retried successfully', async () => {
      let failed = true;
      const save = vi.fn((product: Product) => of(product));
      const fixture = await render('edit', 'info-system', {
        get: () =>
          failed
            ? throwError(() => new Error('failed'))
            : of(named('info-system', 'بعد إعادة المحاولة')),
        save,
      });
      const root: HTMLElement = fixture.nativeElement;
      clickButton(root, 'حفظ كمسودة');
      expect(save).not.toHaveBeenCalled();

      failed = false;
      clickButton(root, 'إعادة المحاولة');
      await settle(fixture);
      clickButton(root, 'حفظ كمسودة');
      await settle(fixture);

      expect(save).toHaveBeenCalledTimes(1);
      expect(save.mock.calls[0]?.[0]).toMatchObject({ id: 'info-system', published: false });
    });
  });

  describe('upload preview lifecycle', () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    let created = 0;
    let revoke: ReturnType<typeof vi.fn<(url: string) => void>>;

    beforeEach(() => {
      created = 0;
      revoke = vi.fn<(url: string) => void>();
      URL.createObjectURL = () => `blob:product/${(created += 1)}`;
      URL.revokeObjectURL = revoke;
    });

    afterEach(() => {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    });

    it('keeps a picked image previewable after leaving and returning to its step', async () => {
      const fixture = await render('edit', 'info-system');
      const root: HTMLElement = fixture.nativeElement;
      const editor = fixture.componentInstance;

      pickFile(root, '.editor-section--cover input[type="file"]', 'cover.png');
      await settle(fixture);
      const url = editor.draft().coverUrl;
      expect(url).toBe('blob:product/1');

      editor.select(1);
      await settle(fixture);
      expect(root.querySelector('app-info-step')).toBeNull();
      editor.select(0);
      await settle(fixture);

      expect(revoke).not.toHaveBeenCalled();
      expect(editor.draft().coverUrl).toBe(url);
      expect(
        root.querySelector('.editor-section--cover img.uploader__preview')?.getAttribute('src'),
      ).toBe(url);
    });

    it('revokes only the replaced image, including after the step was left and re-entered', async () => {
      const fixture = await render('edit', 'info-system');
      const root: HTMLElement = fixture.nativeElement;
      const editor = fixture.componentInstance;

      pickFile(root, '.editor-section--cover input[type="file"]', 'first.png');
      await settle(fixture);
      editor.select(1);
      await settle(fixture);
      editor.select(0);
      await settle(fixture);
      pickFile(root, '.editor-section--cover input[type="file"]', 'second.png');
      await settle(fixture);

      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:product/1');
      expect(editor.draft().coverUrl).toBe('blob:product/2');
    });

    it('revokes a newly selected unsaved image when the editor is closed', async () => {
      const fixture = await render('edit', 'info-system');
      const editor = fixture.componentInstance;

      pickFile(fixture.nativeElement, '.editor-section--cover input[type="file"]', 'cover.png');
      await settle(fixture);
      const url = editor.draft().coverUrl;

      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith(url);
    });

    it('keeps a saved cover after closing an editor that did not change it', async () => {
      const fixture = await render('edit', 'info-system');
      const root: HTMLElement = fixture.nativeElement;
      const api = TestBed.inject(ProductsService);

      pickFile(root, '.editor-section--cover input[type="file"]', 'saved.png');
      await settle(fixture);
      clickButton(root, 'حفظ كمسودة');
      await settle(fixture);
      const saved = (await firstValueFrom(api.get('info-system')))?.coverUrl;

      fixture.destroy();
      expect(revoke).not.toHaveBeenCalled();
      expect((await firstValueFrom(api.get('info-system')))?.coverUrl).toBe(saved);
    });

    it('does not break a saved cover when an unsaved edit replaces it, then closes', async () => {
      const fixture = await render('edit', 'info-system');
      const root: HTMLElement = fixture.nativeElement;
      const editor = fixture.componentInstance;
      const api = TestBed.inject(ProductsService);

      pickFile(root, '.editor-section--cover input[type="file"]', 'saved.png');
      await settle(fixture);
      clickButton(root, 'حفظ كمسودة');
      await settle(fixture);
      const saved = editor.draft().coverUrl;
      expect((await firstValueFrom(api.get('info-system')))?.coverUrl).toBe(saved);

      pickFile(root, '.editor-section--cover input[type="file"]', 'unsaved.png');
      await settle(fixture);
      expect(revoke).not.toHaveBeenCalled();
      expect(editor.draft().coverUrl).toBe('blob:product/2');

      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:product/2');
      expect((await firstValueFrom(api.get('info-system')))?.coverUrl).toBe(saved);
    });

    it('revokes the previous cover once a later save no longer uses it, and keeps the new one after close', async () => {
      const fixture = await render('edit', 'info-system');
      const root: HTMLElement = fixture.nativeElement;
      const editor = fixture.componentInstance;
      const api = TestBed.inject(ProductsService);

      pickFile(root, '.editor-section--cover input[type="file"]', 'first.png');
      await settle(fixture);
      clickButton(root, 'حفظ كمسودة');
      await settle(fixture);
      const first = editor.draft().coverUrl;

      pickFile(root, '.editor-section--cover input[type="file"]', 'second.png');
      await settle(fixture);
      expect(revoke).not.toHaveBeenCalled();
      clickButton(root, 'حفظ كمسودة');
      await settle(fixture);

      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith(first);
      expect((await firstValueFrom(api.get('info-system')))?.coverUrl).toBe('blob:product/2');

      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);
      expect((await firstValueFrom(api.get('info-system')))?.coverUrl).toBe('blob:product/2');
    });
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

function pickFile(root: HTMLElement, selector: string, name: string): void {
  const input = root.querySelector<HTMLInputElement>(selector);
  if (!input) {
    throw new Error(`File input "${selector}" is missing`);
  }
  Object.defineProperty(input, 'files', {
    value: [new File([new Uint8Array([1])], name, { type: 'image/png' })],
    configurable: true,
  });
  input.dispatchEvent(new Event('change'));
}
