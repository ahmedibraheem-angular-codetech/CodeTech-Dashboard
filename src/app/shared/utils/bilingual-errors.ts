import {
  type Signal,
  type WritableSignal,
  computed,
  effect,
  signal,
  untracked,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import type { AbstractControl } from '@angular/forms';
import { map, startWith, switchMap } from 'rxjs';

import type { AppLanguage } from '../../core/i18n/language';

const LANGS: readonly AppLanguage[] = ['ar', 'en'];
const attempts = new WeakMap<AbstractControl, WritableSignal<number>>();

function attemptSignal(control: AbstractControl): WritableSignal<number> {
  let value = attempts.get(control);
  if (!value) {
    value = signal(0);
    attempts.set(control, value);
  }
  return value;
}

/** Call on a failed save: marks every field touched and tells the form to show the problem. */
export function revealInvalid(control: AbstractControl): void {
  control.markAllAsTouched();
  attemptSignal(control).update((n) => n + 1);
}

/**
 * Tracks which language tabs hold invalid fields. After a failed save it moves the
 * form to the first tab with an error when the current tab is fine.
 * Must run in an injection context.
 */
export function watchBilingualErrors(
  form: () => AbstractControl,
  locale: WritableSignal<AppLanguage>,
  controlsOf: (form: AbstractControl, locale: AppLanguage) => AbstractControl[],
): Signal<readonly AppLanguage[]> {
  const tick = toSignal(
    toObservable(computed(form)).pipe(
      switchMap((f) => f.events.pipe(startWith(null))),
      map(() => ({})),
    ),
    { initialValue: {} },
  );
  const attempt = computed(() => attemptSignal(form())());

  effect(() => {
    if (attempt() === 0) {
      return;
    }
    untracked(() => {
      const f = form();
      const bad = LANGS.filter((l) => controlsOf(f, l).some((c) => c.invalid));
      if (bad.length > 0 && !bad.includes(locale())) {
        locale.set(bad[0]);
      }
    });
  });

  return computed(() => {
    tick();
    attempt();
    const f = form();
    return LANGS.filter((l) => controlsOf(f, l).some((c) => c.touched && c.invalid));
  });
}
