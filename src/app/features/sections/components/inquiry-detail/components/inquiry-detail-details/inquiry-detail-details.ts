import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { LanguageService } from '../../../../../../core/services/language.service';
import type { Inquiry } from '../../../../models/inquiry.model';

@Component({
  selector: 'app-inquiry-detail-details',
  imports: [],
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

  /** Every related service/product, joined with the Arabic comma. */
  readonly productsLabel = computed(() => {
    const { products, product } = this.inquiry();
    return (products.length ? products : product ? [product] : []).join('، ');
  });
}
