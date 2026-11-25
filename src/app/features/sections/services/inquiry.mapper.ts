import type {
  InquiryApiStatus,
  InquiryDetailDto,
  InquiryListDto,
  InquiryNoteDto,
  InquiryReplyDto,
  InquiryStatMetricDto,
  InquiryStatsDto,
  InquiryTimelineStepDto,
} from '../models/inquiry.api';
import type {
  Inquiry,
  InquiryNote,
  InquiryReply,
  InquiryStats,
  InquiryStatsMetric,
  InquiryStatus,
  InquiryTimelineStep,
} from '../models/inquiry.model';
import { toIsoDate } from '../../../shared/utils/date';

export function toUiInquiryStatus(status: InquiryApiStatus): InquiryStatus {
  return status === 'in_progress' ? 'progress' : status;
}

export function toApiInquiryStatus(status: InquiryStatus): InquiryApiStatus {
  return status === 'progress' ? 'in_progress' : status;
}

export function stampFromIso(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) {
    return { date: '', time: '' };
  }
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return { date: '', time: '' };
  }
  const hours = value.getHours();
  const hour = hours % 12 || 12;
  const minutes = `${value.getMinutes()}`.padStart(2, '0');
  const suffix = hours < 12 ? 'صباحًا' : 'مساءً';
  return { date: toIsoDate(value), time: `${hour}:${minutes} ${suffix}` };
}

function uniqueLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of labels) {
    if (!label || seen.has(label)) {
      continue;
    }
    seen.add(label);
    out.push(label);
  }
  return out;
}

function relatedLabels(dto: InquiryListDto): string[] {
  const fromProducts = (dto.products ?? [])
    .map((item) => item.title?.trim() ?? '')
    .filter(Boolean);
  if (fromProducts.length) {
    return uniqueLabels(fromProducts);
  }
  const fromServices = (dto.services ?? [])
    .map((item) => item.name?.trim() ?? '')
    .filter(Boolean);
  if (fromServices.length) {
    return uniqueLabels(fromServices);
  }
  if (dto.product?.title?.trim()) {
    return [dto.product.title.trim()];
  }
  if (dto.service?.name?.trim()) {
    return [dto.service.name.trim()];
  }
  return [];
}

function mapNote(dto: InquiryNoteDto): InquiryNote {
  return {
    id: String(dto.id),
    body: dto.body,
    author: dto.author?.name ?? '',
    ...stampFromIso(dto.created_at),
  };
}

function mapReply(dto: InquiryReplyDto): InquiryReply {
  return {
    id: String(dto.id),
    body: dto.body,
    author: dto.author?.name ?? '',
    ...stampFromIso(dto.created_at),
  };
}

function mapTimelineStep(dto: InquiryTimelineStepDto): InquiryTimelineStep {
  const stamp = stampFromIso(dto.at);
  return {
    id: dto.key,
    title: dto.title,
    hint: dto.description,
    state: dto.state === 'pending' ? 'todo' : dto.state,
    date: stamp.date,
    time: stamp.time,
  };
}

function mapCore(dto: InquiryListDto): Omit<Inquiry, 'notes' | 'replies' | 'reply' | 'timeline'> {
  const stamp = stampFromIso(dto.created_at);
  const products = relatedLabels(dto);
  return {
    id: String(dto.id),
    reference: dto.reference,
    customer: dto.name,
    org: dto.organization,
    phone: dto.phone,
    email: dto.email ?? '',
    product: products[0] ?? '',
    products,
    status: toUiInquiryStatus(dto.status),
    date: stamp.date,
    time: stamp.time,
    body: dto.message ?? '',
  };
}

export function mapInquiryListItem(dto: InquiryListDto): Inquiry {
  return {
    ...mapCore(dto),
    notes: [],
    replies: [],
    reply: null,
    timeline: [],
  };
}

export function mapInquiryDetail(dto: InquiryDetailDto): Inquiry {
  const notes = (dto.notes ?? []).map(mapNote);
  const replies = (dto.replies ?? []).map(mapReply);
  return {
    ...mapCore(dto),
    notes,
    replies,
    reply: replies[0] ?? null,
    timeline: (dto.timeline ?? []).map(mapTimelineStep),
  };
}

function mapMetric(dto: InquiryStatMetricDto): InquiryStatsMetric {
  return {
    value: dto.value,
    previous: dto.previous,
    changePct: dto.change_pct,
  };
}

export function mapInquiryStats(dto: InquiryStatsDto): InquiryStats {
  return {
    total: mapMetric(dto.total),
    new: mapMetric(dto.new),
    progress: mapMetric(dto.in_progress),
    closed: mapMetric(dto.closed),
  };
}
