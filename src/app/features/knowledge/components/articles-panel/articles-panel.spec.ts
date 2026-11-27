import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageService } from '../../../../core/services/language.service';
import { blankArticle, type Article, type ArticleStatus } from '../../models/knowledge.model';
import { ArticlesPanel } from './articles-panel';

describe('ArticlesPanel statistics cards', () => {
  function article(id: string, status: ArticleStatus): Article {
    return {
      ...blankArticle(),
      id,
      code: `ART-${id.padStart(4, '0')}`,
      categoryNameAr: '',
      categoryNameEn: '',
      authorPhoto: { ar: null, en: null },
      thumbnail: { ar: null, en: null },
      cover: { ar: null, en: null },
      status,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
  }

  function setup(articles: readonly Article[] = []): ComponentFixture<ArticlesPanel> {
    TestBed.configureTestingModule({
      imports: [ArticlesPanel],
      providers: [
        {
          provide: LanguageService,
          useValue: {
            language: signal('ar' as const),
            t: (key: string) => key,
            lookup: (key: string) => key,
            set: () => undefined,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ArticlesPanel);
    fixture.componentRef.setInput('articles', articles);
    fixture.componentRef.setInput('categories', []);
    fixture.detectChanges();
    return fixture;
  }

  it('keeps the edited article on its page and marks that row', () => {
    const articles = Array.from({ length: 12 }, (_, index) =>
      article(String(index + 1), 'published'),
    );
    const fixture = setup(articles);
    fixture.componentRef.setInput('highlightedId', '12');
    fixture.detectChanges();

    const panel = fixture.componentInstance;
    expect(panel.first()).toBe(10);
    expect(panel.rows().map((row) => row.id)).toContain('12');
    expect(
      fixture.nativeElement.querySelector('[data-highlight-row="12"]'),
    ).not.toBeNull();
  });

  it('shows zeros for every card when the article list is empty', () => {
    const cards = setup([]).componentInstance.cards();
    expect(cards.map((card) => card.id)).toEqual(['total', 'published', 'draft', 'unpublished']);
    expect(cards.map((card) => card.value)).toEqual(['0', '0', '0', '0']);
  });

  it('counts total and each status from the current articles input', () => {
    const cards = setup([
      article('1', 'published'),
      article('2', 'published'),
      article('3', 'draft'),
      article('4', 'unpublished'),
      article('5', 'draft'),
      article('6', 'draft'),
    ]).componentInstance.cards();

    expect(cards.find((card) => card.id === 'total')?.value).toBe('6');
    expect(cards.find((card) => card.id === 'published')?.value).toBe('2');
    expect(cards.find((card) => card.id === 'draft')?.value).toBe('3');
    expect(cards.find((card) => card.id === 'unpublished')?.value).toBe('1');
  });

  it('keeps translation keys, caption, icons, colors and trend for the four cards', () => {
    const [total, published, draft, unpublished] = setup([
      article('1', 'published'),
    ]).componentInstance.cards();

    expect(total).toMatchObject({
      id: 'total',
      title: 'knowledge.stat.total',
      icon: 'pi pi-file',
      iconColor: '#e11d48',
      iconBackground: '#ffe4e6',
      trend: undefined,
      caption: '',
    });
    expect(published).toMatchObject({
      id: 'published',
      title: 'knowledge.stat.published',
      icon: 'pi pi-check-circle',
      iconColor: '#f59e0b',
      iconBackground: '#ffedd5',
    });
    expect(draft).toMatchObject({
      id: 'draft',
      title: 'knowledge.stat.draft',
      icon: 'pi pi-file-edit',
      iconColor: '#3b82f6',
      iconBackground: '#dbeafe',
    });
    expect(unpublished).toMatchObject({
      id: 'unpublished',
      title: 'knowledge.stat.unpublished',
      icon: 'pi pi-eye-slash',
      iconColor: '#16a34a',
      iconBackground: '#dcfce7',
    });
  });

  it('shows the API change percentage and caption only when the API provides one', () => {
    const fixture = setup([article('1', 'published')]);
    fixture.componentRef.setInput('stats', {
      total: 12,
      published: 7,
      featured: 3,
      unpublished: 4,
      totalChangePct: -5,
      publishedChangePct: null,
      featuredChangePct: null,
      unpublishedChangePct: null,
    });
    fixture.detectChanges();
    const cards = fixture.componentInstance.cards();
    expect(cards.find((c) => c.id === 'total')).toMatchObject({
      value: '12',
      trend: -5,
      caption: 'knowledge.compared',
    });
    expect(cards.find((c) => c.id === 'published')).toMatchObject({
      trend: undefined,
      caption: '',
    });
    expect(cards.find((c) => c.id === 'draft')).toMatchObject({ trend: undefined, caption: '' });
  });

  it('recomputes card values when the articles input changes', () => {
    const fixture = setup([article('1', 'draft')]);
    expect(fixture.componentInstance.cards().map((card) => card.value)).toEqual([
      '1',
      '0',
      '1',
      '0',
    ]);

    fixture.componentRef.setInput('articles', [
      article('1', 'draft'),
      article('2', 'published'),
      article('3', 'unpublished'),
      article('4', 'unpublished'),
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.cards().map((card) => card.value)).toEqual([
      '4',
      '1',
      '1',
      '2',
    ]);
  });
});
