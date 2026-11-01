import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { Tooltip } from 'primeng/tooltip';

import { LanguageService } from '../../../../core/services/language.service';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import {
  type DataTableBadgeValue,
  type DataTableColumn,
  type DataTableDateValue,
  type DataTableFilterOption,
  type DataTableIconValue,
} from '../../../../shared/components/data-table/data-table.model';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { StatisticsCards } from '../../../../shared/components/statistics-cards/statistics-cards';
import { type StatisticsCard } from '../../../../shared/components/statistics-cards/statistics-card.model';
import { type Inquiry, type InquiryStatus } from '../../models/inquiry.model';
import { InquiriesService } from '../../services/inquiries.service';

interface InquiryRow {
  id: string;
  name: DataTableIconValue;
  org: DataTableIconValue;
  phone: string;
  product: string;
  status: DataTableBadgeValue & { value: InquiryStatus };
  when: DataTableDateValue;
}

@Component({
  selector: 'app-inquiries-board',
  imports: [
    DatePickerModule,
    FormsModule,
    PageHeader,
    SectionEmpty,
    StatisticsCards,
    DataTable,
    Tooltip,
  ],
  templateUrl: './inquiries-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiriesBoard {
  private readonly api = inject(InquiriesService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly pageTitle = input('', {
    transform: (value: string | undefined) => value ?? '',
  });

  readonly pageTitleKey = input('', {
    transform: (value: string | undefined) => value ?? '',
  });

  readonly detailPath = input('/contact/inquiries', {
    transform: (value: string | undefined) => value ?? '/contact/inquiries',
  });

  readonly heading = computed(() => {
    this.lang.language();
    const custom = this.pageTitle().trim();
    if (custom) {
      return custom;
    }
    const key = this.pageTitleKey().trim();
    if (key) {
      return this.lang.t(key);
    }
    return this.lang.t('nav.inquiries');
  });

  readonly query = signal('');
  readonly selectedFilters = signal<string[]>([]);

  readonly dateFilter = signal<string | null>(null);
  private readonly source = signal<Inquiry[]>([]);

  readonly isEmpty = computed(() => this.loaded() && this.source().length === 0);
  readonly loaded = signal(false);

  constructor() {
    this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rows) => {
        this.source.set(rows);
        this.loaded.set(true);
      });
  }

  readonly cards = computed<StatisticsCard[]>(() => {
    const ar = this.lang.language() === 'ar';
    const caption = ar ? 'مقارنة بالأمس' : 'Compared with yesterday';
    return [
      this.card(
        'total',
        ar ? 'إجمالي الطلبات' : 'Total requests',
        'pi pi-users',
        '#16a34a',
        '#dcfce7',
        caption,
      ),
      this.card(
        'fresh',
        ar ? 'طلبات جديدة' : 'New requests',
        'pi pi-inbox',
        '#3b82f6',
        '#dbeafe',
        caption,
      ),
      this.card(
        'progress',
        ar ? 'طلبات قيد المتابعة' : 'Requests in progress',
        'pi pi-headphones',
        '#f59e0b',
        '#ffedd5',
        caption,
      ),
      this.card(
        'closed',
        ar ? 'طلبات مغلقة' : 'Closed requests',
        'pi pi-comment',
        '#e11d48',
        '#ffe4e6',
        caption,
      ),
    ];
  });

  readonly filters = computed<DataTableFilterOption[]>(() => {
    const ar = this.lang.language() === 'ar';
    return [
      { value: 'all', label: ar ? 'كل الحالات' : 'All statuses', selectAll: true },
      { value: 'new', label: this.lang.t('inquiry.statusNew') },
      { value: 'progress', label: this.lang.t('inquiry.statusProgress') },
      { value: 'closed', label: this.lang.t('inquiry.statusClosed') },
    ];
  });

  readonly columns = computed<DataTableColumn<InquiryRow>[]>(() => {
    const ar = this.lang.language() === 'ar';
    return [
      { key: 'id', header: 'ID', field: 'id', width: '140px' },
      { key: 'name', header: ar ? 'الاسم' : 'Name', field: 'name', kind: 'icon-text' },
      {
        key: 'org',
        header: ar ? 'الجهة / الشركة' : 'Organization',
        field: 'org',
        kind: 'icon-text',
      },
      {
        key: 'phone',
        header: ar ? 'رقم الهاتف' : 'Phone',
        field: 'phone',
        dir: 'ltr',
        width: '150px',
      },
      {
        key: 'product',
        header: ar ? 'المنتج' : 'Product',
        field: 'product',
        sortable: true,
        width: '110px',
      },
      {
        key: 'status',
        header: ar ? 'الحالة' : 'Status',
        field: 'status',
        kind: 'badge',
        width: '150px',
      },
      {
        key: 'when',
        header: ar ? 'التاريخ' : 'Date',
        field: 'when',
        kind: 'datetime',
        width: '240px',
      },
    ];
  });

  readonly rows = computed(() => {
    const query = this.query().trim();
    const selected = this.selectedFilters();
    const day = this.dateFilter();
    return this.source()
      .filter((row) => {
        const statusOk = selected.length === 0 || selected.includes(row.status);
        const dateOk = !day || row.date.slice(0, 10) === day;
        const haystack = `${row.id} ${row.customer} ${row.org} ${row.phone} ${row.product}`;
        return statusOk && dateOk && (!query || haystack.includes(query));
      })
      .map((row) => this.toRow(row));
  });

  protected setDateFilter(value: string | Date | null): void {
    if (!value) {
      this.dateFilter.set(null);
      return;
    }
    if (value instanceof Date) {
      const y = value.getFullYear();
      const m = `${value.getMonth() + 1}`.padStart(2, '0');
      const d = `${value.getDate()}`.padStart(2, '0');
      this.dateFilter.set(`${y}-${m}-${d}`);
      return;
    }
    this.dateFilter.set(value.slice(0, 10) || null);
  }

  protected exported(rows: readonly InquiryRow[]): void {
    this.messages.add({
      severity: 'success',
      summary: this.lang.language() === 'ar' ? `تصدير ${rows.length}` : `Export ${rows.length}`,
    });
  }

  protected open(row: InquiryRow): void {
    void this.router.navigate([this.detailPath(), row.id]);
  }

  private toRow(row: Inquiry): InquiryRow {
    return {
      id: row.id,
      name: { icon: 'pi pi-user', label: row.customer },
      org: { icon: 'pi pi-building', label: row.org },
      phone: row.phone,
      product: row.product,
      status: {
        value: row.status,
        label: this.lang.t(this.statusKey(row.status)),
        tone: row.status,
      },
      when: { date: row.date, time: row.time },
    };
  }

  private statusKey(
    status: InquiryStatus,
  ): 'inquiry.statusNew' | 'inquiry.statusProgress' | 'inquiry.statusClosed' {
    if (status === 'progress') {
      return 'inquiry.statusProgress';
    }
    return status === 'closed' ? 'inquiry.statusClosed' : 'inquiry.statusNew';
  }

  private card(
    id: string,
    title: string,
    icon: string,
    iconColor: string,
    iconBackground: string,
    caption: string,
  ): StatisticsCard {
    return { id, title, value: '1,284', icon, iconColor, iconBackground, trend: 12.5, caption };
  }
}
