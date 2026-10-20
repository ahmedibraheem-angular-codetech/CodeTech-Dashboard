import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Paginator, type PaginatorState } from 'primeng/paginator';

import { AppPaginator } from './app-paginator';

@Component({
  imports: [AppPaginator],
  template: `
    <ul>
      @for (item of visible; track item) {
        <li>{{ item }}</li>
      }
    </ul>
    <app-paginator
      [first]="first"
      [rows]="rows"
      [totalRecords]="items.length"
      (pageChange)="onPage($event)"
    />
  `,
})
class ListHost {
  items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  first = 0;
  rows = 10;
  last: PaginatorState | undefined;

  get visible(): number[] {
    return this.items.slice(this.first, this.first + this.rows);
  }

  onPage(event: PaginatorState): void {
    this.last = event;
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
  }
}

@Component({
  imports: [AppPaginator],
  template: `
    <app-paginator
      [first]="first"
      [rows]="rows"
      [totalRecords]="total"
      (pageChange)="events.push($event)"
    />
  `,
})
class ControlledHost {
  first = 0;
  rows = 10;
  total = 30;
  events: PaginatorState[] = [];
}

describe('AppPaginator', () => {
  function render(inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [AppPaginator] });
    const fixture = TestBed.createComponent(AppPaginator);
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
    return {
      fixture,
      host: fixture.nativeElement as HTMLElement,
      component: fixture.componentInstance,
      prime: () =>
        fixture.debugElement.query(By.directive(Paginator)).componentInstance as Paginator,
    };
  }

  it('renders the default catalog paginator without first/last icons', () => {
    const { host, prime } = render({ totalRecords: 30 });
    expect(host.classList.contains('app-paginator')).toBe(true);
    expect(host.querySelector('p-paginator')).not.toBeNull();
    expect(host.textContent).toContain('عرض');
    expect(prime().first).toBe(0);
    expect(prime().rows).toBe(10);
    expect(prime().showFirstLastIcon).toBe(false);
    expect(prime().alwaysShow).toBe(true);
    expect(host.querySelector('.p-paginator-first')).toBeNull();
    expect(host.querySelector('.p-paginator-last')).toBeNull();
  });

  it('emits pageChange with first, rows and page when the next page is opened', () => {
    const events: PaginatorState[] = [];
    const { fixture, host, component } = render({ totalRecords: 30 });
    fixture.componentInstance.pageChange.subscribe((event) => events.push(event));

    const next = host.querySelector('.p-paginator-next') as HTMLButtonElement;
    expect(next.disabled).toBe(false);
    next.click();
    fixture.detectChanges();

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({ first: 10, rows: 10, page: 1, pageCount: 3 }),
    );
    expect(component.first()).toBe(0);
  });

  it('emits the new rows value when the page size changes', () => {
    const events: PaginatorState[] = [];
    const { fixture, prime } = render({ totalRecords: 50, first: 0, rows: 10 });
    fixture.componentInstance.pageChange.subscribe((event) => events.push(event));

    prime().rows = 20;
    prime().onRppChange(new Event('change'));
    fixture.detectChanges();

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(expect.objectContaining({ first: 0, rows: 20, page: 0 }));
  });

  it('still renders when the list is empty and does not emit on next', () => {
    const events: PaginatorState[] = [];
    const { fixture, host } = render({ totalRecords: 0, alwaysShow: true });
    fixture.componentInstance.pageChange.subscribe((event) => events.push(event));

    expect(host.querySelector('p-paginator')).not.toBeNull();
    const next = host.querySelector('.p-paginator-next') as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    next.click();
    fixture.detectChanges();
    expect(events).toHaveLength(0);
  });

  it('reflects parent first and rows updates without keeping a private copy', () => {
    const { fixture, prime, component } = render({ first: 0, rows: 10, totalRecords: 40 });
    expect(prime().first).toBe(0);

    fixture.componentRef.setInput('first', 20);
    fixture.componentRef.setInput('rows', 20);
    fixture.detectChanges();

    expect(component.first()).toBe(20);
    expect(component.rows()).toBe(20);
    expect(prime().first).toBe(20);
    expect(prime().rows).toBe(20);
  });

  it('pages a sliced list once — parent slice is the only pagination', () => {
    TestBed.configureTestingModule({ imports: [ListHost] });
    const fixture = TestBed.createComponent(ListHost);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('li')).toHaveLength(10);
    expect(host.querySelectorAll('app-paginator')).toHaveLength(1);
    expect(host.querySelectorAll('p-paginator')).toHaveLength(1);

    const next = host.querySelector('.p-paginator-next') as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    const items = [...host.querySelectorAll('li')].map((node) => node.textContent?.trim());
    expect(items).toEqual(['11', '12']);
    expect(fixture.componentInstance.first).toBe(10);
    expect(fixture.componentInstance.last).toEqual(
      expect.objectContaining({ first: 10, rows: 10, page: 1 }),
    );
  });

  it('does not write first or rows unless the parent applies the emitted state', () => {
    TestBed.configureTestingModule({ imports: [ControlledHost] });
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();

    const next = (fixture.nativeElement as HTMLElement).querySelector(
      '.p-paginator-next',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.events[0]).toEqual(
      expect.objectContaining({ first: 10, rows: 10, page: 1 }),
    );
    expect(fixture.componentInstance.first).toBe(0);
    expect(fixture.componentInstance.rows).toBe(10);
  });
});
