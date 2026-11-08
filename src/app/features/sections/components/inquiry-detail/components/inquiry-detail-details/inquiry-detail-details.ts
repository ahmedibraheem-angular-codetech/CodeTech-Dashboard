import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Tooltip } from 'primeng/tooltip';

import { LanguageService } from '../../../../../../core/services/language.service';
import type { Inquiry } from '../../../../models/inquiry.model';

@Component({
  selector: 'app-inquiry-detail-details',
  imports: [Tooltip],
  templateUrl: './inquiry-detail-details.html',
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiryDetailDetails {
  readonly lang = inject(LanguageService);

  readonly inquiry = input.required<Inquiry>();

  readonly moreProducts = computed(() => {
    const items = this.inquiry().products;
    return items.length > 1 ? items.slice(1) : [];
  });

  readonly moreCount = computed(() => this.moreProducts().length);

  readonly moreTooltip = computed(() => this.moreProducts().join('\n'));
}
