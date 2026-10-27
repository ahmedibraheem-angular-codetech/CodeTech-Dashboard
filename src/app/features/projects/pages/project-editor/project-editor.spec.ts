import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { firstValueFrom, map, NEVER, of, throwError, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { blankProject, localeText, PROJECT_STEPS, type Project } from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';
import { ProjectEditor } from './project-editor';

@Component({ template: '' })
class ProjectRouteStub {}

describe('ProjectEditor', () => {
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
    api?: Pick<ProjectsService, 'get' | 'save'>,
  ) {
    TestBed.configureTestingModule({
      imports: [ProjectEditor],
      providers: [
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
        provideRouter([{ path: 'projects/:id', component: ProjectRouteStub }]),
        {
          provide: ActivatedRoute,
          useValue: { data: of({ mode }), snapshot: { data: { mode } } },
        },
      ],
    });
    if (api) {
      TestBed.overrideProvider(ProjectsService, { useValue: api });
    }
    localStorage.setItem('codetech.language', 'ar');
    const fixture = TestBed.createComponent(ProjectEditor);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  }

  it('keeps seven wizard steps on create and blocks FAQ', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;
    const marks = [...root.querySelectorAll('.wizard__step')];

    expect(PROJECT_STEPS).toHaveLength(7);
    expect(marks).toHaveLength(7);
    expect(root.textContent).toContain('عن المشروع');
    expect(root.textContent).not.toContain('الأسئلة الشائعة');
    expect(root.querySelector('p-stepper.wizard')).not.toBeNull();
  });

  it('preserves bilingual names while navigating steps', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;

    enterName(root, 'مشروع تجريبي');
    switchToEnglish(root);
    fixture.detectChanges();
    enterName(root, 'Sample project');
    fixture.detectChanges();

    clickNext(root);
    fixture.detectChanges();
    expect(editor.step()).toBe(1);
    expect(editor.draft().name).toEqual(localeText('مشروع تجريبي', 'Sample project'));

    clickNext(root);
    fixture.detectChanges();
    expect(editor.step()).toBe(2);
    expect(editor.draft().name.ar).toBe('مشروع تجريبي');
    expect(editor.draft().name.en).toBe('Sample project');
  });

  it('stays on the first step until both names are filled', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;

    clickNext(root);
    fixture.detectChanges();
    expect(root.textContent).toContain('هذا الحقل مطلوب');
    expect(fixture.componentInstance.step()).toBe(0);

    enterName(root, 'مشروع');
    clickNext(root);
    fixture.detectChanges();
    expect(root.textContent).toContain('هذا الحقل مطلوب');

    switchToEnglish(root);
    fixture.detectChanges();
    enterName(root, 'Project');
    clickNext(root);
    fixture.detectChanges();
    expect(fixture.componentInstance.step()).toBe(1);
  });

  it('loads an existing project on edit and keeps nested collections', async () => {
    const fixture = await render('edit', 'wasly');
    const root: HTMLElement = fixture.nativeElement;
    const editor = fixture.componentInstance;

    expect(root.querySelector('app-page-tabs')).not.toBeNull();
    expect(root.querySelector('p-stepper')).toBeNull();
    expect(root.querySelector<HTMLInputElement>('input:not([type="file"])')?.value).toContain(
      'وصلني',
    );
    expect(editor.draft().categories.length).toBeGreaterThan(0);
    expect(editor.draft().gallery.length).toBeGreaterThan(0);
  });

  it('adds and removes gallery images without dropping the last one', async () => {
    const fixture = await render('create');
    const editor = fixture.componentInstance;

    editor.addGallery();
    editor.addGallery();
    expect(editor.draft().gallery).toHaveLength(3);

    editor.removeGallery(0);
    editor.removeGallery(0);
    editor.removeGallery(0);
    expect(editor.draft().gallery).toHaveLength(1);
  });

  it('clears cover and gallery image slots without removing sibling entries', async () => {
    const fixture = await render('edit', 'wasly');
    const editor = fixture.componentInstance;

    editor.setGalleryImage(0, { name: 'a.jpg', url: 'blob:a' });
    editor.addGallery();
    editor.setGalleryImage(1, { name: 'b.jpg', url: 'blob:b' });
    expect(editor.draft().gallery).toHaveLength(3);

    editor.clearGalleryImage(0);
    expect(editor.draft().gallery[0]?.imageUrl).toBe('');
    expect(editor.draft().gallery[1]?.imageUrl).toBe('blob:b');
    expect(editor.draft().gallery).toHaveLength(3);

    editor.clearCover('cover');
    expect(editor.draft().coverUrl).toBe('');
    expect(editor.draft().coverName).toBe('');
    expect(editor.draft().thumbUrl.length).toBeGreaterThan(0);
  });

  it('adds and removes identity buttons without dropping the last entry', async () => {
    const fixture = await render('create');
    const editor = fixture.componentInstance;

    expect(editor.draft().identityButtons).toHaveLength(1);
    expect(editor.draft().identityButtons[0]?.images).toHaveLength(4);

    editor.addIdentityButton();
    editor.addIdentityButton();
    expect(editor.draft().identityButtons).toHaveLength(3);
    expect(editor.draft().identityButtons.every((button) => button.images.length === 4)).toBe(true);

    const secondId = editor.draft().identityButtons[1]?.id;
    editor.removeIdentityButton(0);
    expect(editor.draft().identityButtons).toHaveLength(2);
    expect(editor.draft().identityButtons[0]?.id).toBe(secondId);

    editor.removeIdentityButton(0);
    editor.removeIdentityButton(0);
    expect(editor.draft().identityButtons).toHaveLength(1);
    expect(editor.draft().identityButtons[0]?.images).toHaveLength(4);
  });

  it('updates identity title and body independently per locale', async () => {
    const fixture = await render('create');
    const editor = fixture.componentInstance;
    const root: HTMLElement = fixture.nativeElement;

    enterName(root, 'مشروع');
    switchToEnglish(root);
    fixture.detectChanges();
    enterName(root, 'Project');
    fixture.detectChanges();

    for (let step = 0; step < 5; step += 1) {
      clickNext(root);
      fixture.detectChanges();
    }
    expect(editor.stepId()).toBe('identity');

    editor.useLocale('ar');
    fixture.detectChanges();
    expect(root.textContent).toContain('الزر الأول');
    editor.setIdentityButtonText(0, 'title', inputEvent('عنوان الزر'));
    editor.setIdentityButtonText(0, 'body', inputEvent('وصف الزر'));
    editor.useLocale('en');
    fixture.detectChanges();
    expect(root.textContent).toContain('Button 1');
    editor.setIdentityButtonText(0, 'title', inputEvent('Button title'));
    editor.setIdentityButtonText(0, 'body', inputEvent('Button body'));

    expect(editor.draft().identityButtons[0]?.title).toEqual(
      localeText('عنوان الزر', 'Button title'),
    );
    expect(editor.draft().identityButtons[0]?.body).toEqual(localeText('وصف الزر', 'Button body'));
    expect(editor.identityButtonLabel(0)).toBe('Button 1');
    editor.useLocale('ar');
    expect(editor.identityButtonLabel(0)).toBe('الزر الأول');
  });

  it('renders identity buttons with the shared card, four uploads, and add action', async () => {
    const fixture = await render('create');
    const editor = fixture.componentInstance;
    const root: HTMLElement = fixture.nativeElement;

    enterName(root, 'مشروع');
    switchToEnglish(root);
    fixture.detectChanges();
    enterName(root, 'Project');
    fixture.detectChanges();
    editor.useLocale('ar');
    for (let step = 0; step < 5; step += 1) {
      clickNext(root);
      fixture.detectChanges();
    }

    expect(root.querySelectorAll('app-feature-card')).toHaveLength(1);
    expect(root.querySelectorAll('.identity-grid app-product-upload')).toHaveLength(4);
    expect(root.querySelectorAll('.identity-grid .uploader__mark--icon')).toHaveLength(0);
    expect(root.querySelector('.feature-card__tab')?.textContent).toContain('الزر الأول');
    expect(root.textContent).toContain('عنوان الهوية');
    expect(root.textContent).toContain('صيغة PNG,JPG. الحجم الأقصى 5 ميجابايت');
    expect(root.querySelector<HTMLTextAreaElement>('textarea')?.getAttribute('rows')).toBe('1');
    const remove = root.querySelector<HTMLButtonElement>('.feature-card__remove');
    expect(remove?.disabled).toBe(true);

    const add = root.querySelector<HTMLButtonElement>('.editor-section--identity .add-row');
    expect(add?.textContent?.trim()).toBe('إضافة زر آخر');
    expect(add?.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(add?.lastElementChild?.classList.contains('add-row__mark')).toBe(true);
    add?.click();
    fixture.detectChanges();

    expect(root.querySelectorAll('app-feature-card')).toHaveLength(2);
    expect(root.querySelectorAll('.identity-grid app-product-upload')).toHaveLength(8);
    expect(
      [...root.querySelectorAll<HTMLButtonElement>('.feature-card__remove')].every(
        (item) => !item.disabled,
      ),
    ).toBe(true);
    expect([...root.querySelectorAll('.feature-card__tab')].at(1)?.textContent).toContain(
      'الزر الثاني',
    );
  });

  it('clears one identity image slot without affecting siblings or slot count', async () => {
    const fixture = await render('create');
    const editor = fixture.componentInstance;

    editor.setIdentityButtonImage(0, 0, { name: 'a.jpg', url: 'blob:a' });
    editor.setIdentityButtonImage(0, 1, { name: 'b.jpg', url: 'blob:b' });
    editor.setIdentityButtonImage(0, 2, { name: 'c.jpg', url: 'blob:c' });
    expect(editor.draft().identityButtons[0]?.images).toHaveLength(4);

    editor.clearIdentityButtonImage(0, 1);
    const images = editor.draft().identityButtons[0]?.images ?? [];
    expect(images).toHaveLength(4);
    expect(images[0]?.imageUrl).toBe('blob:a');
    expect(images[1]?.imageUrl).toBe('');
    expect(images[1]?.imageName).toBe('');
    expect(images[2]?.imageUrl).toBe('blob:c');
  });

  it('preserves identity draft data across step navigation and locale switches', async () => {
    const fixture = await render('create');
    const editor = fixture.componentInstance;
    const root: HTMLElement = fixture.nativeElement;

    enterName(root, 'مشروع');
    switchToEnglish(root);
    fixture.detectChanges();
    enterName(root, 'Project');
    fixture.detectChanges();

    editor.addIdentityButton();
    editor.useLocale('ar');
    editor.setIdentityButtonText(0, 'title', inputEvent('أول'));
    editor.useLocale('en');
    editor.setIdentityButtonText(0, 'title', inputEvent('First'));
    editor.setIdentityButtonImage(0, 0, { name: 'mark.jpg', url: 'blob:mark' });
    editor.useLocale('ar');

    for (let step = 0; step < 5; step += 1) {
      clickNext(root);
      fixture.detectChanges();
    }
    expect(editor.stepId()).toBe('identity');
    expect(editor.draft().identityButtons).toHaveLength(2);
    expect(editor.draft().identityButtons[0]?.title).toEqual(localeText('أول', 'First'));
    expect(editor.draft().identityButtons[0]?.images[0]?.imageUrl).toBe('blob:mark');

    clickNext(root);
    fixture.detectChanges();
    expect(editor.stepId()).toBe('seo');
    editor.previous();
    fixture.detectChanges();
    expect(editor.stepId()).toBe('identity');
    expect(editor.draft().identityButtons).toHaveLength(2);
    expect(editor.draft().identityButtons[0]?.title.en).toBe('First');
    expect(editor.draft().identityButtons[0]?.images).toHaveLength(4);
  });

  it('saves and reloads identity button data', async () => {
    const fixture = await render('create');
    const editor = fixture.componentInstance;
    const root: HTMLElement = fixture.nativeElement;
    const api = TestBed.inject(ProjectsService);

    enterName(root, 'هوية');
    switchToEnglish(root);
    fixture.detectChanges();
    enterName(root, 'Identity');
    fixture.detectChanges();

    editor.addIdentityButton();
    editor.useLocale('ar');
    editor.setIdentityButtonText(0, 'title', inputEvent('زر واحد'));
    editor.useLocale('en');
    editor.setIdentityButtonText(0, 'title', inputEvent('One button'));
    editor.setIdentityButtonImage(0, 3, { name: 'slot.jpg', url: 'blob:slot' });

    for (let step = 0; step < 6; step += 1) {
      clickNext(root);
      fixture.detectChanges();
    }
    clickButton(root, 'إنهاء');
    await settle(fixture);

    const savedId = editor.draft().id;
    const reloaded = await firstValueFrom(api.get(savedId));
    expect(reloaded?.identityButtons).toHaveLength(2);
    expect(reloaded?.identityButtons[0]?.title).toEqual(localeText('زر واحد', 'One button'));
    expect(reloaded?.identityButtons[0]?.images[3]?.imageUrl).toBe('blob:slot');
    expect(reloaded?.identityButtons[0]?.images).toHaveLength(4);
    expect(reloaded?.identityButtons[1]?.images).toHaveLength(4);
  });

  it('creates a published project and navigates to details', async () => {
    const fixture = await render('create');
    const root: HTMLElement = fixture.nativeElement;
    const api = TestBed.inject(ProjectsService);
    const router = TestBed.inject(Router);
    const before = (await firstValueFrom(api.list())).length;

    enterName(root, 'مشروع جديد');
    switchToEnglish(root);
    fixture.detectChanges();
    enterName(root, 'New project');
    fixture.detectChanges();

    for (let step = 0; step < 6; step += 1) {
      clickNext(root);
      fixture.detectChanges();
    }

    clickButton(root, 'إنهاء');
    await settle(fixture);

    const projects = await firstValueFrom(api.list());
    const created = projects.find((item) => item.name.ar === 'مشروع جديد');
    expect(projects).toHaveLength(before + 1);
    expect(created?.published).toBe(true);
    expect(created?.name.en).toBe('New project');
    expect(router.url).toBe(`/projects/${created?.id}`);
  });

  it('shows an error and retries a failed edit load', async () => {
    let failed = true;
    const fixture = await render('edit', 'wasly', {
      get: () =>
        failed ? throwError(() => new Error('failed')) : of(named('wasly', 'بعد إعادة المحاولة')),
      save: () => timer(0).pipe(map(() => blankProject())),
    });
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('حدث خطأ');
    failed = false;
    clickButton(root, 'إعادة المحاولة');
    await settle(fixture);
    expect(root.querySelector<HTMLInputElement>('input:not([type="file"])')?.value).toBe(
      'بعد إعادة المحاولة',
    );
  });

  describe('unloaded records', () => {
    const unloaded = {
      missing: () => of(null),
      failed: () => throwError(() => new Error('offline')),
      loading: () => NEVER,
    };

    for (const [name, get] of Object.entries(unloaded)) {
      it(`cannot save, publish, or create a record while the edit page is ${name}`, async () => {
        const save = vi.fn((project: Project) => of(project));
        const fixture = await render('edit', 'wasly', { get, save });
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

    it('does not add a project to the list when an unknown id is saved', async () => {
      const fixture = await render('edit', 'does-not-exist');
      const root: HTMLElement = fixture.nativeElement;
      const api = TestBed.inject(ProjectsService);
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
      const save = vi.fn((project: Project) => of(project));
      const fixture = await render('edit', 'wasly', {
        get: () =>
          failed ? throwError(() => new Error('failed')) : of(named('wasly', 'بعد إعادة المحاولة')),
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
      expect(save.mock.calls[0]?.[0]).toMatchObject({ id: 'wasly', published: false });
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
      URL.createObjectURL = () => `blob:project/${(created += 1)}`;
      URL.revokeObjectURL = revoke;
    });

    afterEach(() => {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    });

    it('keeps a picked cover previewable after leaving and returning to its step, then clears it', async () => {
      const fixture = await render('edit', 'wasly');
      const root: HTMLElement = fixture.nativeElement;
      const editor = fixture.componentInstance;

      pickFile(root, '.editor-section--cover input[type="file"]', 'cover.png');
      await settle(fixture);
      const url = editor.draft().coverUrl;
      expect(url).toBe('blob:project/1');

      editor.select(1);
      await settle(fixture);
      editor.select(0);
      await settle(fixture);

      expect(revoke).not.toHaveBeenCalled();
      expect(editor.draft().coverUrl).toBe(url);
      expect(
        root.querySelector('.editor-section--cover img.uploader__preview')?.getAttribute('src'),
      ).toBe(url);

      root.querySelector<HTMLButtonElement>('.editor-section--cover .uploader__clear')?.click();
      await settle(fixture);

      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith(url);
      expect(editor.draft().coverUrl).toBe('');
    });

    it('revokes only the replaced cover', async () => {
      const fixture = await render('edit', 'wasly');
      const root: HTMLElement = fixture.nativeElement;
      const editor = fixture.componentInstance;

      pickFile(root, '.editor-section--cover input[type="file"]', 'first.png');
      await settle(fixture);
      pickFile(root, '.editor-section--cover input[type="file"]', 'second.png');
      await settle(fixture);

      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:project/1');
      expect(editor.draft().coverUrl).toBe('blob:project/2');
    });

    it('revokes a newly selected unsaved cover when the editor is closed', async () => {
      const fixture = await render('edit', 'wasly');
      const editor = fixture.componentInstance;
      pickFile(fixture.nativeElement, '.editor-section--cover input[type="file"]', 'cover.png');
      await settle(fixture);
      const url = editor.draft().coverUrl;
      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith(url);
    });

    it('keeps a saved cover after closing an editor that did not change it', async () => {
      const fixture = await render('edit', 'wasly');
      const root: HTMLElement = fixture.nativeElement;
      const api = TestBed.inject(ProjectsService);
      pickFile(root, '.editor-section--cover input[type="file"]', 'saved.png');
      await settle(fixture);
      clickButton(root, 'حفظ كمسودة');
      await settle(fixture);
      const saved = (await firstValueFrom(api.get('wasly')))?.coverUrl;
      fixture.destroy();
      expect(revoke).not.toHaveBeenCalled();
      expect((await firstValueFrom(api.get('wasly')))?.coverUrl).toBe(saved);
    });

    it('does not break a saved cover when an unsaved edit replaces or clears it', async () => {
      const fixture = await render('edit', 'wasly');
      const root: HTMLElement = fixture.nativeElement;
      const editor = fixture.componentInstance;
      const api = TestBed.inject(ProjectsService);

      pickFile(root, '.editor-section--cover input[type="file"]', 'saved.png');
      await settle(fixture);
      clickButton(root, 'حفظ كمسودة');
      await settle(fixture);
      const saved = editor.draft().coverUrl;
      expect((await firstValueFrom(api.get('wasly')))?.coverUrl).toBe(saved);

      pickFile(root, '.editor-section--cover input[type="file"]', 'unsaved.png');
      await settle(fixture);
      expect(revoke).not.toHaveBeenCalled();
      expect((await firstValueFrom(api.get('wasly')))?.coverUrl).toBe(saved);

      root.querySelector<HTMLButtonElement>('.editor-section--cover .uploader__clear')?.click();
      await settle(fixture);
      // Clearing drops the draft claim on the unsaved replacement only.
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:project/2');
      expect((await firstValueFrom(api.get('wasly')))?.coverUrl).toBe(saved);
      expect(editor.draft().coverUrl).toBe('');
    });

    it('revokes the previous cover once a later save no longer uses it, and keeps the new one after close', async () => {
      const fixture = await render('edit', 'wasly');
      const root: HTMLElement = fixture.nativeElement;
      const api = TestBed.inject(ProjectsService);

      pickFile(root, '.editor-section--cover input[type="file"]', 'first.png');
      await settle(fixture);
      clickButton(root, 'حفظ كمسودة');
      await settle(fixture);
      const first = (await firstValueFrom(api.get('wasly')))?.coverUrl;

      pickFile(root, '.editor-section--cover input[type="file"]', 'second.png');
      await settle(fixture);
      clickButton(root, 'حفظ كمسودة');
      await settle(fixture);

      expect(revoke).toHaveBeenCalledWith(first);
      expect((await firstValueFrom(api.get('wasly')))?.coverUrl).toBe('blob:project/2');

      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);
      expect((await firstValueFrom(api.get('wasly')))?.coverUrl).toBe('blob:project/2');
    });
  });
});

function enterName(root: HTMLElement, value: string): void {
  const name = root.querySelector<HTMLInputElement>('input:not([type="file"])');
  if (!name) {
    throw new Error('Project name field is missing');
  }
  name.value = value;
  name.dispatchEvent(new Event('input'));
}

function inputEvent(value: string): Event {
  const input = document.createElement('input');
  input.value = value;
  const event = new Event('input', { bubbles: true });
  Object.defineProperty(event, 'target', { value: input });
  return event;
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

function named(id: string, arabic: string): Project {
  return { ...blankProject(), id, published: true, name: localeText(arabic, arabic) };
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
