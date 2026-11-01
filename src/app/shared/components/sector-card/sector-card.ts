import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

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

  readonly showEdit = input(true);

  readonly showDelete = input(true);

  readonly editRequested = output<void>();
  readonly deleteRequested = output<void>();
}
