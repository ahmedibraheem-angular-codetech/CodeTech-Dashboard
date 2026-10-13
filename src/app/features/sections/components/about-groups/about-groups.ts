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
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { ContentPanel } from '../../../../shared/components/content-panel/content-panel';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { Modal } from '../../../../shared/components/modal/modal';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { formatIsoDate, toIsoDate } from '../../../../shared/utils/date';
import { formatFileSize } from '../../../../shared/utils/file-size';
import {
  ABOUT_IMAGE_MAX_BYTES,
  ABOUT_IMAGE_TYPES,
  AboutGroups,
  AboutImage,
  AboutPointGroup,
} from '../../models/about.model';
import { AboutService } from '../../services/about.service';

const LOCALES: readonly AppLanguage[] = ['ar', 'en'];

type GroupForm = FormGroup<{
  id: FormControl<string>;
  title: FormControl<string>;
  highlight: FormControl<string>;
  points: FormArray<FormControl<string>>;
}>;

function control(value: string, required: boolean): FormControl<string> {
  return new FormControl(value, {
    nonNullable: true,
    validators: required ? [Validators.required] : [],
  });
}

function hasCopy(groups: AboutPointGroup[]): boolean {
  return groups.some(
    (group) => group.highlight.trim().length > 0 || group.points.some((point) => point.trim()),
  );
}

/**
 * One checklist section of the About page: the story (image + stacked cards) or the
 * vision (two cards). The modal edits both languages and, for the story, the image.
 */
@Component({
  selector: 'app-about-groups',
  imports: [
    ReactiveFormsModule,
    Button,
    InputText,
    ContentPanel,
    LocaleSwitch,
    Modal,
    SectionEmpty,
  ],
  templateUrl: './about-groups.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutGroupsSection {
  private readonly api = inject(AboutService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly section = input.required<'story' | 'vision'>();
  readonly content = input.required<AboutGroups>();
  readonly heading = input.required<string>();
  readonly emptyTitle = input.required<string>();
  readonly emptyHint = input.required<string>();
  readonly emptyAction = input.required<string>();
  readonly modalTitle = input.required<string>();
  readonly saved = output<AboutGroups>();

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
  readonly icon = computed(() => (this.section() === 'story' ? 'pi pi-building' : 'pi pi-flag'));

  readonly form = new FormGroup({
    ar: new FormArray<GroupForm>([]),
    en: new FormArray<GroupForm>([]),
  });

  open(): void {
    for (const code of LOCALES) {
      const source = this.content().texts[code];
      const groups = source.length ? source : this.defaults(code);
      const array = this.form.controls[code];
      array.clear();
      for (const group of groups) {
        array.push(this.groupForm(group, code === 'ar'));
      }
    }
    this.image.set(this.content().image);
    this.imageError.set('');
    this.locale.set(this.lang.language());
    this.editorOpen.set(true);
  }

  text(key: string, locale: AppLanguage): string {
    return this.lang.lookup(key, locale) ?? key;
  }

  addPoint(locale: AppLanguage, index: number): void {
    this.form.controls[locale].at(index).controls.points.push(control('', locale === 'ar'));
  }

  removePoint(locale: AppLanguage, groupIndex: number, pointIndex: number): void {
    this.form.controls[locale].at(groupIndex).controls.points.removeAt(pointIndex);
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
    const next: AboutGroups = {
      texts: { ar: this.read('ar'), en: this.read('en') },
      image: this.section() === 'story' ? this.image() : null,
    };
    const request =
      this.section() === 'story' ? this.api.saveStory(next) : this.api.saveVision(next);
    this.saving.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  private read(locale: AppLanguage): AboutPointGroup[] {
    return this.form.controls[locale].getRawValue().map((group) => ({
      id: group.id,
      title: group.title.trim(),
      highlight: group.highlight.trim(),
      points: group.points.map((point) => point.trim()).filter((point) => point.length > 0),
    }));
  }

  private groupForm(group: AboutPointGroup, required: boolean): GroupForm {
    const rows = group.points.length ? group.points : [''];
    return new FormGroup({
      id: control(group.id, false),
      title: control(group.title, false),
      highlight: control(group.highlight, false),
      points: new FormArray(rows.map((point) => control(point, required))),
    });
  }

  private defaults(locale: AppLanguage): AboutPointGroup[] {
    const pairs =
      this.section() === 'story'
        ? [
            ['philosophy', 'about.philosophy'],
            ['market', 'about.market'],
          ]
        : [
            ['mission', 'about.mission'],
            ['vision', 'about.visionCard'],
          ];
    return pairs.map(([id, key]) => ({
      id,
      title: this.lang.lookup(key, locale) ?? key,
      highlight: '',
      points: [''],
    }));
  }

  private takeImage(file: File | undefined): void {
    if (!file) {
      return;
    }
    if (!ABOUT_IMAGE_TYPES.includes(file.type)) {
      this.imageError.set('home.imageType');
      return;
    }
    if (file.size > ABOUT_IMAGE_MAX_BYTES) {
      this.imageError.set('home.imageSize');
      return;
    }
    this.imageError.set('');
    this.image.set({ name: file.name, size: file.size, uploadedAt: toIsoDate(new Date()) });
  }
}
