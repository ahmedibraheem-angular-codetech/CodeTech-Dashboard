import type {
  FaqCategoryDto,
  FaqCategoryWriteDto,
  FaqDto,
  FaqLocaleDto,
  FaqWriteDto,
} from '../models/faq.api';
import type {
  FaqCategory,
  FaqCategoryDraft,
  FaqDraft,
  FaqItem,
  FaqLocaleText,
} from '../models/faq.model';

export function mapFaqLocale(dto: FaqLocaleDto | null | undefined): FaqLocaleText {
  return {
    ar: dto?.ar ?? '',
    en: dto?.en ?? '',
  };
}

export function mapFaqCategory(dto: FaqCategoryDto): FaqCategory {
  return {
    id: String(dto.id),
    name: mapFaqLocale(dto.name),
    order: dto.sort_order,
    published: dto.is_published,

    code: String(dto.id).padStart(6, '0'),
    createdAt: dto.created_at,
    faqsCount: dto.faqs_count,
  };
}

export function mapFaq(dto: FaqDto): FaqItem {
  return {
    id: String(dto.id),
    question: mapFaqLocale(dto.question),
    answer: mapFaqLocale(dto.answer),
    categoryId: String(dto.category.id),
    order: dto.sort_order,
    published: dto.is_published,
    updatedAt: dto.updated_at,
  };
}

export function toFaqCategoryWrite(
  draft: FaqCategoryDraft | Pick<FaqCategory, 'name' | 'published'>,
): FaqCategoryWriteDto {
  return {
    name: {
      ar: draft.name.ar.trim(),
      en: draft.name.en.trim(),
    },
    is_published: draft.published,
  };
}

export function toFaqWrite(draft: FaqDraft): FaqWriteDto {
  const categoryId = Number(draft.categoryId);
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    throw new Error('Invalid FAQ category id');
  }
  return {
    faq_category_id: categoryId,
    question: {
      ar: draft.question.ar.trim(),
      en: draft.question.en.trim(),
    },
    answer: {
      ar: draft.answer.ar.trim(),
      en: draft.answer.en.trim(),
    },
    is_published: draft.published,
    sort_order: draft.order,
  };
}
