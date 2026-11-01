import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Checkbox } from 'primeng/checkbox';
import { Popover } from 'primeng/popover';
import { ToggleSwitch } from 'primeng/toggleswitch';

import type { AppLanguage } from '../../../../../../core/i18n/language';
import { LanguageService } from '../../../../../../core/services/language.service';
import { AppButton } from '../../../../../../shared/components/app-button/app-button';
import { StateView } from '../../../../../../shared/components/state-view/state-view';
import { formatIsoDate } from '../../../../../../shared/utils/date';
import type {
  FaqCategory,
  FaqCategoryId,
  FaqItem,
  FaqLocaleText,
} from '../../../../models/faq.model';

type StatusFilter = 'active' | 'inactive' | 'closed';

interface StatusFilterOption {
  value: StatusFilter | 'all';
  label: string;
  selectAll?: boolean;
}

@Component({
  selector: 'app-faq-categories-panel',
  imports: [FormsModule, AppButton, Checkbox, Popover, StateView, ToggleSwitch],
  templateUrl: './faq-categories-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqCategoriesPanel {
  readonly lang = inject(LanguageService);

  readonly categories = input.required<readonly FaqCategory[]>();
  readonly items = input.required<readonly FaqItem[]>();
  readonly showEdit = input(true);
  readonly showDelete = input(true);
  readonly showPublish = input(true);

  readonly edit = output<FaqCategory>();
  readonly remove = output<FaqCategory>();
  readonly publishedChange = output<{ category: FaqCategory; published: boolean }>();

  readonly query = signal('');
  readonly searchOpen = signal(false);
  readonly filterOpen = signal(false);
  readonly selectedStatuses = signal<readonly StatusFilter[]>(['active']);

  readonly statusFilters = computed<readonly StatusFilterOption[]>(() => {
    this.lang.language();
    return [
      { value: 'all', label: this.lang.t('faq.allStatuses'), selectAll: true },
      { value: 'active', label: this.lang.t('faq.active') },
      { value: 'inactive', label: this.lang.t('faq.inactive') },
      { value: 'closed', label: this.lang.t('faq.closed') },
    ];
  });

  readonly filterLabel = computed(() => {
    this.lang.language();
    const selected = this.selectedStatuses();
    if (selected.length === 1 && selected[0] === 'active') {
      return this.lang.t('faq.activeCategory');
    }
    if (selected.length === 0 || selected.length === 3) {
      return this.lang.t('faq.allStatuses');
    }
    if (selected.length === 1) {
      const key =
        selected[0] === 'inactive'
          ? 'faq.inactive'
          : selected[0] === 'closed'
            ? 'faq.closed'
            : 'faq.active';
      return this.lang.t(key);
    }
    return this.lang.t('faq.allStatuses');
  });

  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    const statuses = this.selectedStatuses();
    const locale = this.lang.language();
    return [...this.categories()]
      .filter((category) => this.matchesStatus(category, statuses))
      .filter((category) => {
        if (!query) {
          return true;
        }
        const haystack = `${category.name[locale]} ${category.code}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => a.order - b.order);
  });

  readonly countLabel = computed(() => {
    this.lang.language();
    return this.lang.t('faq.categoriesCount').replace('{count}', `${this.filtered().length}`);
  });

  protected text(value: FaqLocaleText, locale: AppLanguage = this.lang.language()): string {
    return value[locale] || value.ar || value.en;
  }

  protected questionsCount(id: FaqCategoryId): string {
    const count = this.items().filter((item) => item.categoryId === id).length;
    return `${count}`.padStart(2, '0');
  }

  protected stamp(category: FaqCategory): string {
    const date = formatIsoDate(category.createdAt, this.lang.language());
    const time = this.lang.language() === 'ar' ? '12:00 م' : '12:00 PM';
    return `${time} - ${date}`;
  }

  protected onPublished(category: FaqCategory, published: boolean): void {
    this.publishedChange.emit({ category, published });
  }

  protected checked(option: StatusFilterOption): boolean {
    const selected = this.selectedStatuses();
    if (option.selectAll) {
      return selected.length === 3;
    }
    return selected.includes(option.value as StatusFilter);
  }

  protected setOption(option: StatusFilterOption, on: boolean): void {
    if (option.selectAll) {
      this.selectedStatuses.set(on ? ['active', 'inactive', 'closed'] : []);
      return;
    }
    const value = option.value as StatusFilter;
    const next = new Set(this.selectedStatuses());
    if (on) {
      next.add(value);
    } else {
      next.delete(value);
    }
    const order: readonly StatusFilter[] = ['active', 'inactive', 'closed'];
    this.selectedStatuses.set(order.filter((item) => next.has(item)));
  }

  protected toggleSearch(): void {
    this.searchOpen.update((open) => !open);
  }

  protected onQuery(event: Event): void {
    const target = event.target;
    const value = target instanceof HTMLInputElement ? target.value : '';
    this.query.set(value);
  }

  private matchesStatus(category: FaqCategory, statuses: readonly StatusFilter[]): boolean {
    if (statuses.length === 0 || statuses.length === 3) {
      return true;
    }
    const active = statuses.includes('active') && category.published;
    const inactive = statuses.includes('inactive') && !category.published;

    return active || inactive;
  }
}
