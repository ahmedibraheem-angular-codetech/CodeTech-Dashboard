export type LegalDocumentKind = 'terms' | 'privacy';

export interface LegalLocaleHtml {
  ar: string;
  en: string;
}

export interface LegalDocument {
  kind: LegalDocumentKind;
  content: LegalLocaleHtml;
  updatedAt: string;
}

export type LegalDocumentDraft = Pick<LegalDocument, 'content'>;
