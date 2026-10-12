import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Inline form error. Announced to screen readers (`role="alert"`) and meant to be
 * referenced from the field with `aria-describedby`:
 *
 *   <input aria-describedby="email-error" />
 *   <app-field-error id="email-error">Required</app-field-error>
 */
@Component({
  selector: 'app-field-error',
  template: `
    @if (icon()) {
      <i class="pi pi-times-circle" aria-hidden="true"></i>
    }
    <ng-content />
  `,
  host: { class: 'field__error', role: 'alert' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldError {
  readonly icon = input(false);
}
