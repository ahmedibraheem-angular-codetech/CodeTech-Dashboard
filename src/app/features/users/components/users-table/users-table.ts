import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { type PaginatorState } from 'primeng/paginator';
import { Popover } from 'primeng/popover';
import { Select } from 'primeng/select';

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { AppPaginator } from '../../../../shared/components/app-paginator/app-paginator';
import {
  DataTable,
  DataTableCellTemplate,
} from '../../../../shared/components/data-table/data-table';
import type {
  DataTableBadgeValue,
  DataTableColumn,
  DataTableDateValue,
  DataTableIconValue,
} from '../../../../shared/components/data-table/data-table.model';
import type { User, UserRole, UserStatus } from '../../models/user.model';

export interface UsersTableRow {
  id: string;
  code: string;
  name: DataTableIconValue;
  role: DataTableBadgeValue;
  email: string;
  status: DataTableBadgeValue;
  activity: DataTableDateValue;
  source: User;
}

export interface UsersTableOption<T extends string> {
  label: string;
  value: T;
}

/**
 * Users list table: filters, rows, row actions menu, and pagination.
 * Parent owns data loading, row mapping, and CRUD/navigation handlers.
 */
@Component({
  selector: 'app-users-table',
  imports: [
    FormsModule,
    AppButton,
    Select,
    Popover,
    DataTable,
    DataTableCellTemplate,
    AppPaginator,
  ],
  templateUrl: './users-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersTable {
  private readonly menu = viewChild.required(Popover);
  readonly lang = inject(LanguageService);

  readonly title = input.required<string>();
  readonly rows = input.required<readonly UsersTableRow[]>();
  readonly columns = input.required<readonly DataTableColumn<UsersTableRow>[]>();
  readonly totalRecords = input.required<number>();
  readonly roleOptions = input.required<UsersTableOption<UserRole | 'all'>[]>();
  readonly statusOptions = input.required<UsersTableOption<UserStatus | 'all'>[]>();

  readonly query = model.required<string>();
  readonly role = model.required<UserRole | 'all'>();
  readonly status = model.required<UserStatus | 'all'>();
  readonly first = model.required<number>();
  readonly pageSize = model.required<number>();

  readonly rowClick = output<UsersTableRow>();
  readonly exportRows = output<readonly UsersTableRow[]>();
  readonly view = output<User>();
  readonly edit = output<User>();
  readonly remove = output<User>();

  readonly menuUser = signal<User | null>(null);

  protected page(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.pageSize.set(event.rows ?? this.pageSize());
  }

  protected openMenu(event: Event, user: User): void {
    event.stopPropagation();
    this.menuUser.set(user);
    this.menu().toggle(event);
  }

  protected closeMenu(): void {
    this.menuUser.set(null);
    this.menu().hide();
  }

  protected onView(user: User): void {
    this.closeMenu();
    this.view.emit(user);
  }

  protected onEdit(user: User): void {
    this.closeMenu();
    this.edit.emit(user);
  }

  protected onRemove(user: User): void {
    this.closeMenu();
    this.remove.emit(user);
  }
}
