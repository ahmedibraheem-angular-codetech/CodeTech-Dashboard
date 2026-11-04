import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SERVICE_STEPS, localeText, type Service } from '../../models/service.model';
import { ServicesService } from '../../services/services.service';
import {
  inputEvent,
  installServiceEditorTestHooks,
  renderServiceEditor as render,
  seedService as seed,
  settle,
} from '../../testing/service-editor.harness';

describe('ServiceEditor', () => {
  installServiceEditorTestHooks();

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
});
