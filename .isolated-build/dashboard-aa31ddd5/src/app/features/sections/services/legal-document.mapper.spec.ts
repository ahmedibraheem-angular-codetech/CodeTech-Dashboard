import { describe, expect, it } from 'vitest';

import type { LegalPageDto } from '../models/legal-document.api';
import { assertLegalKind, mapLegalPage, toLegalWriteBody } from './legal-document.mapper';

describe('legal-document.mapper', () => {
  const dto = (overrides: Partial<LegalPageDto> = {}): LegalPageDto => ({
    key: 'terms',
    content: { ar: '<p>عربي</p>', en: '<p>English</p>' },
    updated_by: { id: 1, name: 'Admin' },
    updated_at: '2026-10-29T10:00:00.000000Z',
    ...overrides,
  });

  it('maps null HTML and null updated_at to empty editor strings', () => {
    const doc = mapLegalPage(
      dto({ content: { ar: null, en: null }, updated_at: null, updated_by: null }),
    );
    expect(doc).toEqual({
      kind: 'terms',
      content: { ar: '', en: '' },
      updatedAt: null,
    });
  });

  it('preserves rich-text HTML without stripping tags', () => {
    const html =
      '<h3>01</h3><p><strong>Bold</strong></p><ul><li>One</li></ul><img src="https://cdn.test/a.png">';
    const doc = mapLegalPage(dto({ content: { ar: html, en: null } }));
    expect(doc.content.ar).toBe(html);
    expect(doc.content.en).toBe('');
  });

  it('sends both languages; empty English becomes null; empty Arabic becomes ""', () => {
    expect(
      toLegalWriteBody({
        content: { ar: '<p><br></p>', en: '<p><br></p>' },
      }),
    ).toEqual({ content: { ar: '', en: null } });

    expect(
      toLegalWriteBody({
        content: {
          ar: '<p>Keep <strong>HTML</strong></p>',
          en: '<p>Keep EN</p>',
        },
      }),
    ).toEqual({
      content: {
        ar: '<p>Keep <strong>HTML</strong></p>',
        en: '<p>Keep EN</p>',
      },
    });
  });

  it('does not omit English when Arabic-only content is saved', () => {
    const body = toLegalWriteBody({
      content: { ar: '<p>AR only</p>', en: '' },
    });
    expect(body.content).toEqual({ ar: '<p>AR only</p>', en: null });
    expect(Object.keys(body.content).sort()).toEqual(['ar', 'en']);
  });

  it('rejects a mismatched page key', () => {
    expect(() => assertLegalKind('privacy', 'terms')).toThrow(/Unexpected legal page key/);
  });
});
