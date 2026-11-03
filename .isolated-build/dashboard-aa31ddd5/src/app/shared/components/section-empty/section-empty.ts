import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section-empty',
  templateUrl: './section-empty.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionEmpty {
  readonly title = input.required<string>();
  readonly hint = input.required<string>();
}
