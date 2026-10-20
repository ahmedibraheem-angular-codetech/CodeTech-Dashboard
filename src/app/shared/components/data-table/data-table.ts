import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  contentChildren,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Checkbox } from 'primeng/checkbox';
import { Popover } from 'primeng/popover';
import { TableModule } from 'primeng/table';

import { LanguageService } from '../../../core/services/language.service';
import { AppButton } from '../app-button/app-button';
import {
  DataTableBadgeValue,
  DataTableCellContext,
  DataTableColumn,
  DataTableDateValue,
  DataTableFilterOption,
  DataTableIconValue,
} from './data-table.model';

/** Marks a custom cell. `appDataCell` is the column `key`. */
@Directive({
  selector: 'ng-template[appDataCell]',
})
export class DataTableCellTemplate<T = unknown> {
  readonly appDataCell = input.required<string>();
  readonly template = inject(TemplateRef<DataTableCellContext<T>>);
}

@Component({
  selector: 'app-data-table',
  imports: [FormsModule, NgTemplateOutlet, TableModule, AppButton, Popover, Checkbox],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T extends object = Record<string, unknown>> {
  private readonly lang = inject(LanguageService);
  private readonly cellTemplates = contentChildren(DataTableCellTemplate);

  readonly title = input('');
  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly DataTableColumn<T>[]>();
  readonly dataKey = input('id');
  readonly loading = input(false);
  readonly emptyMessage = input('');

  readonly exportLabel = input('');
  readonly showExport = input(true);
  readonly filterLabel = input('');
  readonly filters = input<readonly DataTableFilterOption[]>([]);
  readonly searchLabel = input('');
  readonly showSearch = input(true);

  readonly paginator = input(false);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<number[]>([10, 20, 50]);
  readonly selectionMode = input<'single' | 'multiple' | null>(null);
  /** When true, a row click emits `rowClick`. Toolbar and cell controls stay on the parent. */
  readonly rowClickable = input(false);

  readonly query = model('');
  readonly selectedFilters = model<readonly string[]>([]);
  readonly selection = model<T | T[] | null>(null);

  readonly export = output<readonly T[]>();
  readonly queryChange = output<string>();
  readonly selectedFiltersChange = output<readonly string[]>();
  readonly rowClick = output<T>();

  protected readonly searchOpen = signal(false);
  protected readonly filterOpen = signal(false);

  protected templateFor(key: string): TemplateRef<DataTableCellContext<T>> | null {
    const match = this.cellTemplates().find((item) => item.appDataCell() === key);
    return (match?.template as TemplateRef<DataTableCellContext<T>> | undefined) ?? null;
  }

  protected tableRows(): T[] {
    return [...this.rows()];
  }

  protected valueOf(row: T, column: DataTableColumn<T>): unknown {
    if (!column.field) {
      return null;
    }
    return row[column.field];
  }

  protected textOf(value: unknown): string {
    if (value == null) {
      return '';
    }
    return String(value);
  }

  protected badgeOf(value: unknown): DataTableBadgeValue | null {
    if (!this.has(value, 'label') || !this.has(value, 'tone')) {
      return null;
    }
    return value as unknown as DataTableBadgeValue;
  }

  protected iconOf(value: unknown): DataTableIconValue | null {
    if (!this.has(value, 'icon') || !this.has(value, 'label')) {
      return null;
    }
    return value as unknown as DataTableIconValue;
  }

  protected dateOf(value: unknown): DataTableDateValue | null {
    if (!this.has(value, 'date')) {
      return null;
    }
    return value as unknown as DataTableDateValue;
  }

  protected checked(option: DataTableFilterOption): boolean {
    const selected = this.selectedFilters();
    if (option.selectAll) {
      const values = this.optionValues();
      return values.length > 0 && values.every((value) => selected.includes(value));
    }
    return selected.includes(option.value);
  }

  protected setOption(option: DataTableFilterOption, on: boolean): void {
    const values = this.optionValues();
    if (option.selectAll) {
      this.commit(on ? values : []);
      return;
    }
    const next = new Set(this.selectedFilters());
    if (on) {
      next.add(option.value);
    } else {
      next.delete(option.value);
    }
    this.commit(values.filter((value) => next.has(value)));
  }

  protected toggleSearch(): void {
    this.searchOpen.update((open) => !open);
  }

  protected onQuery(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.queryChange.emit(value);
  }

  protected exportRows(): void {
    this.export.emit(this.rows());
  }

  protected onRowClick(event: Event, row: T): void {
    if (!this.rowClickable()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, .p-checkbox, .p-button')) {
      return;
    }
    this.rowClick.emit(row);
  }

  protected emptyText(): string {
    return this.emptyMessage() || this.lang.t('common.empty');
  }

  private optionValues(): string[] {
    return this.filters()
      .filter((option) => !option.selectAll)
      .map((option) => option.value);
  }

  private commit(values: readonly string[]): void {
    this.selectedFilters.set(values);
    this.selectedFiltersChange.emit(values);
  }

  private has(value: unknown, key: string): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && key in value;
  }
}
