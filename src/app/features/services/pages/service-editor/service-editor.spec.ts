import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { NEVER, firstValueFrom, map, of, throwError, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { LanguageService } from '../../../../core/services/language.service';
import { blankProject } from '../../../projects/models/project.model';
import { ProjectsService } from '../../../projects/services/projects.service';
import { SERVICE_STEPS, blankService, localeText, type Service } from '../../models/service.model';
import { SERVICES_SEED } from '../../services/services.mock';
import { ServicesService } from '../../services/services.service';
import { ServiceEditor } from './service-editor';

@Component({ template: '' })
class RouteStub {}

type ServicesApi = Pick<ServicesService, 'get' | 'save'>;
type ProjectsApi = Pick<ProjectsService, 'list'>;

describe('ServiceEditor', () => {
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
    TestBed.inject(LanguageService).set('ar');
  });

  async function render(
    mode: 'create' | 'edit',
    id = '',
    overrides: { services?: ServicesApi; projects?: ProjectsApi } = {},
  ) {
    TestBed.configureTestingModule({
      imports: [ServiceEditor],
      providers: [
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
        provideRouter([{ path: 'services', component: RouteStub }]),
        { provide: ActivatedRoute, useValue: { data: of({ mode }), snapshot: { data: { mode } } } },
      ],
    });
    if (overrides.services) {
      TestBed.overrideProvider(ServicesService, { useValue: overrides.services });
    }
    if (overrides.projects) {
      TestBed.overrideProvider(ProjectsService, { useValue: overrides.projects });
    }
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const fixture = TestBed.createComponent(ServiceEditor);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    await settle(fixture);
    return {
      fixture,
      editor: fixture.componentInstance,
      root: fixture.nativeElement as HTMLElement,
      navigate,
      toast,
    };
  }

  const seed = (id: string): Service => {
    const found = SERVICES_SEED.find((item) => item.id === id);
    if (!found) {
      throw new Error(`Seed ${id} is missing`);
    }
    return structuredClone(found);
  };

  describe('create', () => {
    it('opens a fresh blank service on the first of seven wizard steps', async () => {
      const { editor, root } = await render('create');
      expect(SERVICE_STEPS).toHaveLength(7);
      expect(root.querySelectorAll('.wizard__step')).toHaveLength(7);
      expect(root.querySelector('app-page-tabs')).toBeNull();
      expect(root.textContent).toContain('إضافة خدمة جديدة');
      expect(editor.step()).toBe(0);
      expect(editor.status()).toBe('ready');
      const { id, whyItems, solutions, stages, features, sectors, faqs, ...rest } = editor.draft();
      const blank = blankService();
      expect(id).toBe('');
      expect(rest).toEqual({
        icon: blank.icon,
        published: blank.published,
        name: blank.name,
        description: blank.description,
        whyImage: blank.whyImage,
        projectIds: [],
      });
      for (const list of [whyItems, solutions, stages, features, sectors, faqs]) {
        expect(list).toHaveLength(1);
      }
    });

    it('does not share state with the seed data or another editor instance', async () => {
      const { fixture, editor } = await render('create');
      const other = TestBed.createComponent(ServiceEditor);
      other.componentRef.setInput('id', '');
      other.detectChanges();
      const second = other.componentInstance;

      editor.setField('name', inputEvent('اسم'));
      editor.addPoint('solutions');
      editor.setProject('wasly', true);
      editor.setIcon('pi-cloud');

      expect(second.draft().name.ar).toBe('');
      expect(second.draft().solutions).toHaveLength(1);
      expect(second.draft().projectIds).toEqual([]);
      expect(second.draft().icon).toBe('');
      expect(editor.draft().whyItems).not.toBe(second.draft().whyItems);
      expect(SERVICES_SEED.every((item) => item.name.ar !== 'اسم')).toBe(true);
      fixture.destroy();
    });

    it('stays on the first step until both names are filled', async () => {
      const { fixture, editor, root } = await render('create');
      clickNext(root);
      fixture.detectChanges();
      expect(editor.step()).toBe(0);
      expect(root.textContent).toContain('هذا الحقل مطلوب');

      enterName(root, 'خدمة');
      clickNext(root);
      fixture.detectChanges();
      expect(editor.step()).toBe(0);

      switchLocale(root, 'English');
      fixture.detectChanges();
      enterName(root, 'Service');
      clickNext(root);
      fixture.detectChanges();
      expect(editor.step()).toBe(1);
      expect(editor.draft().name).toEqual(localeText('خدمة', 'Service'));
    });

    it('renders every one of the seven steps while moving forward and keeps entered data', async () => {
      const { fixture, editor, root } = await render('create');
      const hosts = [
        'app-service-why-step',
        'app-service-solutions-step',
        'app-service-stages-step',
        'app-service-features-step',
        'app-service-projects-step',
        'app-service-sectors-step',
        'app-service-faq-step',
      ];
      editor.setField('name', inputEvent('خدمة'));
      editor.useLocale('en');
      editor.setField('name', inputEvent('Service'));
      editor.setField('description', inputEvent('Description'));
      editor.setIcon('pi-shield');
      editor.setWhyImage({ name: 'why.png', url: 'blob:why' });

      for (const [index, host] of hosts.entries()) {
        expect(root.querySelector(host), host).not.toBeNull();
        expect(editor.step()).toBe(index);
        if (index < hosts.length - 1) {
          clickNext(root);
          await settle(fixture);
        }
      }
      expect(editor.lastStep()).toBe(true);
      expect(root.textContent).toContain('إنهاء');

      editor.select(0);
      fixture.detectChanges();
      expect(editor.draft().name).toEqual(localeText('خدمة', 'Service'));
      expect(editor.draft().description.en).toBe('Description');
      expect(editor.draft().icon).toBe('pi-shield');
      expect(editor.draft().whyImage).toMatchObject({ imageName: 'why.png', imageUrl: 'blob:why' });
    });

    it('will not jump ahead of the current step before it is reached', async () => {
      const { editor } = await render('create');
      editor.select(4);
      expect(editor.step()).toBe(0);
    });

    it('goes back a step and leaves for the list from the first step', async () => {
      const { editor, navigate } = await render('create');
      editor.setField('name', inputEvent('خدمة'));
      editor.useLocale('en');
      editor.setField('name', inputEvent('Service'));
      editor.next();
      expect(editor.step()).toBe(1);
      editor.previous();
      expect(editor.step()).toBe(0);
      editor.previous();
      expect(navigate).toHaveBeenCalledWith(['/services']);
    });

    it('does not save or navigate when finishing without names', async () => {
      const save = vi.fn();
      const { editor, navigate, toast } = await render('create', '', {
        services: { get: () => of(null), save },
      });
      editor.finish();
      expect(save).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      expect(toast).not.toHaveBeenCalled();
      expect(editor.nameError()).toBe(true);
      expect(editor.step()).toBe(0);
    });

    it('saves the complete model on finish, then navigates to the list', async () => {
      const { editor, navigate, toast } = await render('create');
      const api = TestBed.inject(ServicesService);
      const before = (await firstValueFrom(api.list())).length;
      fillEveryStep(editor);

      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/services']));

      const items = await firstValueFrom(api.list());
      expect(items).toHaveLength(before + 1);
      const saved = items[0];
      expect(saved?.id).toMatch(/^svc-/);
      expect(saved).toMatchObject({
        icon: 'pi-cloud',
        published: true,
        name: { ar: 'خدمة جديدة', en: 'New service' },
        description: { ar: 'وصف', en: 'Description' },
        whyImage: {
          title: { ar: 'عنوان', en: 'Title' },
          imageName: 'why.png',
          imageUrl: 'blob:why',
        },
        projectIds: ['wasly'],
      });
      expect(saved?.whyItems[0]).toMatchObject({
        title: { ar: 'سبب', en: 'Reason' },
        imageUrl: 'icon:pi-star',
      });
      expect(saved?.solutions[0]).toMatchObject({
        title: { ar: 'حل', en: 'Solution' },
        body: { ar: 'تفصيل الحل', en: 'Solution body' },
        imageUrl: 'icon:pi-bolt',
      });
      expect(saved?.stages[0]).toMatchObject({
        title: { ar: 'مرحلة', en: 'Stage' },
        imageUrl: 'blob:stage',
      });
      expect(saved?.features[0]).toMatchObject({
        title: { ar: 'ميزة', en: 'Feature' },
        imageUrl: 'blob:feature',
      });
      expect(saved?.sectors[0]).toMatchObject({ imageName: 'sector.png', imageUrl: 'blob:sector' });
      expect(saved?.faqs[0]).toMatchObject({
        question: { ar: 'سؤال', en: 'Question' },
        answer: { ar: 'جواب', en: 'Answer' },
      });
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'success', summary: 'تم حفظ الخدمة' }),
      );
    });

    it('ignores a second finish while the first save is in flight', async () => {
      const save = vi.fn((service: Service) =>
        timer(30).pipe(map(() => ({ ...service, id: 'svc-new' }))),
      );
      const { editor, navigate } = await render('create', '', {
        services: { get: () => of(null), save },
      });
      fillEveryStep(editor);
      editor.finish();
      editor.finish();
      expect(editor.saving()).toBe(true);
      await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
      expect(save).toHaveBeenCalledTimes(1);
      expect(editor.saving()).toBe(false);
    });

    it('saves a draft without names, stays on the page, and reuses the new id afterwards', async () => {
      const { editor, navigate } = await render('create');
      const api = TestBed.inject(ServicesService);
      const before = (await firstValueFrom(api.list())).length;
      editor.saveDraft();
      await vi.waitFor(() => expect(editor.draft().id).toMatch(/^svc-/));
      const id = editor.draft().id;
      expect(editor.draft().published).toBe(false);
      expect(navigate).not.toHaveBeenCalled();

      editor.saveDraft();
      await vi.waitFor(() => expect(editor.saving()).toBe(false));
      const items = await firstValueFrom(api.list());
      expect(items).toHaveLength(before + 1);
      expect(items.filter((item) => item.id === id)).toHaveLength(1);
    });

    it('does not report success or navigate when saving fails', async () => {
      const save = vi.fn(() => throwError(() => new Error('offline')));
      const { editor, navigate, toast } = await render('create', '', {
        services: { get: () => of(null), save },
      });
      fillEveryStep(editor);
      editor.finish();
      await vi.waitFor(() => expect(save).toHaveBeenCalled());
      await vi.waitFor(() => expect(editor.saving()).toBe(false));
      expect(navigate).not.toHaveBeenCalled();
      expect(toast).toHaveBeenCalledTimes(1);
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(editor.draft().id).toBe('');
      expect(editor.draft().name.ar).toBe('خدمة جديدة');
    });
  });

  describe('edit', () => {
    it('loads the requested service into tabs and populates every step', async () => {
      const { fixture, editor, root } = await render('edit', 'web-development');
      const expected = seed('web-development');
      expect(root.querySelector('app-page-tabs')).not.toBeNull();
      expect(root.querySelector('p-stepper')).toBeNull();
      expect(root.querySelectorAll('app-page-tabs [role="tab"]')).toHaveLength(7);
      expect(root.querySelector<HTMLInputElement>('input:not([type="file"])')?.value).toBe(
        expected.name.ar,
      );
      expect(editor.draft()).toEqual(expected);
      expect(root.querySelectorAll('app-service-why-step .feature-card')).toHaveLength(
        expected.whyItems.length,
      );

      const counts: [number, string, number][] = [
        [1, 'app-service-solutions-step app-feature-card', expected.solutions.length],
        [2, 'app-service-stages-step app-feature-card', expected.stages.length],
        [3, 'app-service-features-step app-feature-card', expected.features.length],
        [4, 'app-service-project-card', 6],
        [5, 'app-service-sectors-step .feature-card', expected.sectors.length],
        [6, 'app-service-faq-step app-feature-card', expected.faqs.length],
      ];
      for (const [step, selector, count] of counts) {
        editor.select(step);
        await settle(fixture);
        expect(root.querySelectorAll(selector), selector).toHaveLength(count);
      }
    });

    it('shows the stored icon as selected and does not reset it', async () => {
      const { fixture, editor, root } = await render('edit', 'cloud-devops');
      const selected = root.querySelectorAll<HTMLElement>('.service-icons__item.is-selected');
      expect(selected).toHaveLength(1);
      expect(selected[0]?.dataset['icon']).toBe('pi-cloud');

      editor.setField('name', inputEvent('اسم جديد'));
      editor.select(3);
      editor.select(0);
      await settle(fixture);
      expect(editor.draft().icon).toBe('pi-cloud');
    });

    it('keeps and shows an icon that is outside the picker library', async () => {
      const custom: Service = { ...seed('web-development'), icon: 'pi-unknown-icon' };
      const save = vi.fn((service: Service) => of(service));
      const { editor, root } = await render('edit', 'web-development', {
        services: { get: () => of(custom), save },
      });
      const options = [...root.querySelectorAll<HTMLElement>('.service-icons__item')];
      expect(options[0]?.dataset['icon']).toBe('pi-unknown-icon');
      expect(options[0]?.classList.contains('is-selected')).toBe(true);

      editor.updatePublished(true);
      await vi.waitFor(() => expect(save).toHaveBeenCalled());
      expect(save.mock.calls[0]?.[0].icon).toBe('pi-unknown-icon');
    });

    it('selects an icon from the picker and persists it so the card can use it', async () => {
      const { fixture, editor, root, navigate } = await render('edit', 'web-development');
      root.querySelector<HTMLButtonElement>('button[data-icon="pi-database"]')?.click();
      fixture.detectChanges();
      expect(editor.draft().icon).toBe('pi-database');
      expect(
        root.querySelector('.service-icons__item.is-selected')?.getAttribute('data-icon'),
      ).toBe('pi-database');
      expect(editor.draft().whyImage.imageUrl).not.toContain('pi-database');

      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/services']));
      const stored = await firstValueFrom(TestBed.inject(ServicesService).get('web-development'));
      expect(stored?.icon).toBe('pi-database');
    });

    it('treats an unknown id as not found and renders no form', async () => {
      const { editor, root, toast } = await render('edit', 'does-not-exist');
      expect(editor.status()).toBe('missing');
      expect(root.textContent).toContain('تعذر العثور على هذه الخدمة.');
      expect(root.querySelector('input')).toBeNull();
      expect(root.querySelector('app-page-tabs')).toBeNull();
      expect(root.querySelector('app-service-why-step')).toBeNull();
      editor.finish();
      expect(toast).not.toHaveBeenCalled();
    });

    it('shows an error with retry when loading fails, then loads on retry', async () => {
      let attempts = 0;
      const get = vi.fn(() => {
        attempts += 1;
        return attempts === 1 ? throwError(() => new Error('offline')) : of(seed('mobile-apps'));
      });
      const { fixture, editor, root } = await render('edit', 'mobile-apps', {
        services: { get, save: () => of(seed('mobile-apps')) },
      });
      expect(editor.status()).toBe('error');
      expect(root.querySelector('app-service-why-step')).toBeNull();
      expect(root.querySelector('input')).toBeNull();

      editor.retry();
      await settle(fixture);
      expect(editor.status()).toBe('ready');
      expect(editor.draft().id).toBe('mobile-apps');
      expect(root.querySelector('app-service-why-step')).not.toBeNull();
    });

    it('keeps both languages and every step when moving between steps and locales', async () => {
      const { fixture, editor, root } = await render('edit', 'ui-ux-design');
      const original = seed('ui-ux-design');
      editor.setField('name', inputEvent('اسم معدل'));
      editor.useLocale('en');
      editor.setField('name', inputEvent('Edited name'));
      for (let step = 0; step < SERVICE_STEPS.length; step += 1) {
        editor.select(step);
        await settle(fixture);
      }
      editor.select(0);
      editor.useLocale('ar');
      await settle(fixture);
      expect(root.querySelector<HTMLInputElement>('input:not([type="file"])')?.value).toBe(
        'اسم معدل',
      );
      expect(editor.draft().name).toEqual(localeText('اسم معدل', 'Edited name'));
      expect({ ...editor.draft(), name: original.name }).toEqual(original);
    });

    it('preserves the id and every untouched field on save without creating a duplicate', async () => {
      const { editor, navigate, toast } = await render('edit', 'cyber-security');
      const api = TestBed.inject(ServicesService);
      const original = seed('cyber-security');
      const before = await firstValueFrom(api.list());
      editor.setField('description', inputEvent('وصف محدث'));

      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/services']));

      const after = await firstValueFrom(api.list());
      expect(after).toHaveLength(before.length);
      expect(after.map((item) => item.id)).toEqual(before.map((item) => item.id));
      const stored = after.find((item) => item.id === 'cyber-security');
      expect(stored).toEqual({
        ...original,
        description: { ...original.description, ar: 'وصف محدث' },
      });
      expect(stored?.published).toBe(original.published);
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'success', summary: 'تم حفظ الخدمة' }),
      );
    });

    it('publishes and unpublishes from the header and stays on the page', async () => {
      const { editor, navigate } = await render('edit', 'cyber-security');
      const api = TestBed.inject(ServicesService);
      expect(editor.draft().published).toBe(false);
      editor.updatePublished(true);
      await vi.waitFor(async () =>
        expect((await firstValueFrom(api.get('cyber-security')))?.published).toBe(true),
      );
      expect(editor.draft().published).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not report success or navigate when an edit fails to save', async () => {
      const save = vi.fn(() => throwError(() => new Error('offline')));
      const { editor, navigate, toast } = await render('edit', 'mobile-apps', {
        services: { get: () => of(seed('mobile-apps')), save },
      });
      editor.finish();
      await vi.waitFor(() => expect(editor.saving()).toBe(false));
      expect(save).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
      expect(toast).toHaveBeenCalledTimes(1);
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
      expect(editor.draft()).toEqual(seed('mobile-apps'));
    });
  });

  describe('repeated items', () => {
    it('adds and removes solutions, stages, and features without touching other items', async () => {
      const { editor } = await render('edit', 'mobile-apps');
      const lists = ['solutions', 'stages', 'features'] as const;
      for (const list of lists) {
        const before = editor.draft()[list];
        editor.addPoint(list);
        expect(editor.draft()[list]).toHaveLength(before.length + 1);
        expect(editor.draft()[list].slice(0, before.length)).toEqual(before);
        const added = editor.draft()[list][before.length];
        expect(added?.id).not.toBe('');
        expect(before.some((item) => item.id === added?.id)).toBe(false);

        editor.removePoint(list, 0);
        expect(editor.draft()[list]).toHaveLength(before.length);
        expect(editor.draft()[list].map((item) => item.id)).toEqual([
          ...before.slice(1).map((item) => item.id),
          added?.id,
        ]);
      }
    });

    it('edits one item at a time in the active locale and keeps image metadata', async () => {
      const { editor } = await render('edit', 'ui-ux-design');
      const before = editor.draft().stages;
      editor.useLocale('en');
      editor.setPoint('stages', 1, 'title', inputEvent('Edited stage'));
      editor.setPoint('stages', 1, 'body', inputEvent('Edited body'));
      const after = editor.draft().stages;
      expect(after[1]?.title).toEqual({ ar: before[1]?.title.ar, en: 'Edited stage' });
      expect(after[1]?.body.en).toBe('Edited body');
      expect(after[1]?.imageUrl).toBe(before[1]?.imageUrl);
      expect(after[1]?.imageName).toBe(before[1]?.imageName);
      expect(after[0]).toEqual(before[0]);
      expect(after[2]).toEqual(before[2]);
      expect(after.map((item) => item.id)).toEqual(before.map((item) => item.id));
    });

    it('sets and clears images on one item only', async () => {
      const { editor } = await render('edit', 'web-development');
      const before = editor.draft();
      editor.setPointImage('features', 0, { name: 'new.png', url: 'blob:new' });
      expect(editor.draft().features[0]).toMatchObject({
        imageName: 'new.png',
        imageUrl: 'blob:new',
      });
      expect(editor.draft().features[1]).toEqual(before.features[1]);
      editor.clearPointImage('features', 0);
      expect(editor.draft().features[0]).toMatchObject({ imageName: '', imageUrl: '' });
      expect(editor.draft().features[0]?.title).toEqual(before.features[0]?.title);

      editor.setSectorImage(1, { name: 's.png', url: 'blob:s' });
      expect(editor.draft().sectors[1]).toMatchObject({ imageName: 's.png', imageUrl: 'blob:s' });
      expect(editor.draft().sectors[0]).toEqual(before.sectors[0]);
      editor.clearSectorImage(1);
      expect(editor.draft().sectors[1]).toMatchObject({ imageName: '', imageUrl: '' });

      editor.clearWhyIcon(0);
      expect(editor.draft().whyItems[0]).toMatchObject({ imageName: '', imageUrl: '' });
      expect(editor.draft().whyItems[0]?.title).toEqual(before.whyItems[0]?.title);
      expect(editor.draft().whyItems[1]).toEqual(before.whyItems[1]);
      editor.clearWhyImage();
      expect(editor.draft().whyImage.imageUrl).toBe('');
      expect(editor.draft().whyImage.title).toEqual(before.whyImage.title);
    });

    it('keeps at least one item in every repeatable section', async () => {
      const { editor } = await render('create');
      for (const list of ['solutions', 'stages', 'features'] as const) {
        editor.removePoint(list, 0);
        expect(editor.draft()[list]).toHaveLength(1);
      }
      editor.removeWhy(0);
      editor.removeSector(0);
      editor.removeFaq(0);
      expect(editor.draft().whyItems).toHaveLength(1);
      expect(editor.draft().sectors).toHaveLength(1);
      expect(editor.draft().faqs).toHaveLength(1);
    });

    it('adds, edits, and removes why items, sectors, and FAQs independently', async () => {
      const { editor } = await render('edit', 'cloud-devops');
      const before = editor.draft();
      editor.addWhy();
      editor.addSector();
      editor.addFaq();
      expect(editor.draft().whyItems).toHaveLength(before.whyItems.length + 1);
      expect(editor.draft().sectors).toHaveLength(before.sectors.length + 1);
      expect(editor.draft().faqs).toHaveLength(before.faqs.length + 1);

      editor.useLocale('en');
      editor.setFaq(0, 'question', inputEvent('Edited?'));
      editor.setFaq(0, 'answer', inputEvent('Yes'));
      editor.setWhyTitle(0, inputEvent('Edited reason'));
      expect(editor.draft().faqs[0]?.question).toEqual({
        ar: before.faqs[0]?.question.ar,
        en: 'Edited?',
      });
      expect(editor.draft().faqs[0]?.answer.en).toBe('Yes');
      expect(editor.draft().whyItems[0]?.title.en).toBe('Edited reason');
      expect(editor.draft().whyItems[1]).toEqual(before.whyItems[1]);

      editor.removeFaq(0);
      expect(editor.draft().faqs.map((item) => item.id)).toEqual([
        ...before.faqs.slice(1).map((item) => item.id),
        editor.draft().faqs.at(-1)?.id,
      ]);
      editor.removeWhy(0);
      editor.removeSector(0);
      expect(editor.draft().whyItems).toHaveLength(before.whyItems.length);
      expect(editor.draft().sectors).toHaveLength(before.sectors.length);
    });

    it('renders the add and remove controls and wires them to the draft', async () => {
      const { fixture, editor, root } = await render('edit', 'mobile-apps');
      const addButtons = () => [...root.querySelectorAll<HTMLButtonElement>('.add-row')];
      editor.select(1);
      await settle(fixture);
      const solutions = editor.draft().solutions.length;
      addButtons()[0]?.click();
      await settle(fixture);
      expect(editor.draft().solutions).toHaveLength(solutions + 1);
      expect(root.querySelectorAll('app-service-solutions-step app-feature-card')).toHaveLength(
        solutions + 1,
      );
      root.querySelector<HTMLButtonElement>('.feature-card__remove')?.click();
      await settle(fixture);
      expect(editor.draft().solutions).toHaveLength(solutions);

      editor.select(5);
      await settle(fixture);
      const sectors = editor.draft().sectors.length;
      addButtons()[0]?.click();
      await settle(fixture);
      expect(editor.draft().sectors).toHaveLength(sectors + 1);
    });

    it('labels stages with ordinals and falls back to numbers past ten', async () => {
      const { editor } = await render('create');
      expect(editor.stageLabel(0)).toBe('الخطوة الأولى');
      expect(editor.stageLabel(1)).toBe('الخطوة الثانية');
      expect(editor.stageLabel(10)).toBe('الخطوة 11');
      editor.useLocale('en');
      expect(editor.stageLabel(0)).toBe('Step one');
    });
  });

  describe('related projects', () => {
    it('lists the real projects and reflects the stored selection', async () => {
      const { fixture, editor, root } = await render('edit', 'web-development');
      editor.select(4);
      await settle(fixture);
      const cards = [...root.querySelectorAll('app-service-project-card')];
      expect(cards).toHaveLength(6);
      const projects = await firstValueFrom(TestBed.inject(ProjectsService).list());
      expect(editor.projects().map((project) => project.id)).toEqual(projects.map((p) => p.id));
      const checked = cards
        .map((card, index) => ({
          id: projects[index]?.id,
          on: card.querySelector<HTMLInputElement>('input')?.checked,
        }))
        .filter((item) => item.on)
        .map((item) => item.id);
      expect(checked.sort()).toEqual([...seed('web-development').projectIds].sort());
      expect(cards[0]?.textContent).toContain(projects[0]?.name.ar);
    });

    it('selects and deselects projects and keeps the choice across steps and saving', async () => {
      const { fixture, editor, root, navigate } = await render('create');
      editor.setField('name', inputEvent('خدمة'));
      editor.useLocale('en');
      editor.setField('name', inputEvent('Service'));
      for (let step = 0; step < 4; step += 1) {
        editor.next();
      }
      await settle(fixture);
      expect(editor.stepId()).toBe('projects');

      const toggle = root.querySelectorAll<HTMLInputElement>('app-service-project-card input');
      toggle[1]?.click();
      toggle[2]?.click();
      fixture.detectChanges();
      expect(editor.draft().projectIds).toEqual(['ops-suite', 'care-hub']);
      toggle[1]?.click();
      fixture.detectChanges();
      expect(editor.draft().projectIds).toEqual(['care-hub']);

      editor.select(0);
      for (let step = 0; step < 4; step += 1) {
        editor.next();
      }
      await settle(fixture);
      expect(editor.stepId()).toBe('projects');
      expect(editor.projectSelected('care-hub')).toBe(true);
      expect(
        root.querySelectorAll<HTMLInputElement>('app-service-project-card input')[2]?.checked,
      ).toBe(true);

      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
      const saved = (await firstValueFrom(TestBed.inject(ServicesService).list()))[0];
      expect(saved?.projectIds).toEqual(['care-hub']);
    });

    it('does not duplicate an id that is selected twice', async () => {
      const { editor } = await render('create');
      editor.setProject('wasly', true);
      editor.setProject('wasly', true);
      expect(editor.draft().projectIds).toEqual(['wasly']);
    });

    it('drops references to projects that no longer exist when saving', async () => {
      const stale: Service = {
        ...seed('web-development'),
        projectIds: ['wasly', 'deleted-project'],
      };
      const save = vi.fn((service: Service) => of(service));
      const { editor } = await render('edit', 'web-development', {
        services: { get: () => of(stale), save },
      });
      expect(editor.draft().projectIds).toEqual(['wasly', 'deleted-project']);
      editor.updatePublished(true);
      await vi.waitFor(() => expect(save).toHaveBeenCalled());
      expect(save.mock.calls[0]?.[0].projectIds).toEqual(['wasly']);
    });

    it('keeps every reference when the project list cannot be loaded, and offers a retry', async () => {
      const list = vi.fn(() => throwError(() => new Error('offline')));
      const save = vi.fn((service: Service) => of(service));
      const stale: Service = {
        ...seed('web-development'),
        projectIds: ['wasly', 'deleted-project'],
      };
      const { fixture, editor, root } = await render('edit', 'web-development', {
        services: { get: () => of(stale), save },
        projects: { list },
      });
      expect(editor.projectsStatus()).toBe('error');
      editor.select(4);
      await settle(fixture);
      expect(root.querySelector('app-service-project-card')).toBeNull();
      expect(root.querySelector('app-state-view')?.textContent).toContain('حدث خطأ');

      editor.updatePublished(true);
      await vi.waitFor(() => expect(save).toHaveBeenCalled());
      expect(save.mock.calls[0]?.[0].projectIds).toEqual(['wasly', 'deleted-project']);
    });

    it('shows an empty state when there are no projects to choose from', async () => {
      const { fixture, editor, root } = await render('create', '', {
        projects: { list: () => of([]) },
      });
      editor.setField('name', inputEvent('خدمة'));
      editor.useLocale('en');
      editor.setField('name', inputEvent('Service'));
      for (let step = 0; step < 4; step += 1) {
        editor.next();
      }
      await settle(fixture);
      expect(root.querySelector('app-service-project-card')).toBeNull();
      expect(root.textContent).toContain('No projects available to choose from.');
    });
  });

  describe('regression review: publication state', () => {
    const stored = async (id: string) => firstValueFrom(TestBed.inject(ServicesService).get(id));

    it('keeps a published service published when it is saved with Save', async () => {
      const { editor, navigate } = await render('edit', 'web-development');
      expect(editor.draft().published).toBe(true);
      editor.setField('description', inputEvent('وصف محدث'));
      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/services']));
      expect((await stored('web-development'))?.published).toBe(true);
    });

    it('keeps an unpublished service unpublished when it is saved with Save', async () => {
      const { editor, navigate } = await render('edit', 'cyber-security');
      expect(editor.draft().published).toBe(false);
      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/services']));
      expect((await stored('cyber-security'))?.published).toBe(false);
    });

    it('never publishes an unpublished service when saving a draft', async () => {
      const { editor, navigate } = await render('edit', 'cyber-security');
      editor.setField('description', inputEvent('مسودة'));
      editor.saveDraft();
      await vi.waitFor(() => expect(editor.saving()).toBe(false));
      expect(editor.draft().published).toBe(false);
      const saved = await stored('cyber-security');
      expect(saved?.published).toBe(false);
      expect(saved?.description.ar).toBe('مسودة');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('treats Save as draft on a published service as an explicit unpublish, like Products and Projects', async () => {
      const { fixture, editor, root, navigate } = await render('edit', 'web-development');
      expect(headerButton(root, 'إلغاء النشر')).not.toBeNull();
      editor.saveDraft();
      await vi.waitFor(() => expect(editor.draft().published).toBe(false));
      await settle(fixture);
      expect((await stored('web-development'))?.published).toBe(false);
      expect(headerButton(root, 'نشر')).not.toBeNull();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('publishes and unpublishes only through the explicit header action', async () => {
      const { editor } = await render('edit', 'cyber-security');
      editor.updatePublished(true);
      await vi.waitFor(() => expect(editor.draft().published).toBe(true));
      expect((await stored('cyber-security'))?.published).toBe(true);
      editor.updatePublished(false);
      await vi.waitFor(() => expect(editor.draft().published).toBe(false));
      expect((await stored('cyber-security'))?.published).toBe(false);
    });

    it('stores a created service as a draft until Finish publishes it', async () => {
      const { editor, navigate } = await render('create');
      fillEveryStep(editor);
      editor.saveDraft();
      await vi.waitFor(() => expect(editor.draft().id).toMatch(/^svc-/));
      const id = editor.draft().id;
      expect((await stored(id))?.published).toBe(false);
      editor.saveDraft();
      await vi.waitFor(() => expect(editor.saving()).toBe(false));
      expect((await stored(id))?.published).toBe(false);
      expect(navigate).not.toHaveBeenCalled();

      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/services']));
      expect((await stored(id))?.published).toBe(true);
    });

    it('does not change the publication state shown when a save fails', async () => {
      const save = vi.fn(() => throwError(() => new Error('offline')));
      const { editor } = await render('edit', 'web-development', {
        services: { get: () => of(seed('web-development')), save },
      });
      editor.saveDraft();
      await vi.waitFor(() => expect(editor.saving()).toBe(false));
      expect(editor.draft().published).toBe(true);
    });
  });

  describe('regression review: name validation', () => {
    const stored = async (id: string) => firstValueFrom(TestBed.inject(ServicesService).get(id));

    it('rejects whitespace-only names when moving on in create', async () => {
      const { fixture, editor, root } = await render('create');
      enterName(root, '   ');
      switchLocale(root, 'English');
      fixture.detectChanges();
      enterName(root, '  ');
      clickNext(root);
      fixture.detectChanges();
      expect(editor.step()).toBe(0);
      expect(editor.nameError()).toBe(true);
    });

    it('shows the Services translation in the active content language and clears it once the user types', async () => {
      const { fixture, editor, root } = await render('create');
      clickNext(root);
      fixture.detectChanges();
      expect(root.querySelector('app-field-error')?.textContent).toContain('هذا الحقل مطلوب.');

      enterName(root, 'خدمة');
      fixture.detectChanges();
      expect(editor.nameError()).toBe(false);
      expect(root.querySelector('app-field-error')).toBeNull();

      switchLocale(root, 'English');
      fixture.detectChanges();
      clickNext(root);
      fixture.detectChanges();
      expect(root.querySelector('app-field-error')?.textContent).toContain(
        'This field is required.',
      );
    });

    it('enforces the same two-name rule on Next, Finish, and a published edit', async () => {
      const create = await render('create');
      create.editor.finish();
      expect(create.editor.nameError()).toBe(true);
      expect(create.navigate).not.toHaveBeenCalled();
      TestBed.resetTestingModule();

      const { editor, navigate } = await render('edit', 'web-development');
      editor.select(3);
      editor.useLocale('en');
      editor.setField('name', inputEvent(''));
      editor.finish();
      expect(editor.nameError()).toBe(true);
      expect(editor.step()).toBe(0);
      expect(navigate).not.toHaveBeenCalled();
      expect((await stored('web-development'))?.name.en).toBe(seed('web-development').name.en);
    });

    it('lets a draft bypass name validation, and the shared error clears afterwards', async () => {
      const { editor, navigate } = await render('edit', 'web-development');
      editor.useLocale('en');
      editor.setField('name', inputEvent(''));
      editor.updatePublished(true);
      expect(editor.nameError()).toBe(true);

      editor.saveDraft();
      await vi.waitFor(() => expect(editor.saving()).toBe(false));
      expect(editor.nameError()).toBe(false);
      expect((await stored('web-development'))?.published).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('allows saving an unpublished service whose names are incomplete', async () => {
      const incomplete: Service = { ...seed('cyber-security'), name: localeText('اسم', '') };
      const save = vi.fn((service: Service) => of(service));
      const { editor, navigate } = await render('edit', 'cyber-security', {
        services: { get: () => of(incomplete), save },
      });
      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/services']));
      expect(save).toHaveBeenCalledTimes(1);
      expect(save.mock.calls[0]?.[0].published).toBe(false);
    });
  });

  describe('regression review: related project ids', () => {
    const stale = (): Service => ({
      ...seed('web-development'),
      projectIds: ['wasly', 'deleted-project'],
    });

    it('drops every stored id after a successful load of an empty project list', async () => {
      const save = vi.fn((service: Service) => of(service));
      const { editor } = await render('edit', 'web-development', {
        services: { get: () => of(stale()), save },
        projects: { list: () => of([]) },
      });
      expect(editor.projectsStatus()).toBe('ready');
      editor.updatePublished(true);
      await vi.waitFor(() => expect(save).toHaveBeenCalled());
      expect(save.mock.calls[0]?.[0].projectIds).toEqual([]);
    });

    it('keeps every stored id after a failed project-list request, including an empty-looking state', async () => {
      const save = vi.fn((service: Service) => of(service));
      const { editor } = await render('edit', 'web-development', {
        services: { get: () => of(stale()), save },
        projects: { list: () => throwError(() => new Error('offline')) },
      });
      expect(editor.projects()).toEqual([]);
      expect(editor.projectsStatus()).toBe('error');
      editor.updatePublished(true);
      await vi.waitFor(() => expect(save).toHaveBeenCalled());
      expect(save.mock.calls[0]?.[0].projectIds).toEqual(['wasly', 'deleted-project']);
    });

    it('keeps every stored id while the project list is still loading', async () => {
      const save = vi.fn((service: Service) => of(service));
      const { editor } = await render('edit', 'web-development', {
        services: { get: () => of(stale()), save },
        projects: { list: () => NEVER },
      });
      expect(editor.projectsStatus()).toBe('loading');
      editor.updatePublished(true);
      await vi.waitFor(() => expect(save).toHaveBeenCalled());
      expect(save.mock.calls[0]?.[0].projectIds).toEqual(['wasly', 'deleted-project']);
    });

    it('recovers pruning after a retry succeeds', async () => {
      let attempts = 0;
      const list = vi.fn(() => {
        attempts += 1;
        return attempts === 1
          ? throwError(() => new Error('offline'))
          : of([projectNamed('wasly')]);
      });
      const save = vi.fn((service: Service) => of(service));
      const { fixture, editor } = await render('edit', 'web-development', {
        services: { get: () => of(stale()), save },
        projects: { list },
      });
      editor.loadProjects();
      await settle(fixture);
      expect(editor.projectsStatus()).toBe('ready');
      editor.updatePublished(true);
      await vi.waitFor(() => expect(save).toHaveBeenCalled());
      expect(save.mock.calls[0]?.[0].projectIds).toEqual(['wasly']);
    });

    it('keeps valid selections, in order, across tab switches and a save', async () => {
      const { fixture, editor, navigate } = await render('edit', 'web-development');
      const original = seed('web-development').projectIds;
      for (let step = 0; step < SERVICE_STEPS.length; step += 1) {
        editor.select(step);
        await settle(fixture);
      }
      editor.useLocale('en');
      editor.select(4);
      editor.setProject('care-hub', true);
      editor.select(0);
      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
      const saved = await firstValueFrom(TestBed.inject(ServicesService).get('web-development'));
      expect(saved?.projectIds).toEqual([...original, 'care-hub']);
    });
  });

  describe('regression review: repeated-item ids', () => {
    const collect = (service: Service): string[] => [
      ...service.whyItems.map((item) => item.id),
      ...service.solutions.map((item) => item.id),
      ...service.stages.map((item) => item.id),
      ...service.features.map((item) => item.id),
      ...service.sectors.map((item) => item.id),
      ...service.faqs.map((item) => item.id),
    ];

    it('never reuses an id across collections, removals, or fresh editors', async () => {
      const first = await render('create');
      const secondFixture = TestBed.createComponent(ServiceEditor);
      secondFixture.componentRef.setInput('id', '');
      secondFixture.detectChanges();
      const second = { editor: secondFixture.componentInstance };
      const seen = new Set<string>(SERVICES_SEED.flatMap(collect));
      const seedCount = seen.size;
      const lists = ['solutions', 'stages', 'features'] as const;

      for (const { editor } of [first, second]) {
        for (let round = 0; round < 3; round += 1) {
          for (const list of lists) {
            editor.addPoint(list);
            editor.addPoint(list);
            editor.removePoint(list, 1);
          }
          editor.addWhy();
          editor.addWhy();
          editor.removeWhy(1);
          editor.addSector();
          editor.addSector();
          editor.removeSector(1);
          editor.addFaq();
          editor.addFaq();
          editor.removeFaq(1);
        }
      }
      const everyDraft = [...collect(first.editor.draft()), ...collect(second.editor.draft())];
      expect(new Set(everyDraft).size).toBe(everyDraft.length);
      for (const id of everyDraft) {
        expect(seen.has(id), id).toBe(false);
      }
      expect(seen.size).toBe(seedCount);
    });

    it('keeps the ids of existing items while editing, reordering by removal, and saving', async () => {
      const { editor, navigate } = await render('edit', 'ui-ux-design');
      const before = collect(editor.draft());
      editor.useLocale('en');
      editor.setPoint('stages', 0, 'title', inputEvent('Renamed'));
      editor.setFaq(0, 'question', inputEvent('Renamed?'));
      editor.addPoint('features');
      const added = editor.draft().features.at(-1)?.id ?? '';
      expect(before).not.toContain(added);
      editor.removePoint('features', editor.draft().features.length - 1);
      expect(collect(editor.draft())).toEqual(before);

      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
      const saved = await firstValueFrom(TestBed.inject(ServicesService).get('ui-ux-design'));
      expect(saved ? collect(saved) : []).toEqual(before);
    });
  });

  describe('regression review: data preservation', () => {
    it('keeps every unrelated field through steps, locales, add/remove, and a save', async () => {
      const { fixture, editor, navigate } = await render('edit', 'mobile-apps');
      const original = seed('mobile-apps');

      for (let step = 0; step < SERVICE_STEPS.length; step += 1) {
        editor.select(step);
        editor.useLocale(step % 2 === 0 ? 'en' : 'ar');
        await settle(fixture);
      }
      for (const list of ['solutions', 'stages', 'features'] as const) {
        editor.addPoint(list);
        editor.removePoint(list, editor.draft()[list].length - 1);
      }
      editor.addWhy();
      editor.removeWhy(editor.draft().whyItems.length - 1);
      editor.addSector();
      editor.removeSector(editor.draft().sectors.length - 1);
      editor.addFaq();
      editor.removeFaq(editor.draft().faqs.length - 1);
      editor.setProject('city-sense', true);
      editor.setProject('city-sense', false);
      editor.select(0);
      expect(editor.draft()).toEqual(original);

      editor.finish();
      await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
      const saved = await firstValueFrom(TestBed.inject(ServicesService).get('mobile-apps'));
      expect(saved).toEqual(original);
    });

    it('changes only the targeted field when one value is edited in each step', async () => {
      const { editor } = await render('edit', 'cloud-devops');
      const original = seed('cloud-devops');
      editor.useLocale('en');
      editor.setWhyTitle(0, inputEvent('Why'));
      editor.setPoint('solutions', 0, 'title', inputEvent('S'));
      editor.setPoint('stages', 0, 'body', inputEvent('B'));
      editor.setFaq(0, 'answer', inputEvent('A'));
      const draft = editor.draft();
      expect(draft.whyItems[0]?.title).toEqual({ ...original.whyItems[0]?.title, en: 'Why' });
      expect(draft.solutions[0]?.title).toEqual({ ...original.solutions[0]?.title, en: 'S' });
      expect(draft.stages[0]?.body).toEqual({ ...original.stages[0]?.body, en: 'B' });
      expect(draft.faqs[0]?.answer).toEqual({ ...original.faqs[0]?.answer, en: 'A' });
      const restored: Service = {
        ...draft,
        whyItems: original.whyItems,
        solutions: original.solutions,
        stages: original.stages,
        faqs: original.faqs,
      };
      expect(restored).toEqual(original);
    });
  });

  describe('regression review: unloaded records', () => {
    const unloaded = {
      missing: () => of(null),
      failed: () => throwError(() => new Error('offline')),
      loading: () => NEVER,
    };

    for (const [name, get] of Object.entries(unloaded)) {
      it(`cannot save, publish, or create a record while the edit page is ${name}`, async () => {
        const save = vi.fn((service: Service) => of(service));
        const { editor, root, navigate, toast } = await render('edit', 'web-development', {
          services: { get, save },
        });
        expect(editor.status()).toBe(
          name === 'loading' ? 'loading' : name === 'failed' ? 'error' : 'missing',
        );

        editor.saveDraft();
        editor.updatePublished(false);
        editor.updatePublished(true);
        editor.finish();
        for (const label of ['حفظ كمسودة', 'إلغاء النشر', 'حفظ']) {
          headerButton(root, label)?.click();
        }
        expect(save).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
        expect(toast).not.toHaveBeenCalled();
        expect(editor.draft().id).toBe('');
      });
    }

    it('does not add a record to the list when an unknown id is opened', async () => {
      const { editor } = await render('edit', 'does-not-exist');
      const api = TestBed.inject(ServicesService);
      const before = (await firstValueFrom(api.list())).length;
      editor.saveDraft();
      editor.updatePublished(false);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(await firstValueFrom(api.list())).toHaveLength(before);
    });
  });

  describe('localization and layout', () => {
    it('renders Arabic copy in RTL and English copy in LTR', async () => {
      const { fixture, editor, root } = await render('create');
      const panel = () => root.querySelector('.editor-card');
      expect(panel()?.getAttribute('dir')).toBe('rtl');
      expect(root.textContent).toContain('بيانات الخدمة');
      expect(root.textContent).toContain('أيقونة الخدمة');

      switchLocale(root, 'English');
      fixture.detectChanges();
      expect(editor.locale()).toBe('en');
      expect(panel()?.getAttribute('dir')).toBe('ltr');
      expect(root.textContent).toContain('Service details');
      expect(root.textContent).toContain('Service icon');
      expect(root.textContent).toContain('Why we need the service');
      expect(root.textContent).not.toContain('بيانات الخدمة');
    });

    it('shows the placeholders and labels of every step in the active locale', async () => {
      const { fixture, editor, root } = await render('edit', 'web-development');
      editor.useLocale('en');
      const expected: [number, string][] = [
        [1, 'Solution title'],
        [2, 'Stage title'],
        [3, 'Feature title'],
        [4, 'Choose the projects that belong to this service'],
        [5, 'Upload sector image'],
        [6, 'Add a new question'],
      ];
      for (const [step, text] of expected) {
        editor.select(step);
        await settle(fixture);
        expect(root.textContent, `step ${step}`).toContain(text);
      }
      expect(editor.copy('service.next')).toBe('Next');
      editor.useLocale('ar');
      expect(editor.copy('service.next')).toBe('التالي');
    });

    it('uses the service upload copy and not the product or project copy', async () => {
      const { fixture, editor, root } = await render('edit', 'web-development');
      editor.select(1);
      await settle(fixture);
      expect(root.textContent).toContain('رفع الأيقونة');
      expect(root.querySelector('app-product-upload')).not.toBeNull();
      expect(root.querySelectorAll('app-product-upload img').length).toBe(0);
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
      URL.createObjectURL = () => `blob:service/${(created += 1)}`;
      URL.revokeObjectURL = revoke;
    });

    afterEach(() => {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    });

    it('keeps a picked image previewable after leaving and returning to its step, then clears it', async () => {
      const { fixture, editor, root } = await render('edit', 'web-development');

      pickFile(lastFileInput(root), 'why.png');
      await settle(fixture);
      const url = editor.draft().whyImage.imageUrl;
      expect(url).toBe('blob:service/1');

      editor.select(1);
      await settle(fixture);
      expect(root.querySelector('app-service-why-step')).toBeNull();
      editor.select(0);
      await settle(fixture);

      expect(revoke).not.toHaveBeenCalled();
      expect(editor.draft().whyImage.imageUrl).toBe(url);
      expect(lastFileInput(root).closest('app-product-upload')?.querySelector('img')?.src).toBe(
        url,
      );

      lastFileInput(root)
        .closest('app-product-upload')
        ?.querySelector<HTMLButtonElement>('.uploader__clear')
        ?.click();
      await settle(fixture);

      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith(url);
      expect(editor.draft().whyImage.imageUrl).toBe('');
    });

    it('revokes only the replaced image', async () => {
      const { fixture, editor, root } = await render('edit', 'web-development');

      pickFile(lastFileInput(root), 'first.png');
      await settle(fixture);
      editor.select(1);
      await settle(fixture);
      editor.select(0);
      await settle(fixture);
      pickFile(lastFileInput(root), 'second.png');
      await settle(fixture);

      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:service/1');
      expect(editor.draft().whyImage.imageUrl).toBe('blob:service/2');
    });

    it('revokes a newly selected unsaved image when the editor is closed', async () => {
      const { fixture, editor, root } = await render('edit', 'web-development');
      pickFile(lastFileInput(root), 'why.png');
      await settle(fixture);
      const url = editor.draft().whyImage.imageUrl;
      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith(url);
    });

    it('keeps a saved image after closing an editor that did not change it', async () => {
      const { fixture, root } = await render('edit', 'web-development');
      const api = TestBed.inject(ServicesService);
      pickFile(lastFileInput(root), 'saved.png');
      await settle(fixture);
      headerButton(root, 'حفظ كمسودة')?.click();
      await settle(fixture);
      const saved = (await firstValueFrom(api.get('web-development')))?.whyImage.imageUrl;
      fixture.destroy();
      expect(revoke).not.toHaveBeenCalled();
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.imageUrl).toBe(saved);
    });

    it('does not break a saved image when an unsaved edit replaces or clears it', async () => {
      const { fixture, editor, root } = await render('edit', 'web-development');
      const api = TestBed.inject(ServicesService);

      pickFile(lastFileInput(root), 'saved.png');
      await settle(fixture);
      headerButton(root, 'حفظ كمسودة')?.click();
      await settle(fixture);
      const saved = editor.draft().whyImage.imageUrl;
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.imageUrl).toBe(saved);

      pickFile(lastFileInput(root), 'unsaved.png');
      await settle(fixture);
      expect(revoke).not.toHaveBeenCalled();
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.imageUrl).toBe(saved);

      lastFileInput(root)
        .closest('app-product-upload')
        ?.querySelector<HTMLButtonElement>('.uploader__clear')
        ?.click();
      await settle(fixture);
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:service/2');
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.imageUrl).toBe(saved);
      expect(editor.draft().whyImage.imageUrl).toBe('');
    });

    it('revokes the previous image once a later save no longer uses it, and keeps the new one after close', async () => {
      const { fixture, root } = await render('edit', 'web-development');
      const api = TestBed.inject(ServicesService);

      pickFile(lastFileInput(root), 'first.png');
      await settle(fixture);
      headerButton(root, 'حفظ كمسودة')?.click();
      await settle(fixture);
      const first = (await firstValueFrom(api.get('web-development')))?.whyImage.imageUrl;

      pickFile(lastFileInput(root), 'second.png');
      await settle(fixture);
      headerButton(root, 'حفظ كمسودة')?.click();
      await settle(fixture);

      expect(revoke).toHaveBeenCalledWith(first);
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.imageUrl).toBe(
        'blob:service/2',
      );

      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.imageUrl).toBe(
        'blob:service/2',
      );
    });
  });
});

