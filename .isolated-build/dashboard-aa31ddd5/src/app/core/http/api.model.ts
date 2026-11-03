
export interface ApiEnvelope<T> {
  data: T;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedEnvelope<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export interface FileObject {
  uuid: string;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
  download_url: string;
  created_at: string;
}
