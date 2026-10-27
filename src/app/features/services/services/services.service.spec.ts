import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { ProductsService } from '../../products/services/products.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { blankService, localeText } from '../models/service.model';
import { SERVICES_SEED } from './services.mock';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: API_LATENCY_MS, useValue: 0 }],
    });
    return TestBed.inject(ServicesService);
  }

  it('lists the six seeded services in seed order', async () => {
    const api = setup();
    const items = await firstValueFrom(api.list());
    expect(items.map((item) => item.id)).toEqual(SERVICES_SEED.map((item) => item.id));
    expect(items).toHaveLength(6);
  });

  it('gets a service by id and returns null for a missing id', async () => {
    const api = setup();
    const item = await firstValueFrom(api.get('web-development'));
    expect(item?.name.ar).toBe('تطوير المواقع الإلكترونية');
    expect(item?.icon).toBe('pi-globe');
    expect(await firstValueFrom(api.get('missing-service'))).toBeNull();
  });

  it('creates a new service exactly once with a generated id', async () => {
    const api = setup();
    const created = await firstValueFrom(
      api.save({
        ...blankService(),
        name: localeText('خدمة جديدة', 'New service'),
        published: false,
      }),
    );
    expect(created.id).toMatch(/^svc-/);
    const items = await firstValueFrom(api.list());
    expect(items).toHaveLength(7);
    expect(items.filter((item) => item.id === created.id)).toHaveLength(1);
    expect(items[0]?.id).toBe(created.id);
  });

  it('gives two creates in the same millisecond different ids', async () => {
    const api = setup();
    const first = await firstValueFrom(api.save(blankService()));
    const second = await firstValueFrom(api.save(blankService()));
    expect(second.id).not.toBe(first.id);
    expect(await firstValueFrom(api.list())).toHaveLength(8);
  });

  it('updates an existing service in place without duplicating it', async () => {
    const api = setup();
    const before = await firstValueFrom(api.list());
    const target = await firstValueFrom(api.get('mobile-apps'));
    if (!target) {
      throw new Error('seed missing');
    }
    await firstValueFrom(api.save({ ...target, name: localeText('اسم محدث', 'Updated name') }));
    const after = await firstValueFrom(api.list());
    expect(after).toHaveLength(before.length);
    expect(after.map((item) => item.id)).toEqual(before.map((item) => item.id));
    expect(after.find((item) => item.id === 'mobile-apps')?.name.en).toBe('Updated name');
  });

  it('removes a service', async () => {
    const api = setup();
    await firstValueFrom(api.remove('cloud-devops'));
    expect(await firstValueFrom(api.get('cloud-devops'))).toBeNull();
    expect(await firstValueFrom(api.list())).toHaveLength(5);
  });

  it('toggles publication and ignores an unknown id', async () => {
    const api = setup();
    expect((await firstValueFrom(api.get('web-development')))?.published).toBe(true);
    api.setPublished('web-development', false);
    expect((await firstValueFrom(api.get('web-development')))?.published).toBe(false);
    api.setPublished('web-development', true);
    expect((await firstValueFrom(api.get('web-development')))?.published).toBe(true);
    api.setPublished('missing-service', false);
    expect(await firstValueFrom(api.list())).toHaveLength(6);
  });

  it('reflects a publication change in list() and get() without touching other records', async () => {
    const api = setup();
    const before = await firstValueFrom(api.list());
    api.setPublished('data-analytics', true);
    const after = await firstValueFrom(api.list());
    expect(after.find((item) => item.id === 'data-analytics')?.published).toBe(true);
    expect((await firstValueFrom(api.get('data-analytics')))?.published).toBe(true);
    expect(after.map((item) => item.id)).toEqual(before.map((item) => item.id));
    for (const item of after.filter((entry) => entry.id !== 'data-analytics')) {
      expect(item).toEqual(before.find((entry) => entry.id === item.id));
    }
  });

  it('never overwrites an existing record when a generated id would collide', async () => {
    const api = setup();
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    try {
      const existing = await firstValueFrom(
        api.save({ ...blankService(), id: 'svc-1000', name: localeText('قائم', 'Existing') }),
      );
      const created = await firstValueFrom(
        api.save({ ...blankService(), name: localeText('جديد', 'Created') }),
      );
      expect(existing.id).toBe('svc-1000');
      expect(created.id).toBe('svc-1001');
      const items = await firstValueFrom(api.list());
      expect(items).toHaveLength(8);
      expect(items.find((item) => item.id === 'svc-1000')?.name.en).toBe('Existing');
      expect(items.find((item) => item.id === 'svc-1001')?.name.en).toBe('Created');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('clones nested arrays and objects on the way in and out', async () => {
    const api = setup();
    const draft = blankService();
    draft.solutions[0]!.title.ar = 'حل';
    const saved = await firstValueFrom(api.save(draft));
    draft.solutions[0]!.title.ar = 'تعديل بعد الحفظ';
    draft.solutions.push(draft.solutions[0]!);
    saved.whyImage.title.en = 'mutated';
    saved.whyItems[0]!.title.en = 'mutated';
    const stored = await firstValueFrom(api.get(saved.id));
    expect(stored?.solutions).toHaveLength(1);
    expect(stored?.solutions[0]?.title.ar).toBe('حل');
    expect(stored?.whyImage.title.en).toBe('');
    expect(stored?.whyItems[0]?.title.en).toBe('');
  });

  it('does not let callers mutate internal state through returned values', async () => {
    const api = setup();
    const listed = await firstValueFrom(api.list());
    listed[0]!.name.ar = 'تغيير خارجي';
    listed[0]!.projectIds.push('hacked');
    listed.pop();
    const fetched = await firstValueFrom(api.get('web-development'));
    fetched!.faqs.length = 0;

    const fresh = await firstValueFrom(api.list());
    expect(fresh).toHaveLength(6);
    expect(fresh[0]?.name.ar).toBe('تطوير المواقع الإلكترونية');
    expect(fresh[0]?.projectIds).not.toContain('hacked');
    expect(fresh[0]?.faqs.length).toBeGreaterThan(0);

    const input = blankService();
    const saved = await firstValueFrom(api.save(input));
    input.name.ar = 'بعد الحفظ';
    saved.name.en = 'after save';
    const stored = await firstValueFrom(api.get(saved.id));
    expect(stored?.name).toEqual({ ar: '', en: '' });
  });

  it('keeps its state independent from products and projects', async () => {
    const api = setup();
    const projects = TestBed.inject(ProjectsService);
    const products = TestBed.inject(ProductsService);
    const projectsBefore = await firstValueFrom(projects.list());
    const productsBefore = await firstValueFrom(products.list());
    await firstValueFrom(api.remove('web-development'));
    await firstValueFrom(api.save(blankService()));
    expect(await firstValueFrom(projects.list())).toEqual(projectsBefore);
    expect(await firstValueFrom(products.list())).toEqual(productsBefore);
  });
});
