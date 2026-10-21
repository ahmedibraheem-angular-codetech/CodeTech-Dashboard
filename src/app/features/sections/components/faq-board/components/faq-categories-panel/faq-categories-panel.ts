import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

import type { AppLanguage } from '../../../../../../core/i18n/language';
import { LanguageService } from '../../../../../../core/services/language.service';
import type { FaqCategory, FaqCategoryId, FaqItem, FaqLocaleText } from '../../../../models/faq.model';

/**
 * Categories tab panel. Presentational: receives categories and items for counts,
 * emits publish toggles. Parent owns API and shared category state.
 */
@Component({
  selector: 'app-faq-categories-panel',
  imports: [FormsModule, ToggleSwitch],
  templateUrl: './faq-categories-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqCategoriesPanel {
  readonly lang = inject(LanguageService);

  readonly categories = input.required<readonly FaqCategory[]>();
  readonly items = input.required<readonly FaqItem[]>();
  readonly publishedChange = output<{ category: FaqCategory; published: boolean }>();

  readonly sorted = computed(() => [...this.categories()].sort((a, b) => a.order - b.order));

  readonly countLabel = computed(() => {
    this.lang.language();
    return this.lang.t('faq.categoriesCount').replace('{count}', `${this.sorted().length}`);
  });

  protected text(value: FaqLocaleText, locale: AppLanguage = this.lang.language()): string {
    return value[locale] || value.ar || value.en;
  }

  protected orderLabel(order: number): string {
    return `${order}`.padStart(2, '0');
  }

  protected questionsLabel(id: FaqCategoryId): string {
    const count = this.items().filter((item) => item.categoryId === id).length;
    return this.lang.t('faq.categoryQuestions').replace('{count}', `${count}`);
  }

  protected onPublished(category: FaqCategory, published: boolean): void {
    this.publishedChange.emit({ category, published });
  }
}
