export type DataTableBadgeTone = 'new' | 'progress' | 'closed' | 'neutral';

export interface DataTableBadgeValue {
  label: string;
  tone: DataTableBadgeTone;
}

export interface DataTableIconValue {
  icon: string;
  label: string;
}

export interface DataTableDateValue {
  date: string;
  time?: string;
}

export interface DataTableFilterOption {
  value: string;
  label: string;

  selectAll?: boolean;
}

export interface DataTableColumn<T = unknown> {
  key: string;
  header: string;
  field?: keyof T & string;
  width?: string;
  sortable?: boolean;

  dir?: 'ltr' | 'rtl';
  kind?: 'text' | 'badge' | 'icon-text' | 'datetime';
}

export interface DataTableCellContext<T> {
  $implicit: T;
  row: T;
  column: DataTableColumn<T>;
  value: unknown;
}
