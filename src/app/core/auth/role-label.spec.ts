import { TestBed } from '@angular/core/testing';

import { LanguageService } from '../services/language.service';
import { roleLabel } from './role-label';

describe('roleLabel', () => {
  let lang: LanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    lang = TestBed.inject(LanguageService);
    lang.set('ar');
  });

  it('translates known frontend role keys', () => {
    expect(roleLabel(lang, 'roles.superAdmin')).toBe('أدمن عام');
    expect(roleLabel(lang, 'roles.editor')).toBe('محرر');
  });

  it('returns backend display names as-is', () => {
    expect(roleLabel(lang, 'المدير العام')).toBe('المدير العام');
    expect(roleLabel(lang, 'Content manager')).toBe('Content manager');
  });

  it('returns an empty string for missing values', () => {
    expect(roleLabel(lang, null)).toBe('');
    expect(roleLabel(lang, undefined)).toBe('');
  });
});
