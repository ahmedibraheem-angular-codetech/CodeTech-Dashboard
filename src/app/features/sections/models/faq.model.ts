export interface FaqLocaleText {
  ar: string;
  en: string;
}

export type FaqCategoryId = 'general' | 'services' | 'products' | 'support' | 'billing';

export interface FaqCategory {
  id: FaqCategoryId;
  name: FaqLocaleText;
  order: number;
  published: boolean;
}

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
