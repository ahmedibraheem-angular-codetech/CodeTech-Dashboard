import { describe, expect, it } from 'vitest';

import { PROJECTS_SEED } from '../../projects/services/projects.mock';
import {
  blankService,
  serviceFaq,
  servicePoint,
  serviceSector,
  serviceWhyItem,
  type ServiceImage,
} from '../models/service.model';
import { SERVICES_SEED } from './services.mock';

describe('SERVICES_SEED', () => {
  it('holds exactly six services with unique ids and names', () => {
    expect(SERVICES_SEED).toHaveLength(6);
    expect(new Set(SERVICES_SEED.map((item) => item.id)).size).toBe(6);
    expect(new Set(SERVICES_SEED.map((item) => item.name.en)).size).toBe(6);
    expect(SERVICES_SEED.every((item) => item.id !== '')).toBe(true);
  });

  it('provides Arabic and English copy for every localized field', () => {
    for (const item of SERVICES_SEED) {
      const texts = [
        item.name,
        item.description,
        item.whyImage.title,
        ...item.whyItems.map((entry) => entry.title),
        ...[...item.solutions, ...item.stages, ...item.features].flatMap((entry) => [
          entry.title,
          entry.body,
        ]),
        ...item.faqs.flatMap((entry) => [entry.question, entry.answer]),
      ];
      for (const text of texts) {
        expect(text.ar, item.id).not.toBe('');
        expect(text.en, item.id).not.toBe('');
      }
    }
  });

  it('gives each service its own library icon, separate from images', () => {
    const icons = SERVICES_SEED.map((item) => item.icon);
    expect(icons.every((icon) => /^pi-[a-z-]+$/.test(icon))).toBe(true);
    expect(new Set(icons).size).toBe(6);
  });

  it('populates all seven sections', () => {
    for (const item of SERVICES_SEED) {
      expect(item.whyImage.imageUrl, item.id).not.toBe('');
      expect(item.whyItems.length, item.id).toBeGreaterThan(0);
      expect(item.solutions.length, item.id).toBeGreaterThan(0);
      expect(item.stages.length, item.id).toBeGreaterThan(0);
      expect(item.features.length, item.id).toBeGreaterThan(0);
      expect(item.projectIds.length, item.id).toBeGreaterThan(0);
      expect(item.sectors.length, item.id).toBeGreaterThan(0);
      expect(item.faqs.length, item.id).toBeGreaterThan(0);
    }
  });

  it('references only existing projects by id', () => {
    const known = new Set(PROJECTS_SEED.map((project) => project.id));
    for (const item of SERVICES_SEED) {
      expect(new Set(item.projectIds).size, item.id).toBe(item.projectIds.length);
      for (const projectId of item.projectIds) {
        expect(known.has(projectId), `${item.id} -> ${projectId}`).toBe(true);
      }
    }
  });

  it('never reuses a seeded item id when new items are created afterwards', () => {
    const seeded = new Set(
      SERVICES_SEED.flatMap((item) => [
        ...item.whyItems,
        ...item.solutions,
        ...item.stages,
        ...item.features,
        ...item.sectors,
        ...item.faqs,
      ]).map((entry) => entry.id),
    );
    const created: string[] = [];
    for (let round = 0; round < 50; round += 1) {
      const blank = blankService();
      created.push(
        ...[
          ...blank.whyItems,
          ...blank.solutions,
          ...blank.stages,
          ...blank.features,
          ...blank.sectors,
          ...blank.faqs,
          serviceWhyItem(),
          servicePoint(),
          serviceSector(),
          serviceFaq(),
        ].map((entry) => entry.id),
      );
    }
    expect(new Set(created).size).toBe(created.length);
    expect(created.filter((id) => seeded.has(id))).toEqual([]);
  });

  it('uses only library icons or shipped local images, and unique item ids', () => {
    const images: ServiceImage[] = SERVICES_SEED.flatMap((item) => [
      item.whyImage,
      ...item.whyItems,
      ...item.solutions,
      ...item.stages,
      ...item.features,
      ...item.sectors,
    ]);
    for (const image of images) {
      expect(image.imageUrl.startsWith('icon:') || image.imageUrl.startsWith('/images/')).toBe(
        true,
      );
    }
    const ids = SERVICES_SEED.flatMap((item) => [
      ...item.whyItems,
      ...item.solutions,
      ...item.stages,
      ...item.features,
      ...item.sectors,
      ...item.faqs,
    ]).map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
