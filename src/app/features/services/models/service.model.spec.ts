import { describe, expect, it } from 'vitest';

import {
  SERVICE_STEPS,
  blankService,
  localeText,
  readLocale,
  serviceFaq,
  servicePoint,
  serviceSector,
  serviceWhyItem,
} from './service.model';

describe('service.model', () => {
  it('exposes seven editor steps in the Figma order, without SEO', () => {
    expect(SERVICE_STEPS.map((step) => step.id)).toEqual([
      'why',
      'solutions',
      'stages',
      'features',
      'projects',
      'sectors',
      'faq',
    ]);
    expect(SERVICE_STEPS.every((step) => step.labelKey.startsWith('service.step.'))).toBe(true);
  });

  it('builds a blank service with the expected defaults', () => {
    const service = blankService();
    expect(service.id).toBe('');
    expect(service.icon).toBe('');
    expect(service.published).toBe(true);
    expect(service.name).toEqual({ ar: '', en: '' });
    expect(service.description).toEqual({ ar: '', en: '' });
    expect(service.whyImage).toEqual({ title: { ar: '', en: '' }, imageName: '', imageUrl: '' });
    expect(service.projectIds).toEqual([]);
    expect(Object.keys(service).sort()).toEqual(
      [
        'description',
        'faqs',
        'features',
        'icon',
        'id',
        'name',
        'projectIds',
        'published',
        'sectors',
        'solutions',
        'stages',
        'whyImage',
        'whyItems',
      ].sort(),
    );
  });

  it('starts each repeatable section with exactly one blank item', () => {
    const service = blankService();
    expect(service.whyItems).toHaveLength(1);
    expect(service.solutions).toHaveLength(1);
    expect(service.stages).toHaveLength(1);
    expect(service.features).toHaveLength(1);
    expect(service.sectors).toHaveLength(1);
    expect(service.faqs).toHaveLength(1);
    expect(service.whyItems[0]).toMatchObject({ title: { ar: '', en: '' }, imageUrl: '' });
    expect(service.whyItems[0]).not.toHaveProperty('body');
    expect(service.solutions[0]).toMatchObject({ body: { ar: '', en: '' }, imageUrl: '' });
    expect(service.sectors[0]).toMatchObject({ imageName: '', imageUrl: '' });
    expect(service.faqs[0]).toMatchObject({ question: { ar: '', en: '' } });
  });

  it('returns independent nested objects and arrays on every call', () => {
    const first = blankService();
    const second = blankService();
    expect(first).toEqual({
      ...second,
      whyItems: first.whyItems,
      solutions: first.solutions,
      stages: first.stages,
      features: first.features,
      sectors: first.sectors,
      faqs: first.faqs,
    });
    expect(first.name).not.toBe(second.name);
    expect(first.whyImage).not.toBe(second.whyImage);
    expect(first.whyImage.title).not.toBe(second.whyImage.title);
    expect(first.projectIds).not.toBe(second.projectIds);
    expect(first.whyItems).not.toBe(second.whyItems);
    expect(first.solutions[0]).not.toBe(second.solutions[0]);
    expect(first.solutions[0]?.title).not.toBe(second.solutions[0]?.title);
    first.name.ar = 'تغيير';
    first.projectIds.push('x');
    expect(second.name.ar).toBe('');
    expect(second.projectIds).toEqual([]);
  });

  it('gives every repeated item a unique stable id', () => {
    const ids = [
      ...blankService().whyItems,
      ...blankService().solutions,
      ...blankService().stages,
      ...blankService().features,
      ...blankService().sectors,
      ...blankService().faqs,
      serviceWhyItem(),
      servicePoint(),
      serviceSector(),
      serviceFaq(),
    ].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id !== '')).toBe(true);
  });

  it('reads localized text per language', () => {
    const value = localeText('اسم', 'Name');
    expect(readLocale(value, 'ar')).toBe('اسم');
    expect(readLocale(value, 'en')).toBe('Name');
  });
});
