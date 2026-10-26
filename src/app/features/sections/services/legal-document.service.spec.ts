import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { LegalDocumentService } from './legal-document.service';

describe('LegalDocumentService', () => {
  function setup(): LegalDocumentService {
    TestBed.configureTestingModule({
      providers: [{ provide: API_LATENCY_MS, useValue: 0 }],
    });
    return TestBed.inject(LegalDocumentService);
  }

  it('returns the seeded terms document', async () => {
    const api = setup();
    const doc = await firstValueFrom(api.get('terms'));
    expect(doc.kind).toBe('terms');
    expect(doc.content.ar).toContain('قبول الشروط');
    expect(doc.content.en).toContain('Acceptance');
  });

  it('saves both language payloads for the requested kind', async () => {
    const api = setup();
    const saved = await firstValueFrom(
      api.save('privacy', {
        content: { ar: '<p>عربية</p>', en: '<p>English</p>' },
      }),
    );
    expect(saved.kind).toBe('privacy');
    expect(saved.content).toEqual({ ar: '<p>عربية</p>', en: '<p>English</p>' });

    const loaded = await firstValueFrom(api.get('privacy'));
    expect(loaded.content.en).toBe('<p>English</p>');
  });
});
