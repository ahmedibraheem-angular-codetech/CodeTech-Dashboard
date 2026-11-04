import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { type Service } from '../../models/service.model';
import { SERVICES_SEED } from '../../testing/services.mock';
import { ServicesService } from '../../services/services.service';
import { ServiceEditor } from './service-editor';
import {
  inputEvent,
  installServiceEditorTestHooks,
  renderServiceEditor as render,
  settle,
} from '../../testing/service-editor.harness';

describe('ServiceEditor', () => {
  installServiceEditorTestHooks();

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
      expect(after[1]?.image.ar.imageUrl).toBe(before[1]?.image.ar.imageUrl);
      expect(after[1]?.image.ar.imageName).toBe(before[1]?.image.ar.imageName);
      expect(after[0]).toEqual(before[0]);
      expect(after[2]).toEqual(before[2]);
      expect(after.map((item) => item.id)).toEqual(before.map((item) => item.id));
    });

    it('keeps why and feature images independent per locale tab', async () => {
      const { editor } = await render('create');

      editor.useLocale('ar');
      editor.setWhyImage({ name: 'ar-why.png', url: 'blob:why-ar' });
      editor.setPointImage('features', 0, { name: 'ar-feat.png', url: 'blob:feat-ar' });

      editor.useLocale('en');
      expect(editor.draft().whyImage.image.en.imageUrl).toBe('');
      expect(editor.draft().features[0]?.image.en.imageUrl).toBe('');

      editor.setWhyImage({ name: 'en-why.png', url: 'blob:why-en' });
      editor.setPointImage('features', 0, { name: 'en-feat.png', url: 'blob:feat-en' });

      expect(editor.draft().whyImage.image.ar).toMatchObject({
        imageName: 'ar-why.png',
        imageUrl: 'blob:why-ar',
      });
      expect(editor.draft().whyImage.image.en).toMatchObject({
        imageName: 'en-why.png',
        imageUrl: 'blob:why-en',
      });
      expect(editor.draft().features[0]?.image.ar).toMatchObject({
        imageName: 'ar-feat.png',
        imageUrl: 'blob:feat-ar',
      });
      expect(editor.draft().features[0]?.image.en).toMatchObject({
        imageName: 'en-feat.png',
        imageUrl: 'blob:feat-en',
      });

      editor.useLocale('ar');
      editor.clearWhyImage();
      expect(editor.draft().whyImage.image.ar.imageUrl).toBe('');
      expect(editor.draft().whyImage.image.en.imageUrl).toBe('blob:why-en');
    });

    it('sets and clears images on one item only', async () => {
      const { editor } = await render('edit', 'web-development');
      const before = editor.draft();
      editor.setPointImage('features', 0, { name: 'new.png', url: 'blob:new' });
      expect(editor.draft().features[0]?.image.ar).toMatchObject({
        imageName: 'new.png',
        imageUrl: 'blob:new',
      });
      expect(editor.draft().features[0]?.image.en.imageUrl).toBe('');
      expect(editor.draft().features[1]).toEqual(before.features[1]);
      editor.clearPointImage('features', 0);
      expect(editor.draft().features[0]?.image.ar).toMatchObject({ imageName: '', imageUrl: '' });
      expect(editor.draft().features[0]?.title).toEqual(before.features[0]?.title);

      editor.setSectorImage(1, { name: 's.png', url: 'blob:s' });
      expect(editor.draft().sectors[1]?.image.ar).toMatchObject({
        imageName: 's.png',
        imageUrl: 'blob:s',
      });
      expect(editor.draft().sectors[1]?.image.en).toEqual(before.sectors[1]?.image.en);
      expect(editor.draft().sectors[0]).toEqual(before.sectors[0]);
      editor.clearSectorImage(1);
      expect(editor.draft().sectors[1]?.image.ar).toMatchObject({ imageName: '', imageUrl: '' });

      editor.useLocale('ar');
      editor.setSectorImage(0, { name: 'ar.png', url: 'blob:ar' });
      editor.useLocale('en');
      editor.setSectorImage(0, { name: 'en.png', url: 'blob:en' });
      expect(editor.draft().sectors[0]?.image.ar).toMatchObject({
        imageName: 'ar.png',
        imageUrl: 'blob:ar',
      });
      expect(editor.draft().sectors[0]?.image.en).toMatchObject({
        imageName: 'en.png',
        imageUrl: 'blob:en',
      });
      editor.clearSectorImage(0);
      expect(editor.draft().sectors[0]?.image.en).toMatchObject({ imageName: '', imageUrl: '' });
      expect(editor.draft().sectors[0]?.image.ar).toMatchObject({
        imageName: 'ar.png',
        imageUrl: 'blob:ar',
      });

      editor.useLocale('ar');
      editor.clearWhyIcon(0);
      expect(editor.draft().whyItems[0]?.image.ar).toMatchObject({ imageName: '', imageUrl: '' });
      expect(editor.draft().whyItems[0]?.title).toEqual(before.whyItems[0]?.title);
      expect(editor.draft().whyItems[1]).toEqual(before.whyItems[1]);
      editor.clearWhyImage();
      expect(editor.draft().whyImage.image.ar.imageUrl).toBe('');
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
});
