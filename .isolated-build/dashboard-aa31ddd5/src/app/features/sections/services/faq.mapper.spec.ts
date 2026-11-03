import { describe, expect, it } from 'vitest';

import type { FaqCategoryDto, FaqDto } from '../models/faq.api';
import { mapFaq, mapFaqCategory, toFaqCategoryWrite, toFaqWrite } from './faq.mapper';

describe('faq.mapper', () => {
  const categoryDto = (overrides: Partial<FaqCategoryDto> = {}): FaqCategoryDto => ({
    id: 3,
    name: { ar: 'الخدمات', en: 'Services' },
    is_published: true,
    sort_order: 2,
    faqs_count: 4,
    created_at: '2026-10-29T10:00:00.000000Z',
    updated_at: '2026-10-29T10:00:00.000000Z',
    ...overrides,
  });

  const faqDto = (overrides: Partial<FaqDto> = {}): FaqDto => ({
    id: 12,
    category: { id: 3, name: { ar: 'الخدمات', en: 'Services' } },
    question: { ar: 'سؤال؟', en: 'Question?' },
    answer: { ar: 'جواب', en: 'Answer' },
    is_published: false,
    sort_order: 5,
    created_at: '2026-10-29T10:00:00.000000Z',
    updated_at: '2026-10-29T11:00:00.000000Z',
    ...overrides,
  });

  it('maps category bilingual fields and keeps the backend id as a string', () => {
    expect(mapFaqCategory(categoryDto())).toEqual({
      id: '3',
      name: { ar: 'الخدمات', en: 'Services' },
      order: 2,
      published: true,
      code: '000003',
      createdAt: '2026-10-29T10:00:00.000000Z',
      faqsCount: 4,
    });
  });

  it('maps null locale strings to empty editor strings', () => {
    const category = mapFaqCategory(
      categoryDto({ name: { ar: 'عام', en: null } }),
    );
    expect(category.name).toEqual({ ar: 'عام', en: '' });

    const faq = mapFaq(
      faqDto({
        question: { ar: 'س', en: null },
        answer: { ar: null, en: 'A' },
      }),
    );
    expect(faq.question).toEqual({ ar: 'س', en: '' });
    expect(faq.answer).toEqual({ ar: '', en: 'A' });
  });

  it('maps FAQ category relationship from nested category.id, not an index', () => {
    const faq = mapFaq(faqDto({ category: { id: 99, name: { ar: 'أخرى', en: 'Other' } } }));
    expect(faq.categoryId).toBe('99');
    expect(faq.id).toBe('12');
  });

  it('writes category body with both languages and is_published', () => {
    expect(
      toFaqCategoryWrite({
        name: { ar: ' عام ', en: ' General ' },
        published: false,
        order: 1,
        code: 'x',
        createdAt: '2026-01-01',
      }),
    ).toEqual({
      name: { ar: 'عام', en: 'General' },
      is_published: false,
    });
  });

  it('writes FAQ body with numeric category id and both locales', () => {
    expect(
      toFaqWrite({
        question: { ar: ' س؟ ', en: ' Q? ' },
        answer: { ar: ' ج ', en: ' A ' },
        categoryId: '7',
        order: 3,
        published: true,
        updatedAt: '2026-01-01',
      }),
    ).toEqual({
      faq_category_id: 7,
      question: { ar: 'س؟', en: 'Q?' },
      answer: { ar: 'ج', en: 'A' },
      is_published: true,
      sort_order: 3,
    });
  });

  it('rejects non-numeric category ids on write', () => {
    expect(() =>
      toFaqWrite({
        question: { ar: 'س', en: 'Q' },
        answer: { ar: 'ج', en: 'A' },
        categoryId: 'services',
        order: 1,
        published: true,
        updatedAt: '2026-01-01',
      }),
    ).toThrow(/Invalid FAQ category id/);
  });
});
