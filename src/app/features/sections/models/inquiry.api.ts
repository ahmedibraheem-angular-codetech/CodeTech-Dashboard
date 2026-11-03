/** Backend contact-request statuses (OpenAPI). */
export type InquiryApiStatus = 'new' | 'in_progress' | 'closed';

export interface InquiryRelatedProductDto {
  id: number | null;
  title: string;
}

export interface InquiryRelatedServiceDto {
  id: number | null;
  name: string;
}

export interface InquiryAuthorDto {
  id: number;
  name: string;
}

export interface InquiryNoteDto {
  id: number;
  body: string;
  author: InquiryAuthorDto | null;
  created_at: string;
}

export interface InquiryReplyDto {
  id: number;
  body: string;
  emailed_at: string | null;
  author: InquiryAuthorDto | null;
  created_at: string;
}

export interface InquiryTimelineStepDto {
  key: string;
  state: 'done' | 'current' | 'pending';
  title: string;
  description: string;
  at: string | null;
  by: string | null;
}

/** List row — inquiries include `product`; project requests include `service`. */
export interface InquiryListDto {
  id: number;
  reference: string;
  type: 'inquiry' | 'project_request';
  status: InquiryApiStatus;
  name: string;
  organization: string;
  phone: string;
  email: string | null;
  product?: InquiryRelatedProductDto | null;
  service?: InquiryRelatedServiceDto | null;
  message: string | null;
  close_note: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Detail payload — includes notes, replies, timeline; related resource matches type. */
export interface InquiryDetailDto extends InquiryListDto {
  closed_by?: InquiryAuthorDto | null;
  notes: InquiryNoteDto[];
  replies: InquiryReplyDto[];
  timeline: InquiryTimelineStepDto[];
}

export interface InquiryStatMetricDto {
  value: number;
  previous: number | null;
  change_pct: number | null;
}

export interface InquiryStatsDto {
  total: InquiryStatMetricDto;
  new: InquiryStatMetricDto;
  in_progress: InquiryStatMetricDto;
  closed: InquiryStatMetricDto;
}

export interface InquiryStatusWriteDto {
  status: InquiryApiStatus;
  note?: string | null;
}

export interface InquiryNoteWriteDto {
  body: string;
}

export interface InquiryReplyWriteDto {
  body: string;
}
