import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { blankArticle } from '../models/knowledge.model';
import { CategoryInUseError, KnowledgeService } from './knowledge.service';

describe('KnowledgeService', () => {
  function setup(): KnowledgeService {
    TestBed.configureTestingModule({
      providers: [{ provide: API_LATENCY_MS, useValue: 0 }],
    });
    return TestBed.inject(KnowledgeService);
  }

  it('seeds 15 articles across all three statuses and 6 categories', async () => {
    const api = setup();
    const articles = await firstValueFrom(api.list());
    expect(articles).toHaveLength(15);
    expect(new Set(articles.map((item) => item.status))).toEqual(
      new Set(['published', 'draft', 'unpublished']),
    );
    expect(new Set(articles.map((item) => item.id)).size).toBe(15);
    expect(await firstValueFrom(api.listCategories())).toHaveLength(6);
  });

  it('creates, features, re-statuses and deletes an article', async () => {
    const api = setup();
    const created = await firstValueFrom(
      api.create({ ...blankArticle(), titleAr: 'جديد', categoryId: '710001' }),
    );
    expect(created.status).toBe('draft');
    expect((await firstValueFrom(api.setFeatured(created.id, true))).featured).toBe(true);
    expect((await firstValueFrom(api.setStatus(created.id, 'published'))).status).toBe('published');
    await firstValueFrom(api.remove(created.id));
    expect(await firstValueFrom(api.get(created.id))).toBeNull();
  });

  it('counts articles per category and refuses to delete a used category', async () => {
    const api = setup();
    const categories = await firstValueFrom(api.listCategories());
    const used = categories.find((item) => item.articleCount > 0);
    expect(used).toBeDefined();
    await expect(firstValueFrom(api.removeCategory(used!.id))).rejects.toBeInstanceOf(
      CategoryInUseError,
    );
    const empty = await firstValueFrom(
      api.createCategory({ nameAr: 'فارغ', nameEn: 'Empty', published: true }),
    );
    expect(empty.articleCount).toBe(0);
    await firstValueFrom(api.removeCategory(empty.id));
  });
});
