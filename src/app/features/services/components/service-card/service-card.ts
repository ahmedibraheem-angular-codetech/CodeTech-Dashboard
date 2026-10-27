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

const FALLBACK_ICON = 'pi-cog';
/** `Service.icon` is a bare PrimeIcons class (`pi-globe`), never an `icon:` upload value. */
const ICON_CLASS = /^pi-[a-z0-9-]+$/;

/**
 * One service on the list page: icon tile, edit/delete actions, title with the
 * publication toggle, and the description. Presentational only; the list page owns data.
 */
@Component({
  selector: 'app-service-card',
  imports: [FormsModule, ToggleSwitch, AppButton],
  templateUrl: './service-card.html',
  styleUrl: './service-card.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCard {
  /** `Service.icon`, for example `pi-globe`. */
  readonly icon = input('');
  readonly title = input.required<string>();
  readonly description = input('');
  readonly published = input(false);
  readonly toggleLabel = input('');
  readonly editLabel = input('');
  readonly deleteLabel = input('');

  readonly publishedChange = output<boolean>();
  readonly editRequested = output<void>();
  readonly deleteRequested = output<void>();
  /** The card body or the title was activated; the list page opens the details. */
  readonly openRequested = output<void>();

  protected readonly iconClass = computed(() => {
    const icon = this.icon();
    return `pi ${ICON_CLASS.test(icon) ? icon : FALLBACK_ICON}`;
  });

  /**
   * A click anywhere on the card opens the details, except on the edit/delete buttons, the
   * publication switch and the title button (which opens it by itself for keyboard users).
   */
  protected openFromCard(event: Event): void {
    const target = event.target;
    if (target instanceof Element && target.closest('button, .p-toggleswitch, input')) {
      return;
    }
    this.openRequested.emit();
  }
}