function inputEvent(value: string): Event {
  const input = document.createElement('input');
  input.value = value;
  const event = new Event('input', { bubbles: true });
  Object.defineProperty(event, 'target', { value: input });
  return event;
}

function enterName(root: HTMLElement, value: string): void {
  const name = root.querySelector<HTMLInputElement>('input:not([type="file"])');
  if (!name) {
    throw new Error('Service name field is missing');
  }
  name.value = value;
  name.dispatchEvent(new Event('input'));
}

function switchLocale(root: HTMLElement, label: 'English' | 'عربي'): void {
  const option = [...root.querySelectorAll<HTMLButtonElement>('.locale-switch__option')].find(
    (item) => item.textContent?.includes(label),
  );
  if (!option) {
    throw new Error(`Locale tab ${label} is missing`);
  }
  option.click();
}

function clickNext(root: HTMLElement): void {
  const next = root.querySelector<HTMLButtonElement>('.editor-nav--next');
  if (!next) {
    throw new Error('Next button is missing');
  }
  next.click();
}

async function settle(fixture: { whenStable: () => Promise<unknown>; detectChanges: () => void }) {
  await new Promise((resolve) => setTimeout(resolve, 20));
  await fixture.whenStable();
  fixture.detectChanges();
}

/** Fills one value in every one of the seven steps of a fresh service. */
function fillEveryStep(editor: ServiceEditor): void {
  editor.useLocale('ar');
  editor.setField('name', inputEvent('خدمة جديدة'));
  editor.setField('description', inputEvent('وصف'));
  editor.setIcon('pi-cloud');
  editor.setWhyImageTitle(inputEvent('عنوان'));
  editor.setWhyImage({ name: 'why.png', url: 'blob:why' });
  editor.setWhyTitle(0, inputEvent('سبب'));
  editor.setWhyIcon(0, { name: 'pi-star', url: 'icon:pi-star' });
  editor.setPoint('solutions', 0, 'title', inputEvent('حل'));
  editor.setPoint('solutions', 0, 'body', inputEvent('تفصيل الحل'));
  editor.setPointImage('solutions', 0, { name: 'pi-bolt', url: 'icon:pi-bolt' });
  editor.setPoint('stages', 0, 'title', inputEvent('مرحلة'));
  editor.setPointImage('stages', 0, { name: 'stage.png', url: 'blob:stage' });
  editor.setPoint('features', 0, 'title', inputEvent('ميزة'));
  editor.setPointImage('features', 0, { name: 'feature.png', url: 'blob:feature' });
  editor.setProject('wasly', true);
  editor.setSectorImage(0, { name: 'sector.png', url: 'blob:sector' });
  editor.setFaq(0, 'question', inputEvent('سؤال'));
  editor.setFaq(0, 'answer', inputEvent('جواب'));
  editor.useLocale('en');
  editor.setField('name', inputEvent('New service'));
  editor.setField('description', inputEvent('Description'));
  editor.setWhyImageTitle(inputEvent('Title'));
  editor.setWhyTitle(0, inputEvent('Reason'));
  editor.setPoint('solutions', 0, 'title', inputEvent('Solution'));
  editor.setPoint('solutions', 0, 'body', inputEvent('Solution body'));
  editor.setPoint('stages', 0, 'title', inputEvent('Stage'));
  editor.setPoint('features', 0, 'title', inputEvent('Feature'));
  editor.setFaq(0, 'question', inputEvent('Question'));
  editor.setFaq(0, 'answer', inputEvent('Answer'));
  editor.useLocale('ar');
}

function headerButton(root: HTMLElement, label: string): HTMLButtonElement | null {
  const match = [...root.querySelectorAll('app-page-header app-button')].find(
    (item) => item.textContent?.trim() === label,
  );
  return match?.querySelector('button') ?? null;
}

function projectNamed(id: string) {
  return { ...blankProject(), id, published: true };
}

function lastFileInput(root: HTMLElement): HTMLInputElement {
  const inputs = root.querySelectorAll<HTMLInputElement>('app-service-why-step input[type="file"]');
  const input = inputs.item(inputs.length - 1);
  if (!input) {
    throw new Error('File input is missing');
  }
  return input;
}

function pickFile(input: HTMLInputElement, name: string): void {
  Object.defineProperty(input, 'files', {
    value: [new File([new Uint8Array([1])], name, { type: 'image/png' })],
    configurable: true,
  });
  input.dispatchEvent(new Event('change'));
}
