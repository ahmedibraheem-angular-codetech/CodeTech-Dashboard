import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../../../core/services/language.service';
import { FieldError } from '../../../../../../shared/components/field-error/field-error';
import type { FaqCategoryId } from '../../../../models/faq.model';

export type FaqEditorFormGroup = FormGroup<{
  questionAr: FormControl<string>;
  questionEn: FormControl<string>;
  answerAr: FormControl<string>;
  answerEn: FormControl<string>;
  categoryId: FormControl<FaqCategoryId>;
  order: FormControl<number>;
  published: FormControl<boolean>;
}>;

export interface FaqCategoryOption {
  value: FaqCategoryId;
  label: string;
}

/**
 * Create/edit FAQ form body. The parent owns the FormGroup, validation, API save,
 * and wraps this in `app-modal`.
 */
@Component({
  selector: 'app-faq-editor-form',
  imports: [ReactiveFormsModule, FieldError, InputText, Select, Textarea, ToggleSwitch],
  templateUrl: './faq-editor-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqEditorForm {
  readonly form = input.required<FaqEditorFormGroup>();
  readonly categoryOptions = input.required<FaqCategoryOption[]>();
  readonly submitted = output<void>();

  constructor(readonly lang: LanguageService) {}

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
