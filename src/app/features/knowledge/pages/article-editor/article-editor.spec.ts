import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../../../core/http/api-error';
import { MediaService } from '../../../../core/media/media.service';
import { LanguageService } from '../../../../core/services/language.service';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import { flushUi } from '../../../../../testing/flush-ui';
import { blankArticle, type Article, type ArticleCategory } from '../../models/knowledge.model';
import { KnowledgeActions } from '../../services/knowledge-actions.service';
import { KnowledgeService } from '../../services/knowledge.service';
import { ArticleEditor } from './article-editor';

const CATEGORY: ArticleCategory = {
  id: 'cat-1',
  nameAr: 'تصنيف',
  nameEn: 'Category',
  order: 1,
  published: true,
  articleCount: 1,
  createdAt: '2026-01-01T00:00:00.000000Z',
};

function article(id: string): Article {
  return {
    id,
    code: 'ART-1',
    ...blankArticle(),
    titleAr: 'عنوان',
    titleEn: 'Title',
    categoryId: CATEGORY.id,
    categoryNameAr: CATEGORY.nameAr,
    categoryNameEn: CATEGORY.nameEn,
    authorPhoto: { ar: null, en: null },
    thumbnail: { ar: null, en: null },
    cover: { ar: null, en: null },
    createdAt: '2026-01-01T00:00:00.000000Z',
    updatedAt: '2026-01-01T00:00:00.000000Z',
  };
}

describe('ArticleEditor', () => {
  async function render(mode: 'create' | 'edit', id = '', api: Partial<KnowledgeService> = {}) {
    TestBed.configureTestingModule({
      imports: [ArticleEditor],
      providers: [
        MessageService,
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { mode } } },
        },
        {
          provide: KnowledgeService,
          useValue: {
            listCategories: () => of([CATEGORY]),
            get: () => of(article('9')),
            create: (draft: unknown) => of({ ...article('new'), ...(draft as object) }),
            update: (_id: string, draft: unknown) => of({ ...article('9'), ...(draft as object) }),
            ...api,
          },
        },
        {
          provide: MediaService,
          useValue: { upload: () => of(null), uploadEditorImage: () => of(null) },
        },
        { provide: KnowledgeActions, useValue: {} },
        {
          provide: NetworkStatusService,
          useValue: { online: signal(true) },
        },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const fixture = TestBed.createComponent(ArticleEditor);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    await flushUi(fixture);
    return fixture;
  }

  it('opens create mode ready with category options loaded', async () => {
    const fixture = await render('create');
    const editor = fixture.componentInstance;
    expect(editor.status()).toBe('ready');
    expect(editor.mode).toBe('create');
    expect(editor.categories()).toEqual([CATEGORY]);
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('loads an article into the form on edit', async () => {
    const fixture = await render('edit', '9');
    const editor = fixture.componentInstance;
    expect(editor.status()).toBe('ready');
    expect(editor.form.controls.titleAr.value).toBe('عنوان');
    expect(editor.form.controls.titleEn.value).toBe('Title');
    expect(editor.form.controls.categoryId.value).toBe('cat-1');
  });

  it('shows missing when the article id is unknown', async () => {
    const fixture = await render('edit', '404', { get: () => of(null) });
    expect(fixture.componentInstance.status()).toBe('missing');
  });

  it('shows error with online network when load fails', async () => {
    const fixture = await render('edit', '9', {
      get: () => throwError(() => new Error('boom')),
    });
    expect(fixture.componentInstance.status()).toBe('error');
  });

  it('blocks save and shows a field error for an invalid slug, then saves once it is fixed', async () => {
    const update = vi.fn((_id: string, draft: unknown) =>
      of({ ...article('9'), ...(draft as object) }),
    );
    const fixture = await render('edit', '9', { update });
    const editor = fixture.componentInstance as unknown as {
      form: { controls: { slug: { setValue(value: string): void } } };
      save(): void;
    };

    editor.form.controls.slug.setValue('QA Test_slug');
    editor.save();
    fixture.detectChanges();
    expect(update).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('الرابط المختصر يقبل الأحرف الإنجليزية');

    editor.form.controls.slug.setValue('qa-test-slug');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(
      'الرابط المختصر يقبل الأحرف الإنجليزية',
    );
    editor.save();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('allows an empty slug', async () => {
    const update = vi.fn((_id: string, draft: unknown) =>
      of({ ...article('9'), ...(draft as object) }),
    );
    const fixture = await render('edit', '9', { update });
    (fixture.componentInstance as unknown as { save(): void }).save();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('shows the server validation message when saving is rejected with 422', async () => {
    const update = vi.fn(() =>
      throwError(
        () =>
          new ApiError(422, 'The title (English) field must not be greater than 200 characters.'),
      ),
    );
    const fixture = await render('edit', '9', { update });
    const add = vi.spyOn(TestBed.inject(MessageService), 'add');
    (fixture.componentInstance as unknown as { save(): void }).save();
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'The title (English) field must not be greater than 200 characters.',
      }),
    );
    expect(fixture.componentInstance.form.controls.titleEn.value).toBe('Title');
  });
});
