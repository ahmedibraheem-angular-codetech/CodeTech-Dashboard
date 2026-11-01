import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { AuthService } from '../../../core/auth/auth.service';
import { toIsoDate } from '../../../shared/utils/date';
import { type Inquiry, type InquiryNote, type InquiryReply, type InquiryStamp } from '../models/inquiry.model';
import { INQUIRIES_SEED } from './inquiries.mock';

@Injectable({ providedIn: 'root' })
export class InquiriesService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly auth = inject(AuthService);
  private readonly state = signal<Inquiry[]>(structuredClone(INQUIRIES_SEED));

  list(): Observable<Inquiry[]> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state())));
  }

  get(id: string): Observable<Inquiry | null> {
    return timer(this.latency).pipe(
      map(() => {
        const match = this.state().find((item) => item.id === id);
        return match ? structuredClone(match) : null;
      }),
    );
  }

  addNote(id: string, body: string): Observable<Inquiry> {
    return this.patch(id, (item) => ({
      ...item,
      notes: [...item.notes, this.note(body)],
    }));
  }

  addReply(id: string, body: string): Observable<Inquiry> {
    return this.patch(id, (item) => ({
      ...item,
      status: item.status === 'closed' ? 'closed' : 'progress',
      reply: this.reply(body),
    }));
  }

  close(id: string): Observable<Inquiry> {
    return this.patch(id, (item) => ({ ...item, status: 'closed' }));
  }

  remove(id: string): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        this.state.update((current) => current.filter((item) => item.id !== id));
      }),
    );
  }

  private patch(id: string, update: (item: Inquiry) => Inquiry): Observable<Inquiry> {
    return timer(this.latency).pipe(
      map(() => {
        const current = this.state().find((item) => item.id === id);
        if (!current) {
          throw new Error('missing-inquiry');
        }
        const next = structuredClone(update(current));
        this.state.update((list) => list.map((item) => (item.id === id ? next : item)));
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
