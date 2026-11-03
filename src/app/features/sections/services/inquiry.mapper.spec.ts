import {
  mapInquiryDetail,
  mapInquiryListItem,
  mapInquiryStats,
  toApiInquiryStatus,
  toUiInquiryStatus,
} from './inquiry.mapper';
import type { InquiryDetailDto, InquiryListDto, InquiryStatsDto } from '../models/inquiry.api';

describe('inquiry.mapper', () => {
  it('maps backend in_progress to UI progress and back', () => {
    expect(toUiInquiryStatus('in_progress')).toBe('progress');
    expect(toApiInquiryStatus('progress')).toBe('in_progress');
    expect(toUiInquiryStatus('new')).toBe('new');
    expect(toApiInquiryStatus('closed')).toBe('closed');
  });

  it('maps list items with product and without nested notes', () => {
    const dto: InquiryListDto = {
      id: 42,
      reference: 'REQ-00042',
      type: 'inquiry',
      status: 'in_progress',
      name: 'محمد',
      organization: 'كود',
      phone: '+966',
      email: 'a@b.c',
      product: { id: 1, title: 'ألما' },
      message: 'مرحبا',
      close_note: null,
      closed_at: null,
      created_at: '2026-10-29T08:00:00.000000Z',
      updated_at: '2026-10-29T08:00:00.000000Z',
    };
    const item = mapInquiryListItem(dto);
    expect(item.id).toBe('42');
    expect(item.reference).toBe('REQ-00042');
    expect(item.status).toBe('progress');
    expect(item.product).toBe('ألما');
    expect(item.notes).toEqual([]);
    expect(item.reply).toBeNull();
    expect(item.timeline).toEqual([]);
  });

  it('maps detail notes, replies, timeline and service label for project requests', () => {
    const dto: InquiryDetailDto = {
      id: 57,
      reference: 'REQ-00057',
      type: 'project_request',
      status: 'closed',
      name: 'سارة',
      organization: 'مؤسسة',
      phone: '+966',
      email: null,
      service: { id: 2, name: 'تصميم UI/UX' },
      message: 'نص',
      close_note: 'تم',
      closed_at: '2026-10-29T13:00:00.000000Z',
      created_at: '2026-10-29T08:00:00.000000Z',
      updated_at: '2026-10-29T13:00:00.000000Z',
      notes: [
        {
          id: 5,
          body: 'ملاحظة',
          author: { id: 2, name: 'زياد' },
          created_at: '2026-10-29T09:00:00.000000Z',
        },
      ],
      replies: [
        {
          id: 3,
          body: 'رد',
          emailed_at: null,
          author: { id: 2, name: 'زياد' },
          created_at: '2026-10-29T11:05:00.000000Z',
        },
      ],
      timeline: [
        {
          key: 'received',
          state: 'done',
          title: 'تم الاستلام',
          description: 'وصف',
          at: '2026-10-29T08:00:00.000000Z',
          by: null,
        },
        {
          key: 'note_added',
          state: 'pending',
          title: 'ملحوظة',
          description: 'بانتظار',
          at: null,
          by: null,
        },
      ],
    };
    const item = mapInquiryDetail(dto);
    expect(item.product).toBe('تصميم UI/UX');
    expect(item.notes).toHaveLength(1);
    expect(item.notes[0]?.author).toBe('زياد');
    expect(item.replies).toHaveLength(1);
    expect(item.reply?.body).toBe('رد');
    expect(item.timeline[1]?.state).toBe('todo');
  });

  it('maps stats in_progress into UI progress metric', () => {
    const dto: InquiryStatsDto = {
      total: { value: 10, previous: 8, change_pct: 25 },
      new: { value: 2, previous: 1, change_pct: 100 },
      in_progress: { value: 3, previous: 3, change_pct: 0 },
      closed: { value: 5, previous: 4, change_pct: 25 },
    };
    const stats = mapInquiryStats(dto);
    expect(stats.progress.value).toBe(3);
    expect(stats.progress.changePct).toBe(0);
  });
});
