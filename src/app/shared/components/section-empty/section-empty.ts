import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Project-wide empty state. The illustration stays fixed; each feature supplies the copy and action. */
@Component({
  selector: 'app-section-empty',
  templateUrl: './section-empty.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionEmpty {
  readonly title = input.required<string>();
  readonly hint = input.required<string>();
}
