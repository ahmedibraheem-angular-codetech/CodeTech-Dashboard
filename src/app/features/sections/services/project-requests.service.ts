import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, of, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { AuthService } from '../../../core/auth/auth.service';
import { toIsoDate } from '../../../shared/utils/date';
import type {
  Inquiry,
  InquiryNote,
  InquiryReply,
  InquiryStamp,
  InquiryStats,
} from '../models/inquiry.model';
import type { ContactInboxApi } from './contact-inbox.api';
import { PROJECT_REQUESTS_SEED } from './project-requests.mock';

/**
 * Project-requests inbox remains mock-backed in this phase.
 * Do not point this service at `/admin/project-requests` until that inbox is integrated.
 */
@Injectable({ providedIn: 'root' })
export class ProjectRequestsService implements ContactInboxApi {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly auth = inject(AuthService);
  private readonly state = signal<Inquiry[]>(structuredClone(PROJECT_REQUESTS_SEED));

  list(): Observable<Inquiry[]> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state())));
  }

  stats(): Observable<InquiryStats> {
    return this.list().pipe(
      map((rows) => {
        const count = (status: Inquiry['status']) => rows.filter((row) => row.status === status).length;
        const metric = (value: number) => ({ value, previous: null, changePct: null });
        return {
          total: metric(rows.length),
          new: metric(count('new')),
          progress: metric(count('progress')),
          closed: metric(count('closed')),
        };
      }),
    );
  }

  get(id: string): Observable<Inquiry | null> {
    return timer(this.latency).pipe(
      map(() => {
        const match = this.state().find((item) => item.id === id || item.reference === id);
        return match ? structuredClone(match) : null;
      }),
    );
  }

  addNote(id: string, body: string): Observable<Inquiry> {
    return this.patch(id, (item) => ({
      ...item,
      status: item.status === 'closed' ? 'closed' : item.status === 'new' ? 'progress' : item.status,
      notes: [...item.notes, this.note(body)],
    }));
  }

  addReply(id: string, body: string): Observable<Inquiry> {
    return this.patch(id, (item) => {
      const reply = this.reply(body);
      return {
        ...item,
        status: item.status === 'closed' ? 'closed' : 'progress',
        replies: [...item.replies, reply],
        reply,
      };
    });
  }

  close(id: string): Observable<Inquiry> {
    return this.patch(id, (item) => ({ ...item, status: 'closed' }));
  }

  remove(id: string): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        this.state.update((current) =>
          current.filter((item) => item.id !== id && item.reference !== id),
        );
      }),
    );
  }

  exportCsv(): Observable<Blob> {
    return of(new Blob([''], { type: 'text/csv' }));
  }

  private patch(id: string, update: (item: Inquiry) => Inquiry): Observable<Inquiry> {
    return timer(this.latency).pipe(
      map(() => {
        const current = this.state().find((item) => item.id === id || item.reference === id);
        if (!current) {
          throw new Error('missing-inquiry');
        }
        const next = structuredClone(update(current));
        this.state.update((list) =>
          list.map((item) => (item.id === current.id ? next : item)),
        );
        return structuredClone(next);
      }),
    );
  }

  private note(body: string): InquiryNote {
    return { id: crypto.randomUUID(), body: body.trim(), author: this.author(), ...this.stamp() };
  }

  private reply(body: string): InquiryReply {
    return { id: crypto.randomUUID(), body: body.trim(), author: this.author(), ...this.stamp() };
  }

  private author(): string {
    return this.auth.session()?.name || 'زياد محمد';
  }

  private stamp(now = new Date()): InquiryStamp {
    const hours = now.getHours();
    const hour = hours % 12 || 12;
    const minutes = `${now.getMinutes()}`.padStart(2, '0');
    const suffix = hours < 12 ? 'صباحًا' : 'مساءً';
    return { date: toIsoDate(now), time: `${hour}:${minutes} ${suffix}` };
  }
}
