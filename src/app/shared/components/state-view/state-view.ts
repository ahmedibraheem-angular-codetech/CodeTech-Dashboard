import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ProgressSpinner } from 'primeng/progressspinner';

import { LanguageService } from '../../../core/services/language.service';
import { AppButton } from '../app-button/app-button';
import { SectionEmpty } from '../section-empty/section-empty';

export type ViewState = 'loading' | 'empty' | 'error' | 'offline';

@Component({
  selector: 'app-state-view',
  imports: [AppButton, ProgressSpinner, SectionEmpty],
  templateUrl: './state-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateView {
  readonly lang = inject(LanguageService);
  readonly mode = input.required<ViewState>();
  readonly message = input<string>('');
  readonly retry = output<void>();
}
