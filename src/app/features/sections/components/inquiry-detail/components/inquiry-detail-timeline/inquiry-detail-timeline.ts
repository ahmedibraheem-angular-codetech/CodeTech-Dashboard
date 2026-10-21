import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { LanguageService } from '../../../../../../core/services/language.service';

export type InquiryTimelineStepState = 'done' | 'current' | 'todo';

export interface InquiryTimelineStep {
  id: string;
  title: string;
  hint: string;
  state: InquiryTimelineStepState;
  date: string;
  time: string;
}

/** Status timeline card: received → note → follow-up → done. */
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
