/** Backend project-request statuses (OpenAPI `/admin/project-requests`). */
export type ProjectRequestApiStatus = 'new' | 'in_progress' | 'closed';

export interface ProjectRequestRelatedServiceDto {
  id: number | null;
  name: string;
}

export interface ProjectRequestAuthorDto {
  id: number;
  name: string;
}

export interface ProjectRequestNoteDto {
  id: number;
  body: string;
  author: ProjectRequestAuthorDto | null;
  created_at: string;
}

export interface ProjectRequestReplyDto {
  id: number;
  body: string;
  emailed_at: string | null;
  author: ProjectRequestAuthorDto | null;
  created_at: string;
}

export interface ProjectRequestTimelineStepDto {
  key: string;
  state: 'done' | 'current' | 'pending';
  title: string;
  description: string;
  at: string | null;
  by: string | null;
}

/** List row — project requests expose `service`, never invent a product. */
export interface ProjectRequestListDto {
  id: number;
  reference: string;
  type: 'project_request';
  status: ProjectRequestApiStatus;
  name: string;
  organization: string;
  phone: string;
  email: string | null;
  service?: ProjectRequestRelatedServiceDto | null;
  message: string | null;
  close_note: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Detail payload — notes, replies, timeline. */
export interface ProjectRequestDetailDto extends ProjectRequestListDto {
  closed_by?: ProjectRequestAuthorDto | null;
  notes: ProjectRequestNoteDto[];
  replies: ProjectRequestReplyDto[];
  timeline: ProjectRequestTimelineStepDto[];
}

export interface ProjectRequestStatMetricDto {
  value: number;
  previous: number | null;
  change_pct: number | null;
}

export interface ProjectRequestStatsDto {
  total: ProjectRequestStatMetricDto;
  new: ProjectRequestStatMetricDto;
  in_progress: ProjectRequestStatMetricDto;
  closed: ProjectRequestStatMetricDto;
}

export interface ProjectRequestStatusWriteDto {
  status: ProjectRequestApiStatus;
  note?: string | null;
}

export interface ProjectRequestNoteWriteDto {
  body: string;
}

export interface ProjectRequestReplyWriteDto {
  body: string;
}
