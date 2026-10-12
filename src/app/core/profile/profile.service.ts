import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { API_LATENCY_MS } from '../config/latency';
import { PROFILE_SEED } from './profile.mock';
import { ProfileDraft, UserProfile } from './profile.model';

type ProfileOverrides = Partial<Pick<UserProfile, keyof ProfileDraft | 'avatarUrl'>>;

/**
 * Current user's profile. Mock-backed: the base comes from the auth session plus
 * `PROFILE_SEED`, and edits live in memory only. Swap the `timer` calls for HTTP requests
 * when the API is ready; the public surface can stay the same.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly latency = inject(API_LATENCY_MS);
  private readonly auth = inject(AuthService);
  private readonly overrides = signal<ProfileOverrides>({});

  /** `null` while signed out. */
  readonly profile = computed<UserProfile | null>(() => {
    const session = this.auth.session();
    if (!session) {
      return null;
    }
    return {
      ...PROFILE_SEED,
      name: session.name,
      email: session.email,
      roleKey: session.roleKey,
      ...this.overrides(),
    };
  });

  constructor() {
    effect(() => {
      if (!this.auth.session()) {
        // Untracked: only the session may re-run this effect, never the overrides it resets.
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

  /**
   * Mock only: the API must verify `current` server-side. Passwords are never stored or logged.
   */
  changePassword(current: string, next: string): Observable<void> {
    void current;
    void next;
    return timer(this.latency).pipe(map(() => undefined));
  }

  /** Keeps the picture in memory as an object URL; it is not uploaded anywhere yet. */
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
