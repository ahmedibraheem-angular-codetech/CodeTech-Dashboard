import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

/**
 * One selectable project in the “related projects” step. Presentational only: it receives
 * already-localized text and reports the toggle; the editor owns `Service.projectIds`.
 */
@Component({
  selector: 'app-service-project-card',
  imports: [FormsModule, ToggleSwitch],
  templateUrl: './service-project-card.html',
  styleUrl: './service-project-card.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceProjectCard {
  readonly title = input.required<string>();
  readonly summary = input('');
  readonly coverUrl = input('');
  readonly selected = input(false);
  readonly toggleLabel = input('');

  readonly selectedChange = output<boolean>();
}
