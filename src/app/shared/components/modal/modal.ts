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

/**
 * The application's one modal: a PrimeNG dialog with a designed header, a projected body and
 * the default Save / Cancel footer.
 *
 * It owns no form data and makes no API calls. The parent projects the content, validates it,
 * performs the save and decides what happens on cancel.
 *
 * Text inputs (`title`, `saveLabel`, `cancelLabel`) take already translated strings, like the
 * other shared components. Only the defaults are translated here.
 *
 * Dismissing (Cancel, the close icon, Escape) emits `cancel` and then closes through the
 * two-way `visible` state. A backdrop click never dismisses, so a stray click cannot lose input.
 */
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

  /** Two-way bound by the parent: `[(visible)]="open"`. */
  readonly visible = model(false);
  readonly title = input.required<string>();
  /** Optional PrimeIcons class shown beside the title, e.g. `pi pi-user-edit`. */
  readonly icon = input<string>();
  /** Optional image shown beside the title instead of `icon`. */
  readonly iconUrl = input<string>();

  /** True while the parent's save is running: shows a spinner and blocks save, cancel and dismiss. */
  readonly saving = input(false);
  /** The parent disables save, typically `form.invalid || form.pristine`. */
  readonly saveDisabled = input(false);
  /** Defaults to "Save changes". */
  readonly saveLabel = input<string>();
  /** Icon on the save button. Pass an empty string to show the label alone. */
  readonly saveIcon = input('pi pi-save');
  /** Icon side on the save button. Defaults to `start` (existing modal behaviour). */
  readonly saveIconPos = input<AppButtonIconPos>('start');
  /** Defaults to "Cancel". */
  readonly cancelLabel = input<string>();
  readonly showSave = input(true);
  readonly showCancel = input(true);

  /**
   * Optional content direction for form-scoped locale switches. When set, the dialog
   * panel flips independently of the global UI language.
   */
  readonly dir = input<'rtl' | 'ltr'>();
  /** Extra dialog panel classes, e.g. `app-modal--wide`. */
  readonly styleClass = input('');

  /** Whether the close icon and Escape dismiss the modal. The Cancel button always works. */
  readonly dismissible = input(true);

  protected readonly dialogStyleClass = computed(() => {
    const dir = this.dir();
    const extra = this.styleClass().trim();
    return ['app-modal', dir ? `app-modal--${dir}` : '', extra].filter(Boolean).join(' ');
  });
  /**
   * Set to false when the feature must confirm before closing (unsaved changes). Cancel then
   * only emits `cancel` and the parent closes by setting `visible` itself. The close icon and
   * Escape are turned off in that mode: PrimeNG hides its dialog on its own for them, which
   * the parent could not veto.
   */
  readonly closeOnCancel = input(true);

  readonly save = output<void>();
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
