import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { AppButton } from '../../../../shared/components/app-button/app-button';
import { serviceIconClass } from '../../utils/service-visual';

@Component({
  selector: 'app-service-card',
  imports: [FormsModule, ToggleSwitch, AppButton],
  templateUrl: './service-card.html',
  styleUrl: './service-card.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCard {
  readonly icon = input('');
  /** Media icon URL from the API; preferred over the PrimeIcon class when set. */
  readonly iconUrl = input('');
  readonly title = input.required<string>();
  readonly description = input('');
  readonly published = input(false);
  readonly toggleLabel = input('');
  readonly editLabel = input('');
  readonly deleteLabel = input('');

  readonly showEdit = input(true);

  readonly showDelete = input(true);

  readonly showPublish = input(true);

  readonly publishedChange = output<boolean>();
  readonly editRequested = output<void>();
  readonly deleteRequested = output<void>();

  readonly openRequested = output<void>();

  protected readonly mediaIcon = computed(() => this.iconUrl().trim());

  protected readonly iconClass = computed(() => {
    if (this.mediaIcon()) {
      return '';
    }
    return serviceIconClass(this.icon());
  });

  protected openFromCard(event: Event): void {
    const target = event.target;
    if (target instanceof Element && target.closest('button, .p-toggleswitch, input')) {
      return;
    }
    this.openRequested.emit();
  }
}
