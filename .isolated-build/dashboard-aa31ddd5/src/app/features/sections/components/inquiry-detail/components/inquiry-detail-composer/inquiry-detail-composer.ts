import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type FormControl, ReactiveFormsModule } from '@angular/forms';
import { Textarea } from 'primeng/textarea';

import { FieldError } from '../../../../../../shared/components/field-error/field-error';

@Component({
  selector: 'app-inquiry-detail-composer',
  imports: [ReactiveFormsModule, Textarea, FieldError],
  templateUrl: './inquiry-detail-composer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiryDetailComposer {
  readonly control = input.required<FormControl<string>>();
  readonly fieldLabel = input.required<string>();
  readonly errorMessage = input.required<string>();
}
