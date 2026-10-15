import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';

import { LanguageService } from '../../../../core/services/language.service';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import {
  DataTableBadgeValue,
  DataTableColumn,
  DataTableDateValue,
  DataTableFilterOption,
  DataTableIconValue,
} from '../../../../shared/components/data-table/data-table.model';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatisticsCards } from '../../../../shared/components/statistics-cards/statistics-cards';
import { StatisticsCard } from '../../../../shared/components/statistics-cards/statistics-card.model';

interface Inquiry {
  id: string;
  name: DataTableIconValue;
  org: DataTableIconValue;
  phone: string;
  product: string;
  status: DataTableBadgeValue & { value: string };
  when: DataTableDateValue;
}

const STATUSES = ['new', 'progress', 'closed'] as const;

/** Illustrative inquiries screen. The shared widgets stay free of this sample. */
@Component({
  selector: 'app-inquiries-board',
  imports: [PageHeader, StatisticsCards, DataTable],
  templateUrl: './inquiries-board.html',
  styleUrl: './inquiries-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiriesBoard {
  private readonly messages = inject(MessageService);
  readonly lang = inject(LanguageService);

  readonly query = signal('');
  readonly selectedFilters = signal<string[]>([]);

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
      { value: 'new', label: ar ? 'جديد' : 'New' },
      { value: 'progress', label: ar ? 'قيد المتابعة' : 'In progress' },
      { value: 'closed', label: ar ? 'مغلق' : 'Closed' },
    ];
  });

  readonly columns = computed<DataTableColumn<Inquiry>[]>(() => {
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

  private readonly source: Inquiry[] = Array.from({ length: 8 }, (_, index) => {
    const status = STATUSES[index % STATUSES.length];
    return {
      id: 'REQ-00000',
      name: { icon: 'pi pi-user', label: 'يوسف احمد' },
      org: { icon: 'pi pi-building', label: 'كود التقنية' },
      phone: '+2040798140',
      product: 'الما',
      status: {
        value: status,
        label: status === 'new' ? 'جديد' : status === 'progress' ? 'قيد المتابعة' : 'مغلق',
        tone: status,
      },
      when: { date: '2026-03-18', time: '12:00 ظهراً' },
    };
  });

  readonly rows = computed(() => {
    const query = this.query().trim();
    const selected = this.selectedFilters();
    return this.source.filter((row) => {
      const statusOk = selected.length === 0 || selected.includes(row.status.value);
      const haystack = `${row.id} ${row.name.label} ${row.org.label} ${row.phone} ${row.product}`;
      return statusOk && (!query || haystack.includes(query));
    });
  });

  protected exported(rows: readonly Inquiry[]): void {
    this.messages.add({
      severity: 'success',
      summary: this.lang.language() === 'ar' ? `تصدير ${rows.length}` : `Export ${rows.length}`,
    });
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
