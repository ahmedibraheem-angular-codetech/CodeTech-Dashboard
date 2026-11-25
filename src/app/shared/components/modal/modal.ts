import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { Dialog } from 'primeng/dialog';

import { LanguageService } from '../../../core/services/language.service';
import { AppButton, type AppButtonIconPos } from '../app-button/app-button';

@Component({
  selector: 'app-modal',
  imports: [Dialog, AppButton],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  readonly lang = inject(LanguageService);

  readonly visible = model(false);
  readonly title = input.required<string>();

  readonly icon = input<string>();

  readonly iconUrl = input<string>();

  readonly saving = input(false);

  readonly saveDisabled = input(false);

  readonly saveLabel = input<string>();

  readonly saveIcon = input('pi pi-save');

  readonly saveIconPos = input<AppButtonIconPos>('start');

  readonly cancelLabel = input<string>();
  readonly showSave = input(true);
  readonly showCancel = input(true);

  readonly dir = input<'rtl' | 'ltr'>();

  readonly styleClass = input('');

  readonly dismissible = input(true);

  protected readonly dialogStyleClass = computed(() => {
    const dir = this.dir();
    const extra = this.styleClass().trim();
    return ['app-modal', dir ? `app-modal--${dir}` : '', extra].filter(Boolean).join(' ');
  });
  readonly closeOnCancel = input(true);

  readonly save = output<void>();

  // eslint-disable-next-line @angular-eslint/no-output-native -- public API used across the app
  readonly cancel = output<void>();

  protected onSave(): void {
    if (this.saving() || this.saveDisabled()) {
      return;
    }
    this.save.emit();
  }

  protected requestClose(): void {
    if (this.saving()) {
      return;
    }
    this.cancel.emit();
    if (this.closeOnCancel()) {
      this.visible.set(false);
    }
  }
}
