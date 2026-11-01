import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
