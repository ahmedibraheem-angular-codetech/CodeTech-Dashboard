import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { type Observable, map, timer } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { API_LATENCY_MS } from '../config/latency';
import { PROFILE_SEED } from './profile.mock';
import { type ProfileDraft, type UserProfile } from './profile.model';

type ProfileOverrides = Partial<Pick<UserProfile, keyof ProfileDraft | 'avatarUrl'>>;

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly auth = inject(AuthService);
  private readonly overrides = signal<ProfileOverrides>({});

  readonly profile = computed<UserProfile | null>(() => {
    const session = this.auth.session();
    if (!session) {
      return null;
    }
    const overrides = this.overrides();
    if (session.profileLoaded) {
      return {
        name: overrides.name ?? session.name,
        email: overrides.email ?? session.email,
        roleKey: session.roleKey,
        username: overrides.username ?? session.username ?? '',
        phone: overrides.phone ?? session.phone ?? '',
        lastLogin: session.lastLoginAt,
        avatarUrl:
          overrides.avatarUrl !== undefined ? overrides.avatarUrl : session.avatarUrl,
      };
    }
    return {
      ...PROFILE_SEED,
      name: session.name,
      email: session.email,
      roleKey: session.roleKey,
      ...overrides,
    };
  });

  constructor() {
    effect(() => {
      if (!this.auth.session()) {

        untracked(() => {
          this.revokeAvatar();
          this.overrides.set({});
        });
      }
    });
  }

  update(draft: ProfileDraft): Observable<void> {
    return timer(this.latency).pipe(
      map(() => this.overrides.update((current) => ({ ...current, ...draft }))),
    );
  }

  changePassword(current: string, next: string): Observable<void> {
    void current;
    void next;
    return timer(this.latency).pipe(map(() => undefined));
  }

  setAvatar(file: File): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        this.revokeAvatar();
        this.overrides.update((current) => ({ ...current, avatarUrl: URL.createObjectURL(file) }));
      }),
    );
  }

  removeAvatar(): Observable<void> {
    return timer(this.latency).pipe(
      map(() => {
        this.revokeAvatar();
        this.overrides.update((current) => ({ ...current, avatarUrl: null }));
      }),
    );
  }

  private revokeAvatar(): void {
    const url = this.overrides().avatarUrl;
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
