/** UI status tokens (labels/tones). Backend `in_progress` maps to `progress`. */
export type InquiryStatus = 'new' | 'progress' | 'closed';

export type InquiryTimelineStepState = 'done' | 'current' | 'todo';

export interface InquiryTimelineStep {
  id: string;
  title: string;
  hint: string;
  state: InquiryTimelineStepState;
  date: string;
  time: string;
}

export interface InquiryStamp {
  date: string;
  time: string;
}

export interface InquiryNote extends InquiryStamp {
  id: string;
  body: string;
  author: string;
}

export interface InquiryReply extends InquiryStamp {
  id: string;
  body: string;
  author: string;
}

export interface InquiryStatsMetric {
  value: number;
  previous: number | null;
  changePct: number | null;
}

export interface InquiryStats {
  total: InquiryStatsMetric;
  new: InquiryStatsMetric;
  progress: InquiryStatsMetric;
  closed: InquiryStatsMetric;
}

export interface Inquiry {
  /** Numeric API id (string) used in routes and HTTP paths. */
  id: string;
  /** Display reference, e.g. REQ-00042. */
  reference: string;
  customer: string;
  org: string;
  phone: string;
  email: string;
  /** Product title (inquiries) or service name (project requests). */
  product: string;
  status: InquiryStatus;
  date: string;
  time: string;
  body: string;
  notes: InquiryNote[];
  replies: InquiryReply[];
  /** First reply for header / legacy single-card UI. */
  reply: InquiryReply | null;
  timeline: InquiryTimelineStep[];
}

export type InquiryInbox = 'inquiries' | 'project_requests';
