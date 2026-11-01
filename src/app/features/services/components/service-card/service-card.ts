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

const ICON_CLASS = /^pi-[a-z0-9-]+$/;

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

  protected readonly iconClass = computed(() => {
    const icon = this.icon();
    return `pi ${ICON_CLASS.test(icon) ? icon : FALLBACK_ICON}`;
  });

  protected openFromCard(event: Event): void {
    const target = event.target;
    if (target instanceof Element && target.closest('button, .p-toggleswitch, input')) {
      return;
    }
    this.openRequested.emit();
  }
}
