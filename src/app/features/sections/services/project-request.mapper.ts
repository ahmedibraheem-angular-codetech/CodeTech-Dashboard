import type {
  ProjectRequestApiStatus,
  ProjectRequestDetailDto,
  ProjectRequestListDto,
  ProjectRequestNoteDto,
  ProjectRequestReplyDto,
  ProjectRequestStatMetricDto,
  ProjectRequestStatsDto,
  ProjectRequestTimelineStepDto,
} from '../models/project-request.api';
import type {
  Inquiry,
  InquiryNote,
  InquiryReply,
  InquiryStats,
  InquiryStatsMetric,
  InquiryStatus,
  InquiryTimelineStep,
} from '../models/inquiry.model';
import { stampFromIso, toUiInquiryStatus } from './inquiry.mapper';

export function toUiProjectRequestStatus(status: ProjectRequestApiStatus): InquiryStatus {
  return toUiInquiryStatus(status);
}

function serviceLabel(dto: ProjectRequestListDto): string {
  return dto.service?.name?.trim() || '';
}

function mapNote(dto: ProjectRequestNoteDto): InquiryNote {
  return {
    id: String(dto.id),
    body: dto.body,
    author: dto.author?.name ?? '',
    ...stampFromIso(dto.created_at),
  };
}

function mapReply(dto: ProjectRequestReplyDto): InquiryReply {
  return {
    id: String(dto.id),
    body: dto.body,
    author: dto.author?.name ?? '',
    ...stampFromIso(dto.created_at),
  };
}

function mapTimelineStep(dto: ProjectRequestTimelineStepDto): InquiryTimelineStep {
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

function mapCore(dto: ProjectRequestListDto): Omit<Inquiry, 'notes' | 'replies' | 'reply' | 'timeline'> {
  const stamp = stampFromIso(dto.created_at);
  return {
    id: String(dto.id),
    reference: dto.reference,
    customer: dto.name,
    org: dto.organization,
    phone: dto.phone,
    email: dto.email ?? '',
    /** Shared inbox UI field — filled from `service.name` only. */
    product: serviceLabel(dto),
    status: toUiProjectRequestStatus(dto.status),
    date: stamp.date,
    time: stamp.time,
    body: dto.message ?? '',
  };
}

/** List rows have no nested notes/replies/timeline. */
export function mapProjectRequestListItem(dto: ProjectRequestListDto): Inquiry {
  return {
    ...mapCore(dto),
    notes: [],
    replies: [],
    reply: null,
    timeline: [],
  };
}

export function mapProjectRequestDetail(dto: ProjectRequestDetailDto): Inquiry {
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

function mapMetric(dto: ProjectRequestStatMetricDto): InquiryStatsMetric {
  return {
    value: dto.value,
    previous: dto.previous,
    changePct: dto.change_pct,
  };
}

export function mapProjectRequestStats(dto: ProjectRequestStatsDto): InquiryStats {
  return {
    total: mapMetric(dto.total),
    new: mapMetric(dto.new),
    progress: mapMetric(dto.in_progress),
    closed: mapMetric(dto.closed),
  };
}
