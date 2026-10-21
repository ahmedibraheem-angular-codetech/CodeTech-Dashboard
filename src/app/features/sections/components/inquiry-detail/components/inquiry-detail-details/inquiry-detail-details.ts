import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { LanguageService } from '../../../../../../core/services/language.service';
import type { Inquiry } from '../../../../models/inquiry.model';

/** Customer/org/product contact fields card on the inquiry detail page. */
@Component({
  selector: 'app-inquiry-detail-details',
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
}
