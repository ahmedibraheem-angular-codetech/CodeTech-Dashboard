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
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ContentPanel } from '../../../../shared/components/content-panel/content-panel';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { Modal } from '../../../../shared/components/modal/modal';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { formatIsoDate, toIsoDate } from '../../../../shared/utils/date';
import { formatFileSize } from '../../../../shared/utils/file-size';
import {
  BLOCK_IMAGE_MAX_BYTES,
  BLOCK_IMAGE_TYPES,
  BlockImage,
  ContentBlock,
  ContentBlockText,
} from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';

export type ContentBlockKind = 'about' | 'vision';

/** Arabic first, as in the design. */
const LOCALES: readonly AppLanguage[] = ['ar', 'en'];

type TextGroup = FormGroup<{
  title: FormControl<string>;
  body: FormControl<string>;
  points: FormArray<FormControl<string>>;
}>;

function control(value: string, required: boolean): FormControl<string> {
  return new FormControl(value, {
    nonNullable: true,
    validators: required ? [Validators.required] : [],
  });
}

/** Arabic is mandatory; English is optional and falls back to Arabic on the page. */
function textGroup(required: boolean): TextGroup {
  return new FormGroup({
    title: control('', required),
    body: control('', required),
    points: new FormArray<FormControl<string>>([]),
  });
}

@Component({
  selector: 'app-content-block-card',
  imports: [
    ReactiveFormsModule,
    AppButton,
    IconField,
    InputIcon,
    InputText,
    Textarea,
    SectionEmpty,
    ContentPanel,
    LocaleSwitch,
    Modal,
  ],
  templateUrl: './content-block-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentBlockCard {
  private readonly api = inject(HomepageService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly kind = input.required<ContentBlockKind>();
  readonly block = input.required<ContentBlock>();
  /** Emitted with the saved block so the parent can replace its copy. */
  readonly blockSaved = output<ContentBlock>();

  readonly locales = LOCALES;

  /** The text shown on the page: the application language, or the other one when it is empty. */
  readonly view = computed<ContentBlockText>(() => {
    const { texts } = this.block();
    const current = this.lang.language();
    const other = current === 'ar' ? 'en' : 'ar';
    if (texts[current].body.trim()) {
      return texts[current];
    }
    return texts[other].body.trim() ? texts[other] : texts[current];
  });
  readonly filled = computed(() =>
    LOCALES.some((locale) => this.block().texts[locale].body.trim().length > 0),
  );
  readonly icon = computed(() => (this.kind() === 'about' ? 'pi pi-building' : 'pi pi-flag'));

  readonly editorOpen = signal(false);
  readonly saving = signal(false);
  /** The language tab being edited. */
  readonly locale = signal<AppLanguage>('ar');
  readonly image = signal<BlockImage | null>(null);
  /** Translation key of the last rejected image, or empty. */
  readonly imageError = signal('');
  readonly imageSize = computed(() => formatFileSize(this.image()?.size ?? 0));
  readonly imageDate = computed(() =>
    formatIsoDate(this.image()?.uploadedAt ?? '1970-01-01', this.lang.language()),
  );

  readonly form = new FormGroup({ ar: textGroup(true), en: textGroup(false) });

  open(): void {
    const block = this.block();
    for (const locale of LOCALES) {
      const text = block.texts[locale];
      const group = this.form.controls[locale];
      group.controls.title.setValue(text.title);
      group.controls.body.setValue(text.body);
      const points = group.controls.points;
      points.clear();
      // An empty block starts with one empty row, so the points section is never bare.
      for (const value of text.points.length ? text.points : ['']) {
        points.push(control(value, locale === 'ar'));
      }
    }
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.image.set(block.image);
    this.imageError.set('');
    this.locale.set(this.lang.language());
    this.editorOpen.set(true);
  }

  /** Field copy follows the tab's language, not the application language. */
  text(key: string, locale: AppLanguage): string {
    return this.lang.lookup(key, locale) ?? key;
  }

  addPoint(locale: AppLanguage): void {
    this.form.controls[locale].controls.points.push(control('', locale === 'ar'));
  }

  removePoint(locale: AppLanguage, index: number): void {
    this.form.controls[locale].controls.points.removeAt(index);
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
    const arabic = this.form.controls.ar;
    if (arabic.invalid) {
      arabic.markAllAsTouched();
      return;
    }
    if (this.saving()) {
      return;
    }
    const block: ContentBlock = {
      texts: { ar: this.read('ar'), en: this.read('en') },
      image: this.image(),
    };
    this.saving.set(true);
    this.api
      .saveBlock(this.kind(), block)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.blockSaved.emit(saved);
          this.editorOpen.set(false);
          this.messages.add({ severity: 'success', summary: this.lang.t('common.save') });
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  private read(locale: AppLanguage): ContentBlockText {
    const value = this.form.controls[locale].getRawValue();
    return {
      title: value.title.trim(),
      body: value.body.trim(),
      points: value.points.map((point) => point.trim()).filter((point) => point.length > 0),
    };
  }

  private takeImage(file: File | undefined): void {
    if (!file) {
      return;
    }
    if (!BLOCK_IMAGE_TYPES.includes(file.type)) {
      this.imageError.set('home.imageType');
      return;
    }
    if (file.size > BLOCK_IMAGE_MAX_BYTES) {
      this.imageError.set('home.imageSize');
      return;
    }
    this.imageError.set('');
    this.image.set({ name: file.name, size: file.size, uploadedAt: toIsoDate(new Date()) });
  }
}
