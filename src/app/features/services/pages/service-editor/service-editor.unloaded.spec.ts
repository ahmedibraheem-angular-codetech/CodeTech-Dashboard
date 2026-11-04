import { TestBed } from '@angular/core/testing';
import { NEVER, firstValueFrom, of, throwError } from 'rxjs';

import { type Service } from '../../models/service.model';
import { ServicesService } from '../../services/services.service';
import {
  headerButton,
  installServiceEditorTestHooks,
  renderServiceEditor as render,
} from '../../testing/service-editor.harness';

describe('ServiceEditor', () => {
  installServiceEditorTestHooks();

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

});
