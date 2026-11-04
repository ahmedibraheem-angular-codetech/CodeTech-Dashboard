import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { localeText, type Service } from '../../models/service.model';
import { ServicesService } from '../../services/services.service';
import {
  clickNext,
  enterName,
  fillEveryStep,
  headerButton,
  inputEvent,
  installServiceEditorTestHooks,
  renderServiceEditor as render,
  seedService as seed,
  settle,
  switchLocale,
} from '../../testing/service-editor.harness';

describe('ServiceEditor', () => {
  installServiceEditorTestHooks();

  describe('regression review: publication state', () => {
    const stored = async (id: string) => firstValueFrom(TestBed.inject(ServicesService).get(id));

    // Removed duplicate cases already covered by edit describe
    // (`preserves … published`, `publishes and unpublishes from the header`)
    // and by `service-editor-persist` publication readiness.

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
});
