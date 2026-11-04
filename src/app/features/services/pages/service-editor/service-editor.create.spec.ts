import { TestBed } from '@angular/core/testing';
import { firstValueFrom, map, of, throwError, timer } from 'rxjs';

import { SERVICE_STEPS, blankService, localeText, type Service } from '../../models/service.model';
import { SERVICES_SEED } from '../../testing/services.mock';
import { ServicesService } from '../../services/services.service';
import { ServiceEditor } from './service-editor';
import {
  clickNext,
  enterName,
  fillEveryStep,
  inputEvent,
  installServiceEditorTestHooks,
  renderServiceEditor as render,
  settle,
  switchLocale,
} from '../../testing/service-editor.harness';

describe('ServiceEditor', () => {
  installServiceEditorTestHooks();

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
        code: blank.code,
        icon: blank.icon,
        iconUrl: blank.iconUrl,
        iconUuid: blank.iconUuid,
        published: blank.published,
        name: blank.name,
        description: blank.description,
        whyImage: blank.whyImage,
        projectIds: [],
        linkedProjects: [],
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

      expect(second.draft().name.ar).toBe('');
      expect(second.draft().solutions).toHaveLength(1);
      expect(second.draft().projectIds).toEqual([]);
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
      editor.setWhyImage({ name: 'why.png', url: 'blob:why' });
      editor.useLocale('en');
      editor.setField('name', inputEvent('Service'));
      editor.setField('description', inputEvent('Description'));

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
      expect(editor.draft().whyImage.image.ar).toMatchObject({
        imageName: 'why.png',
        imageUrl: 'blob:why',
      });
      expect(editor.draft().whyImage.image.en.imageUrl).toBe('');
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
        published: true,
        name: { ar: 'خدمة جديدة', en: 'New service' },
        description: { ar: 'وصف', en: 'Description' },
        whyImage: {
          title: { ar: 'عنوان', en: 'Title' },
          image: {
            ar: { imageName: 'why.png', imageUrl: 'blob:why' },
            en: { imageName: '', imageUrl: '' },
          },
        },
        projectIds: ['wasly'],
      });
      expect(saved?.whyItems[0]).toMatchObject({
        title: { ar: 'سبب', en: 'Reason' },
        image: { ar: { imageUrl: 'icon:pi-star' }, en: { imageUrl: '' } },
      });
      expect(saved?.solutions[0]).toMatchObject({
        title: { ar: 'حل', en: 'Solution' },
        body: { ar: 'تفصيل الحل', en: 'Solution body' },
        image: { ar: { imageUrl: 'icon:pi-bolt' }, en: { imageUrl: '' } },
      });
      expect(saved?.stages[0]).toMatchObject({
        title: { ar: 'مرحلة', en: 'Stage' },
        image: { ar: { imageUrl: 'blob:stage' }, en: { imageUrl: '' } },
      });
      expect(saved?.features[0]).toMatchObject({
        title: { ar: 'ميزة', en: 'Feature' },
        image: { ar: { imageUrl: 'blob:feature' }, en: { imageUrl: '' } },
      });
      expect(saved?.sectors[0]?.image.ar).toMatchObject({
        imageName: 'sector.png',
        imageUrl: 'blob:sector',
      });
      expect(saved?.sectors[0]?.image.en).toMatchObject({ imageName: '', imageUrl: '' });
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

});
