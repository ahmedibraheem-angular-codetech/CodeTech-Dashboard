import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { firstValueFrom, map, of, throwError, timer } from 'rxjs';

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
    expect(editor.draft().identityButtons.every((button) => button.images.length === 4)).toBe(
      true,
    );

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
        failed
          ? throwError(() => new Error('failed'))
          : of(named('wasly', 'بعد إعادة المحاولة')),
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
