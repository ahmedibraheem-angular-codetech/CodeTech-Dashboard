import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { User, UserDraft } from '../models/user.model';
import { USERS_SEED } from './users.mock';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly users = signal<User[]>(USERS_SEED.map((user) => ({ ...user })));

  list(): Observable<User[]> {
    return timer(this.latency).pipe(map(() => this.users().map((user) => ({ ...user }))));
  }

  get(id: string): Observable<User | null> {
    return timer(this.latency).pipe(
      map(() => {
        const user = this.users().find((item) => item.id === id);
        return user ? { ...user } : null;
      }),
    );
  }

  create(draft: UserDraft): Observable<User> {
    const user: User = { ...draft, id: crypto.randomUUID() };
    return timer(this.latency).pipe(
      map(() => {
        this.users.update((list) => [user, ...list]);
        return user;
      }),
    );
  }

  update(id: string, draft: UserDraft): Observable<User> {
    const user: User = { ...draft, id };
    return timer(this.latency).pipe(
      map(() => {
        this.users.update((list) => list.map((item) => (item.id === id ? user : item)));
        return user;
      }),
    );
  }

  remove(id: string): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        this.users.update((list) => list.filter((user) => user.id !== id));
      }),
    );
  }
}
