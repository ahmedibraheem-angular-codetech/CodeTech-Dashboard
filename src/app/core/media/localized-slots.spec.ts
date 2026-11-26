import { signal } from '@angular/core';

import type { AppLanguage } from '../i18n/language';
import type { LocalizedMedia } from './localized-media';
import { LocalizedImageSlots } from './localized-slots';

const file = (uuid: string): LocalizedMedia['ar'] => ({
  uuid,
  url: `https://cdn.test/${uuid}.png`,
  name: uuid,
  fileName: `${uuid}.png`,
  size: 10,
});

describe('LocalizedImageSlots', () => {
  const png = (name: string) => new File([new Uint8Array([1])], name, { type: 'image/png' });

  it('keeps Arabic and English images independent for the same slot', () => {
    const locale = signal<AppLanguage>('ar');
    const slots = new LocalizedImageSlots<'cover'>(['cover'], () => locale());
    slots.reset({ cover: { ar: file('ar-cover'), en: null } });

    expect(slots.imageOf('cover')?.name).toBe('ar-cover.png');
    locale.set('en');
    expect(slots.imageOf('cover')).toBeNull();

    const english = png('en.png');
    slots.take('cover', english);
    expect(slots.imageOf('cover')?.name).toBe('en.png');
    locale.set('ar');
    expect(slots.imageOf('cover')?.name).toBe('ar-cover.png');

    const draft = slots.draft().cover;
    expect(draft.ar).toEqual({ kind: 'omit' });
    expect(draft.en).toEqual({ kind: 'replace', file: english });
  });

  it('clears only the active language and sends clear for a stored file', () => {
    const locale = signal<AppLanguage>('en');
    const slots = new LocalizedImageSlots<'cover'>(['cover'], () => locale());
    slots.reset({ cover: { ar: file('a'), en: file('e') } });
    slots.remove('cover');
    expect(slots.imageOf('cover')).toBeNull();
    locale.set('ar');
    expect(slots.imageOf('cover')?.name).toBe('a.png');
    expect(slots.draft().cover).toEqual({ ar: { kind: 'omit' }, en: { kind: 'clear' } });
  });

  it('removing a new, unsaved pick sends nothing and rejects a bad file type', () => {
    const locale = signal<AppLanguage>('ar');
    const slots = new LocalizedImageSlots<'cover'>(['cover'], () => locale());
    slots.take('cover', png('x.png'));
    slots.remove('cover');
    expect(slots.draft().cover.ar).toEqual({ kind: 'omit' });
    slots.take('cover', new File(['x'], 'x.gif', { type: 'image/gif' }));
    expect(slots.errorOf('cover')).toBe('home.imageType');
  });
});
