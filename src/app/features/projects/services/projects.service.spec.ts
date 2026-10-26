import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { blankProject, localeText } from '../models/project.model';
import { PROJECTS_SEED } from './projects.mock';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: API_LATENCY_MS, useValue: 0 }],
    });
    return TestBed.inject(ProjectsService);
  }

  it('seeds six distinct projects with stable ids', async () => {
    const api = setup();
    const items = await firstValueFrom(api.list());
    const ids = items.map((item) => item.id);
    expect(items).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    expect(ids).toEqual(PROJECTS_SEED.map((item) => item.id));
    expect(new Set(items.map((item) => item.name.ar)).size).toBe(6);
  });

  it('loads a seeded project by id without mutating products state', async () => {
    const api = setup();
    const item = await firstValueFrom(api.get('wasly'));
    expect(item?.name.ar).toContain('وصلني');
    expect(item?.categories.length).toBeGreaterThan(0);
    expect(item?.gallery.length).toBeGreaterThan(0);
    expect(item?.identityButtons).toHaveLength(1);
    expect(item?.identityButtons[0]?.images).toHaveLength(4);
    expect(item?.identityButtons[0]?.title.ar).toBe('الهوية البصرية');
  });

  it('keeps identityButtons on every seeded project', async () => {
    const api = setup();
    const items = await firstValueFrom(api.list());
    for (const item of items) {
      expect(item.identityButtons.length).toBeGreaterThan(0);
      expect(item.identityButtons.every((button) => button.images.length === 4)).toBe(true);
    }
  });

  it('returns null for a missing project id', async () => {
    const api = setup();
    expect(await firstValueFrom(api.get('missing-project'))).toBeNull();
  });

  it('saves a new project and updates publication', async () => {
    const api = setup();
    const created = await firstValueFrom(
      api.save({
        ...blankProject(),
        name: localeText('مشروع جديد', 'New project'),
        published: false,
      }),
    );
    expect(created.id).toMatch(/^prj-/);
    api.setPublished(created.id, true);
    expect((await firstValueFrom(api.get(created.id)))?.published).toBe(true);
  });

  it('removes a project from the catalog', async () => {
    const api = setup();
    await firstValueFrom(api.remove('wasly'));
    expect(await firstValueFrom(api.get('wasly'))).toBeNull();
    expect((await firstValueFrom(api.list())).some((item) => item.id === 'wasly')).toBe(false);
  });

  it('toggles catalog visibility independently of product records', () => {
    const api = setup();
    expect(api.catalogVisible()).toBe(true);
    api.toggleCatalog();
    expect(api.catalogVisible()).toBe(false);
  });
});
