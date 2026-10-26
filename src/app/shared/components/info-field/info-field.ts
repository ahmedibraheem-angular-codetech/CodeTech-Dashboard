import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Read-only label + value tile used on detail screens (products, knowledge, …).
 * Project the value (text, chips, avatar, actions) into the default slot.
 */
@Component({
  selector: 'app-info-field',
  templateUrl: './info-field.html',
  styleUrl: './info-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'info-field',
    '[class.info-field--wide]': 'wide()',
  },
})
export class InfoField {
  readonly label = input.required<string>();
  /** Spans the full grid row when the parent is a multi-column field grid. */
  readonly wide = input(false);
}
