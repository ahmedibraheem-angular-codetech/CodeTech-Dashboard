import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { firstValueFrom, map, NEVER, of, Subject, throwError, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { ApiError } from '../../../../core/http/api-error';
import { blankProduct, localeText, type Product } from '../../models/product.model';
import { ProductsMemoryService } from '../../products.spec-helpers';
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
        { provide: ProductsService, useClass: ProductsMemoryService },
        provideRouter([
          { path: 'products', component: ProductRouteStub },
          { path: 'products/:id', component: ProductRouteStub },
        ]),
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
    expect(router.url).toBe('/products');
  });

  it('creates one published product when finish is clicked twice', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;
    const api = TestBed.inject(ProductsService);
    const router = TestBed.inject(Router);
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
    expect(router.url).toBe('/products');
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

  it('stores the stats answer field on value for both locales', async () => {
    const fixture = await render('create');
    const editor = fixture.componentInstance;
    const root: HTMLElement = fixture.nativeElement;

    editor.useLocale('ar');
    editor.setStat(0, 'label', inputEvent('شركات تستخدم النظام'));
    editor.setStat(0, 'value', inputEvent('+10'));
    fixture.detectChanges();

    expect(editor.draft().stats[0]?.label.ar).toBe('شركات تستخدم النظام');
    expect(editor.draft().stats[0]?.value.ar).toBe('+10');
    expect(editor.draft().stats[0]?.body.ar).toBe('');

    const answer = root.querySelector<HTMLTextAreaElement>('.editor-section--stats textarea');
    expect(answer?.value).toBe('+10');

    editor.useLocale('en');
    editor.setStat(0, 'value', inputEvent('10+'));
    fixture.detectChanges();

    expect(editor.draft().stats[0]?.value).toEqual({ ar: '+10', en: '10+' });
    expect(editor.draft().stats[0]?.body).toEqual({ ar: '', en: '' });
  });

  it('keeps cover and feature images independent per locale tab', async () => {
    const fixture = await render('create');
    const editor = fixture.componentInstance;

    editor.useLocale('ar');
    editor.setCover('cover', { name: 'ar-cover.png', url: 'blob:cover-ar' });
    editor.setPointImage('features', 0, { name: 'ar-feat.png', url: 'blob:feat-ar' });

    editor.useLocale('en');
    expect(editor.draft().cover.en.imageUrl).toBe('');
    expect(editor.draft().features[0]?.image.en.imageUrl).toBe('');

    editor.setCover('cover', { name: 'en-cover.png', url: 'blob:cover-en' });
    editor.setPointImage('features', 0, { name: 'en-feat.png', url: 'blob:feat-en' });

    expect(editor.draft().cover.ar).toMatchObject({
      imageName: 'ar-cover.png',
      imageUrl: 'blob:cover-ar',
    });
    expect(editor.draft().cover.en).toMatchObject({
      imageName: 'en-cover.png',
      imageUrl: 'blob:cover-en',
    });
    expect(editor.draft().features[0]?.image.ar).toMatchObject({
      imageName: 'ar-feat.png',
      imageUrl: 'blob:feat-ar',
    });
    expect(editor.draft().features[0]?.image.en).toMatchObject({
      imageName: 'en-feat.png',
      imageUrl: 'blob:feat-en',
    });
  });

  it('removes a sector and a unit point and keeps the last one', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    tabs[1]?.click();
    fixture.detectChanges();
    const sectors = () => [
      ...(root
        .querySelectorAll('.editor-section--soft')[0]
        ?.querySelectorAll<HTMLButtonElement>('.feature-card__remove') ?? []),
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
      const url = editor.draft().cover.ar.imageUrl;
      expect(url).toBe('blob:product/1');

      editor.select(1);
      await settle(fixture);
      expect(root.querySelector('app-info-step')).toBeNull();
      editor.select(0);
      await settle(fixture);

      expect(revoke).not.toHaveBeenCalled();
      expect(editor.draft().cover.ar.imageUrl).toBe(url);
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
      expect(editor.draft().cover.ar.imageUrl).toBe('blob:product/2');
    });

    it('revokes a newly selected unsaved image when the editor is closed', async () => {
      const fixture = await render('edit', 'info-system');
      const editor = fixture.componentInstance;

      pickFile(fixture.nativeElement, '.editor-section--cover input[type="file"]', 'cover.png');
      await settle(fixture);
      const url = editor.draft().cover.ar.imageUrl;

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
      const saved = (await firstValueFrom(api.get('info-system')))?.cover.ar.imageUrl;

      fixture.destroy();
      expect(revoke).not.toHaveBeenCalled();
      expect((await firstValueFrom(api.get('info-system')))?.cover.ar.imageUrl).toBe(saved);
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
      const saved = editor.draft().cover.ar.imageUrl;
      expect((await firstValueFrom(api.get('info-system')))?.cover.ar.imageUrl).toBe(saved);

      pickFile(root, '.editor-section--cover input[type="file"]', 'unsaved.png');
      await settle(fixture);
      expect(revoke).not.toHaveBeenCalled();
      expect(editor.draft().cover.ar.imageUrl).toBe('blob:product/2');

      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:product/2');
      expect((await firstValueFrom(api.get('info-system')))?.cover.ar.imageUrl).toBe(saved);
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
      const first = editor.draft().cover.ar.imageUrl;

      pickFile(root, '.editor-section--cover input[type="file"]', 'second.png');
      await settle(fixture);
      expect(revoke).not.toHaveBeenCalled();
      clickButton(root, 'حفظ كمسودة');
      await settle(fixture);

      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith(first);
      expect((await firstValueFrom(api.get('info-system')))?.cover.ar.imageUrl).toBe(
        'blob:product/2',
      );

      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);
      expect((await firstValueFrom(api.get('info-system')))?.cover.ar.imageUrl).toBe(
        'blob:product/2',
      );
    });
  });

  it('shows a permanent slug hint and an inline error for invalid non-empty slugs without transforming input', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;

    editor.select(7);
    fixture.detectChanges();

    const hint = 'استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط (مثال: my-product).';
    const error = 'الرابط المختصر يقبل الأحرف الإنجليزية الصغيرة والأرقام والشرطات فقط.';
    expect(root.textContent).toContain(hint);
    expect(editor.slugInvalid()).toBe(false);
    expect(root.textContent).not.toContain(error);

    editor.setSeo('slug', inputEvent('ITSM'));
    fixture.detectChanges();
    expect(editor.draft().seo.slug.ar).toBe('ITSM');
    expect(editor.slugInvalid()).toBe(true);
    expect(root.textContent).toContain(hint);
    expect(root.textContent).toContain(error);

    editor.setSeo('slug', inputEvent('my-product'));
    fixture.detectChanges();
    expect(editor.draft().seo.slug.ar).toBe('my-product');
    expect(editor.slugInvalid()).toBe(false);
    expect(root.textContent).toContain(hint);
    expect(root.textContent).not.toContain(error);

    editor.setSeo('slug', inputEvent(''));
    fixture.detectChanges();
    expect(editor.slugInvalid()).toBe(false);
    expect(root.textContent).not.toContain(error);
  });

  it('counts the active-locale summary and shows an inline error over 300 characters without truncating', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;
    const summaryError = 'الحد الأقصى للوصف المختصر 300 حرف.';

    editor.setField('summary', inputEvent('a'.repeat(300)));
    fixture.detectChanges();
    expect(editor.draft().summary.ar).toHaveLength(300);
    expect(editor.summaryInvalid()).toBe(false);
    expect(root.textContent).toContain('300/300');
    expect(root.textContent).not.toContain(summaryError);

    editor.setField('summary', inputEvent('a'.repeat(301)));
    fixture.detectChanges();
    expect(editor.draft().summary.ar).toHaveLength(301);
    expect(editor.summaryInvalid()).toBe(true);
    expect(root.textContent).toContain('301/300');
    expect(root.textContent).toContain(summaryError);
  });

  it('blocks save when the inactive summary locale exceeds 300 characters', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;
    const api = TestBed.inject(ProductsService);
    const save = vi.spyOn(api, 'save');

    editor.draft.update((current) => ({
      ...current,
      summary: localeText('قصير', 'e'.repeat(301)),
    }));
    fixture.detectChanges();
    expect(editor.summaryInvalid()).toBe(false);

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);

    expect(save).not.toHaveBeenCalled();
    expect(editor.locale()).toBe('en');
    expect(editor.step()).toBe(0);
    expect(editor.summaryInvalid()).toBe(true);
    expect(root.textContent).toContain('Short description must not exceed 300 characters.');
  });

  it('maps 422 field errors to nested UI fields, navigates to the step, and clears them on edit', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;
    const api = TestBed.inject(ProductsService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    const messages = TestBed.inject(MessageService);
    const add = vi.spyOn(messages, 'add');
    const nameBefore = editor.draft().name.ar;
    vi.spyOn(api, 'save').mockReturnValue(
      throwError(
        () =>
          new ApiError(422, 'The given data was invalid.', {
            slug: ['The slug format is invalid.'],
            'meta_keywords.ar.0': ['May not be greater than 50 characters.'],
            'sectors.0.image.ar': ['The sectors.0.image.ar field is required.'],
          }),
      ),
    );

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);

    expect(navigate).not.toHaveBeenCalled();
    expect(editor.draft().name.ar).toBe(nameBefore);
    expect(editor.step()).toBe(7);
    expect(editor.slugErrorText()).toBe('The slug format is invalid.');
    expect(editor.keywordsErrorText()).toBe('May not be greater than 50 characters.');
    expect(add).not.toHaveBeenCalled();

    editor.setSeo('slug', inputEvent('itsm'));
    fixture.detectChanges();
    expect(editor.slugErrorText()).toBe('');
    expect(editor.serverErrors()['slug']).toBeUndefined();

    editor.setSeo('keywords', inputEvent('قصير'));
    fixture.detectChanges();
    expect(editor.keywordsErrorText()).toBe('');

    editor.serverErrors.set({
      'sectors.0.image.ar': ['The sectors.0.image.ar field is required.'],
    });
    editor.select(1);
    fixture.detectChanges();
    expect(editor.step()).toBe(1);
    expect(editor.sectorImageError(0)).toBe('The sectors.0.image.ar field is required.');
    editor.setSectorImage(0, { name: 'b.png', url: 'blob:sector/1' }, 'ar');
    fixture.detectChanges();
    expect(editor.serverErrors()['sectors.0.image.ar']).toBeUndefined();
  });

  it('blocks leaving the SEO step and publishing when slug or keywords are invalid', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;
    const api = TestBed.inject(ProductsService);
    const save = vi.spyOn(api, 'save');

    editor.select(7);
    fixture.detectChanges();
    editor.setSeo('slug', inputEvent('ITSM'));
    fixture.detectChanges();
    expect(editor.slugInvalid()).toBe(true);

    editor.select(0);
    fixture.detectChanges();
    expect(editor.step()).toBe(7);
    expect(editor.locale()).toBe('ar');

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);
    expect(save).not.toHaveBeenCalled();
    expect(editor.step()).toBe(7);

    editor.setSeo('slug', inputEvent('itsm'));
    editor.draft.update((current) => ({
      ...current,
      seo: {
        ...current.seo,
        keywords: localeText('قصير', 'e'.repeat(51)),
      },
    }));
    fixture.detectChanges();
    expect(editor.slugInvalid()).toBe(false);

    editor.select(6);
    fixture.detectChanges();
    expect(editor.step()).toBe(7);
    expect(editor.locale()).toBe('en');
    expect(editor.keywordsInvalid()).toBe(true);

    editor.setSeo('keywords', inputEvent('ok, short'));
    fixture.detectChanges();
    editor.select(6);
    fixture.detectChanges();
    expect(editor.step()).toBe(6);
  });

  it('counts the longest active-locale keyword and blocks save when any keyword exceeds 50 characters', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;
    const api = TestBed.inject(ProductsService);
    const save = vi.spyOn(api, 'save');
    const tooLong = 'ك'.repeat(51);
    const error = 'كل كلمة مفتاحية يجب ألا تتجاوز 50 حرفًا.';

    editor.select(7);
    fixture.detectChanges();

    editor.setSeo('keywords', inputEvent(`قصير, ${'a'.repeat(50)}`));
    fixture.detectChanges();
    expect(editor.keywordsLongest()).toBe(50);
    expect(editor.keywordsInvalid()).toBe(false);
    expect(root.textContent).toContain('50/50');
    expect(root.textContent).not.toContain(error);

    editor.setSeo('keywords', inputEvent(`قصير, ${tooLong}`));
    fixture.detectChanges();
    expect(editor.draft().seo.keywords.ar).toContain(tooLong);
    expect(editor.keywordsLongest()).toBe(51);
    expect(editor.keywordsInvalid()).toBe(true);
    expect(root.textContent).toContain('51/50');
    expect(root.textContent).toContain(error);

    editor.draft.update((current) => ({
      ...current,
      seo: {
        ...current.seo,
        keywords: localeText('قصير', 'e'.repeat(51)),
      },
    }));
    fixture.detectChanges();
    expect(editor.keywordsInvalid()).toBe(false);

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);
    expect(save).not.toHaveBeenCalled();
    expect(editor.step()).toBe(7);
    expect(editor.locale()).toBe('en');
    expect(editor.keywordsInvalid()).toBe(true);
    expect(root.textContent).toContain('Each keyword must not exceed 50 characters.');
  });

  it('blocks navigation and save for incomplete workflow steps without discarding partial input', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;
    const api = TestBed.inject(ProductsService);
    const save = vi.spyOn(api, 'save');

    editor.select(5);
    fixture.detectChanges();
    editor.draft.update((current) => ({
      ...current,
      steps: [
        {
          id: 'step-1',
          title: localeText('', 'English only'),
          body: localeText('', 'English body'),
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
    }));
    fixture.detectChanges();

    expect(editor.workflowStepTitleError(0)).toContain('عنوان الخطوة بالعربية مطلوب');
    expect(editor.workflowStepBodyError(0)).toContain('وصف الخطوة بالعربية مطلوب');
    expect(root.textContent).toContain('عنوان الخطوة بالعربية مطلوب');

    editor.select(6);
    fixture.detectChanges();
    expect(editor.step()).toBe(5);
    expect(editor.locale()).toBe('ar');
    expect(editor.draft().steps[0]?.title.en).toBe('English only');
    expect(editor.draft().steps[0]?.body.en).toBe('English body');

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);
    expect(save).not.toHaveBeenCalled();
    expect(editor.step()).toBe(5);

    editor.draft.update((current) => ({
      ...current,
      steps: [
        {
          ...current.steps[0]!,
          title: localeText('عنوان عربي', 'English only'),
          body: localeText('وصف عربي', 'English body'),
        },
      ],
    }));
    fixture.detectChanges();
    expect(editor.workflowStepTitleError(0)).toBe('');
    expect(editor.workflowStepBodyError(0)).toBe('');

    editor.select(6);
    fixture.detectChanges();
    expect(editor.step()).toBe(6);
  });

  it('blocks save for English-only sector images and accepts Arabic images without re-upload', async () => {
    const fixture = await render('edit', 'info-system');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;
    const api = TestBed.inject(ProductsService);
    const save = vi.spyOn(api, 'save');
    const sectorError = 'صورة القطاع بالعربية مطلوبة.';

    editor.select(1);
    fixture.detectChanges();

    editor.draft.update((current) => ({
      ...current,
      sectors: [
        {
          id: '31',
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: {
              imageName: 'en.png',
              imageUrl: 'https://cdn.test/en.png',
              imageUuid: 'sec-en',
            },
          },
        },
      ],
    }));
    fixture.detectChanges();
    expect(editor.sectorArabicImageInvalid(0)).toBe(true);
    expect(root.textContent).toContain(sectorError);

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);
    expect(save).not.toHaveBeenCalled();
    expect(editor.step()).toBe(1);
    expect(editor.locale()).toBe('ar');

    editor.draft.update((current) => ({
      ...current,
      sectors: [
        {
          id: '31',
          image: {
            ar: {
              imageName: 'ar.png',
              imageUrl: 'https://cdn.test/ar.png',
              imageUuid: 'sec-ar',
            },
            en: {
              imageName: 'en.png',
              imageUrl: 'https://cdn.test/en.png',
              imageUuid: 'sec-en',
            },
          },
        },
      ],
    }));
    fixture.detectChanges();
    expect(editor.sectorArabicImageInvalid(0)).toBe(false);
    expect(root.textContent).not.toContain(sectorError);

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);
    expect(save).toHaveBeenCalled();
  });

  it('blocks save for incomplete new repeater rows and allows existing server rows', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;
    const api = TestBed.inject(ProductsService);
    const save = vi.spyOn(api, 'save');

    enterName(root, 'منتج جديد');
    fixture.detectChanges();
    [...root.querySelectorAll<HTMLButtonElement>('.locale-switch__option')]
      .find((button) => button.textContent?.includes('English'))
      ?.click();
    fixture.detectChanges();
    enterName(root, 'New product');
    fixture.detectChanges();
    [...root.querySelectorAll<HTMLButtonElement>('.locale-switch__option')]
      .find(
        (button) => button.textContent?.includes('عربي') || button.textContent?.includes('Arabic'),
      )
      ?.click();
    fixture.detectChanges();

    editor.draft.update((current) => ({
      ...current,
      features: [
        {
          id: 'point-new',
          title: localeText('', 'Only English'),
          body: localeText('وصف', 'Body'),
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
    }));
    fixture.detectChanges();
    expect(editor.featureTitleError(0)).toBe(editor.copy('product.required'));
    expect(editor.featureBodyError(0)).toBe('');

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);
    expect(save).not.toHaveBeenCalled();
    expect(editor.step()).toBe(0);
    expect(editor.locale()).toBe('ar');

    editor.draft.update((current) => ({
      ...current,
      features: [
        {
          id: '12',
          title: localeText('', 'Server EN only'),
          body: localeText('', 'Server EN only'),
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      integrations: [
        {
          id: 'media-new',
          title: localeText('تكامل', 'Integration'),
          body: localeText('', ''),
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
    }));
    fixture.detectChanges();
    expect(editor.featureTitleError(0)).toBe('');
    expect(editor.integrationImageError(0)).toBe(editor.copy('product.imageRequired'));

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);
    expect(save).not.toHaveBeenCalled();
    expect(editor.step()).toBe(3);

    editor.draft.update((current) => ({
      ...current,
      integrations: [
        {
          id: 'media-new',
          title: localeText('تكامل', 'Integration'),
          body: localeText('', ''),
          image: {
            ar: {
              imageName: 'a.png',
              imageUrl: 'https://cdn.test/a.png',
              imageUuid: 'img-1',
            },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
    }));
    fixture.detectChanges();
    expect(editor.integrationImageError(0)).toBe('');

    clickButton(root, 'حفظ كمسودة');
    await settle(fixture);
    expect(save).toHaveBeenCalled();
    const payload = save.mock.calls[0]?.[0] as Product;
    expect(payload.features[0]?.id).toBe('12');
    expect(payload.integrations[0]?.image.ar.imageUuid).toBe('img-1');
  });
});

function inputEvent(value: string): Event {
  const input = document.createElement('input');
  input.value = value;
  return { target: input } as unknown as Event;
}

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
