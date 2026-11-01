import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { type FormControl, type FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';

import type { AppLanguage } from '../../../../../../core/i18n/language';
import { LanguageService } from '../../../../../../core/services/language.service';
import { FieldError } from '../../../../../../shared/components/field-error/field-error';
import { LocaleSwitch } from '../../../../../../shared/components/locale-switch/locale-switch';
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

@Component({
  selector: 'app-faq-editor-form',
  imports: [
    ReactiveFormsModule,
    FieldError,
    IconField,
    InputIcon,
    InputText,
    LocaleSwitch,
    Select,
    Textarea,
    ToggleSwitch,
  ],
  templateUrl: './faq-editor-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqEditorForm {
  readonly form = input.required<FaqEditorFormGroup>();
  readonly categoryOptions = input.required<FaqCategoryOption[]>();
  readonly submitted = output<void>();

  readonly lang = inject(LanguageService);
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly orderOptions = Array.from({ length: 50 }, (_, index) => {
    const value = index + 1;
    return { value, label: `${value}`.padStart(2, '0') };
  });

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
