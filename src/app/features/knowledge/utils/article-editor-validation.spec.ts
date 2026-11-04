import { collectArticleValidationIssues } from './article-editor-validation';

describe('article-editor-validation', () => {
  const empty = {
    titleAr: '',
    titleEn: '',
    contentAr: '',
    contentEn: '',
    categoryId: '',
  };

  it('requires bilingual title/content and category in strict mode', () => {
    const result = collectArticleValidationIssues(empty, 'strict', 'Ar', () => false);
    expect([...result.missing]).toEqual(
      expect.arrayContaining(['titleAr', 'titleEn', 'contentAr', 'contentEn', 'categoryId']),
    );
  });

  it('requires any title in lenient mode and can suggest locale switch', () => {
    const result = collectArticleValidationIssues(empty, 'lenient', 'Ar');
    expect(result.missing.has('titleAr')).toBe(true);

    const otherLocale = collectArticleValidationIssues(
      {
        titleAr: 'عنوان',
        titleEn: '',
        contentAr: '<p>ع</p>',
        contentEn: '',
        categoryId: '1',
      },
      'strict',
      'Ar',
      (html) => html.includes('ع') || html.includes('x'),
    );
    expect(otherLocale.missing.has('titleEn')).toBe(true);
    expect(otherLocale.switchTo).toBe('en');
  });
});
