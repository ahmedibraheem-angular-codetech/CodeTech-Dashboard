import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { InquiriesService } from './inquiries.service';

describe('InquiriesService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: API_LATENCY_MS, useValue: 0 }],
    });
    return TestBed.inject(InquiriesService);
  }

  it('loads a seeded inquiry by id', async () => {
    const api = setup();
    const item = await firstValueFrom(api.get('REQ-00000'));
    expect(item?.customer).toBe('محمد عبدالمجيد حسن');
    expect(item?.status).toBe('new');
  });

  it('adds a note and a reply without mixing the two', async () => {
    const api = setup();
    const noted = await firstValueFrom(api.addNote('REQ-00000', 'تذكير'));
    expect(noted.notes.at(-1)?.body).toBe('تذكير');
    expect(noted.reply).toBeNull();
    expect(noted.status).toBe('new');

    const replied = await firstValueFrom(api.addReply('REQ-00000', 'تم الرد'));
    expect(replied.reply?.body).toBe('تم الرد');
    expect(replied.status).toBe('progress');
    expect(replied.notes).toHaveLength(noted.notes.length);
  });
});
