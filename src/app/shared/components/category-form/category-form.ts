import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { type FormControl, type FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';

import type { AppLanguage } from '../../../core/i18n/language';
import { LanguageService } from '../../../core/services/language.service';
import { FieldError } from '../field-error/field-error';
import { LocaleSwitch } from '../locale-switch/locale-switch';

export type CategoryFormGroup = FormGroup<{
  nameAr: FormControl<string>;
  nameEn: FormControl<string>;
  published: FormControl<boolean>;
}>;

@Component({
  selector: 'app-category-form',
  imports: [
    ReactiveFormsModule,
    FieldError,
    IconField,
    InputIcon,
    InputText,
    LocaleSwitch,
    ToggleSwitch,
  ],
  templateUrl: './category-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryForm {
  readonly lang = inject(LanguageService);

  readonly form = input.required<CategoryFormGroup>();

  readonly labelKey = input.required<string>();

  readonly placeholderKey = input.required<string>();

  readonly requiredKey = input.required<string>();

  readonly publishedKey = input.required<string>();
  readonly submitted = output<void>();

  readonly locale = model<AppLanguage>(this.lang.language());
  protected ct(key: string): string {
    return this.lang.lookup(key, this.locale()) ?? this.lang.t(key);
  }


  protected onSubmit(): void {
    this.submitted.emit();
  }
}
