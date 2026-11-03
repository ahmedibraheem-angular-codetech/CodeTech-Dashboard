import { hasVisibleHtml } from '../../../shared/editor/quill';
import type { LegalPageDto, LegalPageWriteDto } from '../models/legal-document.api';
import type {
  LegalDocument,
  LegalDocumentDraft,
  LegalDocumentKind,
} from '../models/legal-document.model';

export function mapLegalPage(dto: LegalPageDto): LegalDocument {
  return {
    kind: dto.key,
    content: {
      ar: dto.content?.ar ?? '',
      en: dto.content?.en ?? '',
    },
    updatedAt: dto.updated_at,
  };
}

export function toLegalWriteBody(draft: LegalDocumentDraft): LegalPageWriteDto {
  return {
    content: {
      ar: hasVisibleHtml(draft.content.ar) ? draft.content.ar : '',
      en: hasVisibleHtml(draft.content.en) ? draft.content.en : null,
    },
  };
}

export function assertLegalKind(key: string, expected: LegalDocumentKind): void {
  if (key !== expected) {
    throw new Error(`Unexpected legal page key: ${key}`);
  }
}
