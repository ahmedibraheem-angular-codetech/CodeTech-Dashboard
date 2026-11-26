import { computed, signal } from '@angular/core';

import { toIsoDate } from '../../shared/utils/date';
import { parseUploadedImage } from '../../shared/utils/image-upload';
import type { AppLanguage } from '../i18n/language';
import {
  type LocalizedMedia,
  type LocalizedMediaDraft,
  type LocalizedMediaIntent,
  LOCALES,
} from './localized-media';

export interface SlotImage {
  url: string;
  name: string;
  size: number;
  date: string;
  file?: File;
  cleared?: boolean;
}

type PerLang<T> = Record<AppLanguage, T>;

/**
 * Per-language image slots for an editor. Every slot holds one image for Arabic and one
 * for English, and the active content tab decides which one the editor shows and edits.
 */
export class LocalizedImageSlots<K extends string> {
  readonly state = signal<Record<K, PerLang<SlotImage | null>>>({} as never);
  readonly errors = signal<Record<string, string>>({});
  /** Whether a stored file existed when loaded, so removing it sends null. */
  private readonly existing = signal<Record<string, boolean>>({});

  constructor(
    private readonly keys: readonly K[],
    private readonly locale: () => AppLanguage,
  ) {
    this.reset();
  }

  reset(from?: Partial<Record<K, LocalizedMedia | null>>, date = toIsoDate(new Date())): void {
    const next = {} as Record<K, PerLang<SlotImage | null>>;
    const had: Record<string, boolean> = {};
    for (const key of this.keys) {
      next[key] = { ar: null, en: null };
      for (const lang of LOCALES) {
        const file = from?.[key]?.[lang] ?? null;
        if (file) {
          next[key][lang] = {
            url: file.url,
            name: file.fileName || file.name,
            size: file.size,
            date,
          };
          had[`${key}:${lang}`] = true;
        }
      }
    }
    for (const key of this.keys) {
      for (const lang of LOCALES) {
        const image = this.state()[key]?.[lang];
        if (image?.file && image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      }
    }
    this.state.set(next);
    this.existing.set(had);
    this.errors.set({});
  }

  imageOf(slot: K, lang: AppLanguage = this.locale()): SlotImage | null {
    const image = this.state()[slot]?.[lang] ?? null;
    return image && !image.cleared && image.url ? image : null;
  }

  errorOf(slot: K): string {
    return this.errors()[`${slot}:${this.locale()}`] ?? '';
  }

  /** The active tab's image URL per slot, for previews. */
  readonly active = computed(() => {
    const lang = this.locale();
    const out = {} as Record<K, SlotImage | null>;
    for (const key of this.keys) {
      out[key] = this.imageOf(key, lang);
    }
    return out;
  });

  take(slot: K, file: File | undefined): void {
    const lang = this.locale();
    const parsed = parseUploadedImage(file);
    if (!parsed || !file) {
      return;
    }
    const errorKey = `${slot}:${lang}`;
    if (!parsed.ok) {
      this.errors.update((all) => ({ ...all, [errorKey]: parsed.errorKey }));
      return;
    }
    this.errors.update((all) => ({ ...all, [errorKey]: '' }));
    this.revoke(slot, lang);
    this.set(slot, lang, {
      url: URL.createObjectURL(file),
      name: parsed.image.name,
      size: parsed.image.size,
      date: parsed.image.uploadedAt,
      file,
    });
  }

  remove(slot: K): void {
    const lang = this.locale();
    this.revoke(slot, lang);
    const had = !!this.existing()[`${slot}:${lang}`];
    this.set(slot, lang, had ? { url: '', name: '', size: 0, date: '', cleared: true } : null);
    this.errors.update((all) => ({ ...all, [`${slot}:${lang}`]: '' }));
  }

  draft(): Record<K, LocalizedMediaDraft> {
    const out = {} as Record<K, LocalizedMediaDraft>;
    for (const key of this.keys) {
      out[key] = {
        ar: this.intent(this.state()[key]?.ar),
        en: this.intent(this.state()[key]?.en),
      };
    }
    return out;
  }

  private intent(image: SlotImage | null | undefined): LocalizedMediaIntent {
    if (image?.file) {
      return { kind: 'replace', file: image.file };
    }
    if (image?.cleared) {
      return { kind: 'clear' };
    }
    return { kind: 'omit' };
  }

  private set(slot: K, lang: AppLanguage, image: SlotImage | null): void {
    this.state.update((all) => ({ ...all, [slot]: { ...all[slot], [lang]: image } }));
  }

  private revoke(slot: K, lang: AppLanguage): void {
    const current = this.state()[slot]?.[lang];
    if (current?.file && current.url.startsWith('blob:')) {
      URL.revokeObjectURL(current.url);
    }
  }
}
