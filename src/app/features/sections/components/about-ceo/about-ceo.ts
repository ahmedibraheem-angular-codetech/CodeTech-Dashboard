import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ContentPanel } from '../../../../shared/components/content-panel/content-panel';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { Modal } from '../../../../shared/components/modal/modal';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { formatIsoDate } from '../../../../shared/utils/date';
import { formatFileSize } from '../../../../shared/utils/file-size';
import { parseUploadedImage } from '../../../../shared/utils/image-upload';
import { AboutCeo, AboutCeoText, AboutImage } from '../../models/about.model';
import { AboutService } from '../../services/about.service';

const LOCALES: readonly AppLanguage[] = ['ar', 'en'];

function control(value: string, required: boolean): FormControl<string> {
  return new FormControl(value, {
    nonNullable: true,
    validators: required ? [Validators.required] : [],
  });
}

function textGroup(required: boolean): FormGroup<{
  name: FormControl<string>;
  role: FormControl<string>;
  body: FormControl<string>;
  quote: FormControl<string>;
}> {
  return new FormGroup({
    name: control('', required),
    role: control('', required),
    body: control('', required),
    quote: control('', false),
  });
}

function hasCopy(text: AboutCeoText): boolean {
  return text.name.trim().length > 0 || text.body.trim().length > 0;
}

@Component({
  selector: 'app-about-ceo',
  imports: [
    ReactiveFormsModule,
    AppButton,
    InputText,
    Textarea,
    ContentPanel,
    LocaleSwitch,
    Modal,
    SectionEmpty,
  ],
  templateUrl: './about-ceo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutCeoSection {
  private readonly api = inject(AboutService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly content = input.required<AboutCeo>();
  readonly saved = output<AboutCeo>();

  readonly locales = LOCALES;
  readonly editorOpen = signal(false);
  readonly saving = signal(false);
  readonly locale = signal<AppLanguage>('ar');
  readonly image = signal<AboutImage | null>(null);
  readonly imageError = signal('');

  readonly filled = computed(() => LOCALES.some((code) => hasCopy(this.content().texts[code])));
  readonly view = computed(() => {
    const { texts } = this.content();
    const current = this.lang.language();
    const other: AppLanguage = current === 'ar' ? 'en' : 'ar';
    return hasCopy(texts[current]) ? texts[current] : texts[other];
  });
  readonly imageSize = computed(() => formatFileSize(this.image()?.size ?? 0));
  readonly imageDate = computed(() =>
    formatIsoDate(this.image()?.uploadedAt ?? '1970-01-01', this.lang.language()),
  );

  readonly form = new FormGroup({ ar: textGroup(true), en: textGroup(false) });

  open(): void {
    for (const code of LOCALES) {
      const text = this.content().texts[code];
      this.form.controls[code].setValue({
        name: text.name,
        role: text.role,
        body: text.body,
        quote: text.quote,
      });
    }
    this.image.set(this.content().image);
    this.imageError.set('');
    this.locale.set(this.lang.language());
    this.editorOpen.set(true);
  }

  text(key: string, locale: AppLanguage): string {
    return this.lang.lookup(key, locale) ?? key;
  }

  onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.takeImage(input.files?.[0]);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.takeImage(event.dataTransfer?.files?.[0]);
  }

  removeImage(): void {
    this.image.set(null);
    this.imageError.set('');
  }

  save(): void {
    if (this.form.controls.ar.invalid || this.saving()) {
      this.form.controls.ar.markAllAsTouched();
      return;
    }
    const next: AboutCeo = {
      texts: { ar: this.read('ar'), en: this.read('en') },
      image: this.image(),
    };
    this.saving.set(true);
    this.api
      .saveCeo(next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.saved.emit(saved);
          this.editorOpen.set(false);
          this.messages.add({ severity: 'success', summary: this.lang.t('common.save') });
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  private read(locale: AppLanguage): AboutCeoText {
    const value = this.form.controls[locale].getRawValue();
    return {
      name: value.name.trim(),
      role: value.role.trim(),
      body: value.body.trim(),
      quote: value.quote.trim(),
    };
  }

  private takeImage(file: File | undefined): void {
    const result = parseUploadedImage(file);
    if (!result) {
      return;
    }
    if (!result.ok) {
      this.imageError.set(result.errorKey);
      return;
    }
    this.imageError.set('');
    this.image.set(result.image);
  }
}
