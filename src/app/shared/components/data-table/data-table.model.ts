export type DataTableBadgeTone = 'new' | 'progress' | 'closed' | 'neutral';

export interface DataTableBadgeValue {
  label: string;
  tone: DataTableBadgeTone;
}

export interface DataTableIconValue {
  icon: string;
  label: string;
}

/** Already formatted date and time. The feature owns the locale formatting. */
export interface DataTableDateValue {
  date: string;
  time?: string;
}

export interface DataTableFilterOption {
  value: string;
  label: string;
  /** Checking this option selects every other option. Unchecking it clears them. */
  selectAll?: boolean;
}

export interface DataTableColumn<T = unknown> {
  key: string;
  header: string;
  field?: keyof T & string;
  width?: string;
  sortable?: boolean;
  /** Keeps phone numbers and other Latin values from flipping in RTL. */
  dir?: 'ltr' | 'rtl';
  kind?: 'text' | 'badge' | 'icon-text' | 'datetime';
}

export interface DataTableCellContext<T> {
  $implicit: T;
  row: T;
  column: DataTableColumn<T>;
  value: unknown;
}
