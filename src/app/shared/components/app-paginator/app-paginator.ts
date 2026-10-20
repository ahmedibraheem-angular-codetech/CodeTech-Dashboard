import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { Paginator, type PaginatorState } from 'primeng/paginator';

export type { PaginatorState as AppPaginatorState } from 'primeng/paginator';

const DEFAULT_PAGE_SIZES: number[] = [10, 20, 50];


@Component({
  selector: 'app-paginator',
  imports: [Paginator],
  templateUrl: './app-paginator.html',
  styleUrl: './app-paginator.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-paginator' },
})
export class AppPaginator {
  readonly first = input(0);
  readonly rows = input(10);
  readonly totalRecords = input(0);
  readonly rowsPerPageOptions = input<number[]>(DEFAULT_PAGE_SIZES);
  readonly showCurrentPageReport = input(true);
  readonly showPageLinks = input(true);
  readonly showFirstLastIcon = input(false);
  readonly alwaysShow = input(true);
  readonly currentPageReportTemplate = input('عرض {currentPage} من {rows}');
  readonly styleClass = input<string>();

  readonly pageChange = output<PaginatorState>();

  protected onPrimePageChange(event: PaginatorState): void {
    this.pageChange.emit(event);
  }
}
