import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';

import type { AppLanguage } from '../../../../../../core/i18n/language';
import { LanguageService } from '../../../../../../core/services/language.service';
import { FieldError } from '../../../../../../shared/components/field-error/field-error';
import { LocaleSwitch } from '../../../../../../shared/components/locale-switch/locale-switch';

export type FaqCategoryFormGroup = FormGroup<{
  nameAr: FormControl<string>;
  nameEn: FormControl<string>;
  published: FormControl<boolean>;
}>;

/**
 * Create/edit category form body. Parent owns the FormGroup and wraps this in `app-modal`.
 */
@Component({
  selector: 'app-faq-category-form',
  imports: [
    ReactiveFormsModule,
    FieldError,
    IconField,
    InputIcon,
    InputText,
    LocaleSwitch,
    ToggleSwitch,
  ],
  templateUrl: './faq-category-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqCategoryForm {
  readonly lang = inject(LanguageService);

  readonly form = input.required<FaqCategoryFormGroup>();
  readonly submitted = output<void>();

  readonly locale = signal<AppLanguage>(this.lang.language());

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
