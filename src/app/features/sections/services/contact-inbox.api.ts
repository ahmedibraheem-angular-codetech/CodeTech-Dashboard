import type { Observable } from 'rxjs';

import type { Inquiry, InquiryStats } from '../models/inquiry.model';

/** Shared inbox operations for inquiries and project-requests. */
export interface ContactInboxApi {
  list(): Observable<Inquiry[]>;
  stats(): Observable<InquiryStats>;
  get(id: string): Observable<Inquiry | null>;
  addNote(id: string, body: string): Observable<Inquiry>;
  addReply(id: string, body: string): Observable<Inquiry>;
  close(id: string, note?: string | null): Observable<Inquiry>;
  remove(id: string): Observable<void>;
  exportCsv(): Observable<Blob>;
}
