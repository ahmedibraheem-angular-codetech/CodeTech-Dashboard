import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Shared sector tile: image, title overlay, and optional edit/delete actions.
 * Parents own data and navigation; this component only renders and emits.
 */
@Component({
  selector: 'app-sector-card',
  templateUrl: './sector-card.html',
  styleUrl: './sector-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-sector-card' },
})
export class SectorCard {
  readonly imageUrl = input('');
  readonly title = input.required<string>();
  readonly editLabel = input('');
  readonly deleteLabel = input('');
  readonly deleteDisabled = input(false);
  readonly showActions = input(true);

  readonly editRequested = output<void>();
  readonly deleteRequested = output<void>();
}
