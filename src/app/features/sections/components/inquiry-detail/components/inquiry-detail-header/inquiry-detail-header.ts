import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { LanguageService } from '../../../../../../core/services/language.service';
import { AppButton } from '../../../../../../shared/components/app-button/app-button';
import type { Inquiry, InquiryStatus } from '../../../../models/inquiry.model';

export interface InquiryDetailBadge {
  tone: InquiryStatus;
  label: string;
}

/**
 * Inquiry detail page header: title, status badge, timestamp, and primary actions.
 * Parent owns save/delete/composer workflows.
 */
@Component({
  selector: 'app-inquiry-detail-header',
  imports: [AppButton],
  templateUrl: './inquiry-detail-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiryDetailHeader {
  readonly lang = inject(LanguageService);

  readonly inquiry = input.required<Inquiry>();
  readonly badge = input<InquiryDetailBadge | null>(null);
  readonly saving = input(false);

  readonly sendReply = output<void>();
  readonly closeRequest = output<void>();
  readonly addNote = output<void>();
  readonly remove = output<void>();
}
