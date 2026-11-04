import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SERVICE_STEPS, type Service } from '../../models/service.model';
import { ProjectsService } from '../../../projects/services/projects.service';
import { ServicesService } from '../../services/services.service';
import {
  inputEvent,
  installServiceEditorTestHooks,
  projectNamed,
  renderServiceEditor as render,
  seedService as seed,
  settle,
} from '../../testing/service-editor.harness';

describe('ServiceEditor', () => {
  installServiceEditorTestHooks();

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

  describe('regression review: related project ids', () => {
    const stale = (): Service => ({
      ...seed('web-development'),
      projectIds: ['wasly', 'deleted-project'],
    });

    // Empty/error/loading prune rules are covered by `service-editor-persist` /
    // `service-editor-projects` and the earlier `related projects` describe
    // (`drops references…`, `keeps every reference when the project list cannot be loaded`).

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
});
