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
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { formatIsoDate } from '../../../../shared/utils/date';
import { formatFileSize } from '../../../../shared/utils/file-size';
import { isApiError } from '../../../../core/http/api-error';
import { parseUploadedImage } from '../../../../shared/utils/image-upload';
import { type BlockImage, type ContentBlock, type ContentBlockText } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';

export type ContentBlockKind = 'about' | 'vision';

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

function textGroup(): TextGroup {
  return new FormGroup({
    title: control('', false),
    body: control('', false),
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
    HasPermissionDirective,
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

  readonly blockSaved = output<ContentBlock>();

  readonly locales = LOCALES;

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

  readonly locale = signal<AppLanguage>('ar');
  readonly image = signal<BlockImage | null>(null);

  readonly preview = signal<string | null>(null);

  readonly imageError = signal('');
  readonly imageSize = computed(() => formatFileSize(this.image()?.size ?? 0));
  readonly imageDate = computed(() =>
    formatIsoDate(this.image()?.uploadedAt ?? '1970-01-01', this.lang.language()),
  );
  readonly thumbUrl = computed(
    () => this.preview() || this.image()?.url || 'images/dashboardcodetech.svg',
  );
  readonly visualUrl = computed(() => this.block().image?.url ?? null);

  readonly form = new FormGroup({ ar: textGroup(), en: textGroup() });

  open(): void {
    const block = this.block();
    for (const locale of LOCALES) {
      const text = block.texts[locale];
      const group = this.form.controls[locale];
      group.controls.title.setValue(text.title);
      group.controls.body.setValue(text.body);
      const points = group.controls.points;
      points.clear();

      for (const value of text.points.length ? text.points : ['']) {
        points.push(control(value, false));
      }
    }
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.clearPreview();
    this.image.set(block.image);
    this.imageError.set('');
    this.locale.set(this.lang.language());
    this.editorOpen.set(true);
  }

  text(key: string, locale: AppLanguage): string {
    return this.lang.lookup(key, locale) ?? key;
  }

  addPoint(locale: AppLanguage): void {
    this.form.controls[locale].controls.points.push(control('', false));
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
    this.clearPreview();
    this.image.set(null);
    this.imageError.set('');
  }

  save(): void {
    if (this.saving()) {
      return;
    }
    const block: ContentBlock = {
      texts: { ar: this.read('ar'), en: this.read('en') },
      image: this.image(),
    };
    this.saving.set(true);
    this.api
      .saveBlock(this.kind(), block, this.block().image)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.blockSaved.emit(saved);
          this.clearPreview();
          this.editorOpen.set(false);
          this.messages.add({
            severity: 'success',
            summary: this.lang.t(
              this.kind() === 'about' ? 'home.toastAboutSuccess' : 'home.toastVisionSuccess',
            ),
          });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.messages.add({
            severity: 'error',
            summary:
              isApiError(error) && error.serverMessage
                ? error.serverMessage
                : this.lang.t(
                    this.kind() === 'about' ? 'home.toastAboutError' : 'home.toastVisionError',
                  ),
          });
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
    const result = parseUploadedImage(file);
    if (!result) {
      return;
    }
    if (!result.ok) {
      this.imageError.set(result.errorKey);
      return;
    }
    if (!file) {
      return;
    }
    this.clearPreview();
    this.imageError.set('');
    this.preview.set(URL.createObjectURL(file));
    this.image.set({ ...result.image, file, url: undefined, uuid: undefined });
  }

  private clearPreview(): void {
    const preview = this.preview();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    this.preview.set(null);
  }
}
