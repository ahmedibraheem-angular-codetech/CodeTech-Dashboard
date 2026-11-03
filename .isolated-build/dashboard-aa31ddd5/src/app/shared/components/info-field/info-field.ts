import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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

  readonly wide = input(false);
}
