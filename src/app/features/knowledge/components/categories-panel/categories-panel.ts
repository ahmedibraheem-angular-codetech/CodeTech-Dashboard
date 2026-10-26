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

import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { formatIsoDate } from '../../../../shared/utils/date';
import type { ArticleCategory } from '../../models/knowledge.model';
import { categoryName } from '../../utils/knowledge-format';

type CategoryStatus = 'active' | 'inactive';

const ALL_STATUSES: readonly CategoryStatus[] = ['active', 'inactive'];

interface StatusOption {
  value: CategoryStatus | 'all';
  label: string;
  selectAll?: boolean;
}

/** Categories tab: card grid with search and a status filter. The board owns every write. */
@Component({
  selector: 'app-knowledge-categories-panel',
  imports: [FormsModule, AppButton, Checkbox, Popover, StateView],
  templateUrl: './categories-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPanel {
  readonly lang = inject(LanguageService);

  readonly categories = input.required<readonly ArticleCategory[]>();

  readonly edit = output<ArticleCategory>();
  readonly remove = output<ArticleCategory>();

  readonly query = signal('');
  readonly searchOpen = signal(false);
  readonly filterOpen = signal(false);
  readonly selected = signal<readonly CategoryStatus[]>(ALL_STATUSES);

  readonly statusOptions = computed<readonly StatusOption[]>(() => {
    this.lang.language();
    return [
      { value: 'all', label: this.lang.t('knowledge.allStatuses'), selectAll: true },
      { value: 'active', label: this.lang.t('knowledge.active') },
      { value: 'inactive', label: this.lang.t('knowledge.inactive') },
    ];
  });

  readonly filterLabel = computed(() => {
    this.lang.language();
    const selected = this.selected();
    if (selected.length === 1) {
      return this.lang.t(selected[0] === 'active' ? 'knowledge.active' : 'knowledge.inactive');
    }
    return this.lang.t('knowledge.allStatuses');
  });

  readonly filtered = computed(() => {
    const locale = this.lang.language();
    const query = this.query().trim().toLowerCase();
    const statuses = this.selected();
    const everything = statuses.length === 0 || statuses.length === ALL_STATUSES.length;
    return [...this.categories()]
      .filter((item) => everything || statuses.includes(item.published ? 'active' : 'inactive'))
      .filter((item) => {
        const haystack = `${categoryName(item, locale)} ${item.nameAr} ${item.nameEn} ${item.id}`;
        return !query || haystack.toLowerCase().includes(query);
      })
      .sort((a, b) => a.order - b.order);
  });

  readonly countLabel = computed(() => {
    this.lang.language();
    return this.lang.t('knowledge.categoriesTitle').replace('{count}', `${this.filtered().length}`);
  });

  protected name(category: ArticleCategory): string {
    return categoryName(category, this.lang.language());
  }

  protected created(category: ArticleCategory): string {
    return formatIsoDate(category.createdAt, this.lang.language());
  }

  protected padded(value: number): string {
    return `${value}`.padStart(2, '0');
  }

  protected checked(option: StatusOption): boolean {
    const selected = this.selected();
    return option.selectAll
      ? selected.length === ALL_STATUSES.length
      : selected.includes(option.value as CategoryStatus);
  }

  protected setOption(option: StatusOption, on: boolean): void {
    if (option.selectAll) {
      this.selected.set(on ? ALL_STATUSES : []);
      return;
    }
    const next = new Set(this.selected());
    if (on) {
      next.add(option.value as CategoryStatus);
    } else {
      next.delete(option.value as CategoryStatus);
    }
    this.selected.set(ALL_STATUSES.filter((status) => next.has(status)));
  }

  protected toggleSearch(): void {
    this.searchOpen.update((open) => !open);
  }

  protected onQuery(event: Event): void {
    const target = event.target;
    this.query.set(target instanceof HTMLInputElement ? target.value : '');
  }
}
