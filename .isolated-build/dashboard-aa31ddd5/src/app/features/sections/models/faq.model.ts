export interface FaqLocaleText {
  ar: string;
  en: string;
}

export type FaqCategoryId = string;

export interface FaqCategory {
  id: FaqCategoryId;
  name: FaqLocaleText;
  order: number;
  published: boolean;

  code: string;
  createdAt: string;

  faqsCount?: number;
}

export type FaqCategoryDraft = Omit<FaqCategory, 'id'>;

export interface FaqItem {
  id: string;
  question: FaqLocaleText;
  answer: FaqLocaleText;
  categoryId: FaqCategoryId;
  order: number;
  published: boolean;
  updatedAt: string;
}

export type FaqDraft = Omit<FaqItem, 'id'>;
