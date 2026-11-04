import {
  installServiceEditorTestHooks,
  renderServiceEditor as render,
  settle,
  switchLocale,
} from '../../testing/service-editor.harness';

describe('ServiceEditor', () => {
  installServiceEditorTestHooks();

  describe('localization and layout', () => {
    it('renders Arabic copy in RTL and English copy in LTR', async () => {
      const { fixture, editor, root } = await render('create');
      const panel = () => root.querySelector('.editor-card');
      expect(panel()?.getAttribute('dir')).toBe('rtl');
      expect(root.textContent).toContain('بيانات الخدمة');

      switchLocale(root, 'English');
      fixture.detectChanges();
      expect(editor.locale()).toBe('en');
      expect(panel()?.getAttribute('dir')).toBe('ltr');
      expect(root.textContent).toContain('Service details');
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
      expect(root.textContent).not.toContain('رفع الايقونة');
      expect(root.querySelector('app-product-upload')).not.toBeNull();
      expect(root.querySelectorAll('.uploader__action').length).toBeGreaterThanOrEqual(2);

      // Icon refs open the library panel; switch to upload to assert seeded icon previews.
      for (const upload of root.querySelectorAll('app-product-upload')) {
        const tabs = [...upload.querySelectorAll('.uploader__action')] as HTMLButtonElement[];
        tabs[0]?.click();
      }
      fixture.detectChanges();
      await settle(fixture);

      expect(
        root.querySelectorAll('app-product-upload img.icon-library__img--preview').length,
      ).toBe(2);
      expect(
        editor.draft().solutions.filter((item) => item.image.ar.imageUrl.startsWith('icon:'))
          .length,
      ).toBe(2);
    });
  });
});
