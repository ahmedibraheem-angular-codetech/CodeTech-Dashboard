import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DataTable, DataTableCellTemplate } from './data-table';
import { DataTableColumn, DataTableFilterOption } from './data-table.model';

interface Row {
  id: string;
  name: string;
  status: { label: string; tone: 'new' };
}

@Component({
  imports: [DataTable, DataTableCellTemplate],
  template: `
    <app-data-table
      title="Inquiries"
      exportLabel="Export"
      filterLabel="All"
      searchLabel="Search"
      [rows]="visible()"
      [columns]="columns"
      [filters]="filters"
      [(query)]="query"
      [(selectedFilters)]="selected"
      (export)="exported.set($event.length)"
    >
      <ng-template appDataCell="name" let-row>
        <strong class="custom-name">{{ row.name }}</strong>
      </ng-template>
    </app-data-table>
  `,
})
class Host {
  readonly query = signal('');
  readonly selected = signal<string[]>([]);
  readonly exported = signal(0);
  readonly columns: DataTableColumn<Row>[] = [
    { key: 'id', header: 'ID', field: 'id' },
    { key: 'name', header: 'Name', field: 'name' },
    { key: 'status', header: 'Status', field: 'status', kind: 'badge' },
  ];
  readonly filters: DataTableFilterOption[] = [
    { value: 'all', label: 'All', selectAll: true },
    { value: 'new', label: 'New' },
    { value: 'closed', label: 'Closed' },
  ];
  readonly rows: Row[] = [
    { id: '1', name: 'Youssef', status: { label: 'New', tone: 'new' } },
    { id: '2', name: 'Sara', status: { label: 'New', tone: 'new' } },
  ];
  readonly visible = signal(this.rows);
}

describe('DataTable', () => {
  function render() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture;
  }

  it('renders columns, a badge, and a custom cell template', () => {
    const fixture = render();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('h2')?.textContent).toContain('Inquiries');
    expect(root.textContent).toContain('Youssef');
    expect(root.querySelector('.custom-name')?.textContent).toBe('Youssef');
    expect(root.querySelector('.dt-badge--new')?.textContent).toContain('New');
  });

  it('selects every filter option from the select-all checkbox and emits export', () => {
    const fixture = render();
    const table = fixture.debugElement.children[0].componentInstance as DataTable<Row>;

    table['setOption'](fixture.componentInstance.filters[0], true);
    expect(fixture.componentInstance.selected()).toEqual(['new', 'closed']);

    table['setOption'](fixture.componentInstance.filters[1], false);
    expect(fixture.componentInstance.selected()).toEqual(['closed']);
    expect(table['checked'](fixture.componentInstance.filters[0])).toBe(false);

    table['exportRows']();
    expect(fixture.componentInstance.exported()).toBe(2);
  });
});
