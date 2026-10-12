import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';

import { LanguageService } from '../../../core/services/language.service';

export type ViewState = 'loading' | 'empty' | 'error';

@Component({
  selector: 'app-state-view',
  imports: [Button, ProgressSpinner],
  templateUrl: './state-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateView {
  readonly mode = input.required<ViewState>();
  readonly message = input<string>('');
  readonly retry = output<void>();

  constructor(readonly lang: LanguageService) {}
}
