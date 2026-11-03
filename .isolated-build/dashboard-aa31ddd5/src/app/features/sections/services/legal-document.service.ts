import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope } from '../../../core/http/api.model';
import type { LegalPageDto } from '../models/legal-document.api';
import type {
  LegalDocument,
  LegalDocumentDraft,
  LegalDocumentKind,
} from '../models/legal-document.model';
import { assertLegalKind, mapLegalPage, toLegalWriteBody } from './legal-document.mapper';

const LEGAL_PATH = 'admin/legal-pages';

/**
 * Terms and Privacy pages. Each `kind` hits its own `/admin/legal-pages/{key}`
 * URL so one document cannot overwrite the other in memory.
 */
@Injectable({ providedIn: 'root' })
export class LegalDocumentService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  get(kind: LegalDocumentKind): Observable<LegalDocument> {
    return this.http
      .get<ApiEnvelope<LegalPageDto>>(apiUrl(this.base, `${LEGAL_PATH}/${kind}`))
      .pipe(map((envelope) => this.requirePage(envelope, kind)));
  }

  save(kind: LegalDocumentKind, draft: LegalDocumentDraft): Observable<LegalDocument> {
    return this.http
      .put<ApiEnvelope<LegalPageDto>>(
        apiUrl(this.base, `${LEGAL_PATH}/${kind}`),
        toLegalWriteBody(draft),
      )
      .pipe(map((envelope) => this.requirePage(envelope, kind)));
  }

  private requirePage(
    envelope: ApiEnvelope<LegalPageDto>,
    kind: LegalDocumentKind,
  ): LegalDocument {
    const data = envelope?.data;
    if (!data || (data.key !== 'terms' && data.key !== 'privacy')) {
      throw new Error('Invalid legal page response');
    }
    assertLegalKind(data.key, kind);
    return mapLegalPage(data);
  }
}
