
export interface FaqLocaleDto {
  ar: string | null;
  en: string | null;
}

export interface FaqCategoryRefDto {
  id: number;
  name: FaqLocaleDto;
}

export interface FaqCategoryDto {
  id: number;
  name: FaqLocaleDto;
  is_published: boolean;
  sort_order: number;
  faqs_count: number;
  created_at: string;
  updated_at: string;
}

export interface FaqDto {
  id: number;
  category: FaqCategoryRefDto;
  question: FaqLocaleDto;
  answer: FaqLocaleDto;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FaqCategoryWriteDto {
  name: { ar: string; en: string };
  is_published: boolean;
}

export interface FaqWriteDto {
  faq_category_id: number;
  question: { ar: string; en: string };
  answer: { ar: string; en: string };
  is_published: boolean;
  sort_order?: number | null;
}

export interface FaqPublishWriteDto {
  is_published: boolean;
}
