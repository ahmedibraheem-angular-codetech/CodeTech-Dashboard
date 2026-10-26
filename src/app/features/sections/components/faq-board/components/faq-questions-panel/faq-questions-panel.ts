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
import { type PaginatorState } from 'primeng/paginator';
import { ToggleSwitch } from 'primeng/toggleswitch';

import type { AppLanguage } from '../../../../../../core/i18n/language';
import { LanguageService } from '../../../../../../core/services/language.service';
import { AppButton } from '../../../../../../shared/components/app-button/app-button';
import { AppPaginator } from '../../../../../../shared/components/app-paginator/app-paginator';
import { StateView } from '../../../../../../shared/components/state-view/state-view';
import { formatIsoDate } from '../../../../../../shared/utils/date';
import type {
  FaqCategory,
  FaqCategoryId,
  FaqItem,
  FaqLocaleText,
} from '../../../../models/faq.model';

/**
 * Questions tab panel. Owns search, category filter, and pagination UI state.
 * Parent supplies items/categories and handles edit/delete/publish API actions.
 */
@Component({
  selector: 'app-faq-questions-panel',
  imports: [FormsModule, AppButton, AppPaginator, StateView, ToggleSwitch],
  templateUrl: './faq-questions-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqQuestionsPanel {
  readonly lang = inject(LanguageService);

  readonly items = input.required<readonly FaqItem[]>();
  readonly categories = input.required<readonly FaqCategory[]>();

  readonly edit = output<FaqItem>();
  readonly remove = output<FaqItem>();
  readonly publishedChange = output<{ item: FaqItem; published: boolean }>();

  readonly query = signal('');
  readonly searchOpen = signal(false);
  readonly categoryFilter = signal<'all' | FaqCategoryId>('all');
  readonly first = signal(0);
  readonly pageSize = signal(10);

  readonly filterChips = computed(() => {
    this.lang.language();
    return [
      { value: 'all' as const, label: this.lang.t('faq.allCategories') },
      ...this.categories().map((category) => ({
        value: category.id,
        label: this.text(category.name),
      })),
    ];
  });

  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.categoryFilter();
    const locale = this.lang.language();
    return this.items()
      .filter((item) => filter === 'all' || item.categoryId === filter)
      .filter((item) => {
        if (!query) {
          return true;
        }
        const haystack = `${item.question[locale]} ${item.answer[locale]}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => a.order - b.order);
  });

  readonly paged = computed(() =>
    this.filtered().slice(this.first(), this.first() + this.pageSize()),
  );

  readonly countLabel = computed(() => {
    this.lang.language();
    return this.lang.t('faq.count').replace('{count}', `${this.filtered().length}`);
  });

  protected text(value: FaqLocaleText, locale: AppLanguage = this.lang.language()): string {
    return value[locale] || value.ar || value.en;
  }

  protected categoryLabel(id: FaqCategoryId): string {
    const match = this.categories().find((item) => item.id === id);
    return match ? this.text(match.name) : id;
  }

  protected stamp(item: FaqItem): string {
    const date = formatIsoDate(item.updatedAt, this.lang.language());
    const time = this.lang.language() === 'ar' ? '12:00 م' : '12:00 PM';
    return `${date} - ${time}`;
  }

  protected orderLabel(order: number): string {
    return `${order}`.padStart(2, '0');
  }

  protected setFilter(value: 'all' | FaqCategoryId): void {
    this.categoryFilter.set(value);
    this.first.set(0);
  }

  protected toggleSearch(): void {
    this.searchOpen.update((open) => !open);
  }

  protected onQuery(event: Event): void {
    const target = event.target;
    const value = target instanceof HTMLInputElement ? target.value : '';
    this.setQuery(value);
  }

  protected setQuery(value: string): void {
    this.query.set(value);
    this.first.set(0);
  }

  protected page(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.pageSize.set(event.rows ?? this.pageSize());
  }
}
