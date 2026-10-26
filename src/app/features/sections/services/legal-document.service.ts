import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { toIsoDate } from '../../../shared/utils/date';
import type {
  LegalDocument,
  LegalDocumentDraft,
  LegalDocumentKind,
} from '../models/legal-document.model';
import { LEGAL_DOCUMENTS_SEED } from './legal-document.mock';

@Injectable({ providedIn: 'root' })
export class LegalDocumentService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly documents = signal<LegalDocument[]>(structuredClone(LEGAL_DOCUMENTS_SEED));

  get(kind: LegalDocumentKind): Observable<LegalDocument> {
    return timer(this.latency).pipe(
      map(() => {
        const current = this.documents().find((item) => item.kind === kind);
        if (!current) {
          throw new Error('missing-legal-document');
        }
        return structuredClone(current);
      }),
    );
  }

  save(kind: LegalDocumentKind, draft: LegalDocumentDraft): Observable<LegalDocument> {
    return timer(this.latency).pipe(
      map(() => {
        const current = this.documents().find((item) => item.kind === kind);
        if (!current) {
          throw new Error('missing-legal-document');
        }
        const next: LegalDocument = {
          ...current,
          content: structuredClone(draft.content),
          updatedAt: toIsoDate(new Date()),
        };
        this.documents.update((list) => list.map((item) => (item.kind === kind ? next : item)));
        return structuredClone(next);
      }),
    );
  }
}
