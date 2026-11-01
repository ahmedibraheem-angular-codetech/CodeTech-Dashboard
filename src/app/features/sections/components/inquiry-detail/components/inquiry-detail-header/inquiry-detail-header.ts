import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import type { PermissionName } from '../../../../../../core/auth/auth.model';
import { LanguageService } from '../../../../../../core/services/language.service';
import { AppButton } from '../../../../../../shared/components/app-button/app-button';
import { HasPermissionDirective } from '../../../../../../shared/directives/has-permission.directive';
import type { Inquiry, InquiryStatus } from '../../../../models/inquiry.model';

export interface InquiryDetailBadge {
  tone: InquiryStatus;
  label: string;
}

@Component({
  selector: 'app-inquiry-detail-header',
  imports: [AppButton, HasPermissionDirective],
  templateUrl: './inquiry-detail-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiryDetailHeader {
  readonly lang = inject(LanguageService);

  readonly inquiry = input.required<Inquiry>();
  readonly badge = input<InquiryDetailBadge | null>(null);
  readonly saving = input(false);

  readonly updatePermission = input.required<PermissionName>();

  readonly deletePermission = input.required<PermissionName>();

  readonly sendReply = output<void>();
  readonly closeRequest = output<void>();
  readonly addNote = output<void>();
  readonly remove = output<void>();
}
