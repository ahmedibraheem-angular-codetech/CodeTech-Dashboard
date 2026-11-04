import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ServicesService } from '../../services/services.service';
import {
  headerButton,
  installServiceEditorTestHooks,
  lastFileInput,
  pickFile,
  renderServiceEditor as render,
  settle,
} from '../../testing/service-editor.harness';

describe('ServiceEditor', () => {
  installServiceEditorTestHooks();

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
      const url = editor.draft().whyImage.image.ar.imageUrl;
      expect(url).toBe('blob:service/1');

      editor.select(1);
      await settle(fixture);
      expect(root.querySelector('app-service-why-step')).toBeNull();
      editor.select(0);
      await settle(fixture);

      expect(revoke).not.toHaveBeenCalled();
      expect(editor.draft().whyImage.image.ar.imageUrl).toBe(url);
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
      expect(editor.draft().whyImage.image.ar.imageUrl).toBe('');
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
      expect(editor.draft().whyImage.image.ar.imageUrl).toBe('blob:service/2');
    });

    it('revokes a newly selected unsaved image when the editor is closed', async () => {
      const { fixture, editor, root } = await render('edit', 'web-development');
      pickFile(lastFileInput(root), 'why.png');
      await settle(fixture);
      const url = editor.draft().whyImage.image.ar.imageUrl;
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
      const saved = (await firstValueFrom(api.get('web-development')))?.whyImage.image.ar.imageUrl;
      fixture.destroy();
      expect(revoke).not.toHaveBeenCalled();
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.image.ar.imageUrl).toBe(
        saved,
      );
    });

    it('does not break a saved image when an unsaved edit replaces or clears it', async () => {
      const { fixture, editor, root } = await render('edit', 'web-development');
      const api = TestBed.inject(ServicesService);

      pickFile(lastFileInput(root), 'saved.png');
      await settle(fixture);
      headerButton(root, 'حفظ كمسودة')?.click();
      await settle(fixture);
      const saved = editor.draft().whyImage.image.ar.imageUrl;
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.image.ar.imageUrl).toBe(
        saved,
      );

      pickFile(lastFileInput(root), 'unsaved.png');
      await settle(fixture);
      expect(revoke).not.toHaveBeenCalled();
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.image.ar.imageUrl).toBe(
        saved,
      );

      lastFileInput(root)
        .closest('app-product-upload')
        ?.querySelector<HTMLButtonElement>('.uploader__clear')
        ?.click();
      await settle(fixture);
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:service/2');
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.image.ar.imageUrl).toBe(
        saved,
      );
      expect(editor.draft().whyImage.image.ar.imageUrl).toBe('');
    });

    it('revokes the previous image once a later save no longer uses it, and keeps the new one after close', async () => {
      const { fixture, root } = await render('edit', 'web-development');
      const api = TestBed.inject(ServicesService);

      pickFile(lastFileInput(root), 'first.png');
      await settle(fixture);
      headerButton(root, 'حفظ كمسودة')?.click();
      await settle(fixture);
      const first = (await firstValueFrom(api.get('web-development')))?.whyImage.image.ar.imageUrl;

      pickFile(lastFileInput(root), 'second.png');
      await settle(fixture);
      headerButton(root, 'حفظ كمسودة')?.click();
      await settle(fixture);

      expect(revoke).toHaveBeenCalledWith(first);
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.image.ar.imageUrl).toBe(
        'blob:service/2',
      );

      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);
      expect((await firstValueFrom(api.get('web-development')))?.whyImage.image.ar.imageUrl).toBe(
        'blob:service/2',
      );
    });
  });
});
