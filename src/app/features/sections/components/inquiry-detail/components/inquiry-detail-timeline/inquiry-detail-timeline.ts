import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { LanguageService } from '../../../../../../core/services/language.service';
import type { InquiryTimelineStep } from '../../../../models/inquiry.model';

export type { InquiryTimelineStep, InquiryTimelineStepState } from '../../../../models/inquiry.model';

@Component({
  selector: 'app-inquiry-detail-timeline',
  templateUrl: './inquiry-detail-timeline.html',
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiryDetailTimeline {
  readonly lang = inject(LanguageService);

  readonly steps = input.required<readonly InquiryTimelineStep[]>();
}
